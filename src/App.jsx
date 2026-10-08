import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { aiRecommendations } from './mockData'
import { supabase } from './supabaseClient'
import { createProfileName, ensureProfile, getStorageKeys, getStoredJson, getStoredProfiles, loadProfilesFromSupabase, persistProfiles, saveActiveProfile, saveProfilesToSupabase } from './profileService'
import { ADMIN_ROLE, getAccountRole } from './features/auth/authService'
import AuthFormPanel from './features/auth/AuthFormPanel'
import AuthenticatedSessionPanel from './features/auth/AuthenticatedSessionPanel'
import GuestSessionPanel from './features/auth/GuestSessionPanel'
import AdminDashboard from './features/admin/AdminDashboard'
import DeviceCatalogPanel from './features/devices/DeviceCatalogPanel'
import WorkspaceSettings from './features/devices/WorkspaceSettings'
import { DEFAULT_DEVICE_SETTINGS } from './features/devices/deviceSettings'
import { AITroubleshootingPanel, SmartInsightsPanel } from './features/insights/InsightPanels'
import { AIRecommendationPanel, ProfileDetailModal } from './features/recommendations/RecommendationPanels'
import { ProfileControlCenter, SavedProfilesPanel } from './features/profiles/ProfilePanels'
import DragonMascot from './LokiDragon'
import { requestAssistantReply, validateAssistantAction, ASSISTANT_PROFILE_ACTIONS } from './features/assistant/assistantService'
import './App.css'

function publicAsset(path) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

const mouseControls = [
  { label: 'Left click', placement: 'left-click', anchor: [465, 180], edge: [220, 118], path: 'M465 180 H448 Q425 180 425 157 V118 H220' },
  { label: 'Right Click', placement: 'right-click', anchor: [535, 180], edge: [690, 126], path: 'M535 180 H555 Q578 180 578 157 V126 H690' },
  { label: 'Scroll Click', placement: 'scroll-click', anchor: [500, 240], edge: [210, 219], path: 'M500 240 H450 Q430 240 430 239 V219 H210' },
  { label: 'Scroll Up', placement: 'scroll-up', anchor: [500, 198], edge: [690, 205], path: 'M500 198 V205 H690' },
  { label: 'Scroll Down', placement: 'scroll-down', anchor: [520, 273], edge: [720, 355], path: 'M520 273 H562 Q585 273 585 308 V332 Q585 355 608 355 H720' },
  { label: 'Mouse Button 4', placement: 'button-four', anchor: [385, 340], edge: [230, 430], path: 'M385 340 H335 Q310 340 310 366 V407 Q310 430 287 430 H230' },
  { label: 'Mouse Button 5', placement: 'button-five', anchor: [385, 435], edge: [230, 530], path: 'M385 435 H350 Q326 435 326 461 V507 Q326 530 303 530 H230' },
  { label: 'Cycle up Sensitive', placement: 'sensitivity', anchor: [590, 438], edge: [780, 540], path: 'M590 438 H740 Q770 438 770 468 V510 Q770 540 780 540' },
]

const buttonListOrder = ['Left click', 'Right Click', 'Scroll Click', 'Scroll Up', 'Scroll Down', 'Mouse Button 4', 'Cycle up Sensitive', 'Mouse Button 5']
const vortexParticlePositions = Array.from({ length: 36 }, (_, index) => {
  const angle = index * 2.399963
  const radius = 12 + ((index * 19) % 40)
  return { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius * 0.72 }
})

const defaultButtonAssignments = {
  'Left click': { category: 'Mouse', value: 'Left Click' },
  'Right Click': { category: 'Mouse', value: 'Right Click' },
  'Scroll Click': { category: 'Mouse', value: 'Scroll Click' },
  'Scroll Up': { category: 'Mouse', value: 'Scroll Up' },
  'Scroll Down': { category: 'Mouse', value: 'Scroll Down' },
  'Mouse Button 4': { category: 'Mouse', value: 'Mouse Button 4' },
  'Cycle up Sensitive': { category: 'Sensitivity', value: 'Cycle Up Sensitivity Stages' },
  'Mouse Button 5': { category: 'Mouse', value: 'Mouse Button 5' },
}

const actionCategories = [
  { id: 'default', label: 'Default' },
  { id: 'mouse', label: 'Mouse function' },
  { id: 'keyboard', label: 'Keyboard shortcut' },
  { id: 'sensitivity', label: 'Sensitivity' },
  { id: 'profile', label: 'Switch profile' },
  { id: 'multimedia', label: 'Multimedia' },
  { id: 'text', label: 'Text function' },
  { id: 'website', label: 'Open website' },
]

const actionOptions = {
  default: ['Keep standard behavior', 'Disable this control'],
  mouse: ['Left click', 'Right click', 'Middle click', 'Back', 'Forward', 'Scroll up', 'Scroll down'],
  sensitivity: [
    'Sensitivity Clutch',
    'Sensitivity Stage Up',
    'Sensitivity Stage Down',
    'On-The-Fly Sensitivity',
    'Cycle Up Sensitivity Stages',
    'Cycle Down Sensitivity Stages',
    'Increase DPI',
    'Decrease DPI',
  ],
  multimedia: ['Volume up', 'Volume down', 'Mute', 'Play / pause', 'Next track', 'Previous track'],
}

function actionDescription(action) {
  if (!action) return ''
  if (action.category === 'text') return action.value ? `Text: ${action.value}` : 'Text function'
  if (action.category === 'website') return action.value || 'Open website'
  return action.value || actionCategories.find(({ id }) => id === action.category)?.label || 'Custom action'
}

function buttonListAssignment(deviceActions, label) {
  const action = deviceActions[label]
  if (!action || (action.category === 'default' && action.value === 'Keep standard behavior')) {
    return { ...defaultButtonAssignments[label], isCustom: false }
  }
  if (action.category === 'default') return { category: 'Default', value: action.value, isCustom: true }
  return {
    category: actionCategories.find(({ id }) => id === action.category)?.label || 'Custom',
    value: actionDescription(action),
    isCustom: true,
  }
}

function canSaveAction(action) {
  if (['keyboard', 'text', 'website'].includes(action.category)) return Boolean(action.value?.trim())
  if (action.category === 'sensitivity') {
    return Boolean(action.value)
      && Boolean(action.stages?.length)
      && action.stages.every((dpi) => Number.isFinite(Number(dpi)) && Number(dpi) >= 100 && Number(dpi) <= 50000)
  }
  if (action.category === 'profile' || actionOptions[action.category]) return Boolean(action.value)
  return true
}

function uniqueDevices(deviceList) {
  const devicesByIdentity = new Map()
  for (const device of deviceList) {
    const key = deviceKey(device)
    const current = devicesByIdentity.get(key)
    if (!current || deviceInterfacePriority(device) > deviceInterfacePriority(current)) devicesByIdentity.set(key, device)
  }
  return [...devicesByIdentity.values()]
}

function deviceInterfacePriority(device) {
  const isMouseInterface = (device.collections || []).some((collection) => collection.usagePage === 0x01 && collection.usage === 0x02)
  if (supportsRazerBatteryProtocol(device) && isMouseInterface) return 4
  if (supportsRazerBatteryProtocol(device)) return 3
  if (isMouseInterface) return 2
  return 1
}

function deviceTransportKey(device) {
  const signatures = []
  const visit = (collections) => {
    for (const collection of collections || []) {
      const inputIds = Array.from(collection.inputReports || [], (report) => report.reportId).join('.')
      const featureIds = Array.from(collection.featureReports || [], (report) => report.reportId).join('.')
      signatures.push(`${collection.usagePage}:${collection.usage}:i${inputIds}:f${featureIds}`)
      visit(collection.children)
    }
  }

  visit(device.collections)
  return `${device.vendorId}:${device.productId}:${signatures.sort().join('|')}`
}

