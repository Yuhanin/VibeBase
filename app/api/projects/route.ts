import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../lib/auth'

export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase.from('projects').select('*').order('updated_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ projects: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  if (!body.name?.trim()) return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
  const slug = body.slug || body.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  let { data: workspace } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1).maybeSingle()
  if (!workspace) {
    const created = await supabase.from('workspaces').insert({ owner_id: user.id, name: `${body.name.trim()} Workspace`, slug: `${slug}-workspace` }).select('id').single()
    if (created.error) return NextResponse.json({ error: created.error.message }, { status: 500 })
    workspace = created.data
  }
  const { data, error } = await supabase.from('projects').insert({ owner_id: user.id, workspace_id: workspace.id, name: body.name.trim(), slug, description: body.description ?? '', problem: body.problem ?? body.problemStatement ?? '', target_audience: body.targetAudience ?? '', vision: body.vision ?? '', tech_stack: body.techStack ?? {}, progress: 0 }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ project: data }, { status: 201 })
}
