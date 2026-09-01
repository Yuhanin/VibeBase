import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/auth'

const stages = [
  ['context','Context'],['plan','Plan'],['validate','Validation'],['branch','GitHub Branch'],['implementation','Implementation'],['ci','CI'],['review','Review'],['deploy','Deployment'],['verify','Production Verification'],['complete','Complete'],
] as const
export async function GET(req:Request){
  const s=await createSupabaseServer(); const {data:{user}}=await s.auth.getUser();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
  const id=new URL(req.url).searchParams.get('taskId'); if(!id)return NextResponse.json({error:'taskId is required'},{status:400})
  const {data:t,error}=await s.from('tasks').select('id,title,status,workflow_status,github_branch,github_pr_number,github_pr_url').eq('id',id).single()
  if(error||!t)return NextResponse.json({error:'Task not found'},{status:404})
  const current=t.workflow_status||t.status||'backlog'; const map:any={backlog:0,in_progress:4,review:6,done:9}; const active=map[current]??0
  return NextResponse.json({task:t,stages:stages.map(([key,label],i)=>({key,label,status:i<active?'completed':i===active?'active':'pending'}))})
}
