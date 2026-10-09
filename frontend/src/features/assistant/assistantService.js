const PROFILE_SWITCH_ACTIONS = ['Next profile', 'Previous profile', 'Cycle profiles']
const DPI_MIN = 100
const DPI_MAX = 50000
const MAX_STAGES = 8
const PROFILE_NAME_PATTERN = /^[A-Za-z0-9_-]{1,32}$/

export const ASSISTANT_PROFILE_ACTIONS = PROFILE_SWITCH_ACTIONS

function matchOption(options, value) {
  const wanted = String(value ?? '').trim().toLowerCase()
  return options.find((option) => option.toLowerCase() === wanted)
}

function validateButtonAction(args, rules) {
  const control = matchOption(rules.controls, args.control)
  if (!rules.hasMouse) return { ok: false, error: 'Select or connect a mouse first; button assignments only apply to mice.' }
  if (!control) return { ok: false, error: `Unknown control: ${String(args.control ?? '').slice(0, 40)}` }

  const category = typeof args.category === 'string' ? args.category.trim().toLowerCase() : ''
  const rawValue = typeof args.value === 'string' ? args.value.trim() : ''
  if (!Object.hasOwn(rules.categories, category)) return { ok: false, error: `Unsupported action type: ${category.slice(0, 40)}` }

  const options = rules.actionOptions[category]
  let value = rawValue

  if (options) {
    value = matchOption(options, rawValue)
    if (!value) return { ok: false, error: `"${rawValue.slice(0, 60)}" is not an available ${category} action.` }
  } else if (category === 'profile') {
    value = matchOption([...PROFILE_SWITCH_ACTIONS, ...rules.profiles], rawValue)
    if (!value) return { ok: false, error: `"${rawValue.slice(0, 60)}" is not a valid profile action.` }
  } else if (category === 'keyboard') {
    if (!rawValue || rawValue.length > 60) return { ok: false, error: 'Keyboard shortcut must be 1-60 characters.' }
  } else if (category === 'text') {
    if (!rawValue || rawValue.length > 250) return { ok: false, error: 'Text must be 1-250 characters.' }
  } else if (category === 'website') {
    try {
      const url = new URL(rawValue)
      if (!['http:', 'https:'].includes(url.protocol) || rawValue.length > 200) throw new Error('invalid')
    } catch {
      return { ok: false, error: 'Website must be a valid http(s) address.' }
    }
  }

  const action = { category, value }

  if (category === 'sensitivity') {
    const stages = Array.isArray(args.stages) ? args.stages.map(Number) : []
    const valid = stages.length > 0
      && stages.length <= MAX_STAGES
      && stages.every((dpi) => Number.isInteger(dpi) && dpi >= DPI_MIN && dpi <= DPI_MAX)
    if (!valid) return { ok: false, error: `DPI stages must be 1-${MAX_STAGES} whole numbers between ${DPI_MIN} and ${DPI_MAX}.` }
    action.stages = stages
  }

  return { ok: true, kind: 'button', control, action }
}

export function validateAssistantAction(action, rules) {
  const args = action?.arguments && typeof action.arguments === 'object' ? action.arguments : {}

  switch (action?.name) {
    case 'set_button_action':
      return validateButtonAction(args, rules)

    case 'reset_button_action': {
      const control = matchOption(rules.controls, args.control)
      if (!rules.hasMouse) return { ok: false, error: 'Select or connect a mouse first; button assignments only apply to mice.' }
      if (!control) return { ok: false, error: `Unknown control: ${String(args.control ?? '').slice(0, 40)}` }
      return { ok: true, kind: 'button', control, action: { category: 'default', value: 'Keep standard behavior' } }
    }

    case 'switch_profile': {
      const wanted = String(args.profile ?? '').trim().toLowerCase()
      const existing = rules.profiles.find((profile) => profile.toLowerCase() === wanted)
      if (existing) return { ok: true, kind: 'switch', profile: existing }

      const recommendation = rules.recommendations.find(({ id, title, profileName }) => [id, title, profileName].some((name) => name.toLowerCase() === wanted))
      if (recommendation) return { ok: true, kind: 'switch', profile: recommendation.profileName, recommendationId: recommendation.id }
      return { ok: false, error: `Profile "${wanted.slice(0, 40)}" does not exist.` }
    }

    case 'create_profile': {
      const name = typeof args.name === 'string' ? args.name.trim() : ''
      if (!name) return { ok: true, kind: 'create', name: '' }
      if (!PROFILE_NAME_PATTERN.test(name)) return { ok: false, error: 'Profile names use letters, digits, "_" or "-" (max 32).' }
      if (rules.profiles.some((profile) => profile.toLowerCase() === name.toLowerCase())) return { ok: false, error: `Profile "${name}" already exists.` }
      return { ok: true, kind: 'create', name }
    }

    default:
      return { ok: false, error: 'Unsupported action requested by the assistant.' }
  }
}

export async function requestAssistantReply(supabase, messages, context) {
  const { data, error } = await supabase.functions.invoke('loki-chat', { body: { messages, context } })

  if (error) {
    if (error.name === 'FunctionsFetchError' || error.context?.status === 404) {
      throw new Error('The AI service is not deployed or not reachable yet.')
    }

    const detail = await (error.context?.json?.() ?? Promise.resolve(null)).then((body) => body?.error, () => '')
    throw new Error(detail || 'The AI service is unavailable. Please try again.')
  }

  return {
    reply: typeof data?.reply === 'string' ? data.reply : '',
    actions: Array.isArray(data?.actions) ? data.actions.slice(0, 6) : [],
  }
}
