-- SKYQUAKE MVP schema (NASA Space Apps)
-- Run this in the Supabase SQL editor, then enable Realtime on
-- sensor_readings and events if the publication block below is skipped.

create extension if not exists "pgcrypto";

create table if not exists public.users_devices (
  device_id text primary key,
  user_id text,
  device_type text,
  sensor_types jsonb,
  lat double precision not null,
  lon double precision not null,
  altitude double precision,
  accuracy_m double precision,
  os text,
  app_version text,
  last_seen timestamptz
);

create table if not exists public.sensor_readings (
  reading_id uuid primary key default gen_random_uuid(),
  device_id text not null references public.users_devices(device_id) on delete cascade,
  timestamp_utc timestamptz not null,
  sensor_type text not null check (sensor_type in ('infrasound', 'seismic', 'pressure', 'weather')),
  value double precision not null,
  unit text not null,
  sampling_rate_hz double precision not null,
  quality_flag text not null default 'good' check (quality_flag in ('good', 'noisy', 'suspicious'))
);

create index if not exists sensor_readings_time_idx on public.sensor_readings (timestamp_utc desc);
create index if not exists sensor_readings_device_time_idx on public.sensor_readings (device_id, timestamp_utc desc);

create table if not exists public.events (
  event_id uuid primary key default gen_random_uuid(),
  start_time_utc timestamptz not null,
  end_time_utc timestamptz,
  event_type text not null check (event_type in ('meteor_candidate', 'earthquake_candidate', 'noise')),
  confidence double precision not null check (confidence >= 0 and confidence <= 1),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  region text,
  created_at timestamptz not null default now()
);

create index if not exists events_start_idx on public.events (start_time_utc desc);

create table if not exists public.event_detections (
  detection_id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(event_id) on delete cascade,
  device_id text not null references public.users_devices(device_id) on delete cascade,
  arrival_time_utc timestamptz not null,
  peak_amplitude double precision not null,
  dominant_frequency_hz double precision not null,
  duration_s double precision not null,
  snr double precision not null,
  back_azimuth_deg double precision,
  distance_km double precision
);

create table if not exists public.signal_features (
  event_id uuid not null references public.events(event_id) on delete cascade,
  device_id text not null references public.users_devices(device_id) on delete cascade,
  fft_peak_hz double precision not null,
  band_energy_0_1hz double precision not null,
  band_energy_1_5hz double precision not null,
  band_energy_5_20hz double precision not null,
  n_wave_detected boolean not null default false,
  spectral_centroid double precision not null,
  waveform_duration_s double precision not null,
  primary key (event_id, device_id)
);

create table if not exists public.classifications (
  classification_id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(event_id) on delete cascade,
  label text not null check (label in ('meteor', 'earthquake', 'explosion', 'construction', 'noise')),
  probability double precision not null check (probability >= 0 and probability <= 1),
  model_version text not null,
  rules_triggered jsonb not null default '[]'::jsonb,
  explanation text not null
);

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

-- Experimental 3-station array (guide MVP: at least 3 devices)
insert into public.users_devices
  (device_id, user_id, device_type, sensor_types, lat, lon, altitude, accuracy_m, os, app_version, last_seen)
values
  ('SKY-01', 'demo', 'Raspberry Pi', '["microphone","accelerometer","GPS"]'::jsonb, 33.605, -116.502, 1280, 8, 'linux', 'mvp-1', now()),
  ('SKY-02', 'demo', 'Raspberry Pi', '["microphone","accelerometer","GPS"]'::jsonb, 33.621, -116.481, 1312, 8, 'linux', 'mvp-1', now()),
  ('SKY-03', 'demo', 'Raspberry Pi', '["microphone","accelerometer","GPS"]'::jsonb, 33.589, -116.468, 1194, 8, 'linux', 'mvp-1', now())
on conflict (device_id) do update set last_seen = now();

alter table public.users_devices enable row level security;
alter table public.sensor_readings enable row level security;
alter table public.events enable row level security;
alter table public.event_detections enable row level security;
alter table public.signal_features enable row level security;
alter table public.classifications enable row level security;
alter table public.location_estimates enable row level security;

drop policy if exists "public read devices" on public.users_devices;
drop policy if exists "public write devices" on public.users_devices;
create policy "public read devices" on public.users_devices for select using (true);
create policy "public write devices" on public.users_devices for all using (true) with check (true);

drop policy if exists "public read readings" on public.sensor_readings;
drop policy if exists "public write readings" on public.sensor_readings;
create policy "public read readings" on public.sensor_readings for select using (true);
create policy "public write readings" on public.sensor_readings for all using (true) with check (true);

drop policy if exists "public read events" on public.events;
drop policy if exists "public write events" on public.events;
create policy "public read events" on public.events for select using (true);
create policy "public write events" on public.events for all using (true) with check (true);

drop policy if exists "public read detections" on public.event_detections;
drop policy if exists "public write detections" on public.event_detections;
create policy "public read detections" on public.event_detections for select using (true);
create policy "public write detections" on public.event_detections for all using (true) with check (true);

drop policy if exists "public read features" on public.signal_features;
drop policy if exists "public write features" on public.signal_features;
create policy "public read features" on public.signal_features for select using (true);
create policy "public write features" on public.signal_features for all using (true) with check (true);

drop policy if exists "public read classifications" on public.classifications;
drop policy if exists "public write classifications" on public.classifications;
create policy "public read classifications" on public.classifications for select using (true);
create policy "public write classifications" on public.classifications for all using (true) with check (true);

drop policy if exists "public read locations" on public.location_estimates;
drop policy if exists "public write locations" on public.location_estimates;
create policy "public read locations" on public.location_estimates for select using (true);
create policy "public write locations" on public.location_estimates for all using (true) with check (true);

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
end $$;
