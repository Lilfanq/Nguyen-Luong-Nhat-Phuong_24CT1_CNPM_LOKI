// Deno runtime for Supabase Edge Functions; excluded from the app's lint and TS checks.
// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2'

const allowedOrigins = new Set(
  (Deno.env.get('APP_ORIGINS') || 'http://127.0.0.1:5176,http://localhost:5176,https://lilfanq.github.io')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
)

const reasons = {
  invalid_email: 'The email address was rejected as invalid.',
  weak_password: 'The password did not meet the configured requirements.',
  missing_fields: 'The email or password was missing.',
  email_exists_or_hidden: 'Auth reported an existing or protected account.',
  rate_limited: 'The signup request was rate limited.',
  auth_error: 'Supabase Auth rejected the signup request.',
}

const attempts = new Map()
const RATE_LIMIT = 12
const RATE_WINDOW_MS = 60_000

function headersFor(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    Vary: 'Origin',
  }
}

function respond(body, status, origin) {
  return new Response(JSON.stringify(body), { status, headers: headersFor(origin) })
}

function isRateLimited(request) {
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()
  const current = attempts.get(key)

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }

  current.count += 1
  return current.count > RATE_LIMIT
}

function maskEmail(value) {
  if (typeof value !== 'string' || value.length > 320) return null
  const match = value.trim().match(/^([^@\s]+)@([^@\s]+)$/)
  return match ? `${match[1].slice(0, 1)}***@${match[2]}` : null
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin') || ''
  if (!allowedOrigins.has(origin)) return new Response('Forbidden', { status: 403 })
  if (request.method === 'OPTIONS') return new Response('ok', { headers: headersFor(origin) })
  if (request.method !== 'POST') return respond({ error: 'Method not allowed' }, 405, origin)
  if (isRateLimited(request)) return respond({ error: 'Too many attempts' }, 429, origin)

  const payload = await request.json().catch(() => null)
  const reasonCode = payload?.reasonCode
  if (!Object.hasOwn(reasons, reasonCode)) {
    return respond({ error: 'Unsupported reason code' }, 400, origin)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return respond({ error: 'Server configuration error' }, 500, origin)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await admin.from('auth_signup_events').insert({
    email_masked: maskEmail(payload?.email),
    outcome: 'failure',
    reason_code: reasonCode,
    reason: reasons[reasonCode],
    source: 'client',
  })

  if (error) return respond({ error: 'Could not record signup attempt' }, 500, origin)
  return respond({ ok: true }, 200, origin)
})
