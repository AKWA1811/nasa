import { NextResponse } from 'next/server'
import { insertMockSensorChunk, type SimScenario } from '@/lib/mvp/mock-sensor-stream'
import { isSupabaseConfigured } from '@/lib/supabase/client'

const VALID_SCENARIOS: SimScenario[] = ['idle', 'meteor', 'earthquake', 'noise']

/**
 * POST /api/simulate
 * Body: { scenario?: 'meteor' | 'earthquake' | 'noise' | 'idle' }
 *
 * Inserts one realistic sensor chunk (3 demo stations x infrasound + seismic,
 * 32 samples each at 8 Hz) into Supabase `sensor_readings`. The MVP pipeline
 * (lib/mvp/pipeline.ts) listens for these inserts, classifies the window and
 * writes `events` / `classifications` rows.
 *
 * With no (or an invalid) body a weighted-random scenario is generated so a
 * simple GET/curl keeps the demo feed alive.
 */
async function runSimulation(request?: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' },
      { status: 503 },
    )
  }

  let scenario: SimScenario | undefined
  if (request) {
    try {
      const body = (await request.json()) as { scenario?: string }
      if (body?.scenario && VALID_SCENARIOS.includes(body.scenario as SimScenario)) {
        scenario = body.scenario as SimScenario
      }
    } catch {
      // Empty / invalid JSON body -> fall through to a random scenario.
    }
  }

  try {
    const used = await insertMockSensorChunk(scenario)
    return NextResponse.json({ ok: true, scenario: used, insertedAt: new Date().toISOString() })
  } catch (err) {
    // supabase-js throws plain PostgrestError objects (not Error instances).
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'object' && err && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to insert sensor chunk'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return runSimulation(request)
}

export async function GET() {
  return runSimulation()
}
