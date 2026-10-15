'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Flame, Radio, RotateCcw, VolumeX, Waves } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { EventTypeBadge } from './event-badges'
import { WaveformChart } from './waveform-chart'
import { insertMockSensorChunk, type SimScenario } from '@/lib/mvp/mock-sensor-stream'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { type DetectedEvent, type EventType, type WaveformPoint, formatUtcTime } from '@/lib/seismic-data'

const BUFFER = 300
const SAMPLES_PER_TICK = 3
const INJECTION_LENGTH = 150

const SIM_REGIONS: Record<Exclude<EventType, 'Noise'>, { region: string; lat: number; lon: number }[]> = {
  'Meteor Candidate': [
    { region: 'Barents Sea', lat: 73.1, lon: 38.4 },
    { region: 'Sahara Desert', lat: 23.8, lon: 8.1 },
    { region: 'Indian Ocean', lat: -18.2, lon: 74.6 },
  ],
  Earthquake: [
    { region: 'Sumatra, Indonesia', lat: 1.8, lon: 97.4 },
    { region: 'Kamchatka, Russia', lat: 53.2, lon: 159.8 },
    { region: 'Oaxaca, Mexico', lat: 16.1, lon: -97.2 },
  ],
}

interface Injection {
  type: Exclude<EventType, 'Noise'>
  start: number
}

interface DemoModeViewProps {
  running: boolean
  onRunningChange: (running: boolean) => void
  detections: DetectedEvent[]
  onDetect: (event: DetectedEvent) => void
  onOpenEvent: (id: string) => void
}

function sampleAt(s: number, injection: Injection | null): WaveformPoint {
  let infrasound = (Math.random() - 0.5) * 0.12 + Math.sin(s * 0.21) * 0.03
  let seismic = (Math.random() - 0.5) * 0.1
  if (injection) {
    const k = (s - injection.start) / INJECTION_LENGTH
    if (k >= 0 && k <= 1) {
      if (injection.type === 'Meteor Candidate') {
        infrasound += Math.exp(-((k - 0.35) ** 2) / 0.01) * Math.sin(s * 0.8) * 0.95
        seismic += Math.exp(-((k - 0.4) ** 2) / 0.004) * Math.sin(s * 1.6) * 0.2
      } else {
        const p = k > 0.1 ? Math.exp(-(k - 0.1) * 10) : 0
        const sw = k > 0.3 ? Math.exp(-(k - 0.3) * 4.5) : 0
        seismic += p * Math.sin(s * 2.2) * 0.45 + sw * Math.sin(s * 1.2) * 0.95
        infrasound += sw * Math.sin(s * 0.5) * 0.28
      }
    }
  }
  return { t: Number((s / 10).toFixed(1)), infrasound, seismic }
}

