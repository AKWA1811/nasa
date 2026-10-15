'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { EventTypeBadge, StatusBadge } from './event-badges'
import { type DetectedEvent, type EventType, formatUtc } from '@/lib/seismic-data'

type Filter = 'all' | EventType

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Meteor Candidate', label: 'Meteor' },
  { value: 'Earthquake', label: 'Earthquake' },
  { value: 'Noise', label: 'Noise' },
]

interface EventLogViewProps {
  events: DetectedEvent[]
  onOpenEvent: (id: string) => void
}

export function EventLogView({ events, onOpenEvent }: EventLogViewProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return events.filter(
      (e) =>
        (filter === 'all' || e.type === filter) &&
        (!q || e.id.toLowerCase().includes(q) || e.region.toLowerCase().includes(q)),
    )
  }, [events, filter, query])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Log</CardTitle>
        <CardDescription>
          {rows.length} of {events.length} detections · sorted by most recent
        </CardDescription>
        <CardAction className="hidden font-mono text-xs text-muted-foreground md:block">
          {events.filter((e) => e.status === 'Confirmed').length} CONFIRMED ·{' '}
          {events.filter((e) => e.status === 'Pending').length} PENDING
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ToggleGroup
            variant="outline"
            size="sm"
            value={[filter]}
            onValueChange={(value) => setFilter((value[0] as Filter) ?? 'all')}
            aria-label="Filter by event type"
          >
            {FILTERS.map((f) => (
              <ToggleGroupItem key={f.value} value={f.value}>
                {f.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="relative sm:w-72">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ID or region"
              aria-label="Search events by ID or region"
              className="pl-8 font-mono"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableCaption className="sr-only">Detected infrasound and seismic events</TableCaption>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-mono text-xs tracking-widest uppercase">Event ID</TableHead>
                <TableHead className="font-mono text-xs tracking-widest uppercase">Time</TableHead>
                <TableHead className="font-mono text-xs tracking-widest uppercase">Type</TableHead>
                <TableHead className="font-mono text-xs tracking-widest uppercase">Region</TableHead>
                <TableHead className="font-mono text-xs tracking-widest uppercase">Status</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No events match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-mono text-xs text-primary">{event.id}</TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">{formatUtc(event.time)}</TableCell>
                    <TableCell>
                      <EventTypeBadge type={event.type} />
                    </TableCell>
                    <TableCell>{event.region}</TableCell>
                    <TableCell>
                      <StatusBadge status={event.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => onOpenEvent(event.id)}>
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
