'use client'
import { useEffect, useState } from 'react'

const columns = ['backlog','ready','active','review','testing','done','blocked'] as const
const labels: Record<string,string> = { backlog:'Backlog', ready:'Ready', active:'Active', review:'Review', testing:'Testing', done:'Done', blocked:'Blocked' }

export default function TasksPage() {
  const [tasks,setTasks] = useState<any[]>([])
  const [projects,setProjects] = useState<any[]>([])
  const [projectId,setProjectId] = useState('')
  const [title,setTitle] = useState('')
  const [busy,setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/projects').then(r=>r.json()).then(j => {
      const list = j.projects ?? []
      setProjects(list)
      if (list[0]) setProjectId(list[0].id)
    })
  }, [])

  useEffect(() => {
    if (!projectId) return
    fetch(`/api/tasks?projectId=${projectId}`).then(r=>r.json()).then(j=>setTasks(j.tasks ?? []))
  }, [projectId])

  async function add() {
    if (!projectId || !title.trim()) return
    setBusy(true)
    const r = await fetch('/api/tasks', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ projectId, title, status:'backlog' }) })
    const j = await r.json()
    if (r.ok) { setTasks(x=>[...x,j.task]); setTitle('') }
    setBusy(false)
  }

  async function move(task:any,status:string) {
    setTasks(x=>x.map(t=>t.id===task.id?{...t,status}:t))
    const r = await fetch('/api/tasks', { method:'PATCH', headers:{'content-type':'application/json'}, body:JSON.stringify({ id:task.id, status }) })
    if (!r.ok) setTasks(x=>x.map(t=>t.id===task.id?task:t))
  }

  return <main className="min-h-screen p-6 md:p-10"><div className="mx-auto max-w-7xl">
    <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm tracking-[.2em] text-zinc-500">VIBEBASE / TASKS</p><h1 className="mt-2 text-3xl font-bold">Execution board</h1></div><div className="flex flex-wrap gap-2"><select value={projectId} onChange={e=>setProjectId(e.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm">{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><input value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="New task…" className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"/><button disabled={busy} onClick={add} className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black">Add</button></div></header>
    <div className="grid gap-4 xl:grid-cols-7">{columns.map(status=><section key={status} className="min-h-72 rounded-2xl border border-zinc-800 bg-zinc-950 p-4"><div className="flex justify-between"><h2 className="font-semibold">{labels[status]}</h2><span className="text-xs text-zinc-600">{tasks.filter(t=>t.status===status).length}</span></div><div className="mt-4 space-y-2">{tasks.filter(t=>t.status===status).map(t=><article key={t.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"><p className="text-sm font-medium">{t.title}</p><div className="mt-3 flex flex-wrap gap-1">{columns.filter(s=>s!==status).map(s=><button key={s} onClick={()=>move(t,s)} className="rounded-lg border border-zinc-800 px-2 py-1 text-[10px] text-zinc-500">→ {labels[s]}</button>)}</div></article>)}</div></section>)}</div>
  </div></main>
}
