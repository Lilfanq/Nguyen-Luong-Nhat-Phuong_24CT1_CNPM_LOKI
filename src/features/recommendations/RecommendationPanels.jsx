import { aiRecommendations } from '../../mockData'

export function AIRecommendationPanel({ activeProfile, selectedRecommendation, onOpenPreview, onApplyRecommendation }) {
  const selected = aiRecommendations.find((item) => item.id === selectedRecommendation) || aiRecommendations[0]

  return <section className="ai-recommendation-panel" aria-label="LOKI AI recommendations">
    <div className="ai-recommendation-header">
      <div>
        <p className="ai-recommendation-kicker">LOKI AI</p>
        <h2>Recommended profiles</h2>
      </div>
      <button type="button" className="ai-recommendation-action">Generate new setup</button>
    </div>
    <div className="ai-recommendation-grid">
      {aiRecommendations.map(({ id, title, game, accent, profileName, summary, highlights }) => {
        const isSelected = selectedRecommendation === id || activeProfile === profileName
        return <article className={`ai-recommendation-card ai-${accent} ${isSelected ? 'is-selected' : ''}`} key={id}>
          <div className="ai-card-topline">
            <span className="ai-card-tag">{game}</span>
            <span className="ai-card-dot" aria-hidden="true" />
          </div>
          <h3>{title}</h3>
          <p>{summary}</p>
          <ul>
            {highlights.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <div className="ai-card-actions">
            <button type="button" className="ai-card-preview" onClick={() => onOpenPreview(profileName)}>Preview</button>
            <button type="button" className="ai-card-apply" onClick={() => onApplyRecommendation(profileName)}>{activeProfile === profileName ? 'Active' : 'Apply'}</button>
          </div>
        </article>
      })}
    </div>

    <div className="ai-selected-detail">
      <div className="ai-selected-detail-copy">
        <p className="ai-selected-kicker">Selected recommendation</p>
        <h3>{selected.title}</h3>
        <p>{selected.summary}</p>
      </div>
      <div className="ai-selected-metrics">
        <div><span>DPI</span><strong>{selected.details.dpi}</strong></div>
        <div><span>Hz</span><strong>{selected.details.polling}</strong></div>
        <div><span>Profile</span><strong>{selected.profileName}</strong></div>
      </div>
      <div className="ai-selected-actions">
        <button type="button" className="ai-detail-btn ai-detail-secondary" onClick={() => onOpenPreview(selected.profileName)}>Detailed view</button>
        <button type="button" className="ai-detail-btn ai-detail-primary" onClick={() => onApplyRecommendation(selected.profileName)}>{activeProfile === selected.profileName ? 'Applied' : 'Apply this profile'}</button>
      </div>
    </div>
  </section>
}

export function ProfileDetailModal({ profile, onClose, onApply }) {
  if (!profile) return null

  return <div className="profile-detail-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="profile-detail-modal" aria-modal="true" role="dialog" aria-label={`${profile.title} profile details`}>
      <header className="profile-detail-header">
        <div>
          <p className="profile-detail-kicker">LOKI AI / PROFILE</p>
          <h2>{profile.title}</h2>
        </div>
        <button type="button" className="profile-detail-close" onClick={onClose} aria-label="Close profile detail">×</button>
      </header>

      <div className="profile-detail-body">
        <div className="profile-detail-summary">
          <span className="profile-detail-tag">{profile.game}</span>
          <p>{profile.summary}</p>
        </div>

        <div className="profile-detail-grid">
          <div className="profile-detail-stat">
            <span>Recommended for</span>
            <strong>{profile.details.recommendedFor}</strong>
          </div>
          <div className="profile-detail-stat">
            <span>DPI</span>
            <strong>{profile.details.dpi}</strong>
          </div>
          <div className="profile-detail-stat">
            <span>Polling</span>
            <strong>{profile.details.polling} Hz</strong>
          </div>
          <div className="profile-detail-stat">
            <span>Lift-off</span>
            <strong>{profile.details.liftOff}</strong>
          </div>
        </div>

        <div className="profile-detail-section">
          <h3>Button mapping</h3>
          <ul>
            {profile.details.bindSummary.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>

      <footer className="profile-detail-footer">
        <button type="button" className="profile-detail-secondary" onClick={onClose}>Close</button>
        <button type="button" className="profile-detail-primary" onClick={() => { onApply(profile.profileName); onClose() }}>Apply profile</button>
      </footer>
    </section>
  </div>
}
