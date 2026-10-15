'use client'

import { useEffect, useMemo, useRef } from 'react'
import { type EventType, generateSpectrogram } from '@/lib/seismic-data'

const STOPS: [number, [number, number, number]][] = [
  [0, [8, 14, 28]],
  [0.25, [20, 46, 92]],
  [0.5, [22, 150, 190]],
  [0.75, [240, 190, 70]],
  [1, [255, 245, 220]],
]

function colormap(v: number): [number, number, number] {
  for (let i = 1; i < STOPS.length; i++) {
    const [p1, c1] = STOPS[i]
    const [p0, c0] = STOPS[i - 1]
    if (v <= p1) {
      const k = (v - p0) / (p1 - p0)
      return [c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k, c0[2] + (c1[2] - c0[2]) * k]
    }
  }
  return STOPS[STOPS.length - 1][1]
}

export function Spectrogram({ type, seed }: { type: EventType; seed: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const grid = useMemo(() => generateSpectrogram(type, seed), [type, seed])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const cols = grid.length
    const rows = grid[0].length
    canvas.width = cols
    canvas.height = rows
    const image = ctx.createImageData(cols, rows)
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const [r, g, b] = colormap(grid[x][y])
        const idx = ((rows - 1 - y) * cols + x) * 4
        image.data[idx] = r
        image.data[idx + 1] = g
        image.data[idx + 2] = b
        image.data[idx + 3] = 255
      }
    }
    ctx.putImageData(image, 0, 0)
  }, [grid])

  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-between py-0.5 font-mono text-[10px] text-muted-foreground" aria-hidden="true">
        <span>20Hz</span>
        <span>10</span>
        <span>0.1</span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Spectrogram showing frequency energy over time for a ${type.toLowerCase()} signal`}
          className="h-40 w-full rounded-sm border [image-rendering:pixelated]"
        />
        <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
          <span>0s</span>
          <div className="flex items-center gap-2">
            <span>low</span>
            <span
              aria-hidden="true"
              className="h-1.5 w-24 rounded-full bg-[linear-gradient(to_right,rgb(8,14,28),rgb(20,46,92),rgb(22,150,190),rgb(240,190,70),rgb(255,245,220))]"
            />
            <span>high dB</span>
          </div>
          <span>120s</span>
        </div>
      </div>
    </div>
  )
}
