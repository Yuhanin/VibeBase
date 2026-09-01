import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/auth'
import { githubGet } from '../../../../lib/github'

export async function GET(req: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const q = new URL(req.url).searchParams; const base=q.get('base'); const head=q.get('head')
  if (!base || !head) return NextResponse.json({ error:'base and head are required' },{status:400})
  try { return NextResponse.json(await githubGet(`/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`)) }
  catch(e){return NextResponse.json({error:e instanceof Error?e.message:'GitHub error'},{status:502})}
}
