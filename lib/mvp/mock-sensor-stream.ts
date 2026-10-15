import { DEMO_DEVICES } from './devices'
import { getSupabase } from '@/lib/supabase/client'
import type { SensorReading, UsersDevice } from '@/lib/supabase/types'

export type SimScenario = 'idle' | 'meteor' | 'earthquake' | 'noise'

const SAMPLE_RATE = 8
const SAMPLES = 32

const DEVICE_META: Array<Pick<UsersDevice, 'device_type' | 'sensor_types' | 'os' | 'app_version'>> = [
  { device_type: 'Raspberry Pi 5', sensor_types: ['microphone', 'barometer', 'accelerometer', 'GPS'], os: 'Raspberry Pi OS', app_version: '0.3.0' },
  { device_type: 'Raspberry Pi 5', sensor_types: ['microphone', 'accelerometer', 'GPS'], os: 'Raspberry Pi OS', app_version: '0.3.0' },
  { device_type: 'Smartphone', sensor_types: ['microphone', 'accelerometer', 'GPS'], os: 'Android 15', app_version: '0.3.0' },
]

/**
 * Upserts the three demo stations into `users_devices` and refreshes
 * `last_seen`, so the Overview panel can count connected sensors live.
 */
export async function registerDemoDevices() {
  const supabase = getSupabase()
  const now = new Date().toISOString()
  const rows = DEMO_DEVICES.map((device, i) => ({
    device_id: device.device_id,
    user_id: null,
    lat: device.lat,
    lon: device.lon,
    altitude: 1200 + i * 35,
    accuracy_m: 12,
    last_seen: now,
    ...DEVICE_META[i % DEVICE_META.length],
  }))
  const { error } = await supabase.from('users_devices').upsert(rows, { onConflict: 'device_id' })
  if (error) throw error
}

function pickScenario(): SimScenario {
  const r = Math.random()
  if (r < 0.55) return 'idle'
  if (r < 0.7) return 'meteor'
  if (r < 0.85) return 'earthquake'
  return 'noise'
}

function sampleAt(i: number, n: number, scenario: SimScenario, delay: number, deviceIndex: number) {
  const t = (i - delay) / n
  const noiseI = (Math.random() - 0.5) * 0.08
  const noiseS = (Math.random() - 0.5) * 0.06
  if (t < 0 || t > 1 || scenario === 'idle') {
    return { infrasound: noiseI, seismic: noiseS }
  }
  if (scenario === 'meteor') {
    const burst = Math.exp(-((t - 0.38) ** 2) / 0.004)
    const echo = Math.exp(-((t - 0.62) ** 2) / 0.006)
    return {
      infrasound: noiseI + burst * Math.sin(t * 90) * 1.15 + echo * Math.sin(t * 70) * 0.4,
      seismic: noiseS + Math.exp(-((t - 0.46) ** 2) / 0.003) * Math.sin(t * 140) * 0.22,
    }
  }
  if (scenario === 'earthquake') {
    const p = t > 0.18 ? Math.exp(-(t - 0.18) * 9) : 0
    const s = t > 0.34 ? Math.exp(-(t - 0.34) * 4) : 0
    return {
      infrasound: noiseI + s * Math.sin(t * 50) * 0.22,
      seismic: noiseS + p * Math.sin(t * 220) * 0.5 + s * Math.sin(t * 120) * 0.95,
    }
  }
  const local = deviceIndex !== 1 ? { infrasound: noiseI, seismic: noiseS } : null
  if (local) return local
  const spikes = Math.random() > 0.9 ? (Math.random() - 0.5) * 0.7 : 0
  return {
    infrasound: noiseI + spikes + Math.sin(t * 180) * 0.12,
    seismic: noiseS + Math.sin(t * 240) * 0.1 + (Math.random() > 0.92 ? (Math.random() - 0.5) * 0.45 : 0),
  }
}

function delaysFor(scenario: SimScenario) {
  if (scenario === 'meteor') return [0, 6, 14]
  if (scenario === 'earthquake') return [0, 2, 4]
  return [0, 0, 0]
}

export async function insertMockSensorChunk(scenario: SimScenario = pickScenario()) {
  const supabase = getSupabase()
  await registerDemoDevices()
  const origin = Date.now()
  const delays = delaysFor(scenario)
  const rows: Omit<SensorReading, 'reading_id'>[] = []

  DEMO_DEVICES.forEach((device, deviceIndex) => {
    if (scenario === 'noise' && deviceIndex !== 1) {
      for (let i = 0; i < SAMPLES; i++) {
        const ts = new Date(origin + (i / SAMPLE_RATE) * 1000).toISOString()
        rows.push(
          {
            device_id: device.device_id,
            timestamp_utc: ts,
            sensor_type: 'infrasound',
            value: (Math.random() - 0.5) * 0.08,
            unit: 'Pa',
            sampling_rate_hz: SAMPLE_RATE,
            quality_flag: 'good',
          },
          {
            device_id: device.device_id,
            timestamp_utc: ts,
            sensor_type: 'seismic',
            value: (Math.random() - 0.5) * 0.06,
            unit: 'm/s2',
            sampling_rate_hz: SAMPLE_RATE,
            quality_flag: 'good',
          },
        )
      }
      return
    }

    for (let i = 0; i < SAMPLES; i++) {
      const { infrasound, seismic } = sampleAt(i, SAMPLES, scenario, delays[deviceIndex] ?? 0, deviceIndex)
      const ts = new Date(origin + (i / SAMPLE_RATE) * 1000).toISOString()
      rows.push(
        {
          device_id: device.device_id,
          timestamp_utc: ts,
          sensor_type: 'infrasound',
          value: Number(infrasound.toFixed(4)),
          unit: 'Pa',
          sampling_rate_hz: SAMPLE_RATE,
          quality_flag: 'good',
        },
        {
          device_id: device.device_id,
          timestamp_utc: ts,
          sensor_type: 'seismic',
          value: Number(seismic.toFixed(4)),
          unit: 'm/s2',
          sampling_rate_hz: SAMPLE_RATE,
          quality_flag: 'good',
        },
      )
    }
  })

  const { error } = await supabase.from('sensor_readings').insert(rows)
  if (error) throw error
  return scenario
}

export function startMockSensorStream(onTick?: (scenario: SimScenario) => void) {
  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | null = null

  const loop = async () => {
    if (cancelled) return
    try {
      const scenario = await insertMockSensorChunk()
      onTick?.(scenario)
    } catch (err) {
      console.error('[mock-sensor-stream]', err)
    }
    if (cancelled) return
    const wait = 5000 + Math.random() * 5000
    timer = setTimeout(loop, wait)
  }

  void loop()

  return () => {
    cancelled = true
    if (timer) clearTimeout(timer)
  }
}

export function mockSensorsEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_MOCK_SENSORS !== 'false'
}
