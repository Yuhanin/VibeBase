'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const phaseLabels:Record<string,string>={idea:'Idea',discovery:'Discovery',concept:'Concept',ux:'UX Flow',design:'Design',specification:'Specification',coding:'AI Coding',testing:'Testing',release:'Release',documentation:'Documentation'}

export default function ProjectDetail({params}:{params:Promise<{id:string}>}) {
  const [id,setId]=useState('')
  const [dashboard,setDashboard]=useState<any>()
  const [phases,setPhases]=useState<any[]>([])
  const [busy,setBusy]=useState('')
  useEffect(()=>{params.then(value=>setId(value.id))},[params])
  useEffect(()=>{if(id)load()},[id])

  async function load(){const [d,p]=await Promise.all([fetch(`/api/dashboard?projectId=${id}`).then(r=>r.json()),fetch(`/api/projects/${id}/phases`).then(r=>r.json())]);setDashboard(d);setPhases(p.phases??[])}
  async function setPhase(phase:string,status:string){setBusy(phase+status);await fetch(`/api/projects/${id}/phases`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({phase,status})});await load();setBusy('')}

  if(!dashboard?.project)return <main className="min-h-screen p-8 text-zinc-500">Loading workspace…</main>
  const project=dashboard.project,stats=dashboard.stats
  return <main className="min-h-screen p-6 md:p-10"><div className="mx-auto max-w-7xl">
    <Link href="/projects" className="text-sm text-zinc-500">← Projects</Link>
    <header className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-7"><div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between"><div><p className="text-xs tracking-[.2em] text-zinc-500">PROJECT CONTROL PLANE</p><h1 className="mt-2 text-3xl font-bold">{project.name}</h1><p className="mt-3 max-w-3xl text-zinc-400">{project.description||'No description yet.'}</p><p className="mt-4 text-sm text-zinc-500">Current phase: <span className="text-zinc-200">{phaseLabels[project.current_phase]??project.current_phase}</span></p></div><div className="text-right"><div className="text-4xl font-bold">{project.progress||0}%</div><div className="mt-2 text-xs text-zinc-500">lifecycle completion</div></div></div></header>

    <section className="mt-6"><div className="mb-4"><p className="text-xs tracking-[.2em] text-zinc-500">STEP-BY-STEP WORKFLOW</p><h2 className="mt-1 text-xl font-semibold">Build from idea to documented release</h2></div><div className="grid gap-3 lg:grid-cols-5">{phases.map((phase,index)=><article key={phase.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"><div className="flex items-center justify-between"><span className="text-xs text-zinc-600">{String(index+1).padStart(2,'0')}</span><span className="rounded-full border border-zinc-800 px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-500">{phase.status.replace('_',' ')}</span></div><h3 className="mt-4 font-semibold">{phaseLabels[phase.phase]??phase.phase}</h3><div className="mt-4 flex flex-wrap gap-1">{phase.status!=='in_progress'&&phase.status!=='completed'&&<button disabled={busy!==''} onClick={()=>setPhase(phase.phase,'in_progress')} className="rounded-lg border border-zinc-800 px-2 py-1 text-xs">Start</button>}{phase.status!=='completed'&&<button disabled={busy!==''} onClick={()=>setPhase(phase.phase,'completed')} className="rounded-lg border border-zinc-800 px-2 py-1 text-xs">Complete</button>}{phase.status!=='blocked'&&phase.status!=='completed'&&<button disabled={busy!==''} onClick={()=>setPhase(phase.phase,'blocked')} className="rounded-lg border border-zinc-800 px-2 py-1 text-xs text-zinc-500">Block</button>}</div></article>)}</div></section>

    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[['Features',stats.features],['Tasks',stats.tasks],['Done',stats.doneTasks],['Open Issues',stats.openIssues],['Releases',stats.releases]].map(([label,value])=><div key={label as string} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><p className="text-xs text-zinc-500">{label as string}</p><p className="mt-2 text-3xl font-bold">{value as number}</p></div>)}</div>

    <div className="mt-6 grid gap-4 lg:grid-cols-3"><Info title="Problem" value={project.problem}/><Info title="Target audience" value={project.target_audience}/><Info title="Vision" value={project.vision}/></div>
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><h2 className="font-semibold">Project tools</h2><div className="mt-4 flex flex-wrap gap-2"><Link href="/tasks" className="rounded-xl border border-zinc-800 px-4 py-2 text-sm">Tasks</Link><Link href="/coding/workflow" className="rounded-xl border border-zinc-800 px-4 py-2 text-sm">AI Control Plane</Link><Link href="/knowledge" className="rounded-xl border border-zinc-800 px-4 py-2 text-sm">Knowledge</Link><Link href="/prompts" className="rounded-xl border border-zinc-800 px-4 py-2 text-sm">Prompts</Link><Link href="/github" className="rounded-xl border border-zinc-800 px-4 py-2 text-sm">GitHub</Link></div></section>
  </div></main>
}

function Info({title,value}:{title:string;value?:string}){return <section className="rounded-2xl border border-zinc-800 p-6"><h2 className="font-semibold">{title}</h2><p className="mt-3 text-sm leading-6 text-zinc-500">{value||'Not defined yet.'}</p></section>}
