export type EventType = 'Meteor Candidate' | 'Earthquake' | 'Noise'
export type EventStatus = 'Pending' | 'Confirmed'

export interface DetectedEvent {
  id: string
  time: string
  type: EventType
  region: string
  status: EventStatus
  lat: number
  lon: number
  intensityPa: number
  intensityDb: number
  dominantFrequency: number
  probability: number
  duration: number
  stations: number
  station: string
  seed: number
  explanation?: string
  rulesTriggered?: string[]
  source?: 'catalog' | 'live' | 'demo'
}

export interface Sensor {
  id: string
  name: string
  kind: 'Infrasound' | 'Seismic' | 'Hybrid'
  lat: number
  lon: number
  online: boolean
  latencyMs: number
}

export function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const SENSORS: Sensor[] = [
  { id: 'IS18', name: 'Qaanaaq, Greenland', kind: 'Infrasound', lat: 77.5, lon: -69.3, online: true, latencyMs: 212 },
  { id: 'IS53', name: 'Fairbanks, Alaska', kind: 'Hybrid', lat: 64.9, lon: -147.9, online: true, latencyMs: 148 },
  { id: 'IS57', name: 'Piñon Flat, California', kind: 'Infrasound', lat: 33.6, lon: -116.5, online: true, latencyMs: 61 },
  { id: 'SKY-01', name: 'Piñon Array A', kind: 'Hybrid', lat: 33.605, lon: -116.502, online: true, latencyMs: 40 },
  { id: 'SKY-02', name: 'Piñon Array B', kind: 'Hybrid', lat: 33.621, lon: -116.481, online: true, latencyMs: 44 },
  { id: 'SKY-03', name: 'Piñon Array C', kind: 'Hybrid', lat: 33.589, lon: -116.468, online: true, latencyMs: 47 },
  { id: 'ANMO', name: 'Albuquerque, New Mexico', kind: 'Seismic', lat: 34.9, lon: -106.5, online: true, latencyMs: 54 },
  { id: 'IS59', name: 'Kona, Hawaii', kind: 'Hybrid', lat: 19.6, lon: -155.9, online: true, latencyMs: 132 },
  { id: 'IS41', name: 'Villa Florida, Paraguay', kind: 'Infrasound', lat: -26.3, lon: -57.3, online: false, latencyMs: 0 },
  { id: 'IS08', name: 'La Paz, Bolivia', kind: 'Infrasound', lat: -16.3, lon: -68.1, online: true, latencyMs: 188 },
  { id: 'IS26', name: 'Freyung, Germany', kind: 'Hybrid', lat: 48.9, lon: 13.7, online: true, latencyMs: 97 },
  { id: 'KONO', name: 'Kongsberg, Norway', kind: 'Seismic', lat: 59.6, lon: 9.6, online: true, latencyMs: 104 },
  { id: 'IS48', name: 'Kesra, Tunisia', kind: 'Infrasound', lat: 35.8, lon: 9.3, online: true, latencyMs: 121 },
  { id: 'IS32', name: 'Nairobi, Kenya', kind: 'Infrasound', lat: -1.2, lon: 36.8, online: true, latencyMs: 176 },
  { id: 'IS19', name: 'Djibouti', kind: 'Hybrid', lat: 11.3, lon: 42.8, online: true, latencyMs: 164 },
  { id: 'IS31', name: 'Aktyubinsk, Kazakhstan', kind: 'Infrasound', lat: 50.4, lon: 58.0, online: true, latencyMs: 142 },
  { id: 'IS46', name: 'Zalesovo, Russia', kind: 'Infrasound', lat: 53.9, lon: 84.8, online: false, latencyMs: 0 },
  { id: 'MAJO', name: 'Matsushiro, Japan', kind: 'Seismic', lat: 36.5, lon: 138.2, online: true, latencyMs: 89 },
  { id: 'IS30', name: 'Isumi, Japan', kind: 'Hybrid', lat: 35.3, lon: 140.3, online: true, latencyMs: 92 },
  { id: 'IS39', name: 'Palau', kind: 'Infrasound', lat: 7.5, lon: 134.5, online: true, latencyMs: 205 },
  { id: 'IS07', name: 'Warramunga, Australia', kind: 'Infrasound', lat: -19.9, lon: 134.3, online: true, latencyMs: 231 },
  { id: 'IS36', name: 'Chatham Island, NZ', kind: 'Hybrid', lat: -43.9, lon: -176.5, online: true, latencyMs: 247 },
  { id: 'IS27', name: 'Neumayer, Antarctica', kind: 'Infrasound', lat: -70.7, lon: -8.3, online: true, latencyMs: 318 },
]

