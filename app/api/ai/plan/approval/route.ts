import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error:'Legacy non-persistent approval is retired. Review a persisted run plan via /api/coding/run/[runId]/plan/approve or /reject.' }, { status:410 })
}
