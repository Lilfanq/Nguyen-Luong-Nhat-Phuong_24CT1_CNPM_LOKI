import { useState } from 'react'

export function ProfileControlCenter({ profileName, deviceCount, syncStatus }) {
  const controlCards = [
    { label: 'Active profile', value: profileName, tone: 'primary' },
    { label: 'Connected devices', value: `${deviceCount}`, tone: 'neutral' },
    { label: 'Sync status', value: syncStatus, tone: 'success' },
  ]

  return <section className="profile-control-center" aria-label="LOKI profile control center">
    <div className="ai-troubleshooting-header">
      <div>
        <p className="ai-recommendation-kicker">CONTROL CENTER</p>
        <h2>Profile & device manager</h2>
      </div>
      <button type="button" className="ai-recommendation-action">Manage profiles</button>
    </div>

    <div className="control-center-grid">
      {controlCards.map(({ label, value, tone }) => (
        <article className={`control-center-card ${tone}`} key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </div>

    <div className="control-center-actions">
      <button type="button">Apply to all</button>
      <button type="button">Backup now</button>
      <button type="button">Share config</button>
    </div>
  </section>
}

export function SavedProfilesPanel({ profiles, activeProfile, onSelectProfile, onCreateProfile, onRenameProfile, onDeleteProfile }) {
  const [editingProfile, setEditingProfile] = useState('')
  const [draftName, setDraftName] = useState('')
  const [renameMessage, setRenameMessage] = useState('')
  const [savingRename, setSavingRename] = useState(false)
  const [deletingProfile, setDeletingProfile] = useState('')

  const startRename = (profileName) => {
    setEditingProfile(profileName)
    setDraftName(profileName)
    setRenameMessage('')
  }

  const cancelRename = () => {
    setEditingProfile('')
    setDraftName('')
    setRenameMessage('')
  }

  const commitRename = async (profileName) => {
    if (savingRename) return
    setSavingRename(true)
    setRenameMessage('')

    try {
      const result = await onRenameProfile(profileName, draftName)
      if (!result?.ok) {
        setRenameMessage(result?.message || 'Could not rename this profile.')
        return
      }
      setEditingProfile('')
      setDraftName('')
      setRenameMessage(result.message || 'Profile renamed.')
    } catch (error) {
      setRenameMessage(error?.message || 'Could not rename this profile.')
    } finally {
      setSavingRename(false)
    }
  }

  const requestDelete = async (profileName) => {
    if (deletingProfile) return
    setDeletingProfile(profileName)
    setRenameMessage('')
    try {
      const result = await onDeleteProfile(profileName)
      if (result?.cancelled) return
      setRenameMessage(result?.message || (result?.ok ? 'Profile deleted.' : 'Could not delete this profile.'))
    } catch (error) {
      setRenameMessage(error?.message || 'Could not delete this profile.')
    } finally {
      setDeletingProfile('')
    }
  }

  return <section className="saved-profiles-panel" aria-label="Saved profiles panel">
    <div className="ai-troubleshooting-header">
      <div>
        <p className="ai-recommendation-kicker">PROFILE LIBRARY</p>
        <h2>Saved configurations</h2>
      </div>
      <button type="button" className="ai-recommendation-action" onClick={onCreateProfile}>Create profile</button>
    </div>

    <div className="saved-profile-list">
      {profiles.map((profile) => <article className={`saved-profile-item ${profile === activeProfile ? 'is-active' : ''}`} key={profile}>
        {editingProfile === profile
          ? <form className="saved-profile-rename" onSubmit={(event) => { event.preventDefault(); void commitRename(profile) }}>
              <label><span>Profile name</span><input autoFocus maxLength={40} value={draftName} onChange={(event) => setDraftName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') cancelRename() }} /></label>
              <div><button type="submit" disabled={savingRename}>{savingRename ? 'Saving…' : 'Save'}</button><button type="button" className="saved-profile-cancel" onClick={cancelRename} disabled={savingRename}>Cancel</button></div>
            </form>
          : <>
              <button type="button" className="saved-profile-select" onClick={() => onSelectProfile(profile)} aria-pressed={profile === activeProfile}>
                <span>{profile}</span>
                <small>{profile === activeProfile ? 'Active' : 'Use this profile'}</small>
              </button>
              <div className="saved-profile-actions">
                <button type="button" className="saved-profile-rename-start" onClick={() => startRename(profile)} aria-label={`Rename ${profile}`}>Rename</button>
                <button type="button" className="saved-profile-delete" onClick={() => void requestDelete(profile)} aria-label={`Delete ${profile}`} disabled={profiles.length <= 1 || Boolean(deletingProfile)}>{deletingProfile === profile ? 'Deleting…' : 'Delete'}</button>
              </div>
            </>}
      </article>)}
    </div>
    {renameMessage && <p className="saved-profile-feedback" role="status" aria-live="polite">{renameMessage}</p>}
  </section>
}
