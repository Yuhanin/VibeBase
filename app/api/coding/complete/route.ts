import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error:'Legacy task completion is retired. Complete a verified coding run via /api/coding/run/[runId]/complete.' }, { status:410 })
}
