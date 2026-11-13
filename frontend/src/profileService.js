export const DEFAULT_PROFILES = ['Default_profile0', 'Default_profile1', 'Default_profile2']

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

export function migrateRenamedProfileStorage(storage, historyKey, actionStorageKey, oldName, newName) {
  const history = getStoredJson(storage, historyKey, {})
  if (Object.hasOwn(history, oldName)) {
    const mergedHistory = [...(history[newName] || []), ...history[oldName]]
    history[newName] = mergedHistory.filter((entry, index, entries) => entries.findIndex((item) => item.key === entry.key) === index)
    delete history[oldName]
    persistProfiles(storage, historyKey, history)
  }

  for (const storageKey of ['loki-device-settings', actionStorageKey]) {
    const entries = getStoredJson(storage, storageKey, {})
    let changed = false
    for (const key of Object.keys(entries)) {
      if (!key.endsWith(`::${oldName}`)) continue
      const newKey = `${key.slice(0, -oldName.length)}${newName}`
      entries[newKey] = { ...(entries[newKey] || {}), ...entries[key] }
      delete entries[key]
      changed = true
    }
    if (storageKey === actionStorageKey) {
      for (const assignments of Object.values(entries)) {
        for (const action of Object.values(assignments || {})) {
          if (action?.category === 'profile' && action.value === oldName) {
            action.value = newName
            changed = true
          }
        }
      }
    }
    if (changed) storage.setItem(storageKey, JSON.stringify(entries))
  }

  return history
}

export function deleteProfileStorage(storage, historyKey, actionStorageKey, profileName, legacyProfileName) {
  const history = getStoredJson(storage, historyKey, {})
  delete history[profileName]
  persistProfiles(storage, historyKey, history)

  for (const storageKey of ['loki-device-settings', actionStorageKey]) {
    const entries = getStoredJson(storage, storageKey, {})
    let changed = false
    for (const key of Object.keys(entries)) {
      const profileScopedKey = key.endsWith(`::${profileName}`)
      const legacyDefaultKey = storageKey === actionStorageKey && profileName === legacyProfileName && !key.includes('::')
      if (!profileScopedKey && !legacyDefaultKey) continue
      delete entries[key]
      changed = true
    }

    if (storageKey === actionStorageKey) {
      for (const assignments of Object.values(entries)) {
        for (const action of Object.values(assignments || {})) {
          if (action?.category === 'profile' && action.value === profileName) {
            action.value = 'Next profile'
            changed = true
          }
        }
      }
    }

    if (changed) storage.setItem(storageKey, JSON.stringify(entries))
  }

  return history
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
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) return []

    const { data, error } = await supabaseClient
      .from('user_profiles')
      .select('name, active')
      .eq('user_id', user.id)
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
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) return false

    const rows = profiles.map((profileName) => ({
      user_id: user.id,
      name: profileName,
      active: profileName === activeProfile,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabaseClient.from('user_profiles').upsert(rows, { onConflict: 'user_id,name' })
    return !error
  } catch {
    return false
  }
}

export async function renameProfileInSupabase(supabaseClient, oldName, newName, activeProfile) {
  if (!supabaseClient || !oldName || !newName) return false

  try {
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) return false

    const { data: oldProfile, error: lookupError } = await supabaseClient
      .from('user_profiles')
      .select('active')
      .eq('user_id', user.id)
      .eq('name', oldName)
      .maybeSingle()

    if (lookupError) return false

    const { error: saveError } = await supabaseClient
      .from('user_profiles')
      .upsert({ user_id: user.id, name: newName, active: oldProfile?.active ?? activeProfile === newName, updated_at: new Date().toISOString() }, { onConflict: 'user_id,name' })

    if (saveError) return false
    if (!oldProfile) return true

    const { error: deleteError } = await supabaseClient
      .from('user_profiles')
      .delete()
      .eq('user_id', user.id)
      .eq('name', oldName)

    return !deleteError
  } catch {
    return false
  }
}

export async function deleteProfileFromSupabase(supabaseClient, profileName) {
  if (!supabaseClient || !profileName) return false

  try {
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) return false

    const { error } = await supabaseClient
      .from('user_profiles')
      .delete()
      .eq('user_id', user.id)
      .eq('name', profileName)

    return !error
  } catch {
    return false
  }
}
