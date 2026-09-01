import { NextResponse } from 'next/server'
import { githubGet } from '../../../../lib/github'
export async function GET(request:Request){try{const path=new URL(request.url).searchParams.get('path')||'';const data=await githubGet(`/contents/${path}`);return NextResponse.json({path:data.path,name:data.name,sha:data.sha,size:data.size,htmlUrl:data.html_url,type:data.type})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'GitHub error'},{status:502})}}
