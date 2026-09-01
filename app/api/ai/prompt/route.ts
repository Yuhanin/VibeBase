import { NextResponse } from 'next/server'
import { buildCodingPrompt } from '../../../../lib/ai-context'

export async function POST(request: Request) {
  const body = await request.json()
  if (!body.context || !body.request?.trim()) return NextResponse.json({ error: 'context and request are required' }, { status: 400 })
  return NextResponse.json({ prompt: buildCodingPrompt(body.context, body.request.trim()) })
}
