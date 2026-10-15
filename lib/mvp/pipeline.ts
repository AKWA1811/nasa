import { DEMO_DEVICES, DEMO_REGION } from './devices'
import { classifyCandidate, contributingDevices, type DeviceSnapshot } from './classify'
import { extractChannelFeatures, haversineKm, MVP_THRESHOLDS } from './signal'
import { getSupabase } from '@/lib/supabase/client'
import type { SensorReading } from '@/lib/supabase/types'

const WINDOW_MS = 20_000
const COOLDOWN_MS = 18_000
const MODEL_VERSION = 'mvp-rules-v1'

let lastEventAt = 0
let analyzing = false

function deviceMeta(id: string) {
  return DEMO_DEVICES.find((d) => d.device_id === id) ?? { device_id: id, lat: 33.6, lon: -116.49 }
}

function groupReadings(rows: SensorReading[]) {
  const byDevice = new Map<string, { infra: SensorReading[]; seismic: SensorReading[] }>()
  for (const row of rows) {
    const bucket = byDevice.get(row.device_id) ?? { infra: [], seismic: [] }
    if (row.sensor_type === 'infrasound') bucket.infra.push(row)
    if (row.sensor_type === 'seismic') bucket.seismic.push(row)
    byDevice.set(row.device_id, bucket)
  }
  for (const bucket of byDevice.values()) {
    bucket.infra.sort((a, b) => a.timestamp_utc.localeCompare(b.timestamp_utc))
    bucket.seismic.sort((a, b) => a.timestamp_utc.localeCompare(b.timestamp_utc))
  }
  return byDevice
}

function snapshotsFrom(rows: SensorReading[]): DeviceSnapshot[] {
  const grouped = groupReadings(rows)
  const snapshots: DeviceSnapshot[] = []
  for (const [deviceId, channels] of grouped) {
    if (channels.infra.length < 8) continue
    const sampleRate = channels.infra[0]?.sampling_rate_hz || 8
    const infraVals = channels.infra.map((r) => r.value)
    const seismicVals = channels.seismic.map((r) => r.value)
    const infra = extractChannelFeatures(infraVals, MVP_THRESHOLDS.INFRA_THRESHOLD, sampleRate)
    const seismic = extractChannelFeatures(seismicVals, MVP_THRESHOLDS.SEISMIC_THRESHOLD, sampleRate)
    const meta = deviceMeta(deviceId)
    snapshots.push({
      deviceId,
      lat: meta.lat,
      lon: meta.lon,
      infra: infraVals,
      seismic: seismicVals,
      sampleRate,
      startIso: channels.infra[0].timestamp_utc,
      infraPeak: infra.peak,
      seismicPeak: seismic.peak,
      snr: Math.max(infra.snr, seismic.snr),
      dominantFrequency: infra.dominantFrequency || seismic.dominantFrequency,
      spectralCentroid: infra.spectralCentroid,
      bandEnergy01: infra.bandEnergy01,
      bandEnergy15: infra.bandEnergy15,
      bandEnergy520: infra.bandEnergy520,
      durationS: Math.max(infra.durationS, seismic.durationS),
      nWave: infra.nWave,
      pThenS: seismic.pThenS,
      arrivalIndex: infra.peak >= MVP_THRESHOLDS.INFRA_THRESHOLD ? infra.arrivalIndex : seismic.arrivalIndex,
      fftPeakHz: infra.dominantFrequency || seismic.dominantFrequency,
    })
  }
  return snapshots
}

