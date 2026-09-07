import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../lib/api-auth'

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const projectId = new URL(request.url).searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  const { data, error } = await supabase.from('issues').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ issues: data ?? [] })
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const body = await request.json()
  if (!body.projectId || !body.title?.trim()) return NextResponse.json({ error: 'projectId and title are required' }, { status: 400 })
  const { data, error } = await supabase.from('issues').insert({
    project_id: body.projectId,
    feature_id: body.featureId ?? null,
    title: body.title.trim(),
    description: body.description ?? '',
    status: body.status ?? 'open',
    priority: body.priority ?? 'medium',
    created_by: user.id,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ issue: data }, { status: 201 })
}
