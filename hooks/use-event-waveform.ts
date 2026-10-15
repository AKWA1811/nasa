'use client'

import { useEffect, useMemo, useState } from 'react'
import { generateWaveform, type DetectedEvent, type WaveformPoint } from '@/lib/seismic-data'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type { SensorReading } from '@/lib/supabase/types'

function mergeReadings(rows: SensorReading[]): WaveformPoint[] {
  const byTime = new Map<number, WaveformPoint>()
  const origin = rows[0] ? new Date(rows[0].timestamp_utc).getTime() : 0
  for (const row of rows) {
    const t = Number(((new Date(row.timestamp_utc).getTime() - origin) / 1000).toFixed(2))
    const point = byTime.get(t) ?? { t, infrasound: 0, seismic: 0 }
    if (row.sensor_type === 'infrasound') point.infrasound = row.value
    if (row.sensor_type === 'seismic') point.seismic = row.value
    byTime.set(t, point)
  }
  const series = [...byTime.values()].sort((a, b) => a.t - b.t)
  const peak = series.reduce((max, p) => Math.max(max, Math.abs(p.infrasound), Math.abs(p.seismic)), 0.001)
  const scale = peak > 1.15 ? 1.15 / peak : 1
  return series.map((p) => ({
    t: p.t,
    infrasound: Number((p.infrasound * scale).toFixed(4)),
    seismic: Number((p.seismic * scale).toFixed(4)),
  }))
}

export function useEventWaveform(event: DetectedEvent | undefined) {
  const fallback = useMemo(
    () => (event ? generateWaveform(event.type, event.seed) : []),
    [event],
  )
  const [data, setData] = useState<WaveformPoint[]>(fallback)

  useEffect(() => {
    setData(fallback)
    if (!event || !isSupabaseConfigured() || event.source !== 'live') return

    const start = new Date(new Date(event.time).getTime() - 1000).toISOString()
    const end = new Date(new Date(event.time).getTime() + Math.max(event.duration, 8) * 1000).toISOString()
    let cancelled = false

    void getSupabase()
      .from('sensor_readings')
      .select('*')
      .eq('device_id', event.station)
      .gte('timestamp_utc', start)
      .lte('timestamp_utc', end)
      .order('timestamp_utc', { ascending: true })
      .then(({ data: rows, error }) => {
        if (cancelled || error || !rows?.length) return
        const merged = mergeReadings(rows as SensorReading[])
        if (merged.length >= 8) setData(merged)
      })

    return () => {
      cancelled = true
    }
  }, [event, fallback])

  return data
}
