import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../lib/api-auth'

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const projectId = new URL(request.url).searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  const [project, features, tasks, documents] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    supabase.from('features').select('*').eq('project_id', projectId),
    supabase.from('tasks').select('*').eq('project_id', projectId),
    supabase.from('documents').select('*').eq('project_id', projectId),
  ])
  if (project.error) return NextResponse.json({ error: project.error.message }, { status: 404 })
  return NextResponse.json({ context: { project: project.data, features: features.data ?? [], tasks: tasks.data ?? [], documents: documents.data ?? [] } })
}
