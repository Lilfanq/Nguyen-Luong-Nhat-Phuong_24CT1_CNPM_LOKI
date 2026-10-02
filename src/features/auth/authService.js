export const GUEST_ROLE = 'guest'
export const USER_ROLE = 'user'
export const ADMIN_ROLE = 'admin'

export async function getAccountRole(supabaseClient, userId) {
  if (!userId) return { role: GUEST_ROLE, error: null }

  try {
    const { data, error } = await supabaseClient
      .from('app_users')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (error) return { role: USER_ROLE, error }
    return { role: data?.role === ADMIN_ROLE ? ADMIN_ROLE : USER_ROLE, error: null }
  } catch (error) {
    return { role: USER_ROLE, error }
  }
}

export async function listAccountsForAdmin(supabaseClient) {
  const { data, error } = await supabaseClient
    .from('app_users')
    .select('id, email, display_name, role, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateAccountRole(supabaseClient, userId, role) {
  const { error } = await supabaseClient.rpc('set_loki_user_role', {
    target_user_id: userId,
    requested_role: role,
  })

  if (error) throw error
}
