import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../../../lib/api-auth'
import { loadTaskContext } from '../../../../../lib/task-context'

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const taskId = new URL(request.url).searchParams.get('taskId')
  if (!taskId) return NextResponse.json({ error:'taskId is required' }, { status:400 })
  try {
    return NextResponse.json(await loadTaskContext(supabase, taskId))
  } catch (error) {
    return NextResponse.json({ error:error instanceof Error ? error.message : 'Context load failed' }, { status:404 })
  }
}
