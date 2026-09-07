import type { SupabaseClient } from '@supabase/supabase-js'

export type ProjectGitHubConfig = { owner:string; repo:string; defaultBranch:string; token:string }

export async function getProjectGitHubConfig(supabase: SupabaseClient, projectId:string): Promise<ProjectGitHubConfig> {
  const { data:project, error } = await supabase.from('projects').select('github_owner,github_repo,github_default_branch').eq('id', projectId).single()
  if (error || !project?.github_owner || !project.github_repo) throw new Error('Project GitHub repository is not configured')
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GitHub integration is not configured')
  return { owner:project.github_owner, repo:project.github_repo, defaultBranch:project.github_default_branch || 'main', token }
}

export async function projectGithubGet(config: ProjectGitHubConfig, path:string) {
  const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}${path}`, {
    headers:{ Authorization:`Bearer ${config.token}`, Accept:'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28' },
    cache:'no-store',
  })
  if (!response.ok) throw new Error(`GitHub API ${response.status}`)
  return response.json()
}
