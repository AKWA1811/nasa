import { CircleCheck, CircleDashed } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { EventStatus, EventType } from '@/lib/seismic-data'

const TYPE_CLASSES: Record<EventType, string> = {
  'Meteor Candidate': 'border-meteor/40 bg-meteor/10 text-meteor',
  Earthquake: 'border-quake/40 bg-quake/10 text-quake',
  Noise: 'border-border bg-muted text-muted-foreground',
}

export function EventTypeBadge({ type, className }: { type: EventType; className?: string }) {
  return (
    <Badge variant="outline" className={cn('font-mono', TYPE_CLASSES[type], className)}>
      {type}
    </Badge>
  )
}

export function StatusBadge({ status }: { status: EventStatus }) {
  return status === 'Confirmed' ? (
    <Badge variant="outline" className="border-success/40 bg-success/10 font-mono text-success">
      <CircleCheck data-icon="inline-start" />
      Confirmed
    </Badge>
  ) : (
    <Badge variant="outline" className="font-mono text-muted-foreground">
      <CircleDashed data-icon="inline-start" />
      Pending
    </Badge>
  )
}
