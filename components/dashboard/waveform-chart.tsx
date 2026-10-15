'use client'

import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { WaveformPoint } from '@/lib/seismic-data'

const chartConfig = {
  infrasound: { label: 'Infrasound (Pa)', color: 'var(--chart-1)' },
  seismic: { label: 'Seismic (µm/s)', color: 'var(--seismic)' },
} satisfies ChartConfig

interface WaveformChartProps {
  data: WaveformPoint[]
  channel: 'infrasound' | 'seismic'
  height?: string
  markerAt?: number
  animate?: boolean
}

export function WaveformChart({ data, channel, height = 'h-40', markerAt, animate = false }: WaveformChartProps) {
  return (
    <ChartContainer config={chartConfig} className={`aspect-auto ${height} w-full`}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="2 4" vertical={false} />
        <XAxis
          dataKey="t"
          type="number"
          domain={['dataMin', 'dataMax']}
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          tickFormatter={(v: number) => `${Math.round(v)}s`}
          className="font-mono"
        />
        <YAxis
          domain={[-1.2, 1.2]}
          tickLine={false}
          axisLine={false}
          tickCount={5}
          width={40}
          className="font-mono"
        />
        <ReferenceLine y={0} stroke="var(--border)" />
        {markerAt !== undefined && (
          <ReferenceLine
            x={markerAt}
            stroke="var(--primary)"
            strokeDasharray="3 3"
            label={{ value: 'ONSET', position: 'insideTopRight', fill: 'var(--primary)', fontSize: 10 }}
          />
        )}
        <ChartTooltip
          cursor={{ stroke: 'var(--muted-foreground)', strokeDasharray: '2 2' }}
          content={<ChartTooltipContent labelFormatter={(_, p) => `t = ${p?.[0]?.payload?.t ?? ''}s`} />}
        />
        <Line
          dataKey={channel}
          type="monotone"
          stroke={`var(--color-${channel})`}
          strokeWidth={1.25}
          dot={false}
          isAnimationActive={animate}
        />
      </LineChart>
    </ChartContainer>
  )
}
