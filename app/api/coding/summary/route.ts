import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../../lib/api-auth'

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const taskId = new URL(request.url).searchParams.get('taskId')
  if (!taskId) return NextResponse.json({ error:'taskId is required' }, { status:400 })
  const { data:task } = await supabase.from('tasks').select('id,title,description,status,github_branch,github_pr_number,github_pr_url,github_commit_sha,created_at,updated_at').eq('id', taskId).single()
  if (!task) return NextResponse.json({ error:'Task not found' }, { status:404 })
  return NextResponse.json({ task, summary:{ state:task.status, github:task.github_branch?{ branch:task.github_branch, commitSha:task.github_commit_sha ?? null, pr:task.github_pr_number ?? null, url:task.github_pr_url ?? null }:null } })
}
