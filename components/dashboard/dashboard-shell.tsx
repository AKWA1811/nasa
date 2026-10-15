'use client'

import { useState } from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar, type ViewId } from './app-sidebar'
import { DashboardHeader } from './dashboard-header'
import { DemoModeView } from './demo-mode-view'
import { EventDashboardView } from './event-dashboard-view'
import { EventLogView } from './event-log-view'
import { MapView } from './map-view'
import { OverviewView } from './overview-view'
import { useLiveEvents } from '@/hooks/use-live-events'
import { useSensorPipeline } from '@/hooks/use-sensor-pipeline'
import { type DetectedEvent, EVENTS } from '@/lib/seismic-data'

const VIEW_META: Record<ViewId, { title: string; subtitle: string }> = {
  overview: { title: 'Network Overview', subtitle: 'Global infrasound and seismic monitoring status' },
  events: { title: 'Event Dashboard', subtitle: 'Waveform, spectral and classifier analysis' },
  map: { title: 'Interactive Map', subtitle: 'Geospatial view of stations and detections' },
  log: { title: 'Event Log', subtitle: 'Historical detections and review status' },
  demo: { title: 'Demo Mode', subtitle: 'Simulate signals and exercise the detection pipeline' },
}

export function DashboardShell() {
  const [view, setView] = useState<ViewId>('overview')
  const [simulated, setSimulated] = useState<DetectedEvent[]>([])
  const [selectedId, setSelectedId] = useState(EVENTS[0].id)
  const [demoRunning, setDemoRunning] = useState(false)
  const live = useLiveEvents()
  const pipeline = useSensorPipeline()

  const catalog = live.connected ? live.events : EVENTS
  const events = [...simulated, ...catalog]
  const selectedExists = events.some((event) => event.id === selectedId)
  const activeId = selectedExists ? selectedId : events[0]?.id ?? EVENTS[0].id
  const feedLabel = live.connected ? (pipeline.running ? 'SUPABASE LIVE' : 'SUPABASE') : 'CATALOG'

  const openEvent = (id: string) => {
    setSelectedId(id)
    setView('events')
  }

  return (
    <SidebarProvider>
      <AppSidebar
        active={view}
        onNavigate={setView}
        pendingCount={events.filter((e) => e.status === 'Pending').length}
        demoRunning={demoRunning}
      />
      <SidebarInset className="bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklch,var(--primary)_8%,transparent),transparent_60%)]">
        <DashboardHeader {...VIEW_META[view]} feedLabel={feedLabel} live={live.connected} />
        <div className="flex-1 p-4 md:p-6">
          {view === 'overview' && (
            <OverviewView events={events} onOpenEvent={openEvent} onViewMap={() => setView('map')} />
          )}
          {view === 'events' && <EventDashboardView events={events} selectedId={activeId} onSelect={setSelectedId} />}
          {view === 'map' && (
            <MapView events={events} selectedId={activeId} onSelect={setSelectedId} onInspect={openEvent} />
          )}
          {view === 'log' && <EventLogView events={events} onOpenEvent={openEvent} />}
          {view === 'demo' && (
            <DemoModeView
              running={demoRunning}
              onRunningChange={setDemoRunning}
              detections={simulated}
              onDetect={(event) => setSimulated((prev) => [event, ...prev])}
              onOpenEvent={openEvent}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