export const EVENTS: DetectedEvent[] = [
  { id: 'EVT-26287-014', time: '2026-10-14T03:42:17Z', type: 'Meteor Candidate', region: 'North Atlantic', status: 'Pending', lat: 41.2, lon: -38.7, intensityPa: 2.41, intensityDb: 101.6, dominantFrequency: 0.84, probability: 92.4, duration: 46, stations: 7, station: 'IS18', seed: 14 },
  { id: 'EVT-26287-013', time: '2026-10-14T01:08:55Z', type: 'Earthquake', region: 'Honshu, Japan', status: 'Confirmed', lat: 37.8, lon: 142.1, intensityPa: 0.62, intensityDb: 89.8, dominantFrequency: 2.6, probability: 98.1, duration: 132, stations: 14, station: 'MAJO', seed: 13 },
  { id: 'EVT-26286-012', time: '2026-10-13T22:19:03Z', type: 'Noise', region: 'Bavaria, Germany', status: 'Confirmed', lat: 48.6, lon: 12.9, intensityPa: 0.11, intensityDb: 74.8, dominantFrequency: 6.9, probability: 81.7, duration: 12, stations: 2, station: 'IS26', seed: 12 },
  { id: 'EVT-26286-011', time: '2026-10-13T18:51:40Z', type: 'Meteor Candidate', region: 'Central Australia', status: 'Confirmed', lat: -23.4, lon: 131.9, intensityPa: 1.37, intensityDb: 96.7, dominantFrequency: 1.12, probability: 88.9, duration: 38, stations: 5, station: 'IS07', seed: 11 },
  { id: 'EVT-26286-010', time: '2026-10-13T14:27:12Z', type: 'Earthquake', region: 'Andes, Chile', status: 'Pending', lat: -24.1, lon: -69.3, intensityPa: 0.48, intensityDb: 87.6, dominantFrequency: 3.4, probability: 76.3, duration: 94, stations: 9, station: 'IS08', seed: 10 },
  { id: 'EVT-26286-009', time: '2026-10-13T09:03:48Z', type: 'Earthquake', region: 'Gulf of Alaska', status: 'Confirmed', lat: 57.9, lon: -150.2, intensityPa: 0.71, intensityDb: 91.0, dominantFrequency: 2.1, probability: 96.5, duration: 151, stations: 12, station: 'IS53', seed: 9 },
  { id: 'EVT-26285-008', time: '2026-10-12T23:36:21Z', type: 'Meteor Candidate', region: 'Southern Kazakhstan', status: 'Pending', lat: 44.8, lon: 66.4, intensityPa: 0.93, intensityDb: 93.3, dominantFrequency: 1.48, probability: 71.2, duration: 29, stations: 4, station: 'IS31', seed: 8 },
  { id: 'EVT-26285-007', time: '2026-10-12T17:14:09Z', type: 'Noise', region: 'Mojave Desert, USA', status: 'Confirmed', lat: 35.1, lon: -116.9, intensityPa: 0.17, intensityDb: 78.6, dominantFrequency: 8.3, probability: 85.0, duration: 9, stations: 2, station: 'IS57', seed: 7 },
  { id: 'EVT-26285-006', time: '2026-10-12T11:45:33Z', type: 'Earthquake', region: 'East African Rift', status: 'Confirmed', lat: -2.9, lon: 35.4, intensityPa: 0.39, intensityDb: 85.8, dominantFrequency: 3.9, probability: 93.7, duration: 78, stations: 8, station: 'IS32', seed: 6 },
  { id: 'EVT-26284-005', time: '2026-10-11T20:02:58Z', type: 'Meteor Candidate', region: 'South Pacific', status: 'Confirmed', lat: -31.6, lon: -162.8, intensityPa: 3.06, intensityDb: 103.7, dominantFrequency: 0.66, probability: 95.8, duration: 61, stations: 9, station: 'IS36', seed: 5 },
  { id: 'EVT-26284-004', time: '2026-10-11T06:38:16Z', type: 'Noise', region: 'Gulf of Aden', status: 'Pending', lat: 12.1, lon: 45.2, intensityPa: 0.09, intensityDb: 73.1, dominantFrequency: 5.7, probability: 63.4, duration: 15, stations: 1, station: 'IS19', seed: 4 },
  { id: 'EVT-26283-003', time: '2026-10-10T15:21:44Z', type: 'Earthquake', region: 'Big Island, Hawaii', status: 'Confirmed', lat: 19.4, lon: -155.3, intensityPa: 0.55, intensityDb: 88.8, dominantFrequency: 2.9, probability: 97.2, duration: 103, stations: 11, station: 'IS59', seed: 3 },
]

