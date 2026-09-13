import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../../../../../lib/api-auth'
import { assertPlanApprovalReady, type CodingPlan } from '../../../../../../../lib/ai-planning'

export async function POST(request: Request, { params }: { params: Promise<{ runId:string }> }) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const { runId } = await params
  const body = await request.json().catch(() => ({}))
  const { data:run } = await supabase.from('coding_runs').select('id,active_plan_id,status').eq('id', runId).eq('user_id', user.id).single()
  if (!run) return NextResponse.json({ error:'Run not found' }, { status:404 })
  const planId = body.planId ?? run.active_plan_id
  if (!planId) return NextResponse.json({ error:'No active plan' }, { status:409 })
  const { data:plan } = await supabase.from('coding_plans').select('*').eq('id', planId).eq('run_id', runId).eq('user_id', user.id).single()
  if (!plan) return NextResponse.json({ error:'Plan not found' }, { status:404 })
  if (plan.status !== 'pending_approval') return NextResponse.json({ error:'Plan is not awaiting approval' }, { status:409 })
  try { assertPlanApprovalReady(plan.plan as CodingPlan) } catch (error) {
    return NextResponse.json({ error:error instanceof Error ? error.message : 'Plan is not approval-ready' }, { status:409 })
  }
  const reviewedAt = new Date().toISOString()
  const { data:approved, error } = await supabase.from('coding_plans').update({ status:'approved', approved_at:reviewedAt, rejected_at:null, reviewed_by:user.id, rejection_reason:null }).eq('id', planId).select().single()
  if (error) return NextResponse.json({ error:error.message }, { status:500 })
  await supabase.from('coding_run_events').insert({ run_id:runId, event_type:'plan_approved', status:'awaiting_approval', message:`Plan v${plan.version} approved`, metadata:{ planId, version:plan.version } })
  return NextResponse.json({ plan:approved })
}
