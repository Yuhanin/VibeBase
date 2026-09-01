import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/auth'
import { githubGet } from '../../../../lib/github'

export async function GET(req: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sha = new URL(req.url).searchParams.get('sha')
  if (!sha) return NextResponse.json({ error: 'sha is required' }, { status: 400 })
  try { return NextResponse.json({ commit: await githubGet(`/commits/${sha}`) }) }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'GitHub error' }, { status: 502 }) }
}
