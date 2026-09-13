import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../lib/api-auth'

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const projectId = new URL(request.url).searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  const { data, error } = await supabase.from('features').select('*').eq('project_id', projectId).order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ features: data ?? [] })
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const body = await request.json()
  const title = body.title ?? body.name
  if (!body.projectId || !title?.trim()) return NextResponse.json({ error: 'projectId and title are required' }, { status: 400 })
  const acceptanceCriteria = Array.isArray(body.acceptanceCriteria) ? body.acceptanceCriteria : []
  const { data, error } = await supabase.from('features').insert({
    project_id: body.projectId,
    title: title.trim(),
    description: body.description ?? '',
    priority: body.priority ?? 'medium',
    status: body.status ?? 'backlog',
    mvp: Boolean(body.mvp),
    acceptance_criteria: acceptanceCriteria,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ feature: data }, { status: 201 })
}
