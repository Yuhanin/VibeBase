'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const steps = ['Idea','Discovery','Concept','UX Flow','Design','Specification','AI Coding','Testing','Release','Documentation']
export default function ProjectsPage() {
 const [projects,setProjects]=useState<any[]>([]); const [loading,setLoading]=useState(true)
 useEffect(()=>{fetch('/api/projects').then(r=>r.json()).then(j=>setProjects(j.projects||[])).finally(()=>setLoading(false))},[])
 return <main className="min-h-screen p-6 md:p-10"><div className="mx-auto max-w-6xl">
  <header className="mb-10 flex items-end justify-between"><div><p className="text-sm tracking-[.2em] text-zinc-500">VIBEBASE / PROJECTS</p><h1 className="mt-2 text-3xl font-bold">Project workspace</h1><p className="mt-2 text-zinc-400">Your projects and their complete vibe-coding workflow.</p></div><Link href="/projects/new" className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black">New project</Link></header>
  {loading?<div className="rounded-2xl border border-zinc-800 p-8 text-zinc-500">Loading projects…</div>:projects.length===0?<div className="rounded-3xl border border-dashed border-zinc-800 p-10 text-center"><h2 className="text-xl font-semibold">Start your first project</h2><p className="mt-2 text-zinc-500">Use the setup wizard to turn an idea into an executable workspace.</p><Link href="/projects/new" className="mt-6 inline-block rounded-xl bg-white px-5 py-3 text-sm font-medium text-black">Create project</Link></div>:<div className="grid gap-4 md:grid-cols-2">{projects.map(p=><article key={p.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"><div className="flex justify-between"><div><h2 className="text-xl font-semibold">{p.name}</h2><p className="mt-2 text-sm text-zinc-500">{p.description||'No description yet.'}</p></div><span className="text-sm text-zinc-500">{p.progress||0}%</span></div><div className="mt-6 grid grid-cols-5 gap-1">{steps.map((s,i)=><div key={s} title={s} className={`h-1.5 rounded-full ${i < Math.ceil((p.progress||0)/10) ? 'bg-white' : 'bg-zinc-800'}`}/>)}</div></article>)}</div>}
 </div></main>
}
