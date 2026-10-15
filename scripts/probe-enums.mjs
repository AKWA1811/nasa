// Diagnostic: discovers enum values and minimal valid inserts for each table.
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

// 1. Enum probing: filtering on an invalid enum value returns the allowed set.
const enumProbes = [
  ['events', 'event_type'],
  ['events', 'status'],
  ['classifications', 'label'],
  ['sensor_readings', 'sensor_type'],
  ['sensor_readings', 'quality_flag'],
]
for (const [table, col] of enumProbes) {
  const { error } = await db.from(table).select(col).eq(col, '___definitely_invalid___').limit(1)
  console.log(`[enum ${table}.${col}]`, error ? `${error.code}: ${error.message}` : 'no error (maybe not an enum)')
}

// 2. device_id type probe: try inserting 'SKY-01' style id (expect uuid error if uuid)
const { error: devErr } = await db.from('users_devices').insert({ device_id: 'SKY-01', lat: 0, lon: 0 })
console.log('\n[users_devices insert SKY-01]', devErr ? `${devErr.code}: ${devErr.message}` : 'OK?!')

// 3. What does a valid-uuid device insert need? Use a fixed probe uuid then clean up.
const probeUuid = '00000000-0000-4000-8000-0000000000ff'
const { error: devErr2 } = await db.from('users_devices').insert({ device_id: probeUuid, lat: 1, lon: 2 })
console.log('[users_devices insert uuid minimal]', devErr2 ? `${devErr2.code}: ${devErr2.message}` : 'OK')

// 4. sensor_readings minimal insert with uuid device
const { error: readErr } = await db.from('sensor_readings').insert({
  device_id: probeUuid,
  timestamp_utc: new Date().toISOString(),
  sensor_type: 'infrasound',
  value: 0.1,
  unit: 'Pa',
  sampling_rate_hz: 8,
  quality_flag: 'good',
})
console.log('[sensor_readings insert uuid device]', readErr ? `${readErr.code}: ${readErr.message}` : 'OK')

// 5. events minimal insert
const { data: evt, error: evtErr } = await db
  .from('events')
  .insert({ start_time_utc: new Date().toISOString(), event_type: 'meteor_candidate', confidence: 0.5, status: 'pending', region: 'probe' })
  .select('event_id')
  .single()
console.log('[events insert meteor_candidate/pending]', evtErr ? `${evtErr.code}: ${evtErr.message}` : `OK id=${evt.event_id}`)

// 6. classifications minimal insert (if event insert worked)
if (evt) {
  const { error: clsErr } = await db.from('classifications').insert({
    event_id: evt.event_id,
    label: 'meteor',
    probability: 0.75,
    rules_triggered: ['n_wave'],
    explanation: 'probe',
  })
  console.log('[classifications insert meteor]', clsErr ? `${clsErr.code}: ${clsErr.message}` : 'OK')
}

// 7. RLS delete probe: remove rows we just created
if (evt) {
  const { error: delErr } = await db.from('events').delete().eq('event_id', evt.event_id)
  console.log('[cleanup events]', delErr ? `${delErr.code}: ${delErr.message}` : 'deleted')
}
const { error: cleanDev } = await db.from('users_devices').delete().eq('device_id', probeUuid)
console.log('[cleanup users_devices]', cleanDev ? `${cleanDev.code}: ${cleanDev.message}` : 'deleted')

// 8. Check whether classifications rows from step 6 linger (event cascade?)
const { count } = await db.from('classifications').select('*', { count: 'exact', head: true })
console.log('[classifications total count]', count)
