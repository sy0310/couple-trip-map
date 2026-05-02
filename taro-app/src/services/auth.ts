import type { SupabaseAdapter } from '@shared/lib/adapter'

const TOKEN_KEY = 'yuting_auth_token'
const USER_KEY = 'yuting_user_id'
const TOKEN_EXPIRY_KEY = 'yuting_token_expiry'

interface AuthResult {
  token: string
  userId: string
  isNew: boolean
}

export async function loginWithWeChat(
  adapter: SupabaseAdapter
): Promise<{ token: string; userId: string }> {
  const loginRes = await wx.login()
  if (!loginRes.code) throw new Error('wx.login failed')

  const cloudRes = (await wx.cloud.callFunction({
    name: 'wechat-login',
    data: { code: loginRes.code },
  })) as { result: AuthResult }

  const { token, userId } = cloudRes.result

  wx.setStorageSync(TOKEN_KEY, token)
  wx.setStorageSync(USER_KEY, userId)
  wx.setStorageSync(TOKEN_EXPIRY_KEY, Date.now() + 3600 * 1000)

  ;(adapter as unknown as { setToken: (t: string) => void }).setToken(token)

  return { token, userId }
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

export async function getUser(adapter: SupabaseAdapter) {
  const userId = getUserId()
  if (!userId) return null

  const result = await adapter
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  return result.data as {
    id: string
    nickname: string
    avatar_url: string | null
  } | null
}

export function logout(): void {
  wx.removeStorageSync(TOKEN_KEY)
  wx.removeStorageSync(USER_KEY)
  wx.removeStorageSync(TOKEN_EXPIRY_KEY)
}

export async function ensureAuth(adapter: SupabaseAdapter): Promise<string> {
  const token = getToken()
  const userId = getUserId()

  if (token && userId && !isTokenExpired()) {
    ;(adapter as unknown as { setToken: (t: string) => void }).setToken(token)
    return userId
  }

  const result = await loginWithWeChat(adapter)
  return result.userId
}
