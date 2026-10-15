// Diagnostic: probes which tables/columns the anon (publishable) key can
// actually read, using PostgREST error messages. Run: node scripts/probe-db.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const env = {}
for (const line of readFileSync(resolve(root, '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim()
}
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
})

const tables = [
  'users_devices',
  'sensor_readings',
  'events',
  'event_detections',
  'signal_features',
  'classifications',
  'location_estimates',
  'weather_context',
  'confirmations',
  'media_observations',
  'signal_features_new',
]

for (const table of tables) {
  const { data, error } = await db.from(table).select('*').limit(1)
  if (error) {
    console.log(`\n[${table}] READ ERROR: ${error.message} (code=${error.code})`)
    continue
  }
  console.log(`\n[${table}] readable, rows sampled: ${data.length}`)
}

// Column-level probe: PostgREST reports unknown columns in `select` too.
const probes = {
  users_devices: ['device_id', 'user_id', 'device_type', 'sensor_types', 'lat', 'lon', 'altitude', 'accuracy_m', 'os', 'app_version', 'last_seen', 'device_name', 'label', 'name', 'status', 'online', 'created_at', 'updated_at', 'heartbeat_at', 'metadata'],
  sensor_readings: ['reading_id', 'device_id', 'timestamp_utc', 'sensor_type', 'value', 'unit', 'sampling_rate_hz', 'quality_flag', 'created_at', 'session_id', 'seq'],
  events: ['event_id', 'start_time_utc', 'end_time_utc', 'event_type', 'confidence', 'status', 'region', 'created_at', 'title', 'kind', 'kind_confidence', 'review_status', 'lat', 'lon', 'location', 'summary', 'notes'],
  event_detections: ['detection_id', 'event_id', 'device_id', 'arrival_time_utc', 'peak_amplitude', 'dominant_frequency_hz', 'duration_s', 'snr', 'back_azimuth_deg', 'distance_km', 'created_at'],
  signal_features: ['event_id', 'device_id', 'fft_peak_hz', 'band_energy_0_1hz', 'band_energy_1_5hz', 'band_energy_5_20hz', 'n_wave_detected', 'spectral_centroid', 'waveform_duration_s', 'created_at', 'id'],
  classifications: ['classification_id', 'event_id', 'label', 'probability', 'model_version', 'rules_triggered', 'explanation', 'created_at', 'predicted_label', 'confidence', 'kind_confidence'],
  location_estimates: ['location_id', 'event_id', 'method', 'lat', 'lon', 'altitude_km', 'radius_km', 'trajectory_start', 'trajectory_end', 'uncertainty', 'created_at', 'geom', 'bbox'],
}

for (const [table, cols] of Object.entries(probes)) {
  const ok = []
  const bad = []
  for (const col of cols) {
    const { error } = await db.from(table).select(col).limit(1)
    if (error) bad.push(col)
    else ok.push(col)
  }
  console.log(`\n[${table} columns]`)
  console.log('  OK:   ', ok.join(', '))
  console.log('  MISSING:', bad.join(', '))
}
