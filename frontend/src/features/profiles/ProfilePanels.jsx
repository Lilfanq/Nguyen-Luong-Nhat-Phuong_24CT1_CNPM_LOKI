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

export function SavedProfilesPanel({ profiles, activeProfile, onSelectProfile, onCreateProfile }) {
  return <section className="saved-profiles-panel" aria-label="Saved profiles panel">
    <div className="ai-troubleshooting-header">
      <div>
        <p className="ai-recommendation-kicker">PROFILE LIBRARY</p>
        <h2>Saved configurations</h2>
      </div>
      <button type="button" className="ai-recommendation-action" onClick={onCreateProfile}>Create profile</button>
    </div>

    <div className="saved-profile-list">
      {profiles.map((profile) => (
        <button
          type="button"
          key={profile}
          className={`saved-profile-item ${profile === activeProfile ? 'is-active' : ''}`}
          onClick={() => onSelectProfile(profile)}
        >
          <span>{profile}</span>
          <small>{profile === activeProfile ? 'Active' : 'Use this build'}</small>
        </button>
      ))}
    </div>
  </section>
}
