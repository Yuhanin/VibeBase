import { NextResponse } from 'next/server'

export async function GET() {
 const {GITHUB_TOKEN:token,GITHUB_OWNER:owner,GITHUB_REPO:repo}=process.env
 if(!token||!owner||!repo)return NextResponse.json({connected:false,commits:[]})
 const r=await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=20`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},cache:'no-store'})
 if(!r.ok)return NextResponse.json({connected:false,commits:[],status:r.status},{status:502})
 const data=await r.json()
 return NextResponse.json({connected:true,commits:data.map((c:any)=>({sha:c.sha,message:c.commit?.message?.split('\n')[0],author:c.commit?.author?.name,url:c.html_url,date:c.commit?.author?.date}))})
}
