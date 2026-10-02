export const DEFAULT_PROFILES = ['Default_profile0', 'Default_profile1', 'Default_profile2', 'Default_profile3']

export function getStorageKeys(isSignedIn) {
  return isSignedIn
    ? {
        profiles: 'loki-profiles',
        activeProfile: 'loki-active-profile',
        history: 'loki-device-history',
      }
    : {
        profiles: 'loki-temporary-profiles',
        activeProfile: 'loki-temporary-active-profile',
        history: 'loki-temporary-device-history',
      }
}

export function getStoredProfiles(storage, key, fallback = DEFAULT_PROFILES) {
  try {
    const rawValue = storage.getItem(key)
    const storedProfiles = rawValue ? JSON.parse(rawValue) : null
    if (Array.isArray(storedProfiles) && storedProfiles.length > 0) {
      return storedProfiles
    }
  } catch {
    // Fall back to the default profile set if local storage is corrupted.
  }

  return [...fallback]
}

export function getStoredJson(storage, key, fallback) {
  try {
    const rawValue = storage.getItem(key)
    if (!rawValue) return fallback

    const value = JSON.parse(rawValue)
    if (Array.isArray(fallback)) return Array.isArray(value) ? value : fallback
    if (fallback && typeof fallback === 'object') {
      return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback
    }
    return value
  } catch {
    return fallback
  }
}

export function persistProfiles(storage, key, profiles) {
  storage.setItem(key, JSON.stringify(profiles))
}

export function saveActiveProfile(storage, key, profileName) {
  storage.setItem(key, profileName)
}

export function ensureProfile(profileName, profiles) {
  return profiles.includes(profileName) ? profiles : [...profiles, profileName]
}

export function createProfileName(profiles, prefix = 'Custom_profile') {
  const existing = new Set(profiles)
  let candidateIndex = 0
  let profileName = `${prefix}${candidateIndex}`

  while (existing.has(profileName)) {
    candidateIndex += 1
    profileName = `${prefix}${candidateIndex}`
  }

  return profileName
}

export async function loadProfilesFromSupabase(supabaseClient) {
  if (!supabaseClient) return []

  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('name, active')
      .order('updated_at', { ascending: false })

    if (error) return []

    const remoteProfiles = (data || [])
      .map((row) => row?.name)
      .filter(Boolean)

    return remoteProfiles.length > 0 ? [...new Set(remoteProfiles)] : []
  } catch {
    return []
  }
}

export async function saveProfilesToSupabase(supabaseClient, profiles, activeProfile) {
  if (!supabaseClient || !Array.isArray(profiles) || profiles.length === 0) return false

  try {
    const rows = profiles.map((profileName) => ({
      name: profileName,
      active: profileName === activeProfile,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabaseClient.from('profiles').upsert(rows, { onConflict: 'name' })
    return !error
  } catch {
    return false
  }
}