function deviceKey(device) {
  const productName = (device.productName || device.name || '').trim().toLowerCase()
  const modelName = productName
    .replace(/\b(?:wireless|wired|bluetooth|ble|usb|2\.4(?:\s?ghz)?|receiver|dongle)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return modelName && !/^(?:unnamed|unknown|hid)(?:\s+device)?$/.test(modelName)
    ? `${device.vendorId}-${modelName}`
    : `${device.vendorId}-${device.productId}-hid-device`
}

function deviceHistoryEntry(device) {
  return {
    key: deviceKey(device),
    name: device.productName || 'Unnamed HID device',
    vendorId: device.vendorId,
    productId: device.productId,
    lastConnected: new Date().toISOString(),
  }
}

function deviceAssetPath(device, connected) {
  const name = (device.productName || device.name || '').toLowerCase()
  if (name.includes('mouse') || name.includes('viper')) return publicAsset(connected ? '/devices/mouse/connect/Razer%20Viper%20V4%20Pro%20White%20Edition.png' : '/devices/mouse/disconnect/Razer%20Viper%20V4%20Pro%20White%20Edition.png')
  if (name.includes('aula') || name.includes('hero') || name.includes('win68') || name.includes('keyboard') || name.includes('key')) return publicAsset(connected ? '/devices/keyboard/connect/AULA%20HERO%20WIN68HE.png' : '/devices/keyboard/disconnect/AULA%20HERO%20WIN68HE.png')
  return null
}

function isSupportedDevice(device) {
  return Boolean(deviceAssetPath(device, true))
}

function batteryUsageType(usagePage, usage) {
  if ((usagePage === 0x06 && usage === 0x20) || (usagePage === 0x0d && usage === 0x3b)) return 'level'
  if (usagePage === 0x85 && usage === 0x65) return 'level'
  if (usagePage === 0x85 && usage === 0x44) return 'charging'
  return null
}

function reportItemUsage(item, index) {
  if (item.isRange && Number.isInteger(item.usagesMin) && Number.isInteger(item.usagesMax)) {
    const usage = item.usagesMin + index
    return usage <= item.usagesMax ? usage : null
  }

  const usages = Array.from(item.usages || [])
  if (usages.length === 1) return usages[0]
  return usages[index] ?? null
}

function readReportBits(data, bitOffset, bitSize, logicalMinimum) {
  if (bitSize < 1 || bitSize > 32 || bitOffset + bitSize > data.byteLength * 8) return null

  let value = 0
  for (let bit = 0; bit < bitSize; bit += 1) {
    const sourceByte = data.getUint8(Math.floor((bitOffset + bit) / 8))
    const sourceBit = (sourceByte >> ((bitOffset + bit) % 8)) & 1
    value += sourceBit * (2 ** bit)
  }

  if (logicalMinimum < 0 && value >= 2 ** (bitSize - 1)) value -= 2 ** bitSize
  return value
}

function normalizeBatteryLevel(value, item, usagePage, usage) {
  if (usagePage === 0x85 && usage === 0x65) return Math.round(Math.min(100, Math.max(0, value)))

  const minimum = item.logicalMinimum
  const maximum = item.logicalMaximum
  if (Number.isFinite(minimum) && Number.isFinite(maximum) && maximum > minimum) {
    return Math.round(Math.min(100, Math.max(0, ((value - minimum) / (maximum - minimum)) * 100)))
  }

  return value >= 0 && value <= 100 ? Math.round(value) : null
}

function collectBatteryReports(collections, reportType) {
  const reportsById = new Map()

  const visit = (collectionList) => {
    for (const collection of collectionList || []) {
      for (const report of collection[reportType] || []) {
        const reportId = report.reportId ?? 0
        const items = Array.from(report.items || [])
        if (!reportsById.has(reportId)) reportsById.set(reportId, { reportId, items: [], signatures: new Set() })

        const groupedReport = reportsById.get(reportId)
        const signature = JSON.stringify(items.map((item) => [item.usagePage, item.usages, item.usagesMin, item.usagesMax, item.reportSize, item.reportCount]))
        if (!groupedReport.signatures.has(signature)) {
          groupedReport.signatures.add(signature)
          groupedReport.items.push(...items)
        }
      }
      visit(collection.children)
    }
  }

  visit(collections)

  return [...reportsById.values()].map((report) => {
    let bitOffset = 0
    const fields = []

    for (const item of report.items) {
      const reportSize = Number(item.reportSize) || 0
      const reportCount = Number(item.reportCount) || 1

      for (let index = 0; index < reportCount; index += 1) {
        const usage = reportItemUsage(item, index)
        const type = batteryUsageType(item.usagePage, usage)
        if (type && reportSize > 0) {
          fields.push({ type, usagePage: item.usagePage, usage, bitOffset: bitOffset + index * reportSize, reportSize, logicalMinimum: item.logicalMinimum, logicalMaximum: item.logicalMaximum })
        }
      }

      bitOffset += reportSize * reportCount
    }

    return { reportId: report.reportId, items: report.items, fields }
  }).filter((report) => report.fields.length > 0)
}

function parseBatteryReport(report, data) {
  const result = {}

  for (const field of report.fields) {
    const value = readReportBits(data, field.bitOffset, field.reportSize, field.logicalMinimum)
    if (value === null) continue

    if (field.type === 'charging') {
      result.charging = value !== 0
    } else {
      const level = normalizeBatteryLevel(value, field, field.usagePage, field.usage)
      if (level !== null) result.level = level
    }
  }

  return result
}

function batteryColor(level) {
  if (level === null) return 'unknown'
  if (level < 20) return 'critical'
  if (level < 40) return 'low'
  if (level < 60) return 'medium'
  if (level < 80) return 'high'
  return 'full'
}

function supportsRazerBatteryProtocol(device) {
  if (device.vendorId !== 0x1532) return false

  const hasRazerReport = (collections) => (collections || []).some((collection) => {
    const hasReport = (collection.featureReports || []).some((report) => {
      const reportBits = (report.items || []).reduce((total, item) => total + (item.reportSize || 0) * (item.reportCount || 1), 0)
      return report.reportId === 0 && reportBits >= 90 * 8
    })
    return hasReport || hasRazerReport(collection.children)
  })

  return hasRazerReport(device.collections)
}

function buildRazerBatteryRequest(command) {
  const report = new Uint8Array(90)
  report[1] = 0x1f
  report[5] = 0x02
  report[6] = 0x07
  report[7] = command

  for (let index = 2; index < 88; index += 1) report[88] ^= report[index]
  return report
}

async function readRazerBatteryValue(device, command) {
  await device.sendFeatureReport(0, buildRazerBatteryRequest(command))
  await new Promise((resolve) => window.setTimeout(resolve, 35))
  const response = await device.receiveFeatureReport(0)

  if (response.byteLength < 90 || response.getUint8(0) !== 0x02 || response.getUint8(6) !== 0x07 || response.getUint8(7) !== command) return null
  return response.getUint8(9)
}

const activeRazerBatteryScans = new WeakMap()

async function readRazerBattery(device) {
  let scan = activeRazerBatteryScans.get(device)
  if (!scan) {
    scan = (async () => {
      let rawLevel = null
      let rawCharging = null
      try {
        rawLevel = await readRazerBatteryValue(device, 0x80)
      } catch {
        // Keep the last known level if the device rejects this request.
      }
      try {
        rawCharging = await readRazerBatteryValue(device, 0x84)
      } catch {
        // Keep the last known charging state if the device rejects this request.
      }

      return {
        ...(rawLevel === null ? {} : { level: Math.round((rawLevel / 255) * 100) }),
        ...(rawCharging !== 0 && rawCharging !== 1 ? {} : { charging: rawCharging === 1 }),
      }
    })()
    activeRazerBatteryScans.set(device, scan)
  }

  try {
    return await scan
  } finally {
    if (activeRazerBatteryScans.get(device) === scan) activeRazerBatteryScans.delete(device)
  }
}

function ConnectedDeviceCard({ device, selected, onSelect, isConnected }) {
  const name = device.productName || device.name || 'Unnamed HID device'
  const isMouse = (name || '').toLowerCase().includes('mouse') || (name || '').toLowerCase().includes('viper')

  return <button className={`connected-device-card ${isMouse ? 'mouse-card' : 'keyboard-card'} ${selected ? 'is-selected' : ''} ${isConnected ? 'is-connected' : 'is-disconnected'}`} type="button" onClick={() => isConnected && onSelect(device)} aria-pressed={selected} disabled={!isConnected}>
    {deviceAssetPath(device, isConnected) ? <img src={deviceAssetPath(device, isConnected)} alt={`${name} - ${isConnected ? 'Connected' : 'Disconnected'}`} /> : <span className="unknown-device-visual">HID</span>}
  </button>
}

function ConnectMoreCard({ onConnect }) {
  return <button className="connect-more-card" type="button" onClick={() => onConnect(true)} aria-label="Connect more devices">
    <span className="connect-more-plus" aria-hidden="true">+</span>
    <span className="connect-more-text">Connect more<br />device</span>
  </button>
}

function ConnectedDeviceStage({ devices, selectedDevice, onSelect, onConnect }) {
  return <section className={`connected-device-stage ${devices.length > 1 ? 'has-multiple' : ''}`} aria-label="Connected devices">
    <div className="connected-device-grid">{devices.map(({ device, isConnected }) => <ConnectedDeviceCard device={device} isConnected={isConnected} key={deviceKey(device)} onSelect={onSelect} selected={selectedDevice !== null && deviceKey(selectedDevice) === deviceKey(device)} />)}<ConnectMoreCard onConnect={onConnect} /></div>
  </section>
}

function DeviceVisual({ device }) {
  const [imageFailed, setImageFailed] = useState(false)
  const name = device.productName?.toLowerCase() || ''
  const isMouse = name.includes('mouse') || name.includes('viper')
  const isKeyboard = name.includes('keyboard') || name.includes('key') || name.includes('he')
  const imagePath = isMouse ? publicAsset('/devices/mouse/preview/Razer%20Viper%20V4%20Pro.webp') : isKeyboard ? publicAsset('/devices/keyboard/preview/Aula%20HERO%20WIN68HE.webp') : null

  return <div className={`device-visual relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${isMouse ? 'from-emerald-950/80 to-zinc-950' : 'from-fuchsia-950/70 to-zinc-950'}`} aria-hidden="true">
    {imagePath && !imageFailed ? <img className="max-h-full max-w-full object-contain px-2 py-1" src={imagePath} alt="" onError={() => setImageFailed(true)} /> : <div className={`relative border border-emerald-400/50 bg-black/60 shadow-[0_0_18px_rgba(0,255,102,.15)] ${isMouse ? 'h-10 w-7 rounded-[45%]' : isKeyboard ? 'h-6 w-20 rounded-sm' : 'h-8 w-12 rounded-md'}`}>
      {isMouse ? <span className="absolute left-1/2 top-1 h-4 w-px -translate-x-1/2 bg-emerald-300" /> : <span className="absolute inset-1 bg-[repeating-linear-gradient(90deg,rgba(16,185,129,.3)_0_3px,transparent_3px_7px)]" />}
    </div>}
    <span className="absolute bottom-1 right-2 text-[8px] uppercase tracking-[.18em] text-emerald-300/70">HID / {isMouse ? 'MOUSE' : isKeyboard ? 'KEYBOARD' : 'DEVICE'}</span>
  </div>
}

function DeviceWorkspace({ device, onBack, onDeviceRefresh, onScrollProgress, workspaceScrollProgress, profiles, activeProfile, isSignedIn }) {
  const [mode, setMode] = useState('Standard')
  const [activeControl, setActiveControl] = useState('')
  const [buttonListOpen, setButtonListOpen] = useState(false)
  const [buttonListFilter, setButtonListFilter] = useState('all')
  const [actionDraft, setActionDraft] = useState(null)
  const [buttonActions, setButtonActions] = useState(() => getStoredJson(isSignedIn ? localStorage : sessionStorage, isSignedIn ? 'loki-button-actions' : 'loki-temporary-button-actions', {}))
  const settingsStorage = isSignedIn ? localStorage : sessionStorage
  const settingsStorageKey = 'loki-device-settings'
  const deviceProfileSettingsKey = `${deviceKey(device)}::${activeProfile}`
  const workspaceTrackRef = useRef(null)
  const workspaceSettingsRef = useRef(null)
  const [deviceSettings, setDeviceSettings] = useState(() => {
    const allSettings = getStoredJson(settingsStorage, settingsStorageKey, {})
    return { ...DEFAULT_DEVICE_SETTINGS, ...(allSettings[deviceProfileSettingsKey] || {}) }
  })
  const [battery, setBattery] = useState(() => ({
    level: null,
    charging: null,
    supported: supportsRazerBatteryProtocol(device) || collectBatteryReports(device.collections, 'inputReports').length + collectBatteryReports(device.collections, 'featureReports').length > 0,
  }))
  const name = device.productName || 'Unnamed HID device'
  const isMouse = name.toLowerCase().includes('mouse') || name.toLowerCase().includes('viper')
  const deviceTitle = isMouse && !name.toLowerCase().includes('white edition') ? `${name} White Edition` : name
  const batteryStatus = battery.level === null
    ? battery.supported ? 'Waiting for battery report' : 'Battery status is not exposed by this device'
    : `Battery ${battery.level}%${battery.charging ? ', charging' : ''}`
  const actionStorageKey = `${deviceKey(device)}::${activeProfile}`
  const actionStorage = isSignedIn ? localStorage : sessionStorage
  const actionStorageName = isSignedIn ? 'loki-button-actions' : 'loki-temporary-button-actions'
  const legacyActions = activeProfile === (profiles[0] || 'Default_profile0') ? buttonActions[deviceKey(device)] || {} : {}
  const deviceActions = buttonActions[actionStorageKey] || legacyActions

  useEffect(() => {
    let frame = 0
    let lastReportedProgress = -1
    const updateProgress = () => {
      if (frame) window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const trackTop = workspaceTrackRef.current?.getBoundingClientRect().top ?? 78
        const distance = Math.max(window.innerHeight * 4, 1)
        const progress = Math.min(1, Math.max(0, (78 - trackTop) / distance))
        if (Math.abs(lastReportedProgress - progress) > 0.012) {
          lastReportedProgress = progress
          onScrollProgress(progress)
        }
      })
    }

    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    updateProgress()
    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [onScrollProgress])

  const updateDeviceSettings = (patch) => {
    setDeviceSettings((current) => {
      const nextSettings = { ...current, ...patch }
      const allSettings = getStoredJson(settingsStorage, settingsStorageKey, {})
      settingsStorage.setItem(settingsStorageKey, JSON.stringify({ ...allSettings, [deviceProfileSettingsKey]: nextSettings }))
      return nextSettings
    })
  }

  const scrollToSettings = () => workspaceSettingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const suctionProgress = workspaceScrollProgress
  const heroDissolve = Math.max(0, Math.min(1, (suctionProgress - 0.35) / 0.55))
  const heroTilt = Math.sin(Math.PI * suctionProgress * 2) * 4

  const openActionEditor = (control) => {
    setActiveControl(control)
    setActionDraft(deviceActions[control] || { category: 'default', value: 'Keep standard behavior', stages: [400, 800] })
  }

  const closeActionEditor = () => {
    setActionDraft(null)
    setActiveControl('')
  }

  const saveAction = () => {
    const nextActions = {
      ...buttonActions,
      [actionStorageKey]: { ...deviceActions, [activeControl]: actionDraft },
    }
    setButtonActions(nextActions)
    actionStorage.setItem(actionStorageName, JSON.stringify(nextActions))
    closeActionEditor()
  }

  useEffect(() => {
    if (!actionDraft && !buttonListOpen) return undefined
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeActionEditor()
        setButtonListOpen(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [actionDraft, buttonListOpen])

  useEffect(() => {
    let cancelled = false
    let isReadingFeatureReports = false
    let hasBatteryData = false
    let pollTimeoutId = null
    const logicalDeviceKey = deviceKey(device)
    const transportKey = deviceTransportKey(device)
    const inputReports = collectBatteryReports(device.collections, 'inputReports')
    const featureReports = collectBatteryReports(device.collections, 'featureReports')
    const hasRazerBatteryProtocol = supportsRazerBatteryProtocol(device)
    const inputReportsById = new Map(inputReports.map((report) => [report.reportId, report]))

    const applyReport = (report, data) => {
      const nextBattery = parseBatteryReport(report, data)
      if (Object.keys(nextBattery).length > 0 && !cancelled) {
        hasBatteryData = true
        setBattery((current) => ({ ...current, ...nextBattery, supported: true }))
      }
    }

    const handleInputReport = (event) => {
      const report = inputReportsById.get(event.reportId)
      if (report) applyReport(report, event.data)
    }

    device.addEventListener?.('inputreport', handleInputReport)

    const scanBattery = async () => {
      if (cancelled || isReadingFeatureReports) return
      isReadingFeatureReports = true
      try {
        if (navigator.hid) {
          const availableDevices = uniqueDevices((await navigator.hid.getDevices()).filter(isSupportedDevice))
          const latestDevice = availableDevices.find((candidate) => deviceKey(candidate) === logicalDeviceKey)
          if (latestDevice && (deviceTransportKey(latestDevice) !== transportKey || (!device.opened && latestDevice.opened))) {
            try {
              if (!latestDevice.opened) await latestDevice.open()
              if (!cancelled) onDeviceRefresh(latestDevice)
            } catch {
              // A transport may appear in getDevices before it is ready to open.
            }
            return
          }
        }

        if (!device.opened) return

        if (device.receiveFeatureReport) {
          for (const report of featureReports) {
            try {
              const data = await device.receiveFeatureReport(report.reportId)
              applyReport(report, data)
            } catch {
              // Some devices expose a feature descriptor but do not answer battery queries.
            }
          }
        }

        if (hasRazerBatteryProtocol && device.sendFeatureReport && device.receiveFeatureReport) {
          const nextBattery = await readRazerBattery(device)
          if (Object.keys(nextBattery).length > 0 && !cancelled) {
            hasBatteryData = true
            setBattery((current) => ({ ...current, ...nextBattery, supported: true }))
          }
        }
      } finally {
        isReadingFeatureReports = false
      }
    }

    const canPoll = featureReports.length > 0 || hasRazerBatteryProtocol || device.vendorId === 0x1532
    const scheduleNextScan = () => {
      if (cancelled || !canPoll) return
      pollTimeoutId = window.setTimeout(async () => {
        await scanBattery()
        scheduleNextScan()
      }, device.vendorId === 0x1532 ? 5000 : hasBatteryData ? 30000 : 4000)
    }

    void scanBattery().finally(scheduleNextScan)

    return () => {
      cancelled = true
      device.removeEventListener?.('inputreport', handleInputReport)
      if (pollTimeoutId !== null) window.clearTimeout(pollTimeoutId)
    }
  }, [device, onDeviceRefresh])

  return <div className="workspace-scroll-shell">
    <div className="workspace-scroll-track" ref={workspaceTrackRef}>
      <section className="workspace-hero-sticky">
        <div className="workspace-hero-content" style={{ transform: `translate3d(${-210 * heroDissolve}px, ${-175 * heroDissolve}px, 0) rotate(${heroTilt}deg) scale(${1 - 0.64 * heroDissolve})`, opacity: 1 - heroDissolve, pointerEvents: heroDissolve > 0.9 ? 'none' : 'auto' }}>
        <button className="workspace-back" type="button" onClick={onBack} aria-label="Back to all devices"><span aria-hidden="true">←</span> All devices</button>
        <div className="workspace-device-chip"><span>{deviceTitle}</span></div>
        <div className="device-workspace workspace-hero-art">
    <div className={`workspace-map ${isMouse ? 'workspace-map-mouse' : 'workspace-map-keyboard'}`}>
      <span className="workspace-map-status" aria-hidden="true" />
      {isMouse ? <>
        <img className="workspace-mouse-art" src={publicAsset('/devices/mouse/preview/Razer%20Viper%20V4%20Pro.webp')} alt={`${name} top view`} />
        <svg className="workspace-map-lines" viewBox="0 0 1000 720" preserveAspectRatio="none" aria-hidden="true">
          {mouseControls.map(({ label, anchor, edge, path }) => <g key={label}><path d={path} /><circle cx={anchor[0]} cy={anchor[1]} r="5" /><circle cx={edge[0]} cy={edge[1]} r="5" /></g>)}
        </svg>
        <div className="workspace-map-controls" aria-label="Mouse controls">
          {mouseControls.map(({ label, placement }) => <button className={`workspace-map-control workspace-map-control--${placement} ${activeControl === label ? 'is-active' : ''}`} type="button" key={label} aria-pressed={activeControl === label} title={deviceActions[label] ? `${label}: ${actionDescription(deviceActions[label])}` : `Configure ${label}`} onClick={() => openActionEditor(label)}>{label}</button>)}
        </div>
      </> : <img className="workspace-keyboard-art" src={publicAsset('/devices/keyboard/preview/Aula%20HERO%20WIN68HE.webp')} alt={`${name} control map`} />}
    </div>
      </div>
      <div className={`workspace-battery workspace-battery--${batteryColor(battery.level)} ${battery.charging ? 'is-charging' : ''} ${battery.level === null ? 'is-unavailable' : ''}`} aria-label={batteryStatus} title={batteryStatus}>
      <span className="workspace-battery-icon" aria-hidden="true" style={{ '--battery-level': (battery.level ?? 0) / 100 }}>
        <span className="workspace-battery-fill" />
        {battery.charging && <svg className="workspace-battery-charge" viewBox="0 0 16 22"><path d="M9.5 1 3 12h4.5L6.5 21 13 9.5H8.5z" /></svg>}
      </span>
      <span className="workspace-battery-value">{battery.level === null ? '--%' : `${battery.level}%`}</span>
    </div>
      <div className="workspace-mode-control" role="group" aria-label="Device mode">
      <button className="workspace-mode-icon" type="button" aria-label="Open button assignments" aria-expanded={buttonListOpen} onClick={() => setButtonListOpen((open) => !open)}><svg viewBox="0 0 28 28" aria-hidden="true"><rect x="3" y="3" width="22" height="22" rx="2" /><path d="M14 3v22M7 8h3v12H7z" /></svg></button>
      {['Standard', 'Hypershift'].map((option) => <button className={mode === option ? 'is-active' : ''} type="button" key={option} aria-pressed={mode === option} onClick={() => setMode(option)}>{option}</button>)}
    </div>
        <button className="workspace-scroll-cue" type="button" onClick={scrollToSettings} aria-label="Scroll to device settings">
          <span>Scroll to tune this device</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </button>
        </div>
      </section>
    </div>

    <section className="workspace-settings-anchor" ref={workspaceSettingsRef}>
      <WorkspaceSettings settings={deviceSettings} onChange={updateDeviceSettings} deviceTitle={deviceTitle} activeProfile={activeProfile} batteryStatus={batteryStatus} />
    </section>

    {buttonListOpen && <aside className="workspace-button-list" aria-label="Button assignments">
      <header className="workspace-button-list-header">
        <div><p>LOKI / INPUT MAP</p><h2>Button assignments</h2></div>
        <button type="button" onClick={() => setButtonListOpen(false)} aria-label="Close button assignments">×</button>
      </header>
      <label className="workspace-button-filter"><span className="sr-only">Filter buttons</span><select value={buttonListFilter} onChange={(event) => setButtonListFilter(event.target.value)}><option value="all">All Buttons</option><option value="assigned">Assigned</option><option value="unassigned">Unassigned</option></select><span aria-hidden="true">⌄</span></label>
      <div className="workspace-button-list-items">
        {buttonListOrder.map((label, index) => {
          const assignment = buttonListAssignment(deviceActions, label)
          const isAssigned = assignment.isCustom
          if (buttonListFilter === 'assigned' && !isAssigned) return null
          if (buttonListFilter === 'unassigned' && isAssigned) return null
          return <button className={`workspace-button-list-item ${isAssigned ? 'is-assigned' : ''}`} type="button" key={label} onClick={() => { setButtonListOpen(false); openActionEditor(label) }}>
            <span className="workspace-button-index">{index + 1}</span>
            <span className="workspace-button-assignment"><small>{assignment.category}</small><strong>{assignment.value}</strong></span>
            <span className="workspace-button-chevron" aria-hidden="true">›</span>
          </button>
        })}
        {buttonListFilter === 'assigned' && !mouseControls.some(({ label }) => deviceActions[label] && (deviceActions[label].category !== 'default' || deviceActions[label].value !== 'Keep standard behavior')) && <p className="workspace-button-empty">No custom assignments yet.</p>}
      </div>
    </aside>}
    {actionDraft && <div className="action-editor-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) closeActionEditor() }}>
      <section className="action-editor" role="dialog" aria-modal="true" aria-labelledby="action-editor-title">
        <header className="action-editor-header">
          <div><p className="action-editor-kicker">BUTTON ASSIGNMENT</p><h2 id="action-editor-title">{activeControl}</h2><p className="action-editor-device">{deviceTitle} · {activeProfile}</p></div>
          <button className="action-editor-close" type="button" onClick={closeActionEditor} aria-label="Close action editor">×</button>
        </header>
        <div className="action-editor-body">
          <>
          <nav className="action-category-list" aria-label="Action categories">
            {actionCategories.map(({ id, label }) => <button className={actionDraft.category === id ? 'is-active' : ''} type="button" key={id} onClick={() => setActionDraft((current) => ({ ...current, category: id, value: id === 'default' ? 'Keep standard behavior' : id === 'profile' ? 'Next profile' : '', ...(id === 'sensitivity' ? { stages: current.stages || [400, 800] } : {}) }))}>{label}</button>)}
          </nav>
          <div className="action-editor-form">
            <p className="action-editor-section">{actionCategories.find(({ id }) => id === actionDraft.category)?.label}</p>
            {actionDraft.category === 'default' && <p className="action-editor-copy">Keep the control's standard behavior or disable it.</p>}
            {actionOptions[actionDraft.category] && <label className="action-field"><span>Action</span><select value={actionDraft.value} onChange={(event) => setActionDraft((current) => ({ ...current, value: event.target.value }))}><option value="" disabled>Choose action</option>{actionOptions[actionDraft.category].map((option) => <option key={option}>{option}</option>)}</select></label>}
            {actionDraft.category === 'sensitivity' && <div className="sensitivity-stage-editor">
              <div className="sensitivity-stage-heading"><span>DPI stages</span><small>100-50,000 DPI</small></div>
              {(actionDraft.stages || [400, 800]).map((dpi, index) => <label className="sensitivity-stage-row" key={`stage-${index}`}><span>Stage {index + 1}</span><input type="number" min="100" max="50000" step="100" value={dpi} onChange={(event) => setActionDraft((current) => ({ ...current, stages: (current.stages || [400, 800]).map((stage, stageIndex) => stageIndex === index ? event.target.value === '' ? '' : Number(event.target.value) : stage) }))} aria-label={`Stage ${index + 1} DPI`} /><button type="button" disabled={(actionDraft.stages || [400, 800]).length <= 1} onClick={() => setActionDraft((current) => ({ ...current, stages: (current.stages || [400, 800]).filter((_, stageIndex) => stageIndex !== index) }))} aria-label={`Remove stage ${index + 1}`}>×</button></label>)}
              <button className="sensitivity-add-stage" type="button" disabled={(actionDraft.stages || [400, 800]).length >= 8} onClick={() => setActionDraft((current) => ({ ...current, stages: [...(current.stages || [400, 800]), Math.min(50000, Math.max(...(current.stages || [400, 800]).map(Number)) + 400)] }))}>+ Add stage</button>
            </div>}
            {actionDraft.category === 'keyboard' && <label className="action-field"><span>Key or shortcut</span><input value={actionDraft.value} onChange={(event) => setActionDraft((current) => ({ ...current, value: event.target.value }))} placeholder="e.g. Ctrl + Shift + S" /></label>}
            {actionDraft.category === 'profile' && <label className="action-field"><span>Profile action</span><select value={actionDraft.value} onChange={(event) => setActionDraft((current) => ({ ...current, value: event.target.value }))}><option value="">Choose profile action</option><option>Next profile</option><option>Previous profile</option><option>Cycle profiles</option>{profiles.filter((profile) => profile !== activeProfile).map((profile) => <option key={profile}>{profile}</option>)}</select></label>}
            {actionDraft.category === 'text' && <label className="action-field"><span>Text to type</span><textarea maxLength={250} value={actionDraft.value} onChange={(event) => setActionDraft((current) => ({ ...current, value: event.target.value }))} placeholder="Enter text" rows={4} /><small>{actionDraft.value.length}/250</small></label>}
            {actionDraft.category === 'website' && <label className="action-field"><span>Website address</span><input type="url" value={actionDraft.value} onChange={(event) => setActionDraft((current) => ({ ...current, value: event.target.value }))} placeholder="https://example.com" /></label>}
            <p className="action-editor-storage">Assignments are saved for this device in this browser.</p>
          </div>
          </>
        </div>
        <footer className="action-editor-footer"><button type="button" onClick={closeActionEditor}>Cancel</button><button className="action-save" type="button" onClick={saveAction} disabled={!canSaveAction(actionDraft)}>Save action</button></footer>
      </section>
    </div>}
  </div>
}

function DotGridCanvas({ pointerRef, workspaceProgress = 0 }) {
  const canvasRef = useRef(null)
  const workspaceProgressRef = useRef(workspaceProgress)

  useEffect(() => {
    workspaceProgressRef.current = workspaceProgress
    pointerRef.current.workspaceSuctionProgress = workspaceProgress
    pointerRef.current.redraw?.()
  }, [pointerRef, workspaceProgress])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return undefined
    const pointer = pointerRef.current

    let width = 0
    let height = 0
    let pixelRatio = 1
    let animationFrame = 0
    let pointerFrame = 0
    let previousFrameTime = 0
    let animationTime = 0
    let points = []
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reducedMotion = motionPreference.matches
    let canvasBounds = canvas.getBoundingClientRect()
    let smoothPointerX = 0
    let smoothPointerY = 0
    let pointerStrength = 0
    let hasPointerPosition = false

    const draw = (time) => {
      const frameDelta = previousFrameTime ? Math.min((time - previousFrameTime) / 1000, 0.05) : 1 / 60
      previousFrameTime = time
      animationTime += reducedMotion ? 0 : frameDelta
      context.clearRect(0, 0, width, height)
      const seconds = animationTime
      const pointerSpeed = Math.hypot(pointer.velocityX, pointer.velocityY)
      const pointerFastness = Math.min(pointerSpeed / 1.6, 1)
      const pointerTimeConstant = 0.034 - pointerFastness * 0.02
      const pointerEase = reducedMotion ? 1 : 1 - Math.exp(-frameDelta / pointerTimeConstant)
      const pointerTargetStrength = pointer.active ? 1 : 0
      pointerStrength += (pointerTargetStrength - pointerStrength) * pointerEase
      if (pointer.active && !hasPointerPosition) {
        smoothPointerX = pointer.x
        smoothPointerY = pointer.y
        hasPointerPosition = true
      } else if (pointer.active) {
        const predictionScale = pointer.reversing ? 0.25 : 1
        const predictedX = pointer.x + pointer.velocityX * 8 * predictionScale
        const predictedY = pointer.y + pointer.velocityY * 8 * predictionScale
        smoothPointerX += (predictedX - smoothPointerX) * pointerEase
        smoothPointerY += (predictedY - smoothPointerY) * pointerEase
      }
      const dotPaths = Array.from({ length: 8 }, () => new Path2D())
      const progress = workspaceProgressRef.current
      const suction = progress <= 0.9
        ? progress / 0.9
        : 1 - (progress - 0.9) / 0.1
      const vortexTravel = Math.max(0, Math.min(1, suction))
      const vortexCenterX = width / 2
      const vortexCenterY = height / 2

      for (const point of points) {
          const { x, y, column, row, visibility } = point
          const backgroundWave = Math.sin(column * 0.17 + row * 0.055 + seconds * 1.15) * 5
            + Math.sin(row * 0.2 - column * 0.035 - seconds * 0.85) * 3
          let influence = 0
          let ripple = 0
          let directionX = 0
          let directionY = 0
          if (pointerStrength > 0.005) {
            const pointerX = smoothPointerX - (canvasBounds.left + x)
            const pointerY = smoothPointerY - (canvasBounds.top + y)
            const distanceSquared = pointerX * pointerX + pointerY * pointerY
            if (distanceSquared < 245025) {
              const distance = Math.sqrt(distanceSquared)
              influence = pointerStrength * Math.exp(-distance / 165)
              ripple = influence > 0.015 ? Math.sin(distance * 0.075 - seconds * 5) * 19 * influence : 0
              directionX = distance > 0 ? pointerX / distance : 0
              directionY = distance > 0 ? pointerY / distance : 0
            }
          }
          const rippleStrength = Math.abs(ripple) / 19
          const toVortexX = vortexCenterX - x
          const toVortexY = vortexCenterY - y
          const vortexDistance = Math.hypot(toVortexX, toVortexY) || 1
          const vortexSwirl = vortexTravel * Math.max(0, 1 - vortexDistance / Math.max(width, height)) * 18
          const opacity = (visibility * (0.28 + (Math.sin(column * 0.12 + row * 0.1 + seconds) + 1) * 0.16) + influence * 0.28) * (1 - vortexTravel * 0.58) + vortexTravel * Math.max(0, 1 - vortexDistance / 90) * 0.5
          if (opacity < 0.025) continue

          const dotX = x + toVortexX * vortexTravel + (-toVortexY / vortexDistance) * vortexSwirl + directionX * ripple * 0.35
          const dotY = y + toVortexY * vortexTravel + (toVortexX / vortexDistance) * vortexSwirl + backgroundWave * (1 - vortexTravel) + directionY * ripple
          const radius = (0.8 + visibility * 1.2 + rippleStrength * 1.15) * (1 - vortexTravel * 0.55) + vortexTravel * 1.1
          const opacityBand = Math.min(7, Math.floor(Math.min(opacity, 0.82) / 0.82 * 8))
          dotPaths[opacityBand].moveTo(dotX + radius, dotY)
          dotPaths[opacityBand].arc(dotX, dotY, radius, 0, Math.PI * 2)
      }

      for (let band = 0; band < dotPaths.length; band += 1) {
        context.fillStyle = `rgba(99, 238, 75, ${(band + 0.5) / 8 * 0.82})`
        context.fill(dotPaths[band])
      }
    }

    const renderFrame = (time) => {
      draw(time)
      if (!reducedMotion) animationFrame = window.requestAnimationFrame(renderFrame)
    }

    const resizeCanvas = () => {
      canvasBounds = canvas.getBoundingClientRect()
      width = canvasBounds.width
      height = canvasBounds.height
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      const spacing = width < 560 ? 17 : 19
      const columns = Math.ceil(width / spacing)
      const rows = Math.ceil(height / spacing)
      points = []
      for (let row = 0; row <= rows; row += 1) {
        for (let column = 0; column <= columns; column += 1) {
          const horizontalFade = column / Math.max(columns, 1)
          const verticalFade = row / Math.max(rows, 1)
          points.push({
            x: column * spacing,
            y: row * spacing,
            column,
            row,
            visibility: Math.max(0, Math.min(1, horizontalFade * 0.48 + verticalFade * 0.82 - 0.2)),
          })
        }
      }
      draw(performance.now())
    }

    const updateMotionPreference = (event) => {
      reducedMotion = event.matches
      window.cancelAnimationFrame(animationFrame)
      if (reducedMotion) draw(performance.now())
      else animationFrame = window.requestAnimationFrame(renderFrame)
    }

    const resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(canvas)
    window.addEventListener('resize', resizeCanvas)
    motionPreference.addEventListener('change', updateMotionPreference)
    pointer.redraw = () => {
      if (!reducedMotion || pointerFrame) return
      pointerFrame = window.requestAnimationFrame((time) => {
        pointerFrame = 0
        draw(time)
      })
    }
    resizeCanvas()
    if (!reducedMotion) animationFrame = window.requestAnimationFrame(renderFrame)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.cancelAnimationFrame(pointerFrame)
      resizeObserver.disconnect()
      window.removeEventListener('resize', resizeCanvas)
      motionPreference.removeEventListener('change', updateMotionPreference)
      delete pointer.redraw
    }
  }, [pointerRef])

  return <canvas ref={canvasRef} className="dot-grid-canvas" aria-hidden="true" />
}

