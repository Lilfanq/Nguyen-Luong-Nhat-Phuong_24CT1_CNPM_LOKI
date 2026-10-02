create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

insert into public.app_users (id, email, display_name, role, created_at)
select
  id,
  coalesce(email, ''),
  coalesce(raw_user_meta_data ->> 'display_name', ''),
  'user',
  coalesce(created_at, now())
from auth.users
on conflict (id) do update
set email = excluded.email,
    display_name = coalesce(nullif(public.app_users.display_name, ''), excluded.display_name);

create or replace function public.is_loki_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_users
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_loki_admin() from public, anon;
grant execute on function public.is_loki_admin() to authenticated;

alter table public.app_users enable row level security;
revoke all on table public.app_users from anon, authenticated;
grant select on table public.app_users to authenticated;

drop policy if exists "app_users_select_self_or_admin" on public.app_users;
create policy "app_users_select_self_or_admin"
on public.app_users
for select
to authenticated
using (id = (select auth.uid()) or (select public.is_loki_admin()));

create or replace function public.handle_new_loki_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.app_users (id, email, display_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    'user'
  )
  on conflict (id) do update
  set email = excluded.email,
      display_name = coalesce(nullif(public.app_users.display_name, ''), excluded.display_name);
  return new;
end;
$$;

revoke all on function public.handle_new_loki_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_loki_profile on auth.users;
create trigger on_auth_user_created_loki_profile
after insert on auth.users
for each row execute function public.handle_new_loki_user();

create or replace function public.set_loki_user_role(target_user_id uuid, requested_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_loki_admin() then
    raise exception 'Admin role required' using errcode = '42501';
  end if;

  if requested_role is null or requested_role not in ('user', 'admin') then
    raise exception 'Invalid role';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'You cannot change your own role';
  end if;

  update public.app_users
  set role = requested_role
  where id = target_user_id;

  if not found then
    raise exception 'Account not found';
  end if;
end;
$$;

revoke all on function public.set_loki_user_role(uuid, text) from public, anon;
grant execute on function public.set_loki_user_role(uuid, text) to authenticated;

-- After creating your account, replace the email below and run this once to bootstrap the first admin.
-- update public.app_users set role = 'admin' where lower(email) = lower('YOUR_EMAIL');
-- select id, email, role from public.app_users where lower(email) = lower('YOUR_EMAIL');
