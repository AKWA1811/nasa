'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

function UtcClock() {
  const [now, setNow] = useState<string | null>(null)
  useEffect(() => {
    const tick = () => setNow(new Date().toISOString().slice(11, 19))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="font-mono text-sm tabular-nums text-foreground" aria-live="off">
      {now ?? '--:--:--'} <span className="text-muted-foreground">UTC</span>
    </span>
  )
}

export function DashboardHeader({
  title,
  subtitle,
  feedLabel = 'CATALOG',
  live = false,
}: {
  title: string
  subtitle: string
  feedLabel?: string
  live?: boolean
}) {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="hidden gap-1.5 font-mono sm:inline-flex">
          <span
            className={`size-1.5 rounded-full ${live ? 'animate-pulse bg-success' : 'bg-muted-foreground'}`}
            aria-hidden="true"
          />
          {feedLabel}
        </Badge>
        <UtcClock />
      </div>
    </header>
  )
}
