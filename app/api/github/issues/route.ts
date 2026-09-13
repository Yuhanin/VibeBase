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
    const data = await projectGithubGet(config, '/issues?state=open&per_page=30')
    return NextResponse.json({ issues:data.filter((item:any)=>!item.pull_request).map((item:any)=>({ number:item.number, title:item.title, state:item.state, url:item.html_url, labels:item.labels?.map((label:any)=>label.name) ?? [] })) })
  } catch (error) {
    return NextResponse.json({ error:error instanceof Error ? error.message : 'GitHub error' }, { status:502 })
  }
}
