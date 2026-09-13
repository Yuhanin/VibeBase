import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/auth'

export async function POST(request: Request) {
  const s = await createSupabaseServer()
  const { data:{ user } } = await s.auth.getUser()
  if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  const body = await request.json()
  if (!body.taskId) return NextResponse.json({ error:'taskId is required' }, { status:400 })
  const { data:task } = await s.from('tasks').select('id,title,description,project_id,github_branch,github_pr_number,github_pr_url').eq('id', body.taskId).single()
  if (!task) return NextResponse.json({ error:'Task not found' }, { status:404 })
  const { data:canEdit } = await s.rpc('can_edit_project', { p_project_id:task.project_id })
  if (!canEdit) return NextResponse.json({ error:'Insufficient project permission' }, { status:403 })
  if (task.github_pr_number) return NextResponse.json({ number:task.github_pr_number, url:task.github_pr_url, reused:true })
  if (!task.github_branch) return NextResponse.json({ error:'Task branch is required' }, { status:400 })
  const { data:project } = await s.from('projects').select('github_owner,github_repo,github_default_branch').eq('id', task.project_id).single()
  const token = process.env.GITHUB_TOKEN
  if (!project?.github_owner || !project.github_repo || !token) return NextResponse.json({ error:'GitHub integration is not configured' }, { status:503 })
  const response = await fetch(`https://api.github.com/repos/${project.github_owner}/${project.github_repo}/pulls`, {
    method:'POST', headers:{ Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28', 'Content-Type':'application/json' },
    body:JSON.stringify({ title:body.title||task.title, head:task.github_branch, base:project.github_default_branch||'main', body:body.body||task.description||`VibeBase task: ${task.title}`, draft:Boolean(body.draft) }),
  })
  if (!response.ok) return NextResponse.json({ error:`GitHub PR creation failed (${response.status})` }, { status:502 })
  const pr = await response.json()
  await s.from('tasks').update({ github_pr_number:pr.number, github_pr_url:pr.html_url, status:'review' }).eq('id', task.id)
  return NextResponse.json({ number:pr.number, url:pr.html_url, branch:task.github_branch, reused:false })
}
