import { NextResponse } from 'next/server'

export async function GET() {
  const token = process.env.GITHUB_TOKEN
  if (!token) return NextResponse.json({ connected: false, reason: 'GITHUB_TOKEN is not configured' })
  const response = await fetch('https://api.github.com/user', { headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' }, cache: 'no-store' })
  if (!response.ok) return NextResponse.json({ connected: false, reason: 'GitHub token rejected' }, { status: 502 })
  const user = await response.json()
  return NextResponse.json({ connected: true, login: user.login })
}
