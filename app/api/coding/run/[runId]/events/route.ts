import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../../../../lib/api-auth'

export async function POST(_: Request, { params }: { params: Promise<{ runId:string }> }) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const { runId } = await params
  const { data:run } = await supabase.from('coding_runs').select('id').eq('id', runId).eq('user_id', user.id).single()
  if (!run) return NextResponse.json({ error:'Run not found' }, { status:404 })
  return NextResponse.json({ error:'Coding run events are server-generated and cannot be written by clients' }, { status:403 })
}
