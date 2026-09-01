import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/auth'

export async function POST(request: Request) {
  const supabase = await createSupabaseServer(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error:'Unauthorized' },{status:401})
  const body=await request.json(); if(!body.taskId) return NextResponse.json({error:'taskId is required'},{status:400})
  const {data:task}=await supabase.from('tasks').select('id,title,project_id').eq('id',body.taskId).single(); if(!task)return NextResponse.json({error:'Task not found'},{status:404})
  const {data:project}=await supabase.from('projects').select('github_owner,github_repo,github_default_branch').eq('id',task.project_id).single(); if(!project?.github_owner||!project.github_repo)return NextResponse.json({error:'Project GitHub repository is not configured'},{status:400})
  const token=process.env.GITHUB_TOKEN;if(!token)return NextResponse.json({error:'GitHub integration is not configured'},{status:503})
  const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}
  const base=project.github_default_branch||'main'; const branch=(body.branch||`vibebase/task-${task.id.slice(0,8)}`).replace(/[^A-Za-z0-9._/-]/g,'-')
  const ref=await fetch(`https://api.github.com/repos/${project.github_owner}/${project.github_repo}/git/ref/heads/${base}`,{headers});if(!ref.ok)return NextResponse.json({error:`GitHub base branch unavailable (${ref.status})`},{status:502});const refData=await ref.json()
  const create=await fetch(`https://api.github.com/repos/${project.github_owner}/${project.github_repo}/git/refs`,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({ref:`refs/heads/${branch}`,sha:refData.object.sha})});if(!create.ok)return NextResponse.json({error:`Could not create branch (${create.status})`},{status:502})
  await supabase.from('tasks').update({github_branch:branch,status:'prompt_ready',workflow_status:'prompt_ready'}).eq('id',task.id)
  return NextResponse.json({branch,base,taskId:task.id})
}
