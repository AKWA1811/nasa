'use client'

import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { EventTypeBadge } from './event-badges'
import { SensorMap } from './sensor-map'
import { type DetectedEvent, SENSORS, formatUtc } from '@/lib/seismic-data'

interface MapViewProps {
  events: DetectedEvent[]
  selectedId: string
  onSelect: (id: string) => void
  onInspect: (id: string) => void
}

export function MapView({ events, selectedId, onSelect, onInspect }: MapViewProps) {
  const [showSensors, setShowSensors] = useState(true)
  const [showEvents, setShowEvents] = useState(true)
  const selected = events.find((e) => e.id === selectedId) ?? events[0]
  const nearest = selected
    ? SENSORS.filter((s) => s.online)
        .map((s) => ({ ...s, d: Math.hypot(s.lat - selected.lat, s.lon - selected.lon) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 4)
    : []

  return (
    <div className="grid gap-4 md:gap-6 xl:grid-cols-[1fr_300px]">
      <Card>
        <CardHeader>
          <CardTitle>Interactive Map</CardTitle>
          <CardDescription>Select a detection marker to inspect its source region and contributing stations</CardDescription>
        </CardHeader>
        <CardContent>
          <SensorMap
            sensors={SENSORS}
            events={events}
            selectedEventId={selected?.id}
            onSelectEvent={onSelect}
            showSensors={showSensors}
            showEvents={showEvents}
          />
        </CardContent>
        <CardFooter className="flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={showSensors} onCheckedChange={setShowSensors} />
            Sensor stations
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={showEvents} onCheckedChange={setShowEvents} />
            Detections
          </label>
        </CardFooter>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardDescription className="font-mono text-xs tracking-widest">{selected?.id ?? '—'}</CardDescription>
          <CardTitle>{selected?.region ?? 'No live events yet'}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {selected ? (
            <EventTypeBadge type={selected.type} className="self-start" />
          ) : (
            <p className="text-sm text-muted-foreground">The pipeline has not written an event yet.</p>
          )}
          <dl className="grid grid-cols-2 gap-2 font-mono text-xs">
            <dt className="text-muted-foreground">Origin</dt>
            <dd className="text-right">{selected ? formatUtc(selected.time) : '—'}</dd>
            <dt className="text-muted-foreground">Lat / Lon</dt>
            <dd className="text-right">
              {selected ? `${selected.lat.toFixed(2)}°, ${selected.lon.toFixed(2)}°` : '—'}
            </dd>
            <dt className="text-muted-foreground">Probability</dt>
            <dd className="text-right">{selected ? `${selected.probability.toFixed(1)}%` : '—'}</dd>
            <dt className="text-muted-foreground">Dominant f</dt>
            <dd className="text-right">{selected ? `${selected.dominantFrequency.toFixed(2)} Hz` : '—'}</dd>
          </dl>
          <Separator />
          <div className="flex flex-col gap-2">
            <h2 className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
              Nearest Stations
            </h2>
            <ul className="flex flex-col gap-2">
              {nearest.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="font-mono text-primary">{s.id}</span>
                    <span className="truncate text-muted-foreground">{s.name}</span>
                  </span>
                  <span className="font-mono text-muted-foreground">{s.latencyMs}ms</span>
                </li>
              ))}
            </ul>
          </div>
          <Button variant="outline" size="sm" disabled={!selected} onClick={() => selected && onInspect(selected.id)}>
            Open in Event Dashboard
            <ArrowUpRight data-icon="inline-end" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
