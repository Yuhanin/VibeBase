import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function GET() {
  const { data, error } = await admin().from('projects').select('*').order('updated_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ projects: data ?? [] })
}

export async function POST(request: Request) {
  const body = await request.json()
  if (!body.name?.trim()) return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
  const db = admin()
  const slug = body.slug || body.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const { data: workspace } = await db.from('workspaces').select('id').limit(1).maybeSingle()
  if (!workspace) return NextResponse.json({ error: 'No workspace available' }, { status: 400 })
  const { data, error } = await db.from('projects').insert({ workspace_id: workspace.id, name: body.name.trim(), slug, description: body.description ?? '', problem: body.problem ?? '', target_audience: body.targetAudience ?? '', vision: body.vision ?? '', tech_stack: body.techStack ?? {}, progress: 0 }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ project: data }, { status: 201 })
}
