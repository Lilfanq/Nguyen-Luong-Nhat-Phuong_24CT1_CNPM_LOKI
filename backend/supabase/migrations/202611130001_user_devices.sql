create table if not exists public.user_devices (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_key text not null check (char_length(btrim(device_key)) between 1 and 180),
  vendor_id integer not null check (vendor_id between 0 and 65535),
  product_id integer not null check (product_id between 0 and 65535),
  product_name text not null default 'Unknown HID device' check (char_length(product_name) <= 180),
  manufacturer_name text not null default '' check (char_length(manufacturer_name) <= 180),
  device_type text not null default 'other' check (device_type in ('mouse', 'keyboard', 'other')),
  first_connected_at timestamptz not null default now(),
  last_connected_at timestamptz not null default now(),
  primary key (user_id, device_key)
);

alter table public.user_devices enable row level security;

revoke all on table public.user_devices from anon, authenticated;
grant select, insert, update on table public.user_devices to authenticated;

drop policy if exists user_devices_select_own on public.user_devices;
create policy user_devices_select_own
on public.user_devices
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists user_devices_insert_own on public.user_devices;
create policy user_devices_insert_own
on public.user_devices
for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists user_devices_update_own on public.user_devices;
create policy user_devices_update_own
on public.user_devices
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));