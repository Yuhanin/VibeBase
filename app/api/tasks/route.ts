import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../lib/api-auth'
import { isTaskStatus } from '../../../lib/domain'

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const projectId = new URL(request.url).searchParams.get('projectId')
  let query = supabase.from('tasks').select('*').order('created_at')
  if (projectId) query = query.eq('project_id', projectId)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tasks: data ?? [] })
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const body = await request.json()
  if (!body.projectId || !body.title?.trim()) return NextResponse.json({ error: 'projectId and title are required' }, { status: 400 })
  const status = body.status ?? 'backlog'
  if (!isTaskStatus(status)) return NextResponse.json({ error: 'Invalid task status' }, { status: 400 })
  const { data, error } = await supabase.from('tasks').insert({
    project_id: body.projectId,
    feature_id: body.featureId ?? null,
    title: body.title.trim(),
    description: body.description ?? '',
    status,
    priority: body.priority ?? 'medium',
    due_date: body.dueDate ?? null,
    prompt: body.prompt ?? null,
    acceptance_criteria: Array.isArray(body.acceptanceCriteria) ? body.acceptanceCriteria : [],
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ task: data }, { status: 201 })
}

export async function PATCH(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const patch: Record<string, unknown> = {}
  for (const key of ['title','description','priority','due_date','feature_id','prompt','acceptance_criteria']) if (body[key] !== undefined) patch[key] = body[key]
  const requestedStatus = body.status ?? body.workflow_status
  if (requestedStatus !== undefined) {
    if (!isTaskStatus(requestedStatus)) return NextResponse.json({ error: 'Invalid task status' }, { status: 400 })
    patch.status = requestedStatus
  }
  const { data, error } = await supabase.from('tasks').update(patch).eq('id', body.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ task: data })
}

export async function DELETE(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
