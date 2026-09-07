import type { SupabaseClient } from '@supabase/supabase-js'

export async function loadTaskContext(supabase: SupabaseClient, taskId: string) {
  const { data: task, error } = await supabase.from('tasks').select('*').eq('id', taskId).single()
  if (error || !task) throw new Error('Task not found')

  const [project, feature, decisions, documents, prompts, runs] = await Promise.all([
    supabase.from('projects').select('*').eq('id', task.project_id).single(),
    task.feature_id ? supabase.from('features').select('*').eq('id', task.feature_id).maybeSingle() : Promise.resolve({ data:null, error:null }),
    supabase.from('decisions').select('*').eq('project_id', task.project_id).order('created_at', { ascending:false }).limit(25),
    supabase.from('documents').select('*').eq('project_id', task.project_id).order('updated_at', { ascending:false }).limit(50),
    supabase.from('prompts').select('*').eq('project_id', task.project_id).order('updated_at', { ascending:false }).limit(25),
    supabase.from('coding_runs').select('id,status,request,branch,pr_number,pr_url,commit_sha,created_at,updated_at').eq('task_id', taskId).order('created_at', { ascending:false }).limit(10),
  ])

  if (project.error || !project.data) throw new Error('Project not found')

  return {
    contextVersion:'2.0',
    generatedAt:new Date().toISOString(),
    task,
    project:project.data,
    feature:feature.data ?? null,
    decisions:decisions.data ?? [],
    documents:documents.data ?? [],
    prompts:prompts.data ?? [],
    previousRuns:runs.data ?? [],
  }
}
