import { NextResponse } from 'next/server'
import { githubGet } from '../../../../lib/github'
export async function GET(){try{const data=await githubGet('/pulls?state=open&per_page=30');return NextResponse.json({pullRequests:data.map((x:any)=>({number:x.number,title:x.title,state:x.state,url:x.html_url,branch:x.head?.ref,base:x.base?.ref}))})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'GitHub error'},{status:502})}}
