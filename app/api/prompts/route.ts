import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../lib/api-auth'

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const projectId = new URL(request.url).searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  const { data, error } = await supabase.from('prompts').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ prompts: data ?? [] })
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const body = await request.json()
  if (!body.projectId || !body.title?.trim() || !body.content?.trim()) return NextResponse.json({ error: 'projectId, title and content are required' }, { status: 400 })
  const { data, error } = await supabase.from('prompts').insert({
    project_id: body.projectId,
    title: body.title.trim(),
    content: body.content.trim(),
    category: body.category ?? 'feature',
    tags: Array.isArray(body.tags) ? body.tags : [],
    system_context: body.systemContext ?? null,
    created_by: user.id,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ prompt: data }, { status: 201 })
}
