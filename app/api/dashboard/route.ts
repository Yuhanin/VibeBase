import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../lib/api-auth'

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const projectId = new URL(request.url).searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  const [project, features, tasks, issues, releases] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    supabase.from('features').select('id,priority').eq('project_id', projectId),
    supabase.from('tasks').select('id,status,priority').eq('project_id', projectId),
    supabase.from('issues').select('id,status').eq('project_id', projectId),
    supabase.from('releases').select('id,status').eq('project_id', projectId),
  ])
  if (project.error) return NextResponse.json({ error: project.error.message }, { status: 404 })
  return NextResponse.json({
    project: project.data,
    stats: {
      features: features.data?.length ?? 0,
      tasks: tasks.data?.length ?? 0,
      doneTasks: tasks.data?.filter(x => x.status === 'done').length ?? 0,
      openIssues: issues.data?.filter(x => !['resolved','closed'].includes(x.status)).length ?? 0,
      releases: releases.data?.length ?? 0,
    },
  })
}
