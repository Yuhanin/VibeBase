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
    const [repo,branches,commits,issues,pulls] = await Promise.all([
      projectGithubGet(config, ''),
      projectGithubGet(config, '/branches?per_page=30'),
      projectGithubGet(config, '/commits?per_page=10'),
      projectGithubGet(config, '/issues?state=open&per_page=20'),
      projectGithubGet(config, '/pulls?state=open&per_page=20'),
    ])
    return NextResponse.json({
      repository:{ fullName:repo.full_name, defaultBranch:repo.default_branch, private:repo.private, url:repo.html_url },
      branches:branches.map((branch:any)=>({ name:branch.name, protected:branch.protected })),
      commits:commits.map((commit:any)=>({ sha:commit.sha, message:commit.commit?.message?.split('\n')[0], date:commit.commit?.author?.date })),
      issues:issues.filter((item:any)=>!item.pull_request).map((item:any)=>({ number:item.number, title:item.title, url:item.html_url })),
      pullRequests:pulls.map((item:any)=>({ number:item.number, title:item.title, url:item.html_url, branch:item.head?.ref })),
    })
  } catch (error) {
    return NextResponse.json({ error:error instanceof Error ? error.message : 'GitHub error' }, { status:502 })
  }
}
