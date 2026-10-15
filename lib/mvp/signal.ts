export const INFRA_THRESHOLD = 0.35
export const SEISMIC_THRESHOLD = 0.28
export const MVP_THRESHOLDS = { INFRA_THRESHOLD, SEISMIC_THRESHOLD }

export interface ChannelFeatures {
  peak: number
  rms: number
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
}

const SAMPLE_RATE = 8

export function peakAmplitude(samples: number[]) {
  return samples.reduce((max, v) => Math.max(max, Math.abs(v)), 0)
}

export function rms(samples: number[]) {
  if (!samples.length) return 0
  return Math.sqrt(samples.reduce((sum, v) => sum + v * v, 0) / samples.length)
}

export function snrDb(samples: number[]) {
  if (samples.length < 8) return 0
  const noise = rms(samples.slice(0, Math.max(4, Math.floor(samples.length * 0.2))))
  const signal = peakAmplitude(samples)
  if (noise < 1e-6) return signal > 0.05 ? 40 : 0
  return 20 * Math.log10(signal / noise)
}

function dftPower(samples: number[], bin: number) {
  const n = samples.length
  let re = 0
  let im = 0
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * bin * i) / n
    re += samples[i] * Math.cos(angle)
    im -= samples[i] * Math.sin(angle)
  }
  return re * re + im * im
}

export function spectralBands(samples: number[], sampleRate = SAMPLE_RATE) {
  const n = samples.length
  const nyquist = sampleRate / 2
  let peakBin = 1
  let peakPow = 0
  let weighted = 0
  let total = 0
  let e01 = 0
  let e15 = 0
  let e520 = 0

  for (let bin = 1; bin < n / 2; bin++) {
    const freq = (bin * sampleRate) / n
    if (freq > nyquist) break
    const p = dftPower(samples, bin)
    total += p
    weighted += p * freq
    if (p > peakPow) {
      peakPow = p
      peakBin = bin
    }
    if (freq <= 1) e01 += p
    else if (freq <= 5) e15 += p
    else e520 += p
  }

  return {
    dominantFrequency: (peakBin * sampleRate) / n,
    spectralCentroid: total > 0 ? weighted / total : 0,
    bandEnergy01: total > 0 ? e01 / total : 0,
    bandEnergy15: total > 0 ? e15 / total : 0,
    bandEnergy520: total > 0 ? e520 / total : 0,
  }
}

export function detectNWave(samples: number[], threshold: number) {
  const peakIdx = samples.reduce((best, v, i) => (v > samples[best] ? i : best), 0)
  const troughIdx = samples.reduce((best, v, i) => (v < samples[best] ? i : best), 0)
  const peak = samples[peakIdx]
  const trough = samples[troughIdx]
  const short = Math.abs(troughIdx - peakIdx) <= Math.max(4, samples.length * 0.25)
  return peak > threshold && trough < -threshold * 0.45 && troughIdx > peakIdx && short
}

export function detectPThenS(samples: number[], threshold: number) {
  const env = samples.map((v) => Math.abs(v))
  const minSep = Math.max(3, Math.floor(samples.length * 0.12))
  let first = -1
  let second = -1
  let firstVal = 0
  let secondVal = 0
  for (let i = 1; i < env.length - 1; i++) {
    if (env[i] >= env[i - 1] && env[i] >= env[i + 1] && env[i] > threshold) {
      if (first < 0) {
        first = i
        firstVal = env[i]
      } else if (i - first >= minSep && env[i] > secondVal) {
        second = i
        secondVal = env[i]
      }
    }
  }
  return first >= 0 && second > first && secondVal >= firstVal * 0.7
}

export function arrivalIndex(samples: number[], threshold: number) {
  const idx = samples.findIndex((v) => Math.abs(v) >= threshold)
  return idx < 0 ? 0 : idx
}

export function pulseDurationS(samples: number[], threshold: number, sampleRate = SAMPLE_RATE) {
  const above = samples
    .map((v, i) => (Math.abs(v) >= threshold * 0.35 ? i : -1))
    .filter((i) => i >= 0)
  if (!above.length) return 0
  return (above[above.length - 1] - above[0] + 1) / sampleRate
}

export function extractChannelFeatures(samples: number[], threshold: number, sampleRate = SAMPLE_RATE): ChannelFeatures {
  const spec = spectralBands(samples, sampleRate)
  return {
    peak: peakAmplitude(samples),
    rms: rms(samples),
    snr: snrDb(samples),
    ...spec,
    durationS: pulseDurationS(samples, threshold, sampleRate),
    nWave: detectNWave(samples, threshold),
    pThenS: detectPThenS(samples, threshold * 0.6),
    arrivalIndex: arrivalIndex(samples, threshold),
  }
}

export function toPaDb(peakPa: number) {
  return 20 * Math.log10(Math.max(peakPa, 1e-6) / 2e-5)
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = 6371
  const p1 = (lat1 * Math.PI) / 180
  const p2 = (lat2 * Math.PI) / 180
  const dp = ((lat2 - lat1) * Math.PI) / 180
  const dl = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  return 2 * r * Math.asin(Math.sqrt(a))
}
