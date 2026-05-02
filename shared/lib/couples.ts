import type { SupabaseAdapter } from './adapter'
import { generateId } from './utils'

export interface CoupleInfo {
  id: string
  partnerId: string
  partnerNickname: string
  sinceDate: string | null
  anniversary: string | null
}

/**
 * Generate a binding code.
 * Creates a new couples row with the current user as user_a.
 * Returns the generated 6-character code, or null on failure.
 */
export async function generateBindingCode(
  adapter: SupabaseAdapter,
  userId: string
): Promise<string | null> {
  // Generate a unique 6-char alphanumeric code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }

  // Check uniqueness, regenerate if taken
  const existingResult = await adapter
    .from('couples')
    .select('id')
    .eq('binding_code', code)
    .maybeSingle()

  if (existingResult.data) return generateBindingCode(adapter, userId) // retry

  const id = generateId()
  const result = await adapter
    .from('couples')
    .insert({ id, user_a_id: userId, binding_code: code })

  if (result.error) {
    console.error('Failed to generate binding code:', result.error.message)
    return null
  }

  return code
}

/**
 * Accept a binding code from the other user.
 * Finds the couple by code and sets the current user as user_b.
 * Returns true on success.
 */
export async function acceptBindingCode(
  adapter: SupabaseAdapter,
  userId: string,
  code: string
): Promise<boolean> {
  const trimmed = code.trim().toUpperCase()

  const coupleResult = await adapter
    .from('couples')
    .select('id')
    .eq('binding_code', trimmed)
    .is('user_b_id', null)
    .maybeSingle()

  const couple = coupleResult.data as { id: string } | null
  if (!couple) return false

  const result = await adapter
    .from('couples')
    .update({ user_b_id: userId, binding_code: null, updated_at: new Date().toISOString() })
    .eq('id', couple.id)

  if (result.error) {
    console.error('Failed to accept binding code:', result.error.message)
    return false
  }

  return true
}

/**
 * Delete the couple binding for the current user.
 * Returns true on success.
 */
export async function deleteCoupleBinding(
  adapter: SupabaseAdapter,
  userId: string
): Promise<boolean> {
  const coupleResult = await adapter
    .from('couples')
    .select('id')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .not('user_b_id', 'is', null)
    .maybeSingle()

  const couple = coupleResult.data as { id: string } | null
  if (!couple) return false

  const result = await adapter
    .from('couples')
    .delete()
    .eq('id', couple.id)

  if (result.error) {
    console.error('Failed to delete couple binding:', result.error.message)
    return false
  }

  return true
}

/**
 * Get the couple_id for a user.
 * Looks up the couples table to find which couple the user belongs to.
 * Returns null if the user is not in any couple.
 */
export async function getCoupleId(
  adapter: SupabaseAdapter,
  userId: string
): Promise<string | null> {
  const result = await adapter
    .from('couples')
    .select('id')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .maybeSingle()

  const data = result.data as { id: string } | null
  return data?.id ?? null
}

/**
 * Get the couple_id and partner info for a user.
 * Returns null if the user is not in any couple.
 */
export async function getCoupleInfo(
  adapter: SupabaseAdapter,
  userId: string
): Promise<CoupleInfo | null> {
  const coupleResult = await adapter
    .from('couples')
    .select('id, user_a_id, user_b_id, since_date, anniversary')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .not('user_b_id', 'is', null)
    .maybeSingle()

  const couple = coupleResult.data as {
    id: string
    user_a_id: string
    user_b_id: string
    since_date: string | null
    anniversary: string | null
  } | null

  if (!couple) return null

  const partnerId = couple.user_a_id === userId ? couple.user_b_id : couple.user_a_id

  // Try to get partner nickname via RPC
  const rpcResult = await adapter.rpc<{ couple_id: string; partner_id: string; partner_nickname: string }[]>('get_partner_nickname')
  const partnerNickname = rpcResult.data && rpcResult.data.length > 0
    ? rpcResult.data[0].partner_nickname || partnerId.slice(0, 8)
    : partnerId.slice(0, 8)

  return {
    id: couple.id,
    partnerId,
    partnerNickname,
    sinceDate: couple.since_date,
    anniversary: couple.anniversary,
  }
}

/**
 * Update couple dates (since_date and anniversary).
 */
export async function updateCoupleDates(
  adapter: SupabaseAdapter,
  coupleId: string,
  fields: { since_date?: string | null; anniversary?: string | null }
): Promise<boolean> {
  const result = await adapter
    .from('couples')
    .update(fields)
    .eq('id', coupleId)

  if (result.error) {
    console.error('Failed to update couple dates:', result.error.message)
    return false
  }

  return true
}
