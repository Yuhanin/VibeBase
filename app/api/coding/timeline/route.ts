import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../../lib/api-auth'

const stages=[['context','Context'],['plan','Plan'],['validate','Validation'],['branch','GitHub Branch'],['implementation','Implementation'],['ci','CI'],['review','Review'],['deploy','Deployment'],['verify','Production Verification'],['complete','Complete']] as const
const statusStage:Record<string,number>={backlog:0,ready:1,active:4,review:6,testing:5,done:9,blocked:4}

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const taskId = new URL(request.url).searchParams.get('taskId')
  if (!taskId) return NextResponse.json({ error:'taskId is required' }, { status:400 })
  const { data:task, error } = await supabase.from('tasks').select('id,title,status,github_branch,github_pr_number,github_pr_url,github_commit_sha').eq('id', taskId).single()
  if (error || !task) return NextResponse.json({ error:'Task not found' }, { status:404 })
  const active = statusStage[task.status] ?? 0
  return NextResponse.json({ task, stages:stages.map(([key,label],index)=>({ key,label,status:index<active?'completed':index===active?'active':'pending' })) })
}
