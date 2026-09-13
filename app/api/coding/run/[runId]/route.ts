import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../../../lib/api-auth'

export async function GET(_: Request, { params }: { params: Promise<{ runId:string }> }) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const { runId } = await params
  const { data:run, error } = await supabase.from('coding_runs').select('*').eq('id', runId).eq('user_id', user.id).single()
  if (error || !run) return NextResponse.json({ error:'Run not found' }, { status:404 })
  const [{ data:events }, { data:plans }] = await Promise.all([
    supabase.from('coding_run_events').select('*').eq('run_id', runId).order('created_at', { ascending:true }),
    supabase.from('coding_plans').select('id,version,status,approved_at,rejected_at,rejection_reason,created_at,updated_at').eq('run_id', runId).order('version', { ascending:false }),
  ])
  return NextResponse.json({ run, events:events ?? [], plans:plans ?? [] })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ runId:string }> }) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const { runId } = await params
  const body = await request.json().catch(() => ({}))
  if (body.action !== 'cancel') return NextResponse.json({ error:'Only cancellation is allowed from the client' }, { status:400 })
  const { data:run } = await supabase.from('coding_runs').select('id,status').eq('id', runId).eq('user_id', user.id).single()
  if (!run) return NextResponse.json({ error:'Run not found' }, { status:404 })
  if (['completed','failed','cancelled'].includes(run.status)) return NextResponse.json({ error:`Run is already ${run.status}` }, { status:409 })
  const { data:updated, error } = await supabase.from('coding_runs').update({ status:'cancelled', updated_at:new Date().toISOString() }).eq('id', runId).eq('user_id', user.id).select().single()
  if (error) return NextResponse.json({ error:error.message }, { status:500 })
  await supabase.from('coding_run_events').insert({ run_id:runId, event_type:'run_cancelled', status:'cancelled', message:'Run cancelled by user', metadata:{} })
  return NextResponse.json({ run:updated })
}
