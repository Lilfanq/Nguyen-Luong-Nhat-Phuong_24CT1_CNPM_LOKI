export const deviceCatalog = [
  {
    id: 'razer-viper-v4-pro',
    name: 'Razer Viper V4 Pro',
    brand: 'Razer',
    type: 'Mouse',
    interface: '2.4GHz + Bluetooth',
    status: 'Ready',
    compatibility: ['FPS Pro Setup', 'MOBA Flow'],
    connectivity: 'WebHID / Wireless',
    memory: '5 profiles',
  },
  {
    id: 'aula-hero-win68he',
    name: 'AULA HERO WIN68HE',
    brand: 'AULA',
    type: 'Keyboard',
    interface: 'USB-C Wired',
    status: 'Ready',
    compatibility: ['Productivity Sync', 'FPS Pro Setup'],
    connectivity: 'WebHID / Wired',
    memory: '3 layers',
  },
  {
    id: 'logitech-gpro-x',
    name: 'Logitech G Pro X',
    brand: 'Logitech',
    type: 'Mouse',
    interface: 'USB Wired',
    status: 'Queued',
    compatibility: ['FPS Pro Setup'],
    connectivity: 'WebHID / Wired',
    memory: '4 profiles',
  },
]

export const aiRecommendations = [
  {
    id: 'fps-pro-setup',
    title: 'FPS Pro Setup',
    game: 'Valorant / CS2',
    accent: 'emerald',
    profileName: 'FPS_Pro_Setup',
    summary: 'DPI 800 · polling 1000Hz · low-latency layout',
    highlights: ['Default to 6-button layout', 'High-precision aim curve', 'Fast profile swap'],
    details: {
      recommendedFor: 'FPS / aim-tracking / precision play',
      dpi: 800,
      polling: 1000,
      liftOff: '2 mm',
      bindSummary: ['Mouse button 4 → quick switch', 'Scroll click → crouch', 'DPI cycle → on-the-fly adjustment'],
    },
  },
  {
    id: 'moba-flow',
    title: 'MOBA Flow',
    game: 'League / Dota',
    accent: 'violet',
    profileName: 'MOBA_Flow',
    summary: 'DPI 1200 · side buttons mapped to utility',
    highlights: ['Quick cast binds', 'Lower hand strain', 'Hotkey profile'],
    details: {
      recommendedFor: 'MOBA / lane control / utility rotation',
      dpi: 1200,
      polling: 1000,
      liftOff: '3 mm',
      bindSummary: ['Button 4 → ping', 'Button 5 → instant ability', 'Side tilt → camera track'],
    },
  },
  {
    id: 'productivity-sync',
    title: 'Productivity Sync',
    game: 'Work / Design',
    accent: 'sky',
    profileName: 'Productivity_Sync',
    summary: 'Balanced macro + scroll + media control',
    highlights: ['Workspace profile', 'Audio controls', 'Fast app switch'],
    details: {
      recommendedFor: 'Work / editing / productivity',
      dpi: 1000,
      polling: 500,
      liftOff: '2.5 mm',
      bindSummary: ['Thumb button → app switch', 'Scroll click → mute', 'Button 4 → browser tab'],
    },
  },
]

export const aiDiagnostics = [
  {
    id: 'dpi-mismatch',
    title: 'DPI mismatch detected',
    severity: 'medium',
    message: 'Current mouse sensitivity is above the recommended range for your selected FPS profile.',
    action: 'Reduce sensitivity to 800 DPI and re-check aim profile',
  },
  {
    id: 'polling-sync',
    title: 'Polling rate mismatch',
    severity: 'high',
    message: 'Polling is running at 125Hz while the current setup expects 1000Hz for competitive play.',
    action: 'Switch polling rate to 1000Hz for a low-latency profile',
  },
  {
    id: 'battery-unreadable',
    title: 'Battery status not readable',
    severity: 'low',
    message: 'Battery report is not exposed by this device, so the system is keeping the last known value.',
    action: 'Refresh the device and check if firmware exposes battery reporting',
  },
]

export const supabaseSchema = {
  database: 'LOKI',
  tables: [
    {
      name: 'users',
      columns: ['id uuid primary key', 'email text unique', 'display_name text', 'created_at timestamptz'],
      purpose: 'Store authenticated gamer accounts.',
    },
    {
      name: 'devices',
      columns: ['id uuid primary key', 'user_id uuid references users', 'vendor text', 'model text', 'type text', 'connection_mode text', 'status text'],
      purpose: 'Store attached hardware and status for each user.',
    },
    {
      name: 'profiles',
      columns: ['id uuid primary key', 'device_id uuid references devices', 'name text', 'mode text', 'dpi int', 'polling_rate int', 'updated_at timestamptz'],
      purpose: 'Persist the per-device personalization profiles.',
    },
    {
      name: 'recommendations',
      columns: ['id uuid primary key', 'profile_id uuid references profiles', 'title text', 'game_type text', 'confidence float', 'summary text'],
      purpose: 'Track the AI suggestions generated for the gamer.',
    },
    {
      name: 'diagnostics',
      columns: ['id uuid primary key', 'device_id uuid references devices', 'title text', 'severity text', 'message text', 'solution text'],
      purpose: 'Store health check output and fix guidance.',
    },
  ],
}
