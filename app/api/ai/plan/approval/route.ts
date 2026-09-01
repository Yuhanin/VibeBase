import {NextResponse} from 'next/server'
import {createSupabaseServer} from '../../../../../lib/auth'
import {approvePlan,rejectPlan} from '../../../../../lib/ai-plan-approval'
export async function POST(req:Request){const s=await createSupabaseServer();const {data:{user}}=await s.auth.getUser();if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});try{const b=await req.json();if(b.status==='approved')return NextResponse.json({ok:true,approval:approvePlan(user.id)});if(b.status==='rejected')return NextResponse.json({ok:true,approval:rejectPlan(user.id,b.reason)});return NextResponse.json({error:'status must be approved or rejected'},{status:400})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Approval failed'},{status:400})}}
