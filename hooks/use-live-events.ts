'use client'

import { useEffect, useState } from 'react'
import { toUiEvent } from '@/lib/mvp/to-ui-event'
import type { DetectedEvent } from '@/lib/seismic-data'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type { EventWithRelations } from '@/lib/supabase/types'

const EVENT_SELECT = `
  *,
  classifications (*),
  location_estimates (*),
  event_detections (*),
  signal_features (*)
`

export function useLiveEvents() {
  const [events, setEvents] = useState<DetectedEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured')
      return
    }

    const supabase = getSupabase()
    let cancelled = false

    const load = async () => {
      const { data, error: queryError } = await supabase
        .from('events')
        .select(EVENT_SELECT)
        .order('start_time_utc', { ascending: false })
        .limit(40)

      if (cancelled) return
      if (queryError) {
        setError(queryError.message)
        setConnected(false)
        return
      }
      setError(null)
      setConnected(true)
      setEvents(((data ?? []) as EventWithRelations[]).map(toUiEvent))
    }

    void load()

    const channel = supabase
      .channel('mvp-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        void load()
      })
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [])

  return { events, connected, error }
}
