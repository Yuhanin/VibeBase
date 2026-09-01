import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildProjectContext } from '../../../../../lib/ai-context'

const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()
  const [project, features, tasks, prompts, documents, decisions, issues, releases] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('features').select('*').eq('project_id', id).order('created_at'),
    supabase.from('tasks').select('*').eq('project_id', id).order('created_at'),
    supabase.from('prompts').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('documents').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('decisions').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('issues').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('releases').select('*').eq('project_id', id).order('created_at', { ascending: false }),
  ])
  if (project.error) return NextResponse.json({ error: project.error.message }, { status: 404 })
  const context = buildProjectContext({ project: project.data, features: features.data ?? [], tasks: tasks.data ?? [], prompts: prompts.data ?? [], documents: documents.data ?? [], decisions: decisions.data ?? [], issues: issues.data ?? [], releases: releases.data ?? [] })
  return NextResponse.json({ context })
}
