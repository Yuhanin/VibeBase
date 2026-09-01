import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/auth'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.taskId || !body.request?.trim()) return NextResponse.json({ error: 'taskId and request are required' }, { status: 400 })
  const { data: task, error } = await supabase.from('tasks').select('*').eq('id', body.taskId).single()
  if (error || !task) return NextResponse.json({ error: error?.message || 'Task not found' }, { status: 404 })
  const codingRequest = { taskId: task.id, title: task.title, description: task.description || '', request: body.request.trim(), status: 'ready' }
  return NextResponse.json({ codingRequest })
}
