alter table public.auth_signup_events
  add column if not exists email_confirmed_at timestamptz;
