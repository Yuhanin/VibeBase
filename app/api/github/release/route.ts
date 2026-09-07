import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/auth'

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const { data:{ user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  const body = await request.json()
  if (!body.projectId || !body.tagName) return NextResponse.json({ error:'projectId and tagName are required' }, { status:400 })
  const { data:canManage } = await supabase.rpc('can_manage_project', { p_project_id:body.projectId })
  if (!canManage) return NextResponse.json({ error:'Project admin permission is required' }, { status:403 })
  const { data:project } = await supabase.from('projects').select('github_owner,github_repo').eq('id', body.projectId).single()
  const token = process.env.GITHUB_TOKEN
  if (!project?.github_owner || !project.github_repo || !token) return NextResponse.json({ error:'GitHub integration is not configured' }, { status:503 })
  const response = await fetch(`https://api.github.com/repos/${project.github_owner}/${project.github_repo}/releases`, {
    method:'POST', headers:{ Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28', 'Content-Type':'application/json' },
    body:JSON.stringify({ tag_name:body.tagName, name:body.name||body.tagName, body:body.body||'', draft:Boolean(body.draft), prerelease:Boolean(body.prerelease) }),
  })
  if (!response.ok) return NextResponse.json({ error:`GitHub release failed (${response.status})` }, { status:502 })
  const release = await response.json()
  const { data:dbRelease, error } = await supabase.from('releases').insert({ project_id:body.projectId, version:body.version||body.tagName, name:body.name||body.tagName, status:'released', release_notes:body.body||'', target_date:new Date().toISOString().slice(0,10) }).select().single()
  if (error) return NextResponse.json({ error:`GitHub release was created, but VibeBase persistence failed: ${error.message}`, github:{ id:release.id, url:release.html_url, tagName:release.tag_name } }, { status:500 })
  return NextResponse.json({ github:{ id:release.id, url:release.html_url, tagName:release.tag_name }, release:dbRelease })
}
