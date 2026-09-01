import {NextResponse} from 'next/server'
import {createSupabaseServer} from '../../../../../lib/auth'

export async function GET(req:Request){
 const s=await createSupabaseServer(); const {data:{user}}=await s.auth.getUser(); if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
 const taskId=new URL(req.url).searchParams.get('taskId'); if(!taskId)return NextResponse.json({error:'taskId is required'},{status:400})
 const {data:task,error}=await s.from('tasks').select('*').eq('id',taskId).single(); if(error||!task)return NextResponse.json({error:'Task not found'},{status:404})
 const [project,feature,decisions,docs,knowledge,runs]=await Promise.all([
  s.from('projects').select('*').eq('id',task.project_id).maybeSingle(),
  task.feature_id?s.from('features').select('*').eq('id',task.feature_id).maybeSingle():Promise.resolve({data:null}),
  s.from('decisions').select('*').eq('project_id',task.project_id).order('created_at',{ascending:false}).limit(25),
  s.from('documents').select('*').eq('project_id',task.project_id).order('updated_at',{ascending:false}).limit(25),
  s.from('knowledge').select('*').eq('project_id',task.project_id).order('updated_at',{ascending:false}).limit(50),
  s.from('coding_runs').select('*').eq('task_id',taskId).order('created_at',{ascending:false}).limit(10)
 ])
 return NextResponse.json({generatedAt:new Date().toISOString(),task,project:project.data||null,feature:feature.data||null,decisions:decisions.data||[],documents:docs.data||[],knowledge:knowledge.data||[],previousRuns:runs.data||[],contextVersion:'1.0'})
}
