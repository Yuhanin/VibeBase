import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error:'Legacy static planning is retired. Create a versioned plan through /api/coding/run/[runId]/plan.' }, { status:410 })
}
