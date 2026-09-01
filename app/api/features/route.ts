import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  const { data, error } = await db().from('features').select('*').eq('project_id', projectId).order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ features: data ?? [] })
}

export async function POST(request: Request) {
  const body = await request.json()
  if (!body.projectId || !body.name?.trim()) return NextResponse.json({ error: 'projectId and name are required' }, { status: 400 })
  const { data, error } = await db().from('features').insert({ project_id: body.projectId, name: body.name.trim(), description: body.description ?? '', priority: body.priority ?? 'medium', acceptance_criteria: body.acceptanceCriteria ?? '' }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ feature: data }, { status: 201 })
}