export function DemoModeView({ running, onRunningChange, detections, onDetect, onOpenEvent }: DemoModeViewProps) {
  const [buffer, setBuffer] = useState<WaveformPoint[]>(() =>
    Array.from({ length: BUFFER }, (_, i) => ({ t: i / 10, infrasound: 0, seismic: 0 })),
  )
  const [injection, setInjection] = useState<Injection | null>(null)
  const [pushStatus, setPushStatus] = useState<{ scenario: SimScenario; ok: boolean; message: string } | null>(null)
  const [pushing, setPushing] = useState(false)
  const sampleRef = useRef(BUFFER)
  const counterRef = useRef(detections.length)

  const tick = useEffectEvent(() => {
    const next: WaveformPoint[] = []
    for (let i = 0; i < SAMPLES_PER_TICK; i++) {
      next.push(sampleAt(sampleRef.current, injection))
      sampleRef.current += 1
    }
    setBuffer((prev) => [...prev.slice(next.length), ...next])

    if (injection && sampleRef.current - injection.start > INJECTION_LENGTH) {
      const pool = SIM_REGIONS[injection.type]
      const place = pool[Math.floor(Math.random() * pool.length)]
      counterRef.current += 1
      const isMeteor = injection.type === 'Meteor Candidate'
      onDetect({
        id: `EVT-SIM-${String(counterRef.current).padStart(3, '0')}`,
        time: new Date().toISOString(),
        type: injection.type,
        region: place.region,
        status: 'Pending',
        lat: place.lat,
        lon: place.lon,
        intensityPa: Number((isMeteor ? 1 + Math.random() * 2 : 0.3 + Math.random() * 0.5).toFixed(2)),
        intensityDb: Number((isMeteor ? 94 + Math.random() * 9 : 84 + Math.random() * 7).toFixed(1)),
        dominantFrequency: Number((isMeteor ? 0.6 + Math.random() * 0.9 : 2 + Math.random() * 2).toFixed(2)),
        probability: Number((80 + Math.random() * 18).toFixed(1)),
        duration: Math.round(isMeteor ? 30 + Math.random() * 30 : 80 + Math.random() * 70),
        stations: Math.round(3 + Math.random() * 9),
        station: isMeteor ? 'IS48' : 'MAJO',
        seed: Math.floor(Math.random() * 1000) + 100,
        source: 'demo',
        explanation: isMeteor
          ? 'Demo injection: N-wave-like infrasound burst with delayed weak ground coupling.'
          : 'Demo injection: P then S style seismic energy with weaker infrasound.',
      })
      setInjection(null)
    }
  })

  useEffect(() => {
    if (!running) return
    const id = setInterval(tick, 80)
    return () => clearInterval(id)
  }, [running])

  const inject = (type: Injection['type']) => {
    if (!running) onRunningChange(true)
    setInjection({ type, start: sampleRef.current })
  }

  /**
   * Writes one realistic sensor chunk for `scenario` straight into Supabase
   * `sensor_readings`. The MVP pipeline then classifies it and appends the
   * result to `events` — this event appears in the Event Log / Dashboard via
   * the realtime subscription in useLiveEvents.
   */
  const pushScenario = async (scenario: Exclude<SimScenario, 'idle'>) => {
    if (pushing) return
    if (!isSupabaseConfigured()) {
      setPushStatus({ scenario, ok: false, message: 'Supabase env vars missing — set NEXT_PUBLIC_SUPABASE_URL / ANON_KEY.' })
      return
    }
    setPushing(true)
    setPushStatus({ scenario, ok: true, message: `Pushing ${scenario} chunk to sensor_readings…` })
    try {
      await insertMockSensorChunk(scenario)
      setPushStatus({
        scenario,
        ok: true,
        message: `${scenario} chunk inserted — pipeline analyzing (cooldown 18 s). Watch the Event Log.`,
      })
    } catch (err) {
      const raw =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Insert failed'
      const hint = /row-level security/i.test(raw)
        ? ' → Run supabase/mvp-setup.sql once in the Supabase SQL Editor to grant insert access.'
        : ''
      setPushStatus({ scenario, ok: false, message: raw + hint })
    } finally {
      setPushing(false)
    }
  }

  const status = injection ? `ANALYZING ${injection.type.toUpperCase()} SIGNAL` : running ? 'MONITORING' : 'IDLE'

  return (
    <div className="grid gap-4 md:gap-6 xl:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <CardTitle>Real-time Simulation</CardTitle>
          <CardDescription>
            Synthetic dual-channel stream. Inject a signature to watch the detection pipeline classify it.
          </CardDescription>
          <CardAction>
            <label className="flex items-center gap-2 font-mono text-xs">
              <Switch checked={running} onCheckedChange={onRunningChange} />
              {running ? 'RUNNING' : 'PAUSED'}
            </label>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => inject('Meteor Candidate')} disabled={injection !== null}>
              <Flame data-icon="inline-start" />
              Inject Meteor Airburst
            </Button>
            <Button variant="secondary" onClick={() => inject('Earthquake')} disabled={injection !== null}>
              <Waves data-icon="inline-start" />
              Inject Earthquake
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                onRunningChange(false)
                setInjection(null)
              }}
            >
              <RotateCcw data-icon="inline-start" />
              Reset
            </Button>
            <Badge variant="outline" className="ml-auto gap-1.5 font-mono" aria-live="polite">
              <span
                className={injection ? 'size-1.5 animate-pulse rounded-full bg-meteor' : running ? 'size-1.5 animate-pulse rounded-full bg-success' : 'size-1.5 rounded-full bg-muted-foreground'}
                aria-hidden="true"
              />
              {status}
            </Badge>
          </div>
          <div className="flex flex-col gap-1 rounded-md border bg-background/40 p-3">
            <span className="font-mono text-[11px] tracking-widest text-chart-1 uppercase">Infrasound · SIM-01</span>
            <WaveformChart data={buffer} channel="infrasound" height="h-44" />
          </div>
          <div className="flex flex-col gap-1 rounded-md border bg-background/40 p-3">
            <span className="font-mono text-[11px] tracking-widest text-seismic uppercase">Seismic · SIM-01</span>
            <WaveformChart data={buffer} channel="seismic" height="h-44" />
          </div>

          <div className="flex flex-col gap-2 rounded-md border border-dashed border-primary/30 bg-primary/5 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11px] tracking-widest text-primary uppercase">
                Supabase Pipeline Triggers
              </span>
              <Badge variant="outline" className="font-mono text-[10px]">
                POST /api/simulate
              </Badge>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Writes a real 3-station sensor chunk into <code className="font-mono">sensor_readings</code>. The MVP
              classifier analyzes it and inserts the result into <code className="font-mono">events</code> — it then
              appears live in the Event Dashboard, Map and Log.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" disabled={pushing} onClick={() => void pushScenario('meteor')}>
                <Flame data-icon="inline-start" />
                Simulate Meteor
              </Button>
              <Button size="sm" variant="outline" disabled={pushing} onClick={() => void pushScenario('earthquake')}>
                <Waves data-icon="inline-start" />
                Simulate Earthquake
              </Button>
              <Button size="sm" variant="outline" disabled={pushing} onClick={() => void pushScenario('noise')}>
                <VolumeX data-icon="inline-start" />
                Simulate Noise
              </Button>
              {pushing && (
                <Radio className="size-4 animate-pulse text-primary" aria-label="Pushing scenario" />
              )}
            </div>
            {pushStatus && (
              <p
                className={`font-mono text-[11px] ${pushStatus.ok ? 'text-success' : 'text-destructive'}`}
                role="status"
              >
                {pushStatus.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Simulated Detections</CardTitle>
          <CardDescription>Also appended to the Event Log</CardDescription>
        </CardHeader>
        <CardContent>
          {detections.length === 0 ? (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              No simulated detections yet. Inject a signal to begin.
            </p>
          ) : (
            <ul className="flex flex-col gap-2" aria-live="polite">
              {detections.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => onOpenEvent(d.id)}
                    className="flex w-full flex-col gap-2 rounded-md border bg-background/40 p-3 text-left transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-primary">{d.id}</span>
                      <span className="font-mono text-xs text-muted-foreground">{formatUtcTime(d.time)}</span>
                    </div>
                    <span className="text-sm font-medium">{d.region}</span>
                    <div className="flex items-center justify-between gap-2">
                      <EventTypeBadge type={d.type} />
                      <span className="font-mono text-xs tabular-nums">{d.probability.toFixed(1)}%</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
