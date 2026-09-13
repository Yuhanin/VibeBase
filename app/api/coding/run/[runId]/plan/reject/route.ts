import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../../../../../lib/api-auth'

export async function POST(request: Request, { params }: { params: Promise<{ runId:string }> }) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const { runId } = await params
  const body = await request.json().catch(() => ({}))
  if (!body.reason?.trim()) return NextResponse.json({ error:'Rejection reason is required' }, { status:400 })
  const { data:run } = await supabase.from('coding_runs').select('id,active_plan_id').eq('id', runId).eq('user_id', user.id).single()
  if (!run) return NextResponse.json({ error:'Run not found' }, { status:404 })
  const planId = body.planId ?? run.active_plan_id
  if (!planId) return NextResponse.json({ error:'No active plan' }, { status:409 })
  const { data:plan } = await supabase.from('coding_plans').select('*').eq('id', planId).eq('run_id', runId).eq('user_id', user.id).single()
  if (!plan) return NextResponse.json({ error:'Plan not found' }, { status:404 })
  if (plan.status !== 'pending_approval') return NextResponse.json({ error:'Plan is not awaiting approval' }, { status:409 })
  const reviewedAt = new Date().toISOString()
  const { data:rejected, error } = await supabase.from('coding_plans').update({ status:'rejected', rejected_at:reviewedAt, approved_at:null, reviewed_by:user.id, rejection_reason:body.reason.trim() }).eq('id', planId).select().single()
  if (error) return NextResponse.json({ error:error.message }, { status:500 })
  await supabase.from('coding_runs').update({ status:'planning', updated_at:reviewedAt }).eq('id', runId).eq('user_id', user.id)
  await supabase.from('coding_run_events').insert({ run_id:runId, event_type:'plan_rejected', status:'planning', message:`Plan v${plan.version} rejected`, metadata:{ planId, version:plan.version, reason:body.reason.trim() } })
  return NextResponse.json({ plan:rejected })
}
