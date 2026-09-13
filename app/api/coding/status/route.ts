import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../../lib/api-auth'
import { isTaskStatus } from '../../../../lib/domain'

export async function PATCH(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const body = await request.json()
  if (!body.taskId || !isTaskStatus(body.status)) return NextResponse.json({ error:'Invalid task status' }, { status:400 })
  const { data, error } = await supabase.from('tasks').update({ status:body.status }).eq('id', body.taskId).select().single()
  if (error) return NextResponse.json({ error:error.message }, { status:500 })
  return NextResponse.json({ task:data })
}
