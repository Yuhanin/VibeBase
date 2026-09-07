import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../../../../lib/api-auth'

export async function POST(_: Request, { params }: { params: Promise<{ runId:string }> }) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const { runId } = await params
  const { data:run } = await supabase.from('coding_runs').select('*,tasks!inner(project_id)').eq('id', runId).eq('user_id', user.id).single()
  if (!run) return NextResponse.json({ error:'Run not found' }, { status:404 })
  const { data:project } = await supabase.from('projects').select('github_owner,github_repo').eq('id', run.tasks.project_id).single()
  if (!project?.github_owner || !project.github_repo || !run.commit_sha) return NextResponse.json({ error:'GitHub repository or commit SHA is missing' }, { status:400 })
  const token = process.env.GITHUB_TOKEN
  if (!token) return NextResponse.json({ error:'GitHub integration is not configured' }, { status:503 })

  const response = await fetch(`https://api.github.com/repos/${project.github_owner}/${project.github_repo}/commits/${run.commit_sha}/check-runs`, {
    headers:{ Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28' }, cache:'no-store',
  })
  if (!response.ok) return NextResponse.json({ error:`GitHub checks unavailable (${response.status})` }, { status:502 })
  const payload = await response.json()
  const checks = (payload.check_runs ?? []).map((check:any)=>({ name:check.name, status:check.status, conclusion:check.conclusion, url:check.html_url }))
  const failed = checks.some((check:any)=>['failure','cancelled','timed_out','action_required'].includes(check.conclusion))
  const pending = checks.length === 0 || checks.some((check:any)=>check.status !== 'completed')
  const status = pending ? 'verifying' : failed ? 'failed' : 'review'
  const message = pending ? 'CI pending' : failed ? 'CI failed' : 'CI passed'
  await supabase.from('coding_runs').update({ status, updated_at:new Date().toISOString(), error_message:failed?'One or more GitHub checks failed':null }).eq('id', runId).eq('user_id', user.id)
  await supabase.from('coding_run_events').insert({ run_id:runId, event_type:'ci_sync', status, message, metadata:{ checks } })
  return NextResponse.json({ status, checks, ready:!pending&&!failed })
}
