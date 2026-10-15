'use client'

import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, Clock, Gauge, Percent, Radio, Waves } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { EventTypeBadge, StatusBadge } from './event-badges'
import { Spectrogram } from './spectrogram'
import { WaveformChart } from './waveform-chart'
import { useEventWaveform } from '@/hooks/use-event-waveform'
import { deviceLabel } from '@/lib/mvp/devices'
import { type DetectedEvent, TYPE_TOKEN, formatUtc, formatUtcTime } from '@/lib/seismic-data'

interface EventDashboardViewProps {
  events: DetectedEvent[]
  selectedId: string
  onSelect: (id: string) => void
}

function Metric({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon: typeof Clock
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-md border bg-background/40 p-3">
      <dt className="flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="font-mono text-sm tabular-nums">{children}</dd>
    </div>
  )
}

export function EventDashboardView({ events, selectedId, onSelect }: EventDashboardViewProps) {
  const index = Math.max(
    events.findIndex((e) => e.id === selectedId),
    0,
  )
  const event = events[index]
  const waveform = useEventWaveform(event)

  const classScores = useMemo(() => {
    if (!event) return []
    const rest = 100 - event.probability
    const others = (['Meteor Candidate', 'Earthquake', 'Noise'] as const).filter((t) => t !== event.type)
    return [
      { type: event.type, score: event.probability },
      { type: others[0], score: rest * 0.68 },
      { type: others[1], score: rest * 0.32 },
    ]
  }, [event])

  if (!event) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Dashboard</CardTitle>
          <CardDescription>
            Waiting for the MVP pipeline to classify a sensor chunk and insert it into Supabase.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:gap-6 xl:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <CardDescription className="font-mono text-xs tracking-widest">{event.id}</CardDescription>
          <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
            {event.region}
            <EventTypeBadge type={event.type} />
            <StatusBadge status={event.status} />
          </CardTitle>
          <CardAction className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => onSelect(events[index - 1].id)}
              disabled={index === 0}
              aria-label="Previous event"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => onSelect(events[index + 1].id)}
              disabled={index === events.length - 1}
              aria-label="Next event"
            >
              <ChevronRight />
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-5">
            <Metric label="Start Time" icon={Clock}>
              {formatUtc(event.time)}
            </Metric>
            <Metric label="Signal Intensity" icon={Gauge}>
              {event.intensityPa.toFixed(2)} Pa
              <span className="text-muted-foreground"> · {event.intensityDb.toFixed(1)} dB</span>
            </Metric>
            <Metric label="Dominant Freq." icon={Waves}>
              {event.dominantFrequency.toFixed(2)} Hz
            </Metric>
            <Metric label="Probability" icon={Percent}>
              <span className="flex items-center gap-2">
                {event.probability.toFixed(1)}%
                <Progress value={event.probability} className="flex-1" aria-label="Classification probability" />
              </span>
            </Metric>
            <Metric label="Classification" icon={Radio}>
              <span style={{ color: TYPE_TOKEN[event.type] }}>{event.type}</span>
            </Metric>
          </dl>

          <section aria-labelledby="waveform-heading" className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 id="waveform-heading" className="text-sm font-medium">
                Waveform · {deviceLabel(event.station)}
              </h2>
              <span className="font-mono text-xs text-muted-foreground">BANDPASS 0.1–20 Hz · 40 sps</span>
            </div>
            <div className="flex flex-col gap-1 rounded-md border bg-background/40 p-3">
              <span className="font-mono text-[11px] tracking-widest text-chart-1 uppercase">
                Infrasound · BDF
              </span>
              <WaveformChart data={waveform} channel="infrasound" markerAt={event.type === 'Earthquake' ? 43 : 40} />
            </div>
            <div className="flex flex-col gap-1 rounded-md border bg-background/40 p-3">
              <span className="font-mono text-[11px] tracking-widest text-seismic uppercase">Seismic · BHZ</span>
              <WaveformChart data={waveform} channel="seismic" markerAt={event.type === 'Earthquake' ? 24 : 49} />
            </div>
          </section>

          <section aria-labelledby="spectrogram-heading" className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 id="spectrogram-heading" className="text-sm font-medium">
                Spectrogram
              </h2>
              <span className="font-mono text-xs text-muted-foreground">STFT · 256 pt · Hann</span>
            </div>
            <div className="rounded-md border bg-background/40 p-3">
              <Spectrogram type={event.type} seed={event.seed} />
            </div>
          </section>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 md:gap-6">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Classifier Output</CardTitle>
            <CardDescription>
              {event.source === 'live' ? 'MVP physics rules · infrasound + seismic fusion' : 'Catalog / demo signature'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {classScores.map((c) => (
              <div key={c.type} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span>{c.type}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">{c.score.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.score}%`, backgroundColor: TYPE_TOKEN[c.type] }}
                  />
                </div>
              </div>
            ))}
            {event.explanation && (
              <>
                <Separator />
                <p className="text-xs leading-relaxed text-muted-foreground">{event.explanation}</p>
                {event.rulesTriggered && event.rulesTriggered.length > 0 && (
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {event.rulesTriggered.join(' · ')}
                  </p>
                )}
              </>
            )}
            <Separator />
            <dl className="grid grid-cols-2 gap-2 font-mono text-xs">
              <dt className="text-muted-foreground">Stations</dt>
              <dd className="text-right">{event.stations}</dd>
              <dt className="text-muted-foreground">Duration</dt>
              <dd className="text-right">{event.duration}s</dd>
              <dt className="text-muted-foreground">Location</dt>
              <dd className="text-right">
                {event.lat.toFixed(1)}°, {event.lon.toFixed(1)}°
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card size="sm" className="flex-1">
          <CardHeader>
            <CardTitle>Event Queue</CardTitle>
            <CardAction>
              <Badge variant="secondary" className="font-mono">
                {events.length}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="flex max-h-[420px] flex-col gap-1 overflow-y-auto">
              {events.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(e.id)}
                    aria-pressed={e.id === event.id}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md border border-transparent px-2 py-2 text-left transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                      e.id === event.id && 'border-primary/40 bg-primary/10',
                    )}
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: TYPE_TOKEN[e.type] }}
                      aria-hidden="true"
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-xs font-medium">{e.region}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {formatUtcTime(e.time)} · {e.probability.toFixed(0)}%
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