export async function analyzeLatestReadings() {
  if (analyzing) return null
  if (Date.now() - lastEventAt < COOLDOWN_MS) return null
  analyzing = true
  try {
    const supabase = getSupabase()
    const since = new Date(Date.now() - WINDOW_MS).toISOString()
    const { data, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .gte('timestamp_utc', since)
      .order('timestamp_utc', { ascending: true })
      .limit(2000)

    if (error) throw error
    const snapshots = snapshotsFrom((data ?? []) as SensorReading[])
    const verdict = classifyCandidate(snapshots)
    if (!verdict) return null

    const hits = contributingDevices(snapshots)
    const start = hits.reduce(
      (min, d) => (d.startIso < min ? d.startIso : min),
      hits[0]?.startIso ?? new Date().toISOString(),
    )
    const end = new Date(new Date(start).getTime() + Math.max(...hits.map((d) => d.durationS)) * 1000).toISOString()
    const lat = hits.reduce((s, d) => s + d.lat, 0) / hits.length
    const lon = hits.reduce((s, d) => s + d.lon, 0) / hits.length
    const primary = hits.slice().sort((a, b) => b.infraPeak + b.seismicPeak - (a.infraPeak + a.seismicPeak))[0]

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        start_time_utc: start,
        end_time_utc: end,
        event_type: verdict.eventType,
        confidence: verdict.confidence,
        status: 'pending',
        region: DEMO_REGION,
      })
      .select('*')
      .single()

    if (eventError) throw eventError
    lastEventAt = Date.now()
    const eventId = event.event_id

    const detections = hits.map((d) => ({
      event_id: eventId,
      device_id: d.deviceId,
      arrival_time_utc: new Date(new Date(d.startIso).getTime() + (d.arrivalIndex / d.sampleRate) * 1000).toISOString(),
      peak_amplitude: Number(Math.max(d.infraPeak, d.seismicPeak).toFixed(4)),
      dominant_frequency_hz: Number(d.dominantFrequency.toFixed(3)),
      duration_s: Number(d.durationS.toFixed(2)),
      snr: Number(d.snr.toFixed(2)),
      back_azimuth_deg: null,
      distance_km: Number(haversineKm(lat, lon, d.lat, d.lon).toFixed(2)),
    }))

    const features = hits.map((d) => ({
      event_id: eventId,
      device_id: d.deviceId,
      fft_peak_hz: Number(d.fftPeakHz.toFixed(3)),
      band_energy_0_1hz: Number(d.bandEnergy01.toFixed(4)),
      band_energy_1_5hz: Number(d.bandEnergy15.toFixed(4)),
      band_energy_5_20hz: Number(d.bandEnergy520.toFixed(4)),
      n_wave_detected: d.nWave,
      spectral_centroid: Number(d.spectralCentroid.toFixed(3)),
      waveform_duration_s: Number(d.durationS.toFixed(2)),
    }))

    const writes = await Promise.all([
      supabase.from('event_detections').insert(detections),
      supabase.from('signal_features').insert(features),
      supabase.from('classifications').insert({
        event_id: eventId,
        label: verdict.label,
        probability: verdict.confidence,
        model_version: MODEL_VERSION,
        rules_triggered: verdict.rulesTriggered,
        explanation: verdict.explanation,
      }),
      supabase.from('location_estimates').insert({
        event_id: eventId,
        method: 'arrival-time',
        lat,
        lon,
        altitude_km: verdict.eventType === 'meteor_candidate' ? 25 : 0,
        radius_km: hits.length >= 3 ? 18 : 45,
        trajectory_start: null,
        trajectory_end: null,
        uncertainty: { note: 'MVP centroid of contributing stations' },
      }),
    ])

    const writeError = writes.find((w) => w.error)?.error
    if (writeError) throw writeError

    return { eventId, verdict, station: primary?.deviceId }
  } finally {
    analyzing = false
  }
}

export function startMvpPipeline() {
  const supabase = getSupabase()
  let debounce: ReturnType<typeof setTimeout> | null = null

  const channel = supabase
    .channel('mvp-sensor-readings')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
      () => {
        if (debounce) clearTimeout(debounce)
        debounce = setTimeout(() => {
          void analyzeLatestReadings().catch((err) => console.error('[mvp-pipeline]', err))
        }, 900)
      },
    )
    .subscribe()

  const poll = setInterval(() => {
    void analyzeLatestReadings().catch((err) => console.error('[mvp-pipeline]', err))
  }, 8000)

  return () => {
    if (debounce) clearTimeout(debounce)
    clearInterval(poll)
    void supabase.removeChannel(channel)
  }
}
