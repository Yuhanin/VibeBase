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
    const branches = await projectGithubGet(config, '/branches?per_page=100')
    return NextResponse.json({ connected:true, branches:branches.map((branch:{name:string;protected:boolean})=>({ name:branch.name, protected:branch.protected })) })
  } catch (error) {
    return NextResponse.json({ connected:false, branches:[], error:error instanceof Error ? error.message : 'GitHub error' }, { status:502 })
  }
}
