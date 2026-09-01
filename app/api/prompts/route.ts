import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  const { data, error } = await db().from('prompts').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ prompts: data ?? [] })
}

export async function POST(request: Request) {
  const body = await request.json()
  if (!body.projectId || !body.title?.trim() || !body.content?.trim()) return NextResponse.json({ error: 'projectId, title and content are required' }, { status: 400 })
  const { data, error } = await db().from('prompts').insert({ project_id: body.projectId, title: body.title.trim(), content: body.content.trim(), category: body.category ?? 'general' }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ prompt: data }, { status: 201 })
}
