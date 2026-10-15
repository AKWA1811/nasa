import type { UsersDevice } from '@/lib/supabase/types'

// `users_devices.device_id` is a UUID column in the live database, so the demo
// stations use fixed v4-shaped UUIDs. `label` keeps the friendly SKY-0x names
// for the UI (see deviceLabel()).
export const DEMO_DEVICES: Array<Pick<UsersDevice, 'device_id' | 'lat' | 'lon'> & { label: string }> = [
  { device_id: 'b7a1c0de-0000-4000-8000-000000000001', label: 'SKY-01', lat: 33.605, lon: -116.502 },
  { device_id: 'b7a1c0de-0000-4000-8000-000000000002', label: 'SKY-02', lat: 33.621, lon: -116.481 },
  { device_id: 'b7a1c0de-0000-4000-8000-000000000003', label: 'SKY-03', lat: 33.589, lon: -116.468 },
]

export const DEMO_REGION = 'Piñon Flat experimental array, California'

// All demo stations sit around Piñon Flat; live events have no
// `location_estimates` row in the current schema, so this centroid is the
// event-position fallback.
export const DEMO_CENTER = { lat: 33.605, lon: -116.484 }

export function deviceLabel(id: string) {
  const known = DEMO_DEVICES.find((d) => d.device_id === id)
  if (known) return known.label
  return id.startsWith('b7a1c0de') ? id.slice(-4) : id.slice(0, 8)
}
