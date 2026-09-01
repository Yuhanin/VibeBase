import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/auth'

export async function GET(req: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const taskId = new URL(req.url).searchParams.get('taskId')
  if (!taskId) return NextResponse.json({ error: 'taskId is required' }, { status: 400 })
  const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single()
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  const [features, prompts, knowledge] = await Promise.all([
    supabase.from('features').select('*').eq('project_id', task.project_id),
    supabase.from('prompts').select('*').eq('project_id', task.project_id),
    supabase.from('knowledge').select('*').eq('project_id', task.project_id),
  ])
  return NextResponse.json({ task, features: features.data || [], prompts: prompts.data || [], knowledge: knowledge.data || [] })
}
