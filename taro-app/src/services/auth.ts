import type { SupabaseAdapter } from '@shared/lib/adapter'
import { SUPABASE_URL, SUPABASE_ANON_KEY, wxRequest } from './supabase'

const TOKEN_KEY = 'yuting_auth_token'
const USER_KEY = 'yuting_user_id'
const TOKEN_EXPIRY_KEY = 'yuting_token_expiry'
const LINKED_AUTH_USER_KEY = 'yuting_linked_auth_user'
const LINKED_EMAIL_KEY = 'yuting_linked_email'

const LINKED_TOKEN_KEY = 'yuting_linked_token'

interface AuthResult {
  token: string
  userId: string
  openid: string
  isNew: boolean
}

interface SupabaseAuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  user: {
    id: string
    email: string
  }
}

export async function loginWithWeChat(
  adapter: SupabaseAdapter
): Promise<{ token: string; userId: string }> {
  console.log('Auth: 1. Starting wx.login...')
  const loginRes = await wx.login()
  console.log('Auth: 2. wx.login finished', loginRes.code ? 'with code' : 'failed')
  
  if (!loginRes.code) throw new Error('wx.login failed')

  console.log('Auth: 3. Calling cloud function "login"...')
  try {
    const cloudRes = (await wx.cloud.callFunction({
      name: 'login',
      data: { code: loginRes.code },
      config: { timeout: 20000 }
    })) as { result: AuthResult }
    
    const { openid } = cloudRes.result
    const userId = openid
    const token = 'placeholder-token'
    
    console.log('Auth: 4. Cloud function returned openid:', userId)

    wx.setStorageSync(TOKEN_KEY, token)
    wx.setStorageSync(USER_KEY, userId)
    wx.setStorageSync(TOKEN_EXPIRY_KEY, Date.now() + 3600 * 1000)

    adapter.setToken(token)

    // Create user row on first login; fire-and-forget so it never delays auth
    adapter.from('users').insert({ id: userId, nickname: '旅行者', avatar_url: null }).catch(() => {})

    console.log('Auth: 5. Auth process complete')

    return { token, userId }
  } catch (err) {
    console.error('Auth: Error in cloud call:', err)
    throw err
  }
}

