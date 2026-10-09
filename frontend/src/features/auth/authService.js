import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../../supabaseClient'

export const GUEST_ROLE = 'guest'
export const USER_ROLE = 'user'
export const ADMIN_ROLE = 'admin'

export async function signInWithOAuthProvider(supabaseClient, provider) {
  if (!['google', 'discord'].includes(provider)) throw new Error('Unsupported sign-in provider.')

  const providerName = provider === 'google' ? 'Google' : 'Discord'
  let settingsResponse
  try {
    settingsResponse = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
    })
  } catch {
    throw new Error(`Could not check ${providerName} sign-in settings. Please try again or use email login.`)
  }

  if (!settingsResponse.ok) {
    throw new Error(`Could not check ${providerName} sign-in settings. Please try again or use email login.`)
  }

  const settings = await settingsResponse.json()
  if (!settings.external?.[provider]) {
    throw new Error(`${providerName} sign-in is not enabled for this LOKI project yet. Use email login or ask the project admin to enable it in Supabase.`)
  }

  const redirectTo = new URL(import.meta.env.BASE_URL, window.location.origin).toString()
  const options = { redirectTo }
  if (provider === 'google') options.queryParams = { prompt: 'select_account' }

  const { error } = await supabaseClient.auth.signInWithOAuth({ provider, options })
  if (error) throw error
}

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
