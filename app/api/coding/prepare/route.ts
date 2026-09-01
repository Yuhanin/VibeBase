import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/auth'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.taskId) return NextResponse.json({ error: 'taskId is required' }, { status: 400 })
  const { data: task } = await supabase.from('tasks').select('*').eq('id', body.taskId).single()
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  const branch = task.github_branch || `vibebase/task-${String(task.id).slice(0, 8)}`
  return NextResponse.json({ taskId: task.id, projectId: task.project_id, branch, next: ['load-context','generate-plan','create-branch','implement','test','pull-request','review','merge'] })
}
