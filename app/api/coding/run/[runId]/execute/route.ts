import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../../../../lib/api-auth'
import { assertPlanApprovalReady, type CodingPlan } from '../../../../../../lib/ai-planning'
import { generateAiFileChanges } from '../../../../../../lib/ai-coder'
import { loadTaskContext } from '../../../../../../lib/task-context'
import { getProjectGitHubConfig } from '../../../../../../lib/project-github'

const MAX_SOURCE_FILE_CHARS = 50000
const MAX_TOTAL_SOURCE_CHARS = 180000

function githubPath(path:string) { return path.split('/').map(encodeURIComponent).join('/') }

export async function POST(request: Request, { params }: { params: Promise<{ runId:string }> }) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const { runId } = await params
  const { data:run } = await supabase.from('coding_runs').select('*').eq('id', runId).eq('user_id', user.id).single()
  if (!run) return NextResponse.json({ error:'Run not found' }, { status:404 })
  const planId = run.active_plan_id
  if (!planId) return NextResponse.json({ error:'No active plan' }, { status:409 })
  const { data:planRow } = await supabase.from('coding_plans').select('*').eq('id', planId).eq('run_id', runId).eq('user_id', user.id).single()
  if (!planRow || planRow.status !== 'approved') return NextResponse.json({ error:'Active plan must be approved before execution' }, { status:409 })

  try {
    const plan = assertPlanApprovalReady(planRow.plan as CodingPlan)
    const context = await loadTaskContext(supabase, run.task_id)
    const config = await getProjectGitHubConfig(supabase, context.project.id)
    const sourceFiles: Record<string,string|null> = {}
    let totalChars = 0

    for (const file of plan.files) {
      if (file.action === 'create') { sourceFiles[file.path] = null; continue }
      const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${githubPath(file.path)}?ref=${encodeURIComponent(config.defaultBranch)}`, {
        headers:{ Authorization:`Bearer ${config.token}`, Accept:'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28' }, cache:'no-store',
      })
      if (!response.ok) throw new Error(`Planned ${file.action} file does not exist: ${file.path}`)
      const payload = await response.json()
      if (payload.type !== 'file' || typeof payload.content !== 'string') throw new Error(`Unsupported repository object: ${file.path}`)
      const content = Buffer.from(payload.content.replace(/\n/g,''), 'base64').toString('utf8')
      if (content.length > MAX_SOURCE_FILE_CHARS) throw new Error(`Planned file is too large for AI execution: ${file.path}`)
      totalChars += content.length
      if (totalChars > MAX_TOTAL_SOURCE_CHARS) throw new Error('Approved plan includes too much source content for one AI execution')
      sourceFiles[file.path] = content
    }

    const changes = await generateAiFileChanges({ context, plan, sourceFiles })
    await supabase.from('coding_run_events').insert({ run_id:runId, event_type:'changes_generated', status:'executing', message:'AI generated validated file changes', metadata:{ planId, fileCount:changes.length } })

    const execution = await fetch(new URL('/api/github/task-execution', request.url), {
      method:'POST',
      headers:{ 'content-type':'application/json', cookie:request.headers.get('cookie') ?? '' },
      body:JSON.stringify({ runId, planId, changes }),
      cache:'no-store',
    })
    const payload = await execution.json()
    if (!execution.ok) return NextResponse.json(payload, { status:execution.status })
    return NextResponse.json({ ...payload, generatedBy:'ai' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Execution failed'
    await supabase.from('coding_runs').update({ status:'failed', error_message:message, updated_at:new Date().toISOString() }).eq('id', runId).eq('user_id', user.id)
    await supabase.from('coding_run_events').insert({ run_id:runId, event_type:'execution_failed', status:'failed', message, metadata:{ planId } })
    return NextResponse.json({ error:message }, { status:400 })
  }
}
