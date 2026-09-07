import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../../lib/api-auth'

const MAX_MESSAGES = 20
const MAX_CONTENT_CHARS = 24000

export async function POST(request: Request) {
  const { user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const body = await request.json()
  if (!Array.isArray(body.messages) || body.messages.length === 0) return NextResponse.json({ error: 'messages are required' }, { status: 400 })
  if (body.messages.length > MAX_MESSAGES) return NextResponse.json({ error: 'Too many messages' }, { status: 413 })
  const totalChars = body.messages.reduce((sum: number, message: unknown) => {
    if (!message || typeof message !== 'object') return sum
    const content = (message as { content?: unknown }).content
    return sum + (typeof content === 'string' ? content.length : 0)
  }, 0)
  if (totalChars > MAX_CONTENT_CHARS) return NextResponse.json({ error: 'AI request is too large' }, { status: 413 })

  const apiKey = process.env.AI_API_KEY
  const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1'
  const model = process.env.AI_MODEL || 'gpt-4.1-mini'
  if (!apiKey) return NextResponse.json({ error: 'AI provider is not configured. Set AI_API_KEY.' }, { status: 503 })

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: body.messages, temperature: 0.2 }),
    cache: 'no-store',
  })
  const text = await response.text()
  if (!response.ok) return NextResponse.json({ error: 'AI provider request failed' }, { status: 502 })
  try {
    const data = JSON.parse(text)
    return NextResponse.json({ message: data.choices?.[0]?.message?.content ?? '', model })
  } catch {
    return NextResponse.json({ error: 'AI provider returned invalid JSON' }, { status: 502 })
  }
}
