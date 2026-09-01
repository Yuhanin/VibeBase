import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/auth'

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.taskId || !['backlog','in_progress','review','done'].includes(body.status)) return NextResponse.json({ error: 'Invalid task status' }, { status: 400 })
  const { data, error } = await supabase.from('tasks').update({ status: body.status }).eq('id', body.taskId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ task: data })
}
