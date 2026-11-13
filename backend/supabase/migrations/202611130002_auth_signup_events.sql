create table if not exists public.auth_signup_events (
  id bigint generated always as identity primary key,
  user_id uuid,
  email_masked text,
  outcome text not null check (outcome in ('success', 'failure')),
  reason_code text,
  reason text,
  source text not null check (source in ('auth_trigger', 'client')),
  created_at timestamptz not null default now(),
  email_confirmed_at timestamptz,
  check (
    (outcome = 'success' and source = 'auth_trigger' and reason_code is null and reason is null)
    or
    (outcome = 'failure' and source = 'client' and reason_code is not null and reason is not null)
  )
);

create index if not exists auth_signup_events_created_at_idx
  on public.auth_signup_events (created_at desc);

create index if not exists auth_signup_events_user_id_idx
  on public.auth_signup_events (user_id)
  where user_id is not null;

alter table public.auth_signup_events enable row level security;
revoke all on table public.auth_signup_events from anon, authenticated;
grant select on table public.auth_signup_events to authenticated;

drop policy if exists auth_signup_events_admin_select
  on public.auth_signup_events;
create policy auth_signup_events_admin_select
on public.auth_signup_events
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users as app_user
    where app_user.id = (select auth.uid())
      and app_user.role = 'admin'
  )
);

create or replace function public.audit_auth_signup_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.raw_app_meta_data ->> 'provider', 'email') <> 'email' then
    return new;
  end if;

  insert into public.auth_signup_events (
    user_id,
    email_masked,
    outcome,
    source,
    email_confirmed_at
  ) values (
    new.id,
    case
      when new.email ~ '^[^@]+@[^@]+$'
        then left(split_part(new.email, '@', 1), 1)
          || '***@' || split_part(new.email, '@', 2)
      else null
    end,
    'success',
    'auth_trigger',
    new.email_confirmed_at
  );

  return new;
end;
$$;

drop trigger if exists audit_auth_signup_created on auth.users;
create trigger audit_auth_signup_created
after insert on auth.users
for each row execute function public.audit_auth_signup_created();

create or replace function public.audit_auth_email_confirmation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.auth_signup_events
    set email_confirmed_at = new.email_confirmed_at
    where id = (
      select event.id
      from public.auth_signup_events as event
      where event.user_id = new.id
        and event.outcome = 'success'
      order by event.created_at desc
      limit 1
    );
  end if;

  return new;
end;
$$;

drop trigger if exists audit_auth_email_confirmation on auth.users;
create trigger audit_auth_email_confirmation
after update of email_confirmed_at on auth.users
for each row execute function public.audit_auth_email_confirmation();
