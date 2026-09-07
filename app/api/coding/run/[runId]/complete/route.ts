import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../../../../lib/api-auth'

export async function POST(request: Request, { params }: { params: Promise<{ runId:string }> }) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const { runId } = await params
  const { data:run } = await supabase.from('coding_runs').select('*,tasks!inner(project_id)').eq('id', runId).eq('user_id', user.id).single()
  if (!run) return NextResponse.json({ error:'Run not found' }, { status:404 })
  if (run.status !== 'review') return NextResponse.json({ error:'Run must pass CI and enter review before completion' }, { status:409 })
  if (!run.pr_number || !run.commit_sha) return NextResponse.json({ error:'Run must have a PR and commit before completion' }, { status:409 })

  const { data:project } = await supabase.from('projects').select('github_owner,github_repo').eq('id', run.tasks.project_id).single()
  const token = process.env.GITHUB_TOKEN
  if (!project?.github_owner || !project.github_repo || !token) return NextResponse.json({ error:'GitHub integration is not configured' }, { status:503 })
  const headers = { Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28' }

  const [prResponse, checksResponse] = await Promise.all([
    fetch(`https://api.github.com/repos/${project.github_owner}/${project.github_repo}/pulls/${run.pr_number}`, { headers, cache:'no-store' }),
    fetch(`https://api.github.com/repos/${project.github_owner}/${project.github_repo}/commits/${run.commit_sha}/check-runs`, { headers, cache:'no-store' }),
  ])
  if (!prResponse.ok || !checksResponse.ok) return NextResponse.json({ error:'Could not verify GitHub completion gates' }, { status:502 })
  const pr = await prResponse.json()
  const checksPayload = await checksResponse.json()
  const checks = checksPayload.check_runs ?? []
  const pending = checks.length === 0 || checks.some((check:any)=>check.status !== 'completed')
  const failed = checks.some((check:any)=>!['success','neutral','skipped'].includes(check.conclusion))
  if (pending || failed) return NextResponse.json({ error:'CI checks are not successfully completed' }, { status:409 })
  if (!pr.merged_at) return NextResponse.json({ error:'Pull request must be merged before completion' }, { status:409 })

  const body = await request.json().catch(() => ({}))
  const completedAt = new Date().toISOString()
  const { data:updated, error } = await supabase.from('coding_runs').update({ status:'completed', updated_at:completedAt, error_message:null }).eq('id', runId).eq('user_id', user.id).select().single()
  if (error) return NextResponse.json({ error:error.message }, { status:500 })
  await supabase.from('tasks').update({ status:'done' }).eq('id', run.task_id)
  await supabase.from('coding_run_events').insert({ run_id:runId, event_type:'completed', status:'completed', message:body.message ?? 'Coding run completed after CI and merge verification', metadata:{ ...(body.metadata ?? {}), prNumber:run.pr_number, mergeCommitSha:pr.merge_commit_sha, mergedAt:pr.merged_at } })
  return NextResponse.json({ run:updated, verification:{ ci:true, merged:true, mergeCommitSha:pr.merge_commit_sha } })
}
