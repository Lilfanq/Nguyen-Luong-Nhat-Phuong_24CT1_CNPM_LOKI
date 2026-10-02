import { aiDiagnostics } from '../../mockData'

export function SmartInsightsPanel() {
  const insightCards = [
    { label: 'Profile confidence', value: '94%', hint: 'Tuned for current device' },
    { label: 'Avg latency', value: '12ms', hint: 'Under target 15ms' },
    { label: 'Sync health', value: 'Stable', hint: 'Bluetooth + USB + HID clear' },
    { label: 'Battery drift', value: '0.8%', hint: 'Within safe range' },
  ]

  const quickActions = ['Auto tune', 'Export profile', 'Back up settings', 'Share config']

  return <section className="smart-insights-panel" aria-label="LOKI smart insights">
    <div className="ai-troubleshooting-header">
      <div>
        <p className="ai-recommendation-kicker">SMART INSIGHTS</p>
        <h2>Performance overview</h2>
      </div>
      <button type="button" className="ai-recommendation-action">Refresh report</button>
    </div>

    <div className="smart-insights-grid">
      {insightCards.map(({ label, value, hint }) => (
        <article className="smart-insight-card" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
          <small>{hint}</small>
        </article>
      ))}
    </div>

    <div className="smart-action-strip">
      {quickActions.map((action) => (
        <button type="button" key={action}>{action}</button>
      ))}
    </div>
  </section>
}

export function AITroubleshootingPanel() {
  return <section className="ai-troubleshooting-panel" aria-label="LOKI AI troubleshooting">
    <div className="ai-troubleshooting-header">
      <div>
        <p className="ai-recommendation-kicker">AI DIAGNOSTICS</p>
        <h2>Setup health checks</h2>
      </div>
      <button type="button" className="ai-recommendation-action">Run scan</button>
    </div>

    <div className="ai-diagnostics-list">
      {aiDiagnostics.map(({ id, title, severity, message, action }) => (
        <article className={`ai-diagnostic-item ${severity}`} key={id}>
          <div className="ai-diagnostic-status">
            <span className="ai-diagnostic-severity" aria-hidden="true" />
            <strong>{title}</strong>
          </div>
          <p>{message}</p>
          <div className="ai-diagnostic-footer">
            <span>{severity.toUpperCase()}</span>
            <button type="button">Fix now</button>
          </div>
          <small>{action}</small>
        </article>
      ))}
    </div>
  </section>
}
