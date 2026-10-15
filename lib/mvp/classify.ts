import type { ClassificationLabel, DbEventType } from '@/lib/supabase/types'
import { INFRA_THRESHOLD, SEISMIC_THRESHOLD } from './signal'

export interface DeviceSnapshot {
  deviceId: string
  lat: number
  lon: number
  infra: number[]
  seismic: number[]
  sampleRate: number
  startIso: string
  infraPeak: number
  seismicPeak: number
  snr: number
  dominantFrequency: number
  spectralCentroid: number
  bandEnergy01: number
  bandEnergy15: number
  bandEnergy520: number
  durationS: number
  nWave: boolean
  pThenS: boolean
  arrivalIndex: number
  fftPeakHz: number
}

export interface ClassificationResult {
  eventType: DbEventType
  label: ClassificationLabel
  confidence: number
  rulesTriggered: string[]
  explanation: string
}

export function contributingDevices(devices: DeviceSnapshot[]) {
  return devices.filter((d) => d.infraPeak >= INFRA_THRESHOLD || d.seismicPeak >= SEISMIC_THRESHOLD)
}

export function apparentSpeedKms(devices: DeviceSnapshot[]) {
  const arrivals = contributingDevices(devices)
    .map((d) => ({
      d,
      t: new Date(d.startIso).getTime() + (d.arrivalIndex / Math.max(d.sampleRate, 1)) * 1000,
    }))
    .sort((a, b) => a.t - b.t)
  if (arrivals.length < 2) return null
  const a = arrivals[0]
  const b = arrivals[1]
  const dt = (b.t - a.t) / 1000
  if (dt <= 0.05) return null
  const dist = Math.hypot((a.d.lat - b.d.lat) * 111, (a.d.lon - b.d.lon) * 91)
  return dist / dt
}

export function classifyCandidate(devices: DeviceSnapshot[]): ClassificationResult | null {
  const hits = contributingDevices(devices)
  if (!hits.length) return null

  const rules: string[] = []
  const maxInfra = Math.max(...hits.map((d) => d.infraPeak))
  const maxSeismic = Math.max(...hits.map((d) => d.seismicPeak))
  const nWave = hits.some((d) => d.nWave)
  const pThenS = hits.some((d) => d.pThenS)
  const lowFreq = hits.some((d) => d.dominantFrequency > 0 && d.dominantFrequency < 2)
  const highFreq = hits.every((d) => d.spectralCentroid > 2.8)
  const shortPulse = hits.every((d) => d.durationS > 0 && d.durationS < 8)
  const delayedGround = hits.some((d) => d.arrivalIndex > 0 && d.seismicPeak > 0.08 && d.seismicPeak < maxInfra * 0.7)
  const multi = hits.length >= 2
  const speed = apparentSpeedKms(devices)
  const fast = speed !== null && speed > 1.2
  const atmospheric = speed !== null && speed < 0.8

  if (nWave) rules.push('n_wave')
  if (pThenS) rules.push('p_then_s')
  if (lowFreq) rules.push('low_frequency_energy')
  if (shortPulse) rules.push('short_pulse')
  if (delayedGround) rules.push('delayed_ground_coupling')
  if (multi) rules.push('multi_sensor')
  else rules.push('single_sensor')
  if (fast) rules.push('fast_apparent_speed')
  if (atmospheric) rules.push('atmospheric_apparent_speed')

  if (nWave && delayedGround && multi && !pThenS) {
    rules.push('meteor_rule_table')
    return {
      eventType: 'meteor_candidate',
      label: 'meteor',
      confidence: clamp(0.72 + (maxInfra > 1 ? 0.12 : 0) + (lowFreq ? 0.06 : 0), 0.55, 0.96),
      rulesTriggered: rules,
      explanation:
        'Strong infrasound with an N-wave shock signature, weaker delayed ground coupling, and no clear P/S pair across multiple stations — meteor / fireball candidate.',
    }
  }

  if (pThenS && (fast || multi) && !nWave) {
    rules.push('earthquake_rule_table')
    return {
      eventType: 'earthquake_candidate',
      label: 'earthquake',
      confidence: clamp(0.74 + (fast ? 0.1 : 0.04) + (maxSeismic > 0.6 ? 0.08 : 0), 0.55, 0.97),
      rulesTriggered: rules,
      explanation:
        'Seismic channel shows a P-wave then S-wave sequence with fast apparent propagation across stations — earthquake candidate. Not a prediction; this is a detection.',
    }
  }

  if (!multi || (highFreq && maxInfra < 0.7)) {
    rules.push('noise_rule_table')
    return {
      eventType: 'noise',
      label: hits.length === 1 ? 'construction' : 'noise',
      confidence: clamp(0.58 + (highFreq ? 0.12 : 0), 0.45, 0.86),
      rulesTriggered: rules,
      explanation: !multi
        ? 'Signal exceeded threshold on a single device only. Treat as noise or construction until another station confirms.'
        : 'Frequency content and spatial pattern do not match a propagating airburst or earthquake. Flagged as noise; needs review.',
    }
  }

  rules.push('needs_review')
  return {
    eventType: maxInfra >= maxSeismic ? 'meteor_candidate' : 'earthquake_candidate',
    label: maxInfra >= maxSeismic ? 'meteor' : 'earthquake',
    confidence: 0.48,
    rulesTriggered: rules,
    explanation:
      'Ambiguous dual-channel detection. Preliminary label assigned from dominant channel; confidence is low and the event needs human review.',
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}
