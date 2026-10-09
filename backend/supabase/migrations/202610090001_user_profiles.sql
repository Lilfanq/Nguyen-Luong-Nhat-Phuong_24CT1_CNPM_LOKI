create table if not exists public.user_profiles (
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  active boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, name)
);

alter table public.user_profiles enable row level security;

revoke all on table public.user_profiles from anon, authenticated;
grant select, insert, update, delete on table public.user_profiles to authenticated;

drop policy if exists user_profiles_manage_own on public.user_profiles;
create policy user_profiles_manage_own
on public.user_profiles
for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
