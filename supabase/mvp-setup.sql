-- ============================================================================
-- SKYQUAKE MVP — Supabase bring-up script (FIXED)
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Missing tables
-- ---------------------------------------------------------------------------
create table if not exists public.location_estimates (
  location_id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(event_id) on delete cascade,
  method text not null,
  lat double precision not null,
  lon double precision not null,
  altitude_km double precision,
  radius_km double precision,
  trajectory_start jsonb,
  trajectory_end jsonb,
  uncertainty jsonb
);

-- ---------------------------------------------------------------------------
-- 2. Missing columns & constraint fixes
-- ---------------------------------------------------------------------------
alter table public.users_devices
  add column if not exists last_seen timestamptz;

-- Make user_id nullable so system demo devices don't fail insertion
alter table public.users_devices 
  alter column user_id drop not null;

alter table public.event_detections
  add column if not exists distance_km double precision;

alter table public.signal_features
  add column if not exists band_energy_0_1hz double precision;
alter table public.signal_features
  add column if not exists band_energy_1_5hz double precision;
alter table public.signal_features
  add column if not exists band_energy_5_20hz double precision;
alter table public.signal_features
  add column if not exists waveform_duration_s double precision;

alter table public.signal_features
  alter column band_energy_0_1hz set default 0,
  alter column band_energy_1_5hz set default 0,
  alter column band_energy_5_20hz set default 0,
  alter column waveform_duration_s set default 0;

update public.signal_features
  set band_energy_0_1hz = coalesce(band_energy_0_1hz, 0),
      band_energy_1_5hz = coalesce(band_energy_1_5hz, 0),
      band_energy_5_20hz = coalesce(band_energy_5_20hz, 0),
      waveform_duration_s = coalesce(waveform_duration_s, 0);

alter table public.signal_features
  alter column band_energy_0_1hz set not null,
  alter column band_energy_1_5hz set not null,
  alter column band_energy_5_20hz set not null,
  alter column waveform_duration_s set not null,
  alter column band_energy_0_1hz drop default,
  alter column band_energy_1_5hz drop default,
  alter column band_energy_5_20hz drop default,
  alter column waveform_duration_s drop default;

alter table public.classifications
  add column if not exists model_version text;

update public.classifications
  set model_version = coalesce(model_version, 'mvp-rules-v1');

alter table public.classifications
  alter column model_version set not null;

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------
create index if not exists sensor_readings_time_idx on public.sensor_readings (timestamp_utc desc);
create index if not exists sensor_readings_device_time_idx on public.sensor_readings (device_id, timestamp_utc desc);
create index if not exists events_start_idx on public.events (start_time_utc desc);

-- ---------------------------------------------------------------------------
-- 4. Row Level Security + policies
-- ---------------------------------------------------------------------------
alter table public.users_devices enable row level security;
alter table public.sensor_readings enable row level security;
alter table public.events enable row level security;
alter table public.event_detections enable row level security;
alter table public.signal_features enable row level security;
alter table public.classifications enable row level security;
alter table public.location_estimates enable row level security;

-- users_devices
drop policy if exists "mvp anon select" on public.users_devices;
drop policy if exists "mvp anon insert" on public.users_devices;
drop policy if exists "mvp anon update" on public.users_devices;
create policy "mvp anon select" on public.users_devices for select to anon, authenticated using (true);
create policy "mvp anon insert" on public.users_devices for insert to anon, authenticated with check (true);
create policy "mvp anon update" on public.users_devices for update to anon, authenticated using (true) with check (true);

-- sensor_readings
drop policy if exists "mvp anon select" on public.sensor_readings;
drop policy if exists "mvp anon insert" on public.sensor_readings;
drop policy if exists "mvp anon update" on public.sensor_readings;
create policy "mvp anon select" on public.sensor_readings for select to anon, authenticated using (true);
create policy "mvp anon insert" on public.sensor_readings for insert to anon, authenticated with check (true);
create policy "mvp anon update" on public.sensor_readings for update to anon, authenticated using (true) with check (true);

-- events
drop policy if exists "mvp anon select" on public.events;
drop policy if exists "mvp anon insert" on public.events;
drop policy if exists "mvp anon update" on public.events;
create policy "mvp anon select" on public.events for select to anon, authenticated using (true);
create policy "mvp anon insert" on public.events for insert to anon, authenticated with check (true);
create policy "mvp anon update" on public.events for update to anon, authenticated using (true) with check (true);

-- event_detections
drop policy if exists "mvp anon select" on public.event_detections;
drop policy if exists "mvp anon insert" on public.event_detections;
drop policy if exists "mvp anon update" on public.event_detections;
create policy "mvp anon select" on public.event_detections for select to anon, authenticated using (true);
create policy "mvp anon insert" on public.event_detections for insert to anon, authenticated with check (true);
create policy "mvp anon update" on public.event_detections for update to anon, authenticated using (true) with check (true);

-- signal_features
drop policy if exists "mvp anon select" on public.signal_features;
drop policy if exists "mvp anon insert" on public.signal_features;
drop policy if exists "mvp anon update" on public.signal_features;
create policy "mvp anon select" on public.signal_features for select to anon, authenticated using (true);
create policy "mvp anon insert" on public.signal_features for insert to anon, authenticated with check (true);
create policy "mvp anon update" on public.signal_features for update to anon, authenticated using (true) with check (true);

-- classifications
drop policy if exists "mvp anon select" on public.classifications;
drop policy if exists "mvp anon insert" on public.classifications;
drop policy if exists "mvp anon update" on public.classifications;
create policy "mvp anon select" on public.classifications for select to anon, authenticated using (true);
create policy "mvp anon insert" on public.classifications for insert to anon, authenticated with check (true);
create policy "mvp anon update" on public.classifications for update to anon, authenticated using (true) with check (true);

-- location_estimates
drop policy if exists "mvp anon select" on public.location_estimates;
drop policy if exists "mvp anon insert" on public.location_estimates;
drop policy if exists "mvp anon update" on public.location_estimates;
create policy "mvp anon select" on public.location_estimates for select to anon, authenticated using (true);
create policy "mvp anon insert" on public.location_estimates for insert to anon, authenticated with check (true);
create policy "mvp anon update" on public.location_estimates for update to anon, authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 5. Realtime
-- ---------------------------------------------------------------------------
alter table public.sensor_readings replica identity full;
alter table public.events replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.sensor_readings;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.events;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.event_detections;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.classifications;
  exception when duplicate_object then null;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- 6. Seed demo stations
-- ---------------------------------------------------------------------------
insert into public.users_devices
  (device_id, user_id, device_type, sensor_types, lat, lon, altitude, accuracy_m, os, app_version, last_seen)
values
  ('b7a1c0de-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000001', 'Raspberry Pi 5', '["microphone","barometer","accelerometer","GPS"]'::jsonb, 33.605, -116.502, 1200, 12, 'Raspberry Pi OS', '0.3.0', now()),
  ('b7a1c0de-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000002', 'Raspberry Pi 5', '["microphone","accelerometer","GPS"]'::jsonb, 33.621, -116.481, 1235, 12, 'Raspberry Pi OS', '0.3.0', now()),
  ('b7a1c0de-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000003', 'Smartphone', '["microphone","accelerometer","GPS"]'::jsonb, 33.589, -116.468, 1270, 12, 'Android 15', '0.3.0', now())
on conflict (device_id) do update set last_seen = now();