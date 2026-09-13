import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../../lib/api-auth'
import { getProjectGitHubConfig, projectGithubGet } from '../../../../lib/project-github'

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const projectId = new URL(request.url).searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error:'projectId is required' }, { status:400 })
  try {
    const config = await getProjectGitHubConfig(supabase, projectId)
    const data = await projectGithubGet(config, '')
    return NextResponse.json({ connected:true, repository:{ fullName:data.full_name, defaultBranch:data.default_branch, private:data.private, url:data.html_url } })
  } catch (error) {
    return NextResponse.json({ connected:false, error:error instanceof Error ? error.message : 'GitHub error' }, { status:502 })
  }
}
