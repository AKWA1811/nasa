'use client'

import { useEffect, useState } from 'react'
import { mockSensorsEnabled, startMockSensorStream, type SimScenario } from '@/lib/mvp/mock-sensor-stream'
import { startMvpPipeline } from '@/lib/mvp/pipeline'
import { isSupabaseConfigured } from '@/lib/supabase/client'

export function useSensorPipeline() {
  const [lastScenario, setLastScenario] = useState<SimScenario | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const stops: Array<() => void> = []
    try {
      stops.push(startMvpPipeline())
      if (mockSensorsEnabled()) {
        stops.push(startMockSensorStream((scenario) => setLastScenario(scenario)))
      }
      setRunning(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start sensor pipeline')
    }
    return () => {
      stops.forEach((stop) => stop())
      setRunning(false)
    }
  }, [])

  return { running, lastScenario, error }
}
