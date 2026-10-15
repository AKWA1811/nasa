// Diagnostic: attempts the same writes the simulator performs and prints the
// raw Supabase error. Run: node scripts/diagnose-db.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
let env = {}
try {
  for (const line of readFileSync(resolve(root, '.env.local'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]] = m[2]
  }
} catch {}

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
console.log('URL:', url)
console.log('KEY present:', Boolean(key))

const db = createClient(url, key, { auth: { persistSession: false } })

// 1. Can we read?
const { data: readings, error: readErr } = await db.from('sensor_readings').select('*').limit(1)
console.log('\n[READ sensor_readings]', readErr ? `ERROR: ${readErr.message} (code=${readErr.code})` : `OK (${readings.length} rows)`)

const { data: devices, error: devErr } = await db.from('users_devices').select('*').limit(5)
console.log('[READ users_devices]', devErr ? `ERROR: ${devErr.message} (code=${devErr.code})` : `OK (${devices.length} rows)`)
if (devices?.length) console.log('  existing devices:', devices.map((d) => d.device_id).join(', '))

// 2. Try upsert device
const { error: upErr } = await db.from('users_devices').upsert(
  { device_id: 'SKY-01', lat: 33.605, lon: -116.502, last_seen: new Date().toISOString() },
  { onConflict: 'device_id' },
)
console.log('\n[UPSERT users_devices]', upErr ? `ERROR: ${upErr.message} (code=${upErr.code}, details=${upErr.details})` : 'OK')

// 3. Try insert reading
const { error: insErr } = await db.from('sensor_readings').insert({
  device_id: 'SKY-01',
  timestamp_utc: new Date().toISOString(),
  sensor_type: 'infrasound',
  value: 0.1234,
  unit: 'Pa',
  sampling_rate_hz: 8,
  quality_flag: 'good',
})
console.log('[INSERT sensor_readings]', insErr ? `ERROR: ${insErr.message} (code=${insErr.code}, details=${insErr.details})` : 'OK')

// 4. List tables the anon key can see (via PostgREST root)
const res = await fetch(`${url}/rest/v1/`, { headers: { apikey: key } })
console.log('\n[PostgREST root]', res.status)
try {
  const json = await res.json()
  console.log('  exposed tables:', Object.keys(json).join(', '))
} catch {
  console.log('  (non-JSON response)')
}
