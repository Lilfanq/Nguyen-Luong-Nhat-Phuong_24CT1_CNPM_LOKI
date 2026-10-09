import { deviceCatalog, supabaseSchema } from '../../mockData'

export default function DeviceCatalogPanel() {
  return <section className="device-catalog-panel" aria-label="LOKI device catalog">
    <div className="ai-troubleshooting-header">
      <div>
        <p className="ai-recommendation-kicker">DEVICE LIBRARY</p>
        <h2>Supported hardware</h2>
      </div>
      <button type="button" className="ai-recommendation-action">Sync with Supabase</button>
    </div>

    <div className="device-catalog-grid">
      {deviceCatalog.map(({ id, name, brand, type, interface: deviceInterface, status, compatibility, connectivity, memory }) => (
        <article className="device-catalog-card" key={id}>
          <div className="device-catalog-head">
            <span className="device-catalog-brand">{brand}</span>
            <span className={`device-catalog-status ${status === 'Ready' ? 'ready' : 'queued'}`}>{status}</span>
          </div>
          <h3>{name}</h3>
          <p>{type} · {deviceInterface}</p>
          <ul>
            <li>Connection: {connectivity}</li>
            <li>Memory: {memory}</li>
            <li>Profiles: {compatibility.join(', ')}</li>
          </ul>
        </article>
      ))}
    </div>

    <div className="schema-preview">
      <p className="schema-preview-label">Supabase model</p>
      <div className="schema-preview-list">
        {supabaseSchema.tables.map(({ name, columns }) => (
          <div className="schema-preview-item" key={name}>
            <strong>{name}</strong>
            <span>{columns.join(' · ')}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
}
