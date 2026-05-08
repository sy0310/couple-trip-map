import type { SupabaseAdapter } from './adapter'

export interface CoupleInfo {
  id: string
  partnerId: string
  partnerNickname: string
  sinceDate: string | null
  anniversary: string | null
}

/**
 * Generate a binding code.
 * Uses SECURITY DEFINER RPC to bypass RLS since mini-program auth
 * uses WeChat openid rather than Supabase Auth JWT.
 * Returns the generated 6-character code, or null on failure.
 */
export async function generateBindingCode(
  adapter: SupabaseAdapter,
  userId: string
): Promise<string | null> {
  const result = await adapter.rpc<string>('create_couple_binding', { p_user_id: userId })
  if (result.error) {
    console.error('Failed to generate binding code:', result.error.message)
    return null
  }
  return result.data
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
  const result = await adapter.rpc<boolean>('accept_couple_binding', {
    p_user_id: userId,
    p_code: trimmed,
  })
  if (result.error) {
    console.error('Failed to accept binding code:', result.error.message)
    return false
  }
  return result.data === true
}

/**
 * Delete the couple binding for the current user.
 * Returns true on success.
 */
export async function deleteCoupleBinding(
  adapter: SupabaseAdapter,
  userId: string
): Promise<boolean> {
  const result = await adapter.rpc<boolean>('delete_couple_binding', { p_user_id: userId })
  if (result.error) {
    console.error('Failed to delete couple binding:', result.error.message)
    return false
  }
  return result.data === true
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
  const result = await adapter.rpc<{ id: string }[]>('get_couple_by_user', { p_user_id: userId })

  if (result.error) {
    console.error('getCoupleId error:', result.error.message)
    return null
  }

  const data = result.data && result.data.length > 0 ? result.data[0] : null
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
  const result = await adapter.rpc<{
    id: string
    user_a_id: string
    user_b_id: string
    since_date: string | null
    anniversary: string | null
    partner_id: string
    partner_nickname: string
  }[]>('get_couple_by_user', { p_user_id: userId })

  if (result.error) {
    console.error('getCoupleInfo error:', result.error.message)
    return null
  }

  const couple = result.data && result.data.length > 0 ? result.data[0] : null
  if (!couple) return null

  return {
    id: couple.id,
    partnerId: couple.partner_id,
    partnerNickname: couple.partner_nickname,
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
  const result = await adapter.rpc<boolean>('update_couple_dates', {
    p_couple_id: coupleId,
    p_since_date: fields.since_date || null,
    p_anniversary: fields.anniversary || null,
  })

  if (result.error) {
    console.error('Failed to update couple dates:', result.error.message)
    return false
  }

  return true
}
