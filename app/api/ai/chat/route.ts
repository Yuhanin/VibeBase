import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  if (!body.messages?.length) return NextResponse.json({ error: 'messages are required' }, { status: 400 })
  const apiKey = process.env.AI_API_KEY
  const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1'
  const model = process.env.AI_MODEL || 'gpt-4.1-mini'
  if (!apiKey) return NextResponse.json({ error: 'AI provider is not configured. Set AI_API_KEY.' }, { status: 503 })
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, messages: body.messages, temperature: 0.2 }) })
  const text = await response.text()
  if (!response.ok) return NextResponse.json({ error: text || 'AI provider request failed' }, { status: response.status })
  const data = JSON.parse(text)
  return NextResponse.json({ message: data.choices?.[0]?.message?.content ?? '' })
}
