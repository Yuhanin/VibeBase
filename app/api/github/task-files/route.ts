import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error:'Direct task file writes are retired. Use the approved-plan atomic execution route.' }, { status:410 })
}
