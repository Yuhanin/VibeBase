import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
const db=()=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{autoRefreshToken:false,persistSession:false}})
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const body=await request.json();const {data,error}=await db().from('features').update({name:body.name?.trim(),description:body.description,priority:body.priority,acceptance_criteria:body.acceptanceCriteria}).eq('id',id).select().single();if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({feature:data})}
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const {error}=await db().from('features').delete().eq('id',id);if(error)return NextResponse.json({error:error.message},{status:500});return new NextResponse(null,{status:204})}
