import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/auth'
import { validateChanges, type FileChange } from '../../../../lib/coding-agent'
import { assertPlanApprovalReady, type CodingPlan } from '../../../../lib/ai-planning'
import { createAtomicCommit } from '../../../../lib/github-atomic'

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

  try {
    const body = await request.json() as { runId:string; planId?:string; changes:FileChange[] }
    if (!body.runId) throw new Error('runId is required')
    validateChanges(body.changes)

    const { data:run } = await supabase.from('coding_runs').select('*').eq('id', body.runId).eq('user_id', user.id).single()
    if (!run) return NextResponse.json({ error:'Run not found' }, { status:404 })
    if (['completed','cancelled','verifying'].includes(run.status)) return NextResponse.json({ error:`Run cannot execute from status ${run.status}` }, { status:409 })

    const planId = body.planId ?? run.active_plan_id
    if (!planId) return NextResponse.json({ error:'An approved plan is required' }, { status:409 })
    const { data:planRow } = await supabase.from('coding_plans').select('*').eq('id', planId).eq('run_id', run.id).eq('user_id', user.id).single()
    if (!planRow || planRow.status !== 'approved') return NextResponse.json({ error:'Active plan is not approved' }, { status:409 })
    const plan = assertPlanApprovalReady(planRow.plan as CodingPlan)

    const expected = new Set(plan.files.map(file => `${file.action}:${file.path}`))
    const received = new Set(body.changes.map(change => `${change.operation}:${change.path.replaceAll('\\','/')}`))
    if (expected.size !== received.size || [...expected].some(key => !received.has(key))) return NextResponse.json({ error:'Changes must exactly match the approved plan files and operations' }, { status:409 })

    const { data:task } = await supabase.from('tasks').select('id,title,project_id,github_branch').eq('id', run.task_id).single()
    if (!task) return NextResponse.json({ error:'Task not found' }, { status:404 })

    let branch = task.github_branch as string | null
    if (!branch) {
      const branchResponse = await fetch(new URL('/api/github/task-branch', request.url), {
        method:'POST', headers:{ 'content-type':'application/json', cookie:request.headers.get('cookie') ?? '' }, body:JSON.stringify({ taskId:task.id }), cache:'no-store',
      })
      if (!branchResponse.ok) return NextResponse.json({ error:(await branchResponse.json()).error ?? 'Could not create task branch' }, { status:branchResponse.status })
      branch = (await branchResponse.json()).branch
    }

    const { data:project } = await supabase.from('projects').select('github_owner,github_repo').eq('id', task.project_id).single()
    const token = process.env.GITHUB_TOKEN
    if (!project?.github_owner || !project.github_repo || !token) return NextResponse.json({ error:'GitHub integration is not configured' }, { status:503 })

    await supabase.from('coding_runs').update({ status:'executing', branch, updated_at:new Date().toISOString() }).eq('id', run.id).eq('user_id', user.id)
    await supabase.from('coding_run_events').insert({ run_id:run.id, event_type:'execution_started', status:'executing', message:`Executing approved plan v${planRow.version}`, metadata:{ planId, version:planRow.version, branch } })

    const commit = await createAtomicCommit({ owner:project.github_owner, repo:project.github_repo, branch, token, message:`feat: implement ${task.title}`, changes:body.changes })
    await supabase.from('tasks').update({ github_commit_sha:commit.commitSha, status:'active' }).eq('id', task.id)
    await supabase.from('coding_runs').update({ commit_sha:commit.commitSha, branch, updated_at:new Date().toISOString() }).eq('id', run.id).eq('user_id', user.id)
    await supabase.from('coding_run_events').insert({ run_id:run.id, event_type:'commit_created', status:'executing', message:'Atomic Git commit created', metadata:{ planId, commitSha:commit.commitSha, branch, fileCount:body.changes.length } })

    return NextResponse.json({ ok:true, runId:run.id, taskId:task.id, planId, branch, commitSha:commit.commitSha, fileCount:body.changes.length })
  } catch (error) {
    return NextResponse.json({ error:error instanceof Error ? error.message : 'Execution failed' }, { status:400 })
  }
}
