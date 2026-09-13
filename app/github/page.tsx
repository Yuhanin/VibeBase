'use client'
import { useEffect, useState } from 'react'

type GitHubContext = { repository?:{fullName:string;defaultBranch:string;private:boolean;url:string}; branches?:Array<{name:string;protected:boolean}>; commits?:Array<{sha:string;message:string;date:string}>; pullRequests?:Array<{number:number;title:string;url:string;branch:string}>; issues?:Array<{number:number;title:string;url:string}>; error?:string }

export default function GitHubPage() {
  const [projects,setProjects] = useState<any[]>([])
  const [projectId,setProjectId] = useState('')
  const [data,setData] = useState<GitHubContext>({})
  const [loading,setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/projects').then(r=>r.json()).then(payload => {
      const list = payload.projects ?? []
      setProjects(list)
      if (list[0]) setProjectId(list[0].id)
    })
  }, [])

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    fetch(`/api/github/context?projectId=${projectId}`).then(r=>r.json()).then(setData).finally(()=>setLoading(false))
  }, [projectId])

  return <main className="min-h-screen p-6 md:p-10"><div className="mx-auto max-w-6xl">
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm tracking-[.2em] text-zinc-500">VIBEBASE / GITHUB</p><h1 className="mt-2 text-3xl font-bold">Repository workspace</h1><p className="mt-2 text-zinc-400">Project-scoped repository context for controlled AI execution.</p></div><select value={projectId} onChange={e=>setProjectId(e.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm">{projects.map(project=><option key={project.id} value={project.id}>{project.name}</option>)}</select></header>
    {loading ? <div className="rounded-2xl border border-zinc-800 p-6 text-zinc-500">Loading GitHub context…</div> : data.error ? <div className="rounded-2xl border border-red-900/60 bg-red-950/20 p-6 text-red-300">{data.error}</div> : <div className="space-y-5">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"><div className="text-xs tracking-[.2em] text-zinc-500">REPOSITORY</div><h2 className="mt-2 text-xl font-semibold">{data.repository?.fullName ?? 'Not configured'}</h2><p className="mt-2 text-sm text-zinc-500">Default branch: {data.repository?.defaultBranch ?? '—'} · {data.repository?.private ? 'Private' : 'Public'}</p></section>
      <div className="grid gap-4 lg:grid-cols-3"><Panel title="Branches">{data.branches?.map(branch=><div key={branch.name} className="mb-2 text-sm">{branch.name}{branch.protected?' · protected':''}</div>)}</Panel><Panel title="Pull requests">{data.pullRequests?.map(pr=><div key={pr.number} className="mb-2 text-sm">#{pr.number} {pr.title}</div>)}</Panel><Panel title="Issues">{data.issues?.map(issue=><div key={issue.number} className="mb-2 text-sm">#{issue.number} {issue.title}</div>)}</Panel></div>
    </div>}
  </div></main>
}

function Panel({title,children}:{title:string;children:React.ReactNode}) { return <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><h2 className="mb-4 font-semibold">{title}</h2>{children || <p className="text-sm text-zinc-600">No items.</p>}</section> }
