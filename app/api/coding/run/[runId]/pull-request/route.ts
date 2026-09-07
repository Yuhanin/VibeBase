import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../../../../lib/api-auth'

export async function POST(request: Request, { params }: { params: Promise<{ runId:string }> }) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const { runId } = await params
  const { data:run } = await supabase.from('coding_runs').select('*').eq('id', runId).eq('user_id', user.id).single()
  if (!run) return NextResponse.json({ error:'Run not found' }, { status:404 })
  if (!run.commit_sha || !run.branch) return NextResponse.json({ error:'Run must have an executed commit before creating a pull request' }, { status:409 })

  const response = await fetch(new URL('/api/github/task-pr', request.url), {
    method:'POST',
    headers:{ 'content-type':'application/json', cookie:request.headers.get('cookie') ?? '' },
    body:JSON.stringify({ taskId:run.task_id }),
    cache:'no-store',
  })
  const payload = await response.json()
  if (!response.ok) return NextResponse.json(payload, { status:response.status })

  const updatedAt = new Date().toISOString()
  const { data:updated, error } = await supabase.from('coding_runs').update({
    pr_number:payload.number,
    pr_url:payload.url,
    status:'verifying',
    updated_at:updatedAt,
  }).eq('id', runId).eq('user_id', user.id).select().single()
  if (error) return NextResponse.json({ error:error.message }, { status:500 })
  await supabase.from('coding_run_events').insert({ run_id:runId, event_type:'pull_request_created', status:'verifying', message:`Pull request #${payload.number} ready for CI`, metadata:{ prNumber:payload.number, prUrl:payload.url, reused:Boolean(payload.reused) } })
  return NextResponse.json({ run:updated, pullRequest:payload })
}
