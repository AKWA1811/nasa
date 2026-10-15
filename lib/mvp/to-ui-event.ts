import type { DetectedEvent, EventStatus, EventType } from '@/lib/seismic-data'
import type { DbEventStatus, DbEventType, EventWithRelations } from '@/lib/supabase/types'
import { DEMO_CENTER } from './devices'
import { toPaDb } from './signal'

const TYPE_MAP: Record<DbEventType, EventType> = {
  meteor_candidate: 'Meteor Candidate',
  earthquake_candidate: 'Earthquake',
  noise: 'Noise',
}

const STATUS_MAP: Record<DbEventStatus, EventStatus> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  rejected: 'Pending',
}

function first<T>(value: T[] | T | null | undefined): T | undefined {
  if (!value) return undefined
  return Array.isArray(value) ? value[0] : value
}

function hashSeed(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return (h % 9000) + 100
}

export function toUiEvent(row: EventWithRelations): DetectedEvent {
  const classification = first(row.classifications)
  const location = first(row.location_estimates)
  const detections = Array.isArray(row.event_detections) ? row.event_detections : row.event_detections ? [row.event_detections] : []
  const features = Array.isArray(row.signal_features) ? row.signal_features : row.signal_features ? [row.signal_features] : []
  const primary = detections[0]
  const feature = features[0]
  const peak = primary?.peak_amplitude ?? row.confidence
  const probabilityPct = classification
    ? classification.probability <= 1
      ? classification.probability * 100
      : classification.probability
    : row.confidence * 100

  return {
    id: row.event_id,
    time: row.start_time_utc,
    type: TYPE_MAP[row.event_type] ?? 'Noise',
    region: row.region ?? 'Unknown region',
    status: STATUS_MAP[row.status] ?? 'Pending',
    lat: location?.lat ?? DEMO_CENTER.lat,
    lon: location?.lon ?? DEMO_CENTER.lon,
    intensityPa: Number(peak.toFixed(2)),
    intensityDb: Number(toPaDb(peak).toFixed(1)),
    dominantFrequency: Number((feature?.fft_peak_hz ?? primary?.dominant_frequency_hz ?? 0).toFixed(2)),
    probability: Number(probabilityPct.toFixed(1)),
    duration: Math.round(primary?.duration_s ?? feature?.waveform_duration_s ?? 0),
    stations: Math.max(detections.length, 1),
    station: primary?.device_id ?? 'SKY-01',
    seed: hashSeed(row.event_id),
    explanation: classification?.explanation,
    rulesTriggered: classification?.rules_triggered ?? [],
    source: 'live',
  }
}
