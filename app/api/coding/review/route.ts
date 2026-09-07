import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error:'Legacy review transition is retired. Review status is reached only after run CI verification.' }, { status:410 })
}
