'use client'

import { Activity, FlaskConical, Globe2, LayoutDashboard, ListChecks, Radar } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export type ViewId = 'overview' | 'events' | 'map' | 'log' | 'demo'

export const NAV_ITEMS: { id: ViewId; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'events', label: 'Event Dashboard', icon: Activity },
  { id: 'map', label: 'Interactive Map', icon: Globe2 },
  { id: 'log', label: 'Event Log', icon: ListChecks },
  { id: 'demo', label: 'Demo Mode', icon: FlaskConical },
]

interface AppSidebarProps {
  active: ViewId
  onNavigate: (view: ViewId) => void
  pendingCount: number
  demoRunning: boolean
}

export function AppSidebar({ active, onNavigate, pendingCount, demoRunning }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-1 py-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary">
            <Radar aria-hidden="true" />
          </div>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate font-mono text-sm font-semibold tracking-widest">SKYQUAKE</span>
            <span className="truncate text-xs text-muted-foreground">Infrasound × Seismic</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono tracking-widest uppercase">Mission Control</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={active === item.id}
                    tooltip={item.label}
                    onClick={() => onNavigate(item.id)}
                    aria-current={active === item.id ? 'page' : undefined}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                  {item.id === 'log' && pendingCount > 0 && (
                    <SidebarMenuBadge className="font-mono">{pendingCount}</SidebarMenuBadge>
                  )}
                  {item.id === 'demo' && demoRunning && (
                    <SidebarMenuBadge>
                      <span className="size-2 animate-pulse rounded-full bg-success" />
                      <span className="sr-only">Simulation running</span>
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-1 rounded-md border border-sidebar-border bg-sidebar-accent/40 p-3 font-mono text-xs group-data-[collapsible=icon]:hidden">
          <span className="text-muted-foreground">NASA SPACE APPS 2026</span>
          <span className="flex items-center gap-2 text-sidebar-foreground">
            <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
            Pipeline nominal
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