export async function linkExistingAccount(
  adapter: SupabaseAdapter,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const openid = getUserId()
  if (!openid) return { success: false, error: '未登录，请先微信登录' }
  if (getLinkedAuthUserId()) return { success: false, error: '已绑定其他账号' }

  if (!SUPABASE_URL) return { success: false, error: '配置错误：Supabase URL 为空' }
  const baseUrl = SUPABASE_URL.replace(/\/$/, '')

  try {
    console.log('[linkExistingAccount] Attempting auth for:', email)
    
    const authResult = await wxRequest(
      'POST',
      `${baseUrl}/auth/v1/token?grant_type=password`,
      {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      {
        email: email.trim().toLowerCase(),
        password,
      }
    )

    console.log('[linkExistingAccount] Auth status:', authResult.status, 'body:', JSON.stringify(authResult.data))

    if (authResult.status !== 200) {
      const body = authResult.data as any
      if (authResult.status === 400 || authResult.status === 401) {
        const msg = body?.msg || body?.error_description || body?.message || ''
        if (msg.includes('Invalid login credentials') || msg.includes('Email not confirmed')) {
          return { success: false, error: '邮箱或密码错误' }
        }
        return { success: false, error: msg || '认证失败' }
      }
      return { success: false, error: `服务器错误 (${authResult.status})` }
    }

    const authData = authResult.data as SupabaseAuthResponse

    console.log('[linkExistingAccount] Attempting RPC link_account...')
    // Call link_account RPC directly via wx.request
    const rpcResult = await wxRequest(
      'POST',
      `${baseUrl}/rest/v1/rpc/link_account`,
      {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${authData.access_token}`,
        'Content-Type': 'application/json',
      },
      {
        p_openid: openid,
        p_auth_user_id: authData.user.id,
        p_email: authData.user.email,
      }
    ).catch(err => ({ status: 0, data: err }))

    console.log('[linkExistingAccount] RPC status:', rpcResult.status, 'body:', JSON.stringify(rpcResult.data))

    if (rpcResult.status !== 200) {
      console.error('Failed to store account link:', rpcResult.data)
      const rpcError = rpcResult.data?.message || rpcResult.data?.error || ''
      return { success: false, error: rpcError ? `绑定失败: ${rpcError}` : '绑定失败，请稍后重试' }
    }

    wx.setStorageSync(LINKED_AUTH_USER_KEY, authData.user.id)
    wx.setStorageSync(LINKED_EMAIL_KEY, authData.user.email)
    wx.setStorageSync(LINKED_TOKEN_KEY, authData.access_token)
    adapter.setToken(authData.access_token)

    console.log('[linkExistingAccount] Successfully linked!')
    return { success: true }
  } catch (err: any) {
    console.error('[linkExistingAccount] Fatal error:', err)
    const errMsg = err?.errMsg || err?.message || ''
    if (errMsg.includes('url not in domain list') || errMsg.includes('domain list')) {
      return { success: false, error: '网络错误：Supabase 域名未加入微信合法列表' }
    }
    return { success: false, error: `网络错误 (${errMsg || '未知错误'})，请检查网络或域名配置` }
  }
}

export function getToken(): string | null {
  return wx.getStorageSync(TOKEN_KEY) || null
}

export function getUserId(): string | null {
  return wx.getStorageSync(USER_KEY) || null
}

export function isTokenExpired(): boolean {
  const expiry = wx.getStorageSync(TOKEN_EXPIRY_KEY) as number
  if (!expiry) return true
  return Date.now() > expiry - 5 * 60 * 1000
}

export async function refreshToken(adapter: SupabaseAdapter): Promise<void> {
  await loginWithWeChat(adapter)
}

export function getLinkedAuthUserId(): string | null {
  return wx.getStorageSync(LINKED_AUTH_USER_KEY) || null
}

export function getLinkedEmail(): string | null {
  return wx.getStorageSync(LINKED_EMAIL_KEY) || null
}

export function isAccountLinked(): boolean {
  return !!getLinkedAuthUserId()
}

export function getEffectiveUserId(): string | null {
  return getLinkedAuthUserId() || getUserId()
}

export async function unlinkAccount(adapter: SupabaseAdapter): Promise<void> {
  const openid = getUserId()
  if (openid) {
    try {
      await adapter.rpc('unlink_account', { p_openid: openid })
    } catch (err) {
      console.error('[unlinkAccount] RPC failed:', err)
    }
  }
  wx.removeStorageSync(LINKED_AUTH_USER_KEY)
  wx.removeStorageSync(LINKED_EMAIL_KEY)
  wx.removeStorageSync(LINKED_TOKEN_KEY)
  adapter.setToken('placeholder-token')
}

export async function getUser(adapter: SupabaseAdapter) {
  const linkedUserId = getLinkedAuthUserId()
  const userId = linkedUserId || getUserId()
  console.log('[getUser] linkedUserId:', linkedUserId, 'openid:', getUserId(), 'using:', userId)
  if (!userId) return null

  const result = await adapter.rpc<{
    id: string
    nickname: string
    avatar_url: string | null
    city: string | null
    bio: string | null
    birthday: string | null
  }[]>('get_user_profile', { p_user_id: userId })

  console.log('[getUser] result:', JSON.stringify(result.data), 'error:', result.error?.message)
  const row = result.data && result.data.length > 0 ? result.data[0] : null
  return row
}

export function logout(): void {
  wx.removeStorageSync(TOKEN_KEY)
  wx.removeStorageSync(USER_KEY)
  wx.removeStorageSync(TOKEN_EXPIRY_KEY)
  wx.removeStorageSync(LINKED_AUTH_USER_KEY)
  wx.removeStorageSync(LINKED_EMAIL_KEY)
  wx.removeStorageSync(LINKED_TOKEN_KEY)
  wx.removeStorageSync('has_logged_in')
}

export async function ensureAuth(
  adapter: SupabaseAdapter
): Promise<{ token: string; userId: string }> {
  const userId = getUserId()
  let linkedToken = wx.getStorageSync(LINKED_TOKEN_KEY)
  
  // Sync link status from DB
  if (userId) {
    try {
      console.log('[ensureAuth] Syncing link status from DB...')
      const linkResult = await adapter.rpc<{ auth_user_id: string; email: string }[]>('get_user_link', { p_openid: userId })
      if (linkResult.data && linkResult.data.length > 0) {
        const link = linkResult.data[0]
        if (!wx.getStorageSync(LINKED_AUTH_USER_KEY)) {
          console.log('[ensureAuth] Found missing link in DB:', link.email)
          wx.setStorageSync(LINKED_AUTH_USER_KEY, link.auth_user_id)
          wx.setStorageSync(LINKED_EMAIL_KEY, link.email)
        }
      } else if (wx.getStorageSync(LINKED_AUTH_USER_KEY)) {
        console.log('[ensureAuth] Link no longer exists in DB, clearing local storage')
        wx.removeStorageSync(LINKED_AUTH_USER_KEY)
        wx.removeStorageSync(LINKED_EMAIL_KEY)
        wx.removeStorageSync(LINKED_TOKEN_KEY)
      }
    } catch (err) {
      console.error('[ensureAuth] Link sync failed:', err)
    }
  }

  linkedToken = wx.getStorageSync(LINKED_TOKEN_KEY)
  const token = linkedToken || getToken()
  const effectiveUserId = getEffectiveUserId() || userId

  if (token && effectiveUserId && !isTokenExpired()) {
    adapter.setToken(token)
    return { token, userId: effectiveUserId }
  }

  const result = await loginWithWeChat(adapter)
  return {
    token: result.token,
    userId: getEffectiveUserId() || result.userId
  }
}
