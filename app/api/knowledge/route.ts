import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../lib/api-auth'

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const projectId = new URL(request.url).searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  const [documents, decisions, issues, releases] = await Promise.all([
    supabase.from('documents').select('*').eq('project_id', projectId).order('updated_at', { ascending: false }),
    supabase.from('decisions').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
    supabase.from('issues').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
    supabase.from('releases').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
  ])
  return NextResponse.json({
    documents: documents.data ?? [],
    decisions: decisions.data ?? [],
    issues: issues.data ?? [],
    releases: releases.data ?? [],
  })
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const body = await request.json()
  if (!body.projectId || !body.title?.trim() || !body.content?.trim()) return NextResponse.json({ error: 'projectId, title and content are required' }, { status: 400 })
  const { data, error } = await supabase.from('documents').insert({
    project_id: body.projectId,
    title: body.title.trim(),
    content: body.content.trim(),
    type: body.type ?? 'documentation',
    created_by: user.id,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ document: data }, { status: 201 })
}

export async function PATCH(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const patch: Record<string, unknown> = {}
  for (const key of ['title','content','type']) if (body[key] !== undefined) patch[key] = body[key]
  const { data, error } = await supabase.from('documents').update(patch).eq('id', body.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ document: data })
}

export async function DELETE(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
