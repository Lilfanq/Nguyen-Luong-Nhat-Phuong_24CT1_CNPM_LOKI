import { useEffect, useRef, useState } from 'react'
import { DEFAULT_DEVICE_SETTINGS } from './deviceSettings'

const POLLING_RATES = [125, 500, 1000, 2000, 4000, 8000]
const SENSITIVITY_PRESETS = ['Classic', 'Natural', 'Jump', 'Custom']
const TRACKING_DISTANCES = ['Low', 'Medium', 'High']

function SettingSection({ id, index, title, description, children }) {
  const sectionRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return undefined

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting)
    }, { threshold: 0.12, rootMargin: '-8% 0px -8% 0px' })

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return <section ref={sectionRef} className={`device-setting-section ${isVisible ? 'is-visible' : ''}`} id={id} aria-labelledby={`${id}-title`}>
    <header className="device-setting-section-header">
      <span className="device-setting-index">{index}</span>
      <div><p>DEVICE PROFILE</p><h2 id={`${id}-title`}>{title}</h2><span>{description}</span></div>
      <span className="device-setting-local-tag">LOKI PROFILE</span>
    </header>
    <div className="device-setting-section-body">{children}</div>
  </section>
}

function SettingToggle({ checked, onChange, title, description }) {
  return <label className="device-setting-toggle">
    <span><strong>{title}</strong><small>{description}</small></span>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
  </label>
}

function SegmentedOptions({ label, options, value, onChange, suffix = '' }) {
  return <div className="device-setting-segmented" role="group" aria-label={label}>
    {options.map((option) => {
      const optionValue = typeof option === 'object' ? option.value : option
      const optionLabel = typeof option === 'object' ? option.label : option
      return <button className={value === optionValue ? 'is-active' : ''} type="button" key={optionValue} aria-pressed={value === optionValue} onClick={() => onChange(optionValue)}>{optionLabel}{suffix}</button>
    })}
  </div>
}

