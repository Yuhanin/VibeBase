import { NextResponse } from 'next/server'
import { githubGet } from '../../../../lib/github'
export async function GET(){try{const data=await githubGet('/issues?state=open&per_page=30');return NextResponse.json({issues:data.filter((x:any)=>!x.pull_request).map((x:any)=>({number:x.number,title:x.title,state:x.state,url:x.html_url,labels:x.labels?.map((l:any)=>l.name)||[]}))})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'GitHub error'},{status:502})}}
