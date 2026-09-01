import { NextResponse } from 'next/server'

export async function GET() {
  const checks = {
    app: true,
    supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  }
  return NextResponse.json({ status: Object.values(checks).every(Boolean) ? 'ok' : 'degraded', checks })
}