export default function WorkspaceSettings({ settings, onChange, deviceTitle, activeProfile, batteryStatus }) {
  const stages = Array.isArray(settings.dpiStages) && settings.dpiStages.length > 0 ? settings.dpiStages : DEFAULT_DEVICE_SETTINGS.dpiStages
  const updateStage = (stageIndex, value) => onChange({ dpiStages: stages.map((stage, index) => index === stageIndex ? value : stage) })
  const scrollToSection = (sectionId) => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return <div className="device-settings" id="workspace-settings">
    <header className="device-settings-heading">
      <div><p>LOKI / DEVICE TUNING</p><h1>Settings workspace</h1><span>{deviceTitle} <i /> {activeProfile}</span></div>
      <div className="device-settings-status"><span className="settings-status-light" />{batteryStatus}</div>
    </header>

    <nav className="device-settings-nav" aria-label="Device setting sections">
      {[['performance', 'Performance'], ['power', 'Power'], ['calibration', 'Calibration'], ['advanced', 'Advanced']].map(([id, label], index) => <button type="button" key={id} onClick={() => scrollToSection(`device-${id}`)}><span>0{index + 1}</span>{label}<b aria-hidden="true">↘</b></button>)}
    </nav>

    <div className="device-settings-grid">
      <SettingSection id="device-performance" index="01" title="Performance" description="Sensitivity stages and report frequency">
        <div className="device-setting-block">
          <SettingToggle checked={settings.sensitivityStagesEnabled} onChange={(value) => onChange({ sensitivityStagesEnabled: value })} title="Sensitivity stages" description="Keep several DPI values ready in this profile." />
          <div className="dpi-stage-list">
            {stages.slice(0, settings.sensitivityStagesEnabled ? 8 : 1).map((dpi, index) => <div className={`dpi-stage-row ${settings.activeDpiStage === index ? 'is-active' : ''}`} key={`dpi-${index}`}>
              <button className="dpi-stage-select" type="button" aria-label={`Select DPI stage ${index + 1}`} aria-pressed={settings.activeDpiStage === index} onClick={() => onChange({ activeDpiStage: index })}>{index + 1}</button>
              <label><span>STAGE {String(index + 1).padStart(2, '0')}</span><output>{dpi} <small>DPI</small></output><input type="range" min="100" max="50000" step="100" value={dpi} onChange={(event) => updateStage(index, Number(event.target.value))} aria-label={`DPI for stage ${index + 1}`} /></label>
              {settings.sensitivityStagesEnabled && stages.length > 1 && <button className="dpi-stage-remove" type="button" onClick={() => onChange({ dpiStages: stages.filter((_, stageIndex) => stageIndex !== index), activeDpiStage: Math.min(settings.activeDpiStage, stages.length - 2) })} aria-label={`Remove stage ${index + 1}`}>×</button>}
            </div>)}
          </div>
          {settings.sensitivityStagesEnabled && stages.length < 8 && <button className="device-setting-add-stage" type="button" onClick={() => onChange({ dpiStages: [...stages, Math.min(50000, Number(stages[stages.length - 1]) + 400)] })}>+ Add sensitivity stage</button>}
        </div>
        <div className="device-setting-block">
          <div className="device-setting-label"><span>POLLING RATE</span><small>Higher rates can use more power and CPU.</small></div>
          <SegmentedOptions label="Polling rate" options={POLLING_RATES} value={settings.pollingRate} suffix=" Hz" onChange={(value) => onChange({ pollingRate: value })} />
          <SettingToggle checked={settings.smartPolling} onChange={(value) => onChange({ smartPolling: value })} title="Smart polling" description="Store a separate rate for fullscreen games." />
          {settings.smartPolling && <SegmentedOptions label="Fullscreen polling rate" options={POLLING_RATES} value={settings.smartPollingRate} suffix=" Hz" onChange={(value) => onChange({ smartPollingRate: value })} />}
        </div>
      </SettingSection>

      <SettingSection id="device-power" index="02" title="Power" description="Wireless idle and low-power behavior">
        <div className="device-setting-block">
          <label className="device-setting-range"><span><strong>Sleep after idle</strong><small>Battery: {batteryStatus}</small></span><output>{settings.sleepMinutes} <small>min</small></output><input type="range" min="1" max="15" step="1" value={settings.sleepMinutes} onChange={(event) => onChange({ sleepMinutes: Number(event.target.value) })} aria-label="Sleep after idle minutes" /></label>
          <label className="device-setting-range"><span><strong>Low power threshold</strong><small>Set a profile reminder threshold.</small></span><output>{settings.lowPowerThreshold}<small>%</small></output><input type="range" min="5" max="100" step="1" value={settings.lowPowerThreshold} onChange={(event) => onChange({ lowPowerThreshold: Number(event.target.value) })} aria-label="Low power threshold percent" /></label>
        </div>
      </SettingSection>

      <SettingSection id="device-calibration" index="03" title="Calibration" description="Tracking distance and surface behavior">
        <div className="device-setting-block">
          <SettingToggle checked={settings.asymmetricCutoff} onChange={(value) => onChange({ asymmetricCutoff: value })} title="Asymmetric cut-off" description="Keep lift-off and landing distance as separate profile preferences." />
          <div className="device-setting-label"><span>TRACKING DISTANCE</span><small>Profile target for this surface.</small></div>
          <SegmentedOptions label="Tracking distance" options={TRACKING_DISTANCES} value={settings.trackingDistance} onChange={(value) => onChange({ trackingDistance: value })} />
          <button className="device-setting-outline" type="button" onClick={() => onChange({ trackingDistance: 'Low', asymmetricCutoff: true })}>Set low lift-off target</button>
        </div>
      </SettingSection>

      <SettingSection id="device-advanced" index="04" title="Advanced" description="Sensitivity response and orientation">
        <div className="device-setting-block">
          <SettingToggle checked={settings.dynamicSensitivity} onChange={(value) => onChange({ dynamicSensitivity: value })} title="Dynamic sensitivity" description="Save a preferred response curve to this profile." />
          <div className="device-setting-label"><span>RESPONSE CURVE</span></div>
          <SegmentedOptions label="Sensitivity curve preset" options={SENSITIVITY_PRESETS} value={settings.sensitivityPreset} onChange={(value) => onChange({ sensitivityPreset: value })} />
          <label className="device-setting-range"><span><strong>Rotation</strong><small>Adjust the map orientation preference.</small></span><output>{settings.rotation}°</output><input type="range" min="-44" max="44" step="1" value={settings.rotation} onChange={(event) => onChange({ rotation: Number(event.target.value) })} aria-label="Rotation angle" /></label>
        </div>
      </SettingSection>
    </div>

    <footer className="device-settings-footer"><span>DEVICE WRITE STATUS</span><p>These controls save to the selected LOKI profile in this browser. Direct DPI, polling, calibration, and power writes require a supported device protocol.</p></footer>
  </div>
}