export const TYPE_TOKEN: Record<EventType, string> = {
  'Meteor Candidate': 'var(--meteor)',
  Earthquake: 'var(--quake)',
  Noise: 'var(--chart-5)',
}

export function formatUtc(iso: string) {
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)} UTC`
}

export function formatUtcTime(iso: string) {
  return iso.slice(11, 19)
}

export function projectToMap(lat: number, lon: number) {
  return { x: ((lon + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 }
}

export interface WaveformPoint {
  t: number
  infrasound: number
  seismic: number
}

export function generateWaveform(type: EventType, seed: number, samples = 360): WaveformPoint[] {
  const rand = mulberry32(seed * 7919)
  const points: WaveformPoint[] = []
  for (let i = 0; i < samples; i++) {
    const t = i / samples
    const noiseI = (rand() - 0.5) * 0.12
    const noiseS = (rand() - 0.5) * 0.1
    let infrasound = noiseI
    let seismic = noiseS

    if (type === 'Meteor Candidate') {
      const burst = Math.exp(-((t - 0.38) ** 2) / 0.004)
      infrasound += burst * Math.sin(t * 90) * 0.95
      const echo = Math.exp(-((t - 0.62) ** 2) / 0.006)
      infrasound += echo * Math.sin(t * 70) * 0.35
      seismic += Math.exp(-((t - 0.41) ** 2) / 0.002) * Math.sin(t * 160) * 0.22
    } else if (type === 'Earthquake') {
      const p = t > 0.2 ? Math.exp(-(t - 0.2) * 9) : 0
      const s = t > 0.36 ? Math.exp(-(t - 0.36) * 4) : 0
      seismic += p * Math.sin(t * 260) * 0.45 + s * Math.sin(t * 140) * 0.92
      infrasound += s * Math.sin(t * 60) * 0.3
    } else {
      const spikes = rand() > 0.97 ? (rand() - 0.5) * 0.6 : 0
      infrasound += spikes + Math.sin(t * 220) * 0.06
      seismic += Math.sin(t * 300) * 0.05 + (rand() > 0.985 ? (rand() - 0.5) * 0.4 : 0)
    }

    points.push({
      t: Number((t * 120).toFixed(2)),
      infrasound: Number(infrasound.toFixed(4)),
      seismic: Number(seismic.toFixed(4)),
    })
  }
  return points
}

export function generateSpectrogram(type: EventType, seed: number, cols = 120, rows = 48) {
  const rand = mulberry32(seed * 104729)
  const grid: number[][] = []
  for (let x = 0; x < cols; x++) {
    const column: number[] = []
    const t = x / cols
    for (let y = 0; y < rows; y++) {
      const f = y / rows
      let v = rand() * 0.18 + (1 - f) * 0.08
      if (type === 'Meteor Candidate') {
        const center = 0.38
        const sweep = 0.12 + (t - center) * -0.6
        v += Math.exp(-((t - center) ** 2) / 0.006) * Math.exp(-((f - Math.max(sweep, 0.02)) ** 2) / 0.01) * 1.1
        v += Math.exp(-((t - 0.62) ** 2) / 0.008) * Math.exp(-((f - 0.08) ** 2) / 0.006) * 0.45
      } else if (type === 'Earthquake') {
        if (t > 0.2) v += Math.exp(-(t - 0.2) * 8) * Math.exp(-((f - 0.35) ** 2) / 0.03) * 0.7
        if (t > 0.36) v += Math.exp(-(t - 0.36) * 3) * Math.exp(-((f - 0.18) ** 2) / 0.02) * 1.0
      } else {
        v += rand() > 0.96 ? rand() * 0.5 : 0
        v += Math.exp(-((f - 0.7) ** 2) / 0.002) * 0.25
      }
      column.push(Math.min(v, 1))
    }
    grid.push(column)
  }
  return grid
}
