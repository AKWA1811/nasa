'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  type DetectedEvent,
  type Sensor,
  TYPE_TOKEN,
  projectToMap,
} from '@/lib/seismic-data'

interface SensorMapProps {
  sensors: Sensor[]
  events: DetectedEvent[]
  selectedEventId?: string
  onSelectEvent?: (id: string) => void
  showSensors?: boolean
  showEvents?: boolean
  className?: string
}

export function SensorMap({
  sensors,
  events,
  selectedEventId,
  onSelectEvent,
  showSensors = true,
  showEvents = true,
  className,
}: SensorMapProps) {
  return (
    <div
      className={cn(
        'relative aspect-[2/1] w-full overflow-hidden rounded-md border bg-background',
        className,
      )}
    >
      <Image
        src="/images/world-dots.png"
        alt=""
        fill
        sizes="(min-width: 1024px) 66vw, 100vw"
        className="object-fill opacity-50"
        priority
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:8.333%_16.666%]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/3 animate-[scan_6s_linear_infinite] bg-gradient-to-b from-transparent via-primary/10 to-transparent"
      />

      {showSensors &&
        sensors.map((sensor) => {
          const { x, y } = projectToMap(sensor.lat, sensor.lon)
          return (
            <span
              key={sensor.id}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <span
                className={cn(
                  'block size-2 rotate-45 border',
                  sensor.online ? 'border-primary bg-primary/40' : 'border-destructive bg-destructive/30',
                )}
              />
              <span className="pointer-events-none absolute top-3 left-1/2 hidden -translate-x-1/2 rounded-sm border bg-popover px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap text-popover-foreground group-hover:block">
                {sensor.id} · {sensor.online ? `${sensor.latencyMs}ms` : 'OFFLINE'}
              </span>
              <span className="sr-only">
                Sensor {sensor.id}, {sensor.name}, {sensor.online ? 'online' : 'offline'}
              </span>
            </span>
          )
        })}

      {showEvents &&
        events.map((event) => {
          const { x, y } = projectToMap(event.lat, event.lon)
          const selected = event.id === selectedEventId
          return (
            <button
              key={event.id}
              type="button"
              onClick={() => onSelectEvent?.(event.id)}
              disabled={!onSelectEvent}
              className="absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-default"
              style={{ left: `${x}%`, top: `${y}%`, color: TYPE_TOKEN[event.type] }}
              aria-label={`${event.type} in ${event.region}`}
              aria-pressed={onSelectEvent ? selected : undefined}
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-30" />
              <span
                className={cn(
                  'relative rounded-full bg-current ring-2 ring-background',
                  selected ? 'size-3.5' : 'size-2.5',
                )}
              />
              {selected && <span className="absolute -inset-1.5 rounded-full border border-current" />}
            </button>
          )
        })}

      <div className="absolute bottom-2 left-2 flex flex-wrap items-center gap-3 rounded-sm border bg-background/80 px-2 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rotate-45 border border-primary bg-primary/40" /> Sensor
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-meteor" /> Meteor
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-quake" /> Quake
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-chart-5" /> Noise
        </span>
      </div>
    </div>
  )
}
