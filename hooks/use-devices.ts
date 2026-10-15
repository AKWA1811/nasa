'use client'

import { useEffect, useState } from 'react'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type { UsersDevice } from '@/lib/supabase/types'

// The live `users_devices` table has no `last_seen` column, so a device counts
// as online when it produced a `sensor_readings` row inside this window.
const ONLINE_WINDOW_MS = 90_000

export function useDevices() {
  const [devices, setDevices] = useState<UsersDevice[]>([])
  const [activeIds, setActiveIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const supabase = getSupabase()
    let cancelled = false
    let debounce: ReturnType<typeof setTimeout> | null = null

    const load = async () => {
      const since = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString()
      const [deviceResult, readingResult] = await Promise.all([
        supabase.from('users_devices').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('sensor_readings').select('device_id').gte('timestamp_utc', since).limit(1000),
      ])
      if (cancelled) return
      if (!deviceResult.error && deviceResult.data) setDevices(deviceResult.data as UsersDevice[])
      if (!readingResult.error && readingResult.data) {
        setActiveIds(new Set((readingResult.data as { device_id: string }[]).map((r) => r.device_id)))
      }
    }

    const scheduleLoad = () => {
      if (debounce) clearTimeout(debounce)
      debounce = setTimeout(() => void load(), 2000)
    }

    void load()

    const channel = supabase
      .channel('mvp-devices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users_devices' }, scheduleLoad)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_readings' }, scheduleLoad)
      .subscribe()

    const poll = setInterval(() => void load(), 15_000)

    return () => {
      cancelled = true
      if (debounce) clearTimeout(debounce)
      clearInterval(poll)
      void supabase.removeChannel(channel)
    }
  }, [])

  return {
    devices,
    onlineCount: devices.filter((d) => activeIds.has(d.device_id)).length,
  }
}
