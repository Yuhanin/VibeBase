import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../../../../lib/api-auth'
import { planFromContext, validatePlan, type CodingPlan } from '../../../../../../lib/ai-planning'
import { loadTaskContext } from '../../../../../../lib/task-context'

export async function GET(_: Request, { params }: { params: Promise<{ runId:string }> }) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const { runId } = await params
  const { data:run } = await supabase.from('coding_runs').select('id,active_plan_id').eq('id', runId).eq('user_id', user.id).single()
  if (!run) return NextResponse.json({ error:'Run not found' }, { status:404 })
  const { data:plans, error } = await supabase.from('coding_plans').select('*').eq('run_id', runId).order('version', { ascending:false })
  if (error) return NextResponse.json({ error:error.message }, { status:500 })
  return NextResponse.json({ activePlanId:run.active_plan_id ?? null, plans:plans ?? [] })
}

export async function POST(request: Request, { params }: { params: Promise<{ runId:string }> }) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const { runId } = await params
  const { data:run } = await supabase.from('coding_runs').select('*').eq('id', runId).eq('user_id', user.id).single()
  if (!run) return NextResponse.json({ error:'Run not found' }, { status:404 })
  if (['executing','verifying','completed'].includes(run.status)) return NextResponse.json({ error:'Run can no longer be replanned' }, { status:409 })

  const body = await request.json().catch(() => ({}))
  let plan: CodingPlan
  try {
    const context = await loadTaskContext(supabase, run.task_id)
    plan = validatePlan(body.plan ? body.plan as CodingPlan : planFromContext(context))
  } catch (error) {
    return NextResponse.json({ error:error instanceof Error ? error.message : 'Planning failed' }, { status:400 })
  }

  const { data:latest } = await supabase.from('coding_plans').select('version').eq('run_id', runId).order('version', { ascending:false }).limit(1).maybeSingle()
  const version = (latest?.version ?? 0) + 1

  await supabase.from('coding_plans').update({ status:'superseded' }).eq('run_id', runId).in('status', ['draft','pending_approval','approved'])
  const { data:created, error } = await supabase.from('coding_plans').insert({
    run_id:runId,
    task_id:run.task_id,
    user_id:user.id,
    version,
    status:'pending_approval',
    plan,
  }).select().single()
  if (error) return NextResponse.json({ error:error.message }, { status:500 })

  await supabase.from('coding_runs').update({ active_plan_id:created.id, status:'awaiting_approval', updated_at:new Date().toISOString() }).eq('id', runId).eq('user_id', user.id)
  await supabase.from('coding_run_events').insert({ run_id:runId, event_type:'plan_created', status:'awaiting_approval', message:`Plan v${version} created`, metadata:{ planId:created.id, version } })
  return NextResponse.json({ plan:created }, { status:201 })
}
