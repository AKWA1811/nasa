'use client'

import { ArrowUpRight, Flame, Radio, Waves, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { EventTypeBadge } from './event-badges'
import { SensorMap } from './sensor-map'
import { useDevices } from '@/hooks/use-devices'
import { type DetectedEvent, SENSORS, TYPE_TOKEN, formatUtcTime } from '@/lib/seismic-data'
import { isSupabaseConfigured } from '@/lib/supabase/client'

interface OverviewViewProps {
  events: DetectedEvent[]
  onOpenEvent: (id: string) => void
  onViewMap: () => void
}

function StatCard({
  label,
  value,
  unit,
  detail,
  icon: Icon,
  children,
}: {
  label: string
  value: string
  unit?: string
  detail: string
  icon: typeof Radio
  children?: React.ReactNode
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription className="font-mono text-xs tracking-widest uppercase">{label}</CardDescription>
        <CardAction>
          <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="flex items-baseline gap-1.5 font-mono text-3xl font-semibold tabular-nums">
          {value}
          {unit && <span className="text-sm font-normal text-muted-foreground">{unit}</span>}
        </p>
        {children}
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

export function OverviewView({ events, onOpenEvent, onViewMap }: OverviewViewProps) {
  const { devices: liveDevices, onlineCount: liveOnline } = useDevices()
  const liveMode = isSupabaseConfigured() && liveDevices.length > 0
  const online = liveMode ? liveOnline : SENSORS.filter((s) => s.online).length
  const total = liveMode ? liveDevices.length : SENSORS.length
  const recent = events.slice(0, 6)
  const meteors = events.filter((e) => e.type === 'Meteor Candidate').length
  const quakes = events.filter((e) => e.type === 'Earthquake').length
  const avgLatency = Math.round(
    SENSORS.filter((s) => s.online).reduce((sum, s) => sum + s.latencyMs, 0) / SENSORS.filter((s) => s.online).length,
  )

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <section aria-label="Network summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Connected Sensors"
          value={`${online}`}
          unit={`/ ${total}`}
          detail={liveMode ? 'Demo stations registered in Supabase `users_devices`' : `${SENSORS.length - online} stations offline · IMS + IRIS networks`}
          icon={Radio}
        >
          <Progress value={(online / Math.max(total, 1)) * 100} aria-label="Sensor uptime" />
        </StatCard>
        <StatCard
          label="Recent Events"
          value={`${events.length}`}
          unit="/ 72h"
          detail={`${events.filter((e) => e.status === 'Pending').length} awaiting analyst review`}
          icon={Zap}
        />
        <StatCard
          label="Meteor Candidates"
          value={`${meteors}`}
          detail="Infrasound-dominant airburst signatures"
          icon={Flame}
        />
        <StatCard
          label="Seismic Events"
          value={`${quakes}`}
          detail={`Mean telemetry latency ${avgLatency}ms`}
          icon={Waves}
        />
      </section>

      <section className="grid gap-4 md:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Live Global Sensor Map</CardTitle>
            <CardDescription>Station positions and detections across the monitoring network</CardDescription>
            <CardAction>
              <Badge variant="outline" className="gap-1.5 font-mono">
                <span className="size-1.5 animate-pulse rounded-full bg-success" aria-hidden="true" />
                STREAMING
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <SensorMap sensors={SENSORS} events={events} onSelectEvent={onOpenEvent} />
          </CardContent>
          <CardFooter className="justify-between gap-2">
            <span className="font-mono text-xs text-muted-foreground">PROJECTION: EQUIRECTANGULAR · WGS84</span>
            <Button variant="outline" size="sm" onClick={onViewMap}>
              Open interactive map
              <ArrowUpRight data-icon="inline-end" />
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Detections</CardTitle>
            <CardDescription>Latest classified signals</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col">
            <ul className="flex flex-col">
              {recent.map((event, i) => (
                <li key={event.id}>
                  {i > 0 && <Separator />}
                  <button
                    type="button"
                    onClick={() => onOpenEvent(event.id)}
                    className="flex w-full items-center gap-3 rounded-sm py-3 text-left transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span
                      className="h-8 w-0.5 shrink-0 rounded-full"
                      style={{ backgroundColor: TYPE_TOKEN[event.type] }}
                      aria-hidden="true"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-sm font-medium">{event.region}</span>
                      <span className="truncate font-mono text-xs text-muted-foreground">
                        {formatUtcTime(event.time)} · {event.id}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <EventTypeBadge type={event.type} />
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {event.probability.toFixed(1)}%
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