function App() {
  void DeviceVisual
  const [connected, setConnected] = useState(false)
  const [devices, setDevices] = useState([])
  const devicesRef = useRef(devices)
  const [sessionDevices, setSessionDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [deviceHubOpen, setDeviceHubOpen] = useState(false)
  const [workspaceSuctionProgress, setWorkspaceSuctionProgress] = useState(0)
  const [deviceConnectionRevision, setDeviceConnectionRevision] = useState(0)
  const selectedDeviceRef = useRef(null)
  const dotGridPointerRef = useRef({ x: 0, y: 0, velocityX: 0, velocityY: 0, time: 0, reversing: false, active: false })
  const sessionDeviceKeysRef = useRef(new Set())
  const scanRevisionRef = useRef(0)
  const [isSignedIn, setIsSignedIn] = useState(() => localStorage.getItem('loki-authenticated') === 'true')
  const [authUserId, setAuthUserId] = useState(null)
  const [userRole, setUserRole] = useState('guest')
  const [adminView, setAdminView] = useState(false)
  const isAdmin = isSignedIn && userRole === ADMIN_ROLE
  const profileStorage = isSignedIn ? localStorage : sessionStorage
  const profileStorageKeys = getStorageKeys(isSignedIn)
  const [profiles, setProfiles] = useState(() => getStoredProfiles(profileStorage, profileStorageKeys.profiles))
  const [activeProfile, setActiveProfile] = useState(() => profileStorage.getItem(profileStorageKeys.activeProfile) || 'Default_profile0')
  const [deviceHistory, setDeviceHistory] = useState(() => getStoredJson(profileStorage, profileStorageKeys.history, {}))
  const [authFeedback, setAuthFeedback] = useState('')
  const [authUserEmail, setAuthUserEmail] = useState('')

  useEffect(() => {
    const loadRemoteProfiles = async () => {
      const remoteProfiles = await loadProfilesFromSupabase(supabase)
      if (remoteProfiles.length > 0) {
        const mergedProfiles = [...new Set([...profiles, ...remoteProfiles])]
        setProfiles(mergedProfiles)
        persistProfiles(profileStorage, profileStorageKeys.profiles, mergedProfiles)
      }
    }

    void loadRemoteProfiles()
  }, [])

  useEffect(() => {
    let active = true

    const restoreSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        const user = data.session?.user
        if (!active) return

        if (error || !user) {
          setIsSignedIn(false)
          setAuthUserId(null)
          setAuthUserEmail('')
          setUserRole('guest')
          localStorage.removeItem('loki-authenticated')
          return
        }

        const { role, error: roleError } = await getAccountRole(supabase, user.id)
        if (!active) return

        setIsSignedIn(true)
        setAuthUserId(user.id)
        setAuthUserEmail(user.email || '')
        setUserRole(role)
        localStorage.setItem('loki-authenticated', 'true')
        if (roleError) setAuthFeedback('Role setup is unavailable. This account has standard user access.')
      } catch {
        if (active) {
          setIsSignedIn(false)
          setAuthUserId(null)
          setAuthUserEmail('')
          setUserRole('guest')
          localStorage.removeItem('loki-authenticated')
        }
      }
    }

    void restoreSession()
    return () => { active = false }
  }, [])

  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [productLabOpen, setProductLabOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authFormOpen, setAuthFormOpen] = useState(false)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [deviceName, setDeviceName] = useState('No device selected')
  const [connectionMessage, setConnectionMessage] = useState('Ready to pair with your hardware')
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [assistantBusy, setAssistantBusy] = useState(false)
  const [actionsVersion, setActionsVersion] = useState(0)
  const [selectedRecommendation, setSelectedRecommendation] = useState('fps-pro-setup')
  const [profilePreview, setProfilePreview] = useState(null)
  const [messages, setMessages] = useState([
    { from: 'ai', local: true, text: 'Hi, I am LOKI. Ask me about your setup, or tell me what to change: switch profiles, remap mouse buttons, or set DPI stages.' },
  ])
  const handleWorkspaceScrollProgress = useCallback((progress) => {
    dotGridPointerRef.current.workspaceSuctionProgress = progress
    dotGridPointerRef.current.redraw?.()
    setWorkspaceSuctionProgress(progress)
  }, [])
  const vortexPulse = Math.min(1, workspaceSuctionProgress / 0.14)
    * (1 - Math.max(0, Math.min(1, (workspaceSuctionProgress - 0.93) / 0.07)))
  const suctionTravel = Math.min(1, workspaceSuctionProgress / 0.9)
  const refillTravel = Math.max(0, Math.min(1, (workspaceSuctionProgress - 0.9) / 0.1))
  const dragonGrip = Math.max(0, Math.min(1, (workspaceSuctionProgress - 0.025) / 0.16))
    * (1 - Math.max(0, Math.min(1, (workspaceSuctionProgress - 0.91) / 0.08)))
  const releaseGust = Math.sin(Math.PI * Math.max(0, Math.min(1, (workspaceSuctionProgress - 0.9) / 0.1)))
  const dragonBodyOpacity = Math.max(dragonGrip, releaseGust * 0.9)

  useEffect(() => {
    if (!productLabOpen) return undefined

    const handleEscape = (event) => {
      if (event.key === 'Escape') setProductLabOpen(false)
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [productLabOpen])

  const reconcileSessionDevices = (currentEntries, connectedList) => {
    const nextMap = new Map((currentEntries || []).map((entry) => [deviceKey(entry.device), { device: entry.device, isConnected: false }]))

    for (const device of connectedList) {
      nextMap.set(deviceKey(device), { device, isConnected: true })
    }

    return [...nextMap.values()].sort((a, b) => (a.isConnected === b.isConnected ? 0 : a.isConnected ? -1 : 1))
  }

  const refreshSessionKeys = (devicesList) => {
    const nextKeys = new Set(sessionDeviceKeysRef.current)
    for (const device of devicesList) {
      if (device && isSupportedDevice(device)) nextKeys.add(deviceKey(device))
    }
    sessionDeviceKeysRef.current = nextKeys
  }

  const refreshSelectedDevice = useCallback((refreshedDevice) => {
    const refreshedKey = deviceKey(refreshedDevice)
    selectedDeviceRef.current = refreshedDevice
    devicesRef.current = uniqueDevices([
      ...devicesRef.current.filter((device) => deviceKey(device) !== refreshedKey),
      refreshedDevice,
    ])
    setDevices(devicesRef.current)
    setSessionDevices((current) => current.map((entry) => (
      deviceKey(entry.device) === refreshedKey ? { ...entry, device: refreshedDevice, isConnected: true } : entry
    )))
    setSelectedDevice(refreshedDevice)
    setDeviceConnectionRevision((revision) => revision + 1)
    setConnected(true)
    setConnectionMessage(`${refreshedDevice.productName || 'Device'} connected and ready`)
  }, [])

  const syncDevices = async () => {
    if (!navigator.hid) return []
    const scanRevision = scanRevisionRef.current
    const grantedDevices = await navigator.hid.getDevices()
    if (scanRevision !== scanRevisionRef.current) return []

    const supportedDevices = uniqueDevices(grantedDevices.filter(isSupportedDevice))
    const connectedDevices = []
    for (const device of supportedDevices) {
      try {
        if (!device.opened) await device.open()
        connectedDevices.push(device)
      } catch {
        // Ignore devices that are no longer available.
      }
    }
    if (scanRevision !== scanRevisionRef.current) return []

    refreshSessionKeys(connectedDevices)
    devicesRef.current = connectedDevices
    setDevices(connectedDevices)
    setSessionDevices((current) => reconcileSessionDevices(current, connectedDevices))
    setConnected(connectedDevices.length > 0)
    if (connectedDevices.length > 0) {
      setConnectionMessage(`${connectedDevices.length} device${connectedDevices.length === 1 ? '' : 's'} connected and ready`)
    }
    return connectedDevices
  }

  useEffect(() => {
    if (!navigator.hid) return undefined

    const handleConnect = async (event) => {
      const { device } = event
      if (!isSupportedDevice(device)) return

      try {
        if (!device.opened) await device.open()
        setDeviceConnectionRevision((revision) => revision + 1)
        if (selectedDeviceRef.current && deviceKey(selectedDeviceRef.current) === deviceKey(device)) {
          selectedDeviceRef.current = device
          setSelectedDevice(device)
        }
        refreshSessionKeys([device])
        devicesRef.current = uniqueDevices([...devicesRef.current, device])
        setDevices(devicesRef.current)
        setSessionDevices((current) => reconcileSessionDevices(
          current,
          [...current.filter((entry) => entry.isConnected).map((entry) => entry.device), device],
        ))
        setConnected(true)
        setDeviceName(device.productName || 'Unnamed HID device')
        setConnectionMessage(`${device.productName || 'Device'} connected and ready`)
      } catch {
        setConnectionMessage('Unable to open the connected device')
      }
    }

    const handleDisconnect = (event) => {
      const disconnectedKey = deviceKey(event.device)
      setDeviceConnectionRevision((revision) => revision + 1)
      const remainingDevices = devicesRef.current.filter((device) => deviceKey(device) !== disconnectedKey)
      devicesRef.current = remainingDevices
      setDevices(remainingDevices)
      setSessionDevices((current) => reconcileSessionDevices(
        current,
        current.filter((entry) => entry.isConnected && deviceKey(entry.device) !== disconnectedKey).map((entry) => entry.device),
      ))
      setConnected(remainingDevices.length > 0)
      setConnectionMessage(remainingDevices.length > 0 ? 'A device was disconnected' : 'Device disconnected. Ready to pair with your hardware')
      if (selectedDeviceRef.current && deviceKey(selectedDeviceRef.current) === disconnectedKey) {
        selectedDeviceRef.current = null
        setSelectedDevice(null)
        setDeviceHubOpen(false)
      }
    }

    navigator.hid.addEventListener('connect', handleConnect)
    navigator.hid.addEventListener('disconnect', handleDisconnect)
    const initialSyncId = window.setTimeout(() => void syncDevices(), 0)
    return () => {
      window.clearTimeout(initialSyncId)
      navigator.hid.removeEventListener('connect', handleConnect)
      navigator.hid.removeEventListener('disconnect', handleDisconnect)
    }
  }, [])

  const connectDevice = async (append = false) => {
    if (!navigator.hid) {
      setConnectionMessage('WebHID is unavailable. Use Chrome or Edge over HTTPS.')
      return
    }

    try {
      scanRevisionRef.current += 1
      const grantedDevices = append ? [] : uniqueDevices((await navigator.hid.getDevices()).filter(isSupportedDevice))
      const requestedDevices = grantedDevices.length > 0 ? grantedDevices : (await navigator.hid.requestDevice({ filters: [] })).filter(isSupportedDevice)
      const selectedDevices = uniqueDevices(requestedDevices)
      if (selectedDevices.length === 0) {
        setConnectionMessage('No device selected. Ready when you are.')
        return
      }

      const connectedDevices = []
      for (const device of selectedDevices) {
        if (!device.opened) await device.open()
        connectedDevices.push(device)
      }
      if (!append) {
        await Promise.all(devices
          .filter((device) => !selectedDevices.some((selected) => deviceKey(selected) === deviceKey(device)))
          .map(async (device) => {
            if (device.opened) await device.close().catch(() => undefined)
          }))
      }
      const visibleDevices = append ? uniqueDevices([...devices, ...connectedDevices]) : connectedDevices
      refreshSessionKeys(visibleDevices)
      devicesRef.current = visibleDevices
      setDeviceConnectionRevision((revision) => revision + 1)
      const newlyConnectedDevice = connectedDevices[0]
      const currentSelection = selectedDeviceRef.current
      const device = append && currentSelection && !selectedDevices.some((selected) => deviceKey(selected) === deviceKey(currentSelection))
        ? currentSelection
        : visibleDevices.find((visibleDevice) => deviceKey(visibleDevice) === deviceKey(newlyConnectedDevice)) || newlyConnectedDevice
      setDevices(visibleDevices)
      setSessionDevices((current) => reconcileSessionDevices(current, visibleDevices))
      setConnected(true)
      selectedDeviceRef.current = device
      setSelectedDevice(device)
      setDeviceName(device.productName || 'Unnamed HID device')
      setConnectionMessage(`${visibleDevices.length} device${visibleDevices.length === 1 ? '' : 's'} connected and ready`)
      if (isSignedIn) {
        const nextHistory = { ...deviceHistory, [activeProfile]: [...(deviceHistory[activeProfile] || []), ...connectedDevices.map(deviceHistoryEntry)].filter((entry, index, entries) => entries.findIndex((item) => deviceKey(item) === deviceKey(entry)) === index) }
        setDeviceHistory(nextHistory)
        localStorage.setItem('loki-device-history', JSON.stringify(nextHistory))
        profileStorage.setItem(profileStorageKeys.activeProfile, activeProfile)
      }
    } catch (error) {
      if (error.name !== 'NotFoundError') setConnectionMessage('Connection cancelled or blocked by the browser')
    }
  }

  const selectDevice = async (device) => {
    try {
      if (!device.opened) await device.open()
      setDeviceConnectionRevision((revision) => revision + 1)
      selectedDeviceRef.current = device
      setSelectedDevice(device)
      setDeviceHubOpen(true)
      setConnected(true)
      setDeviceName(device.productName || 'Unnamed HID device')
      setConnectionMessage('Selected device is ready to configure')
    } catch {
      setConnectionMessage('Unable to open this device')
    }
  }

  const assistantTargetDevice = () => selectedDeviceRef.current || devices[0] || null

  const buttonActionStore = () => ({
    storage: isSignedIn ? localStorage : sessionStorage,
    name: isSignedIn ? 'loki-button-actions' : 'loki-temporary-button-actions',
  })

  const assistantRules = (currentProfiles) => {
    const device = assistantTargetDevice()
    const deviceLabel = (device?.productName || '').toLowerCase()
    return {
      hasMouse: Boolean(device) && (deviceLabel.includes('mouse') || deviceLabel.includes('viper')),
      controls: mouseControls.map(({ label }) => label),
      categories: Object.fromEntries(actionCategories.map(({ id, label }) => [id, label])),
      actionOptions,
      profiles: currentProfiles,
      recommendations: aiRecommendations,
    }
  }

  const buildAssistantContext = () => {
    const device = assistantTargetDevice()
    const { storage, name } = buttonActionStore()
    const stored = getStoredJson(storage, name, {})
    const assignments = device ? stored[`${deviceKey(device)}::${activeProfile}`] || {} : {}
    const rules = assistantRules(profiles)

    return {
      activeProfile,
      profiles,
      signedIn: isSignedIn,
      device: device ? { name: device.productName || 'Unnamed HID device', connected: connected } : null,
      canConfigureMouseButtons: rules.hasMouse,
      buttonAssignments: assignments,
      recommendedProfiles: aiRecommendations.map(({ id, title, game, profileName, summary, details }) => ({ id, title, game, profileName, summary, ...details })),
      rules: {
        controls: rules.controls,
        actionCategories: rules.categories,
        options: actionOptions,
        profileActions: ASSISTANT_PROFILE_ACTIONS,
        dpiRange: [100, 50000],
        maxDpiStages: 8,
      },
    }
  }

  const runAssistantActions = (requestedActions) => {
    const device = assistantTargetDevice()
    const { storage, name: storeName } = buttonActionStore()
    let currentProfiles = profiles
    let currentProfile = activeProfile
    let storedActions = getStoredJson(storage, storeName, {})
    let profilesChanged = false
    let activeChanged = false
    let buttonsChanged = false
    let recommendationId = null
    const outcomes = []

    for (const requested of requestedActions) {
      const checked = validateAssistantAction(requested, assistantRules(currentProfiles))
      if (!checked.ok) {
        outcomes.push({ ok: false, text: checked.error })
        continue
      }

      if (checked.kind === 'switch') {
        const nextProfiles = ensureProfile(checked.profile, currentProfiles)
        profilesChanged = profilesChanged || nextProfiles.length !== currentProfiles.length
        currentProfiles = nextProfiles
        currentProfile = checked.profile
        activeChanged = true
        recommendationId = checked.recommendationId || recommendationId
        outcomes.push({ ok: true, text: `Active profile: ${checked.profile}` })
      } else if (checked.kind === 'create') {
        const nextName = checked.name || createProfileName(currentProfiles)
        currentProfiles = [...currentProfiles, nextName]
        currentProfile = nextName
        profilesChanged = true
        activeChanged = true
        outcomes.push({ ok: true, text: `Created profile: ${nextName}` })
      } else if (checked.kind === 'button') {
        const key = `${deviceKey(device)}::${currentProfile}`
        const legacy = currentProfile === (currentProfiles[0] || 'Default_profile0') ? storedActions[deviceKey(device)] || {} : {}
        storedActions = { ...storedActions, [key]: { ...(storedActions[key] || legacy), [checked.control]: checked.action } }
        buttonsChanged = true
        outcomes.push({ ok: true, text: `${checked.control}: ${actionDescription(checked.action)}` })
      }
    }

    if (profilesChanged) {
      setProfiles(currentProfiles)
      persistProfiles(profileStorage, profileStorageKeys.profiles, currentProfiles)
    }
    if (activeChanged) {
      setActiveProfile(currentProfile)
      saveActiveProfile(profileStorage, profileStorageKeys.activeProfile, currentProfile)
      if (recommendationId) setSelectedRecommendation(recommendationId)
    }
    if (profilesChanged || activeChanged) void saveProfilesToSupabase(supabase, currentProfiles, currentProfile)
    if (buttonsChanged) {
      storage.setItem(storeName, JSON.stringify(storedActions))
      setActionsVersion((version) => version + 1)
    }

    return outcomes
  }

  const sendQuestion = async (event) => {
    event.preventDefault()
    const text = question.trim()
    if (!text || assistantBusy) return

    const history = [...messages.filter((message) => !message.local), { from: 'user', text }]
    setMessages((current) => [...current, { from: 'user', text }])
    setQuestion('')
    setAssistantBusy(true)

    try {
      const result = await requestAssistantReply(
        supabase,
        history.map((message) => ({ role: message.from === 'user' ? 'user' : 'assistant', content: message.text })),
        buildAssistantContext(),
      )
      const outcomes = runAssistantActions(result.actions)
      const lines = [result.reply, ...outcomes.map(({ ok, text: line }) => `${ok ? 'Done' : 'Skipped'}: ${line}`)].filter(Boolean)
      setMessages((current) => [...current, { from: 'ai', text: lines.join('\n') || 'I could not produce an answer. Please rephrase.' }])
    } catch (error) {
      setMessages((current) => [...current, { from: 'ai', local: true, text: error.message }])
    } finally {
      setAssistantBusy(false)
    }
  }

  const addProfile = () => {
    const nextProfile = createProfileName(profiles)
    const nextProfiles = [...profiles, nextProfile]
    setProfiles(nextProfiles)
    persistProfiles(profileStorage, profileStorageKeys.profiles, nextProfiles)
    void saveProfilesToSupabase(supabase, nextProfiles, nextProfile)
    setActiveProfile(nextProfile)
    saveActiveProfile(profileStorage, profileStorageKeys.activeProfile, nextProfile)
    setProfileMenuOpen(false)
  }

  const applyRecommendationProfile = (profileName) => {
    const nextProfiles = ensureProfile(profileName, profiles)
    if (nextProfiles.length !== profiles.length) {
      setProfiles(nextProfiles)
      persistProfiles(profileStorage, profileStorageKeys.profiles, nextProfiles)
    }
    setActiveProfile(profileName)
    saveActiveProfile(profileStorage, profileStorageKeys.activeProfile, profileName)
    void saveProfilesToSupabase(supabase, nextProfiles, profileName)
    setSelectedRecommendation(aiRecommendations.find((item) => item.profileName === profileName)?.id || selectedRecommendation)
  }

  const signIn = async (mode = authMode) => {
    const trimmedEmail = authEmail.trim()
    const trimmedPassword = authPassword.trim()

    if (!trimmedEmail || !trimmedPassword) {
      setAuthFeedback('Please enter both email and password.')
      return
    }

    try {
      setAuthFeedback(mode === 'signup' ? 'Creating account...' : 'Signing in...')

      const result = mode === 'signup'
        ? await supabase.auth.signUp({ email: trimmedEmail, password: trimmedPassword })
        : await supabase.auth.signInWithPassword({ email: trimmedEmail, password: trimmedPassword })

      if (result.error) throw result.error
      if (mode === 'signup' && !result.data.session) {
        setAuthEmail('')
        setAuthPassword('')
        setAuthFormOpen(false)
        setAuthFeedback('Account created. Check your email, then sign in to continue.')
        return
      }

      const signedInUser = result.data.user
      if (!signedInUser) throw new Error('Authentication did not return a user account.')
      const { role, error: roleError } = await getAccountRole(supabase, signedInUser.id)

      const savedProfiles = getStoredJson(localStorage, 'loki-profiles', [])
      const nextProfiles = [...new Set([...savedProfiles, ...profiles])]
      const savedHistory = getStoredJson(localStorage, 'loki-device-history', {})
      const nextHistory = { ...savedHistory, ...deviceHistory }
      const temporaryActions = getStoredJson(sessionStorage, 'loki-temporary-button-actions', {})
      const savedActions = getStoredJson(localStorage, 'loki-button-actions', {})

      localStorage.setItem('loki-authenticated', 'true')
      localStorage.setItem('loki-profiles', JSON.stringify(nextProfiles))
      localStorage.setItem('loki-active-profile', activeProfile)
      localStorage.setItem('loki-device-history', JSON.stringify(nextHistory))
      localStorage.setItem('loki-button-actions', JSON.stringify({ ...savedActions, ...temporaryActions }))
      setProfiles(nextProfiles)
      setDeviceHistory(nextHistory)
      setIsSignedIn(true)
      setAuthUserId(signedInUser.id)
      setAuthUserEmail(signedInUser.email || trimmedEmail)
      setUserRole(role)
      setAdminView(false)
      setAuthEmail('')
      setAuthPassword('')
      setAuthFormOpen(false)
      setAuthFeedback(roleError
        ? 'Signed in with standard user access. Apply supabase/admin_roles.sql to enable role management.'
        : mode === 'signup' ? 'Account created. You can now sync profiles.' : 'Signed in successfully.')
      void saveProfilesToSupabase(supabase, nextProfiles, activeProfile)
      if (devices.length > 0) {
        const historyWithDevices = { ...nextHistory, [activeProfile]: [...(nextHistory[activeProfile] || []), ...devices.map(deviceHistoryEntry)].filter((entry, index, entries) => entries.findIndex((item) => deviceKey(item) === deviceKey(entry)) === index) }
        setDeviceHistory(historyWithDevices)
        localStorage.setItem('loki-device-history', JSON.stringify(historyWithDevices))
      }
      setUserMenuOpen(false)
    } catch (error) {
      setAuthFeedback(error?.message || 'Unable to complete the request.')
    }
  }

  const signOut = async () => {
    sessionStorage.setItem('loki-temporary-profiles', JSON.stringify(profiles))
    sessionStorage.setItem('loki-temporary-active-profile', activeProfile)
    sessionStorage.setItem('loki-temporary-device-history', JSON.stringify(deviceHistory))
    sessionStorage.setItem('loki-temporary-button-actions', localStorage.getItem('loki-button-actions') || '{}')
    localStorage.removeItem('loki-authenticated')
    if (supabase?.auth?.signOut) await supabase.auth.signOut()
    setIsSignedIn(false)
    setAuthUserId(null)
    setAuthUserEmail('')
    setUserRole('guest')
    setAdminView(false)
    setUserMenuOpen(false)
    setAuthFormOpen(false)
  }

  const handleDotGridPointerMove = (event) => {
    if (event.pointerType === 'touch') return

    const pointer = dotGridPointerRef.current
    const coalescedEvents = event.nativeEvent.getCoalescedEvents?.() || []
    const latestEvent = coalescedEvents.at(-1) || event
    const nextTime = latestEvent.timeStamp || performance.now()
    const hasPreviousPointer = pointer.active && pointer.time > 0
    const elapsed = hasPreviousPointer ? Math.max(nextTime - pointer.time, 1) : 1
    const rawVelocityX = hasPreviousPointer ? Math.max(-2.5, Math.min(2.5, (latestEvent.clientX - pointer.x) / elapsed)) : 0
    const rawVelocityY = hasPreviousPointer ? Math.max(-2.5, Math.min(2.5, (latestEvent.clientY - pointer.y) / elapsed)) : 0
    const changedDirection = hasPreviousPointer && pointer.velocityX * rawVelocityX + pointer.velocityY * rawVelocityY < 0
    const velocityBlend = !hasPreviousPointer ? 1 : changedDirection ? 0.78 : 1 - Math.exp(-elapsed / 28)

    pointer.velocityX += (rawVelocityX - pointer.velocityX) * velocityBlend
    pointer.velocityY += (rawVelocityY - pointer.velocityY) * velocityBlend
    pointer.reversing = changedDirection
    pointer.x = latestEvent.clientX
    pointer.y = latestEvent.clientY
    pointer.time = nextTime
    pointer.active = true
    pointer.redraw?.()
  }

  const handleDotGridPointerLeave = () => {
    const pointer = dotGridPointerRef.current
    pointer.active = false
    pointer.velocityX = 0
    pointer.velocityY = 0
    pointer.time = 0
    pointer.reversing = false
    pointer.redraw?.()
  }

  const historyDevices = uniqueDevices((deviceHistory[activeProfile] || []).filter(isSupportedDevice))
  const connectedKeys = new Set(devices.map(deviceKey))
  const displayDevices = sessionDevices.length > 0
    ? sessionDevices
    : [
        ...devices.map((device) => ({ device, isConnected: true })),
        ...(isSignedIn ? historyDevices : [])
          .filter((entry) => !connectedKeys.has(deviceKey(entry)))
          .map((entry) => ({ device: entry, isConnected: false })),
      ]
  const profilePreviewData = aiRecommendations.find((item) => item.profileName === profilePreview || item.id === profilePreview) || null

  return (
    <>
    <main className={`hero-shell ${deviceHubOpen && selectedDevice ? 'hub-workspace-open' : ''}`} onPointerMove={handleDotGridPointerMove} onPointerLeave={handleDotGridPointerLeave}>
      <div className="grid-lines" />
      <DotGridCanvas pointerRef={dotGridPointerRef} workspaceProgress={workspaceSuctionProgress} />
      <nav className={`relative z-20 flex items-start justify-between px-6 lg:px-10 ${deviceHubOpen && selectedDevice ? 'workspace-pinned-nav' : ''}`} aria-label="Main navigation">
        <div className="relative"><button className="profile-tab" type="button" onClick={() => setProfileMenuOpen(!profileMenuOpen)} aria-expanded={profileMenuOpen}><img src={publicAsset('/Profile.png')} alt="" aria-hidden="true" /><span>{activeProfile}</span></button>{profileMenuOpen && <div className="profile-menu profile-hub-menu" aria-label="Profiles">{profiles.filter((profile) => profile !== activeProfile).map((profile) => <button className="profile-hub-option" key={profile} type="button" onClick={() => { setActiveProfile(profile); profileStorage.setItem(profileStorageKeys.activeProfile, profile); setProfileMenuOpen(false) }} aria-label={`Select ${profile}`}><span>{profile}</span></button>)}<button className="profile-add" type="button" onClick={addProfile}>+ New profile</button></div>}</div>
        <div className="hub-actions relative">
          <button type="button" onClick={() => setSettingsOpen(!settingsOpen)} aria-label="Open settings" aria-expanded={settingsOpen}><img src={publicAsset('/B%C3%A1nh%20r%C4%83ng%20icon.png')} alt="" /></button>
          {!adminView && <button className="product-lab-launch" type="button" onClick={() => setProductLabOpen(true)} aria-label="Open Product Lab" aria-expanded={productLabOpen}>Product Lab</button>}
          <button type="button" onClick={() => setUserMenuOpen(!userMenuOpen)} aria-label="Open profile actions" aria-expanded={userMenuOpen}><img src={publicAsset('/icon%20personal.png')} alt="" /></button>
          {settingsOpen && <div className="top-menu settings-menu"><strong>Settings</strong><button type="button">Appearance</button><button type="button">Connection</button><button type="button">Notifications</button></div>}
          {userMenuOpen && <div className="top-menu user-menu">
            {isSignedIn ? <AuthenticatedSessionPanel email={authUserEmail} role={userRole} isAdminView={adminView} onToggleAdmin={() => setAdminView((current) => !current)} onSignOut={() => void signOut()} /> : <>
              <GuestSessionPanel onLogin={() => { setAuthMode('login'); setAuthFormOpen(true) }} onSignup={() => { setAuthMode('signup'); setAuthFormOpen(true) }} />
              {authFormOpen && <AuthFormPanel mode={authMode} email={authEmail} password={authPassword} feedback={authFeedback} onEmailChange={setAuthEmail} onPasswordChange={setAuthPassword} onSubmit={() => void signIn(authMode)} onCancel={() => { setAuthFormOpen(false); setAuthFeedback('') }} />}
            </>}
          </div>}
        </div>
      </nav>

      <p className="sr-only" aria-live="polite">{connectionMessage}</p>

      {displayDevices.length > 0 && !deviceHubOpen && !adminView && <ConnectedDeviceStage devices={displayDevices} selectedDevice={selectedDevice} onSelect={selectDevice} onConnect={connectDevice} />}

      <section className={deviceHubOpen && selectedDevice ? 'device-workspace-page' : adminView ? 'relative z-10 mx-auto flex min-h-[calc(100svh-80px)] w-full max-w-7xl items-center px-6 pb-28 pt-12 lg:px-10 lg:pb-24' : displayDevices.length === 0 ? 'connection-stage' : 'relative z-10 mx-auto flex min-h-[calc(100svh-80px)] w-full max-w-7xl items-center px-6 pb-28 pt-12 lg:px-10 lg:pb-24'}>
        {adminView && isAdmin ? <AdminDashboard supabase={supabase} currentUserId={authUserId} onBack={() => setAdminView(false)} /> : <>
        {deviceHubOpen && selectedDevice ? <DeviceWorkspace key={`${deviceKey(selectedDevice)}:${deviceConnectionRevision}:${actionsVersion}:${activeProfile}`} device={selectedDevice} onBack={() => { setWorkspaceSuctionProgress(0); dotGridPointerRef.current.workspaceSuctionProgress = 0; setDeviceHubOpen(false) }} onDeviceRefresh={refreshSelectedDevice} onScrollProgress={handleWorkspaceScrollProgress} workspaceScrollProgress={workspaceSuctionProgress} profiles={profiles} activeProfile={activeProfile} isSignedIn={isSignedIn} /> : null}

        {!deviceHubOpen && (
          <div className={`dashboard-layout ${displayDevices.length === 0 ? 'dashboard-layout--empty' : ''}`}>
            <div className="dashboard-legacy-column">
              {displayDevices.length === 0 && (
                <div className="device-hub-empty legacy-connection-panel" aria-label="Connection hub">
                  <p className="connection-panel-kicker">Connection hub</p>
                  <div className="legacy-connect-shell">
                    <div className="device-placeholder legacy-connect-placeholder" aria-hidden="true"><span className="device-plus">+</span><span className="device-placeholder-label">Connect to<br />your device</span></div>
                    <button className="device-connect-hitbox legacy-connect-hitbox" type="button" onClick={connectDevice} aria-label="Connect to your device">Connect to your device</button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
        </>}
      </section>

      {productLabOpen && !adminView && (
        <div className="product-lab-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) setProductLabOpen(false) }}>
          <section className="product-lab-dialog" role="dialog" aria-modal="true" aria-label="LOKI Product Lab">
            <header className="product-lab-dialog-header">
              <div>
                <p className="ai-recommendation-kicker">LOKI / PRODUCT LAB</p>
                <h2>AI + hardware control stack</h2>
              </div>
              <button className="product-lab-dialog-close" type="button" onClick={() => setProductLabOpen(false)} aria-label="Close Product Lab" title="Close Product Lab">×</button>
            </header>
            <div className="product-lab-content">
              <AIRecommendationPanel activeProfile={activeProfile} selectedRecommendation={selectedRecommendation} onOpenPreview={setProfilePreview} onApplyRecommendation={applyRecommendationProfile} />
              <DeviceCatalogPanel />
              <ProfileControlCenter profileName={activeProfile} deviceCount={displayDevices.length} syncStatus={connected ? 'Synced' : 'Standby'} />
              <SavedProfilesPanel profiles={profiles} activeProfile={activeProfile} onSelectProfile={(profile) => { setActiveProfile(profile); saveActiveProfile(profileStorage, profileStorageKeys.activeProfile, profile) }} onCreateProfile={addProfile} />
              <SmartInsightsPanel />
              <AITroubleshootingPanel />
            </div>
          </section>
        </div>
      )}

      {!adminView && <ProfileDetailModal profile={profilePreviewData} onClose={() => setProfilePreview(null)} onApply={applyRecommendationProfile} />}

    </main>
    {deviceHubOpen && !adminView && createPortal(<div className="workspace-vortex-overlay" aria-hidden="true">
      <div className="workspace-vortex" style={{ opacity: vortexPulse, transform: `translate(-50%, -50%) scale(${0.72 + vortexPulse * 0.7})` }}><span className="workspace-vortex-lip" /><span className="workspace-vortex-core" /><i /><b /></div>
      <div className="workspace-vortex-particles">
        {vortexParticlePositions.map(({ x, y }, index) => {
          const offsetX = (50 - x) * window.innerWidth / 100
          const offsetY = (50 - y) * window.innerHeight / 100
          const suctionOpacity = vortexPulse * (1 - refillTravel)
          const refillOpacity = Math.sin(Math.PI * refillTravel) * (workspaceSuctionProgress > 0.54 ? 1 : 0)
          return <span key={index}>
            <i className="workspace-vortex-particle is-suction" style={{ left: `${x}%`, top: `${y}%`, opacity: suctionOpacity, transform: `translate(${offsetX * suctionTravel}px, ${offsetY * suctionTravel}px) scale(${1 - suctionTravel * 0.92})` }} />
            <i className="workspace-vortex-particle is-refill" style={{ left: '50%', top: '50%', opacity: refillOpacity, transform: `translate(${-offsetX * refillTravel}px, ${-offsetY * refillTravel}px) scale(${0.2 + refillTravel * 0.8})` }} />
          </span>
        })}
      </div>
    </div>, document.body)}
    {createPortal(<div className="loki-assistant-dock">
      {dragonBodyOpacity > 0 && <div className={`dragon-rescue-body ${dragonGrip > 0.1 ? 'is-gripping' : ''} ${releaseGust > 0.01 ? 'is-release-gust' : ''}`} style={{ opacity: dragonBodyOpacity, transform: `translate3d(${84 * releaseGust}px, ${-30 * releaseGust}px, 0) rotate(${10 * releaseGust}deg)` }} aria-hidden="true">
        <svg viewBox="0 0 320 280">
          <defs><linearGradient id="rescue-dragon-scales" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#343443" /><stop offset="0.6" stopColor="#101018" /><stop offset="1" stopColor="#030307" /></linearGradient></defs>
          <g className="dragon-rescue-torso" style={{ transform: `scaleY(${1 - 0.72 * suctionTravel})` }}>
            <path d="M302 151C278 162 275 188 284 208c8 19 6 36-5 51-13 18-34 20-50 5-17-15-22-41-12-62" fill="none" stroke="#05050a" strokeWidth="51" strokeLinecap="round" />
            <path d="M302 151C278 162 275 188 284 208c8 19 6 36-5 51-13 18-34 20-50 5-17-15-22-41-12-62" fill="none" stroke="url(#rescue-dragon-scales)" strokeWidth="43" strokeLinecap="round" />
            <path d="m294 172-17-6 17-8m-12 33-18-4 17-11m16 40-18-7 17-9m-28 36-18-2 15-13m25-36 16-4-10-12" fill="none" stroke="#626277" strokeWidth="3.5" strokeLinejoin="miter" />
            <path d="M264 183c-12-11-17-25-14-41 10 9 20 10 34 4 2 17-4 28-20 37z" fill="#11111a" stroke="#69697d" strokeWidth="3" />
          </g>
          <g className="dragon-rescue-arms">
            <path d="M286 187c-39-1-77 12-112 38l-29 24" fill="none" stroke="#05050a" strokeWidth="32" strokeLinecap="round" />
            <path d="M286 187c-39-1-77 12-112 38l-29 24" fill="none" stroke="url(#rescue-dragon-scales)" strokeWidth="25" strokeLinecap="round" />
            <path d="M288 185c13 13 22 32 22 58l-4 16" fill="none" stroke="#05050a" strokeWidth="27" strokeLinecap="round" />
            <path d="M288 185c13 13 22 32 22 58l-4 16" fill="none" stroke="url(#rescue-dragon-scales)" strokeWidth="21" strokeLinecap="round" />
            <path d="m152 247-18-7-7 9 18 6-12 9 24-2m148-8 10 11-5 9 16 3-2 9-22-3" fill="none" stroke="#e7eef1" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m139 248-10 15m24-7-9 17m164-23 1 17m8-21 9 15" fill="none" stroke="#11111a" strokeWidth="4" strokeLinecap="round" />
          </g>
        </svg>
      </div>}
      {assistantOpen && <aside className="loki-assistant-panel" aria-label="LOKI hardware assistant">
        <header className="loki-assistant-header">
          <DragonMascot idPrefix="chat" />
          <div><p>LOKI / HARDWARE GUIDE</p><span>{connected ? `Connected · ${deviceName}` : 'AI assistant'}</span></div>
          <button type="button" onClick={() => setAssistantOpen(false)} aria-label="Close assistant" title="Close assistant">×</button>
        </header>
        <div className="loki-assistant-messages" aria-live="polite">{messages.map((message, index) => <div className={`loki-assistant-message ${message.from === 'user' ? 'is-user' : 'is-assistant'}`} key={`${message.from}-${index}`}>{message.text}</div>)}{assistantBusy && <div className="loki-assistant-message is-assistant is-pending" role="status">LOKI is thinking...</div>}</div>
        <form className="loki-assistant-form" onSubmit={sendQuestion}>
          <input type="text" value={question} maxLength={1000} disabled={assistantBusy} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask LOKI or tell it what to change..." aria-label="Ask LOKI about your device" />
          <button type="submit" disabled={assistantBusy || !question.trim()} aria-label="Send message" title="Send message">↗</button>
        </form>
      </aside>}
      <button className="dragon-launcher" type="button" onClick={() => setAssistantOpen((open) => !open)} aria-label={assistantOpen ? 'Close Ask LOKI assistant' : 'Open Ask LOKI assistant'} aria-expanded={assistantOpen}>
        <span className="dragon-speech-bubble" aria-hidden="true">Ask LOKI</span>
        <DragonMascot idPrefix="launcher" />
        <span className="dragon-sleep-z dragon-sleep-z-one" aria-hidden="true">z</span>
        <span className="dragon-sleep-z dragon-sleep-z-two" aria-hidden="true">z</span>
        <span className="dragon-sleep-z dragon-sleep-z-three" aria-hidden="true">z</span>
      </button>
    </div>, document.body)}
    </>
  )
}

export default App
