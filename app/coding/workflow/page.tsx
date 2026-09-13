'use client'
import { useEffect, useMemo, useState } from 'react'

type Run = { id:string; status:string; task_id:string; branch?:string|null; commit_sha?:string|null; pr_number?:number|null; pr_url?:string|null; active_plan_id?:string|null; error_message?:string|null }
type PlanRow = { id:string; version:number; status:string; plan:any; rejection_reason?:string|null }

export default function CodingWorkflow() {
  const [tasks,setTasks] = useState<any[]>([])
  const [taskId,setTaskId] = useState('')
  const [request,setRequest] = useState('')
  const [context,setContext] = useState<any>()
  const [run,setRun] = useState<Run>()
  const [plan,setPlan] = useState<PlanRow>()
  const [events,setEvents] = useState<any[]>([])
  const [planEditor,setPlanEditor] = useState('')
  const [rejectReason,setRejectReason] = useState('')
  const [busy,setBusy] = useState('')
  const [message,setMessage] = useState('')

  useEffect(()=>{ fetch('/api/tasks').then(r=>r.json()).then(payload=>setTasks(payload.tasks ?? [])) },[])
  useEffect(()=>{ if(taskId) loadContext(taskId) },[taskId])

  const approvalReady = useMemo(()=>Boolean(plan?.plan?.files?.length && plan?.plan?.tests?.length && plan?.plan?.verification?.length),[plan])

  async function jsonFetch(url:string, init?:RequestInit) {
    const response = await fetch(url, init)
    const payload = await response.json().catch(()=>({}))
    if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status})`)
    return payload
  }

  async function loadContext(id:string) {
    try { setContext(await jsonFetch(`/api/ai/context/task?taskId=${id}`)) } catch(error) { setMessage(error instanceof Error?error.message:'Context failed') }
  }

  async function refresh(runId=run?.id) {
    if (!runId) return
    const data = await jsonFetch(`/api/coding/run/${runId}`)
    setRun(data.run)
    setEvents(data.events ?? [])
    const plans = await jsonFetch(`/api/coding/run/${runId}/plan`)
    const active = (plans.plans ?? []).find((item:PlanRow)=>item.id===plans.activePlanId) ?? plans.plans?.[0]
    if (active) { setPlan(active); setPlanEditor(JSON.stringify(active.plan,null,2)) }
  }

  async function startRun() {
    if (!taskId || !request.trim()) return
    setBusy('start'); setMessage('')
    try {
      const created = await jsonFetch('/api/coding/run',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({taskId,request})})
      setRun(created.run)
      const planned = await jsonFetch(`/api/coding/run/${created.run.id}/plan`,{method:'POST',headers:{'content-type':'application/json'},body:'{}'})
      setPlan(planned.plan); setPlanEditor(JSON.stringify(planned.plan.plan,null,2))
      await refresh(created.run.id)
      if (!planned.approvalReady) setMessage(planned.generator==='template'?'AI provider is not configured; revise the template with concrete affected files before approval.':'Plan needs concrete files/tests/verification before approval.')
    } catch(error) { setMessage(error instanceof Error?error.message:'Run start failed') }
    finally { setBusy('') }
  }

  async function revisePlan() {
    if (!run) return
    setBusy('revise'); setMessage('')
    try {
      const candidate = JSON.parse(planEditor)
      const result = await jsonFetch(`/api/coding/run/${run.id}/plan`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({plan:candidate})})
      setPlan(result.plan); setPlanEditor(JSON.stringify(result.plan.plan,null,2)); await refresh(run.id)
    } catch(error) { setMessage(error instanceof Error?error.message:'Plan revision failed') }
    finally { setBusy('') }
  }

  async function approvePlan() { if(!run||!plan)return; await action('approve',()=>jsonFetch(`/api/coding/run/${run.id}/plan/approve`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({planId:plan.id})})) }
  async function rejectPlan() { if(!run||!plan)return; await action('reject',()=>jsonFetch(`/api/coding/run/${run.id}/plan/reject`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({planId:plan.id,reason:rejectReason})})) }
  async function execute() { if(!run)return; await action('execute',()=>jsonFetch(`/api/coding/run/${run.id}/execute`,{method:'POST'})) }
  async function createPr() { if(!run)return; await action('pr',()=>jsonFetch(`/api/coding/run/${run.id}/pull-request`,{method:'POST'})) }
  async function syncCi() { if(!run)return; await action('ci',()=>jsonFetch(`/api/coding/run/${run.id}/ci`,{method:'POST'})) }
  async function complete() { if(!run)return; await action('complete',()=>jsonFetch(`/api/coding/run/${run.id}/complete`,{method:'POST'})) }
  async function cancel() { if(!run)return; await action('cancel',()=>jsonFetch(`/api/coding/run/${run.id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({action:'cancel'})})) }

  async function action(name:string, fn:()=>Promise<any>) { setBusy(name);setMessage('');try{await fn();if(run)await refresh(run.id)}catch(error){setMessage(error instanceof Error?error.message:`${name} failed`)}finally{setBusy('')} }

  return <main className="min-h-screen p-6 md:p-10"><div className="mx-auto max-w-7xl">
    <p className="text-sm tracking-[.2em] text-zinc-500">VIBEBASE / CONTROL PLANE</p><h1 className="mt-2 text-3xl font-bold">AI Coding Run</h1><p className="mt-2 text-zinc-400">Context → Plan → Approval → Atomic execution → PR → CI → Merge verification.</p>
    <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6"><select value={taskId} onChange={e=>setTaskId(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3"><option value="">Select task</option>{tasks.map(task=><option key={task.id} value={task.id}>{task.title}</option>)}</select><textarea value={request} onChange={e=>setRequest(e.target.value)} placeholder="Describe the implementation goal…" className="mt-4 min-h-28 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3"/><div className="mt-4 flex flex-wrap gap-2"><Button onClick={startRun} disabled={!taskId||!request.trim()||Boolean(run)}>{busy==='start'?'Starting…':'Start run & plan'}</Button>{run&&<><Button onClick={()=>refresh()} secondary>Refresh</Button><Button onClick={cancel} secondary disabled={['completed','failed','cancelled'].includes(run.status)}>Cancel</Button></>}</div>{message&&<p className="mt-4 rounded-xl border border-amber-900/50 bg-amber-950/20 p-3 text-sm text-amber-200">{message}</p>}</section>

    {run&&<div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_1.4fr]">
      <div className="space-y-5"><Panel title="Run"><Row k="Status" v={run.status}/><Row k="Branch" v={run.branch}/><Row k="Commit" v={run.commit_sha?.slice(0,12)}/><Row k="PR" v={run.pr_number?`#${run.pr_number}`:undefined}/><Row k="Error" v={run.error_message}/></Panel><Panel title="Context"><Row k="Task" v={context?.task?.title}/><Row k="Project" v={context?.project?.name}/><Row k="Decisions" v={String(context?.decisions?.length??0)}/><Row k="Documents" v={String(context?.documents?.length??0)}/><Row k="Previous runs" v={String(context?.previousRuns?.length??0)}/></Panel></div>
      <div className="space-y-5">{plan&&<Panel title={`Plan v${plan.version} · ${plan.status}`}><textarea value={planEditor} onChange={e=>setPlanEditor(e.target.value)} className="min-h-80 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 font-mono text-xs"/><div className="mt-3 flex flex-wrap gap-2"><Button onClick={revisePlan} secondary disabled={['approved','superseded'].includes(plan.status)}>Save as revision</Button><Button onClick={approvePlan} disabled={plan.status!=='pending_approval'||!approvalReady}>Approve</Button><input value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Rejection reason" className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"/><Button onClick={rejectPlan} secondary disabled={plan.status!=='pending_approval'||!rejectReason.trim()}>Reject</Button></div>{!approvalReady&&<p className="mt-3 text-xs text-amber-400">Approval requires affected files, tests and verification steps.</p>}</Panel>}
        <Panel title="Execution gates"><div className="flex flex-wrap gap-2"><Button onClick={execute} disabled={plan?.status!=='approved'||run.status==='completed'}>Generate & execute AI changes</Button><Button onClick={createPr} secondary disabled={!run.commit_sha||Boolean(run.pr_number)}>Create PR</Button><Button onClick={syncCi} secondary disabled={!run.pr_number}>Sync CI</Button><Button onClick={complete} secondary disabled={run.status!=='review'}>Verify merge & complete</Button></div></Panel></div>
    </div>}

    {run&&<Panel title="Audit timeline" className="mt-6">{events.length?events.map(event=><div key={event.id} className="border-l-2 border-zinc-700 py-1 pl-4"><div className="text-sm font-medium">{event.event_type}{event.status?` · ${event.status}`:''}</div><div className="text-xs text-zinc-500">{event.message||'Event recorded'} · {new Date(event.created_at).toLocaleString()}</div></div>):<p className="text-sm text-zinc-500">No events yet.</p>}</Panel>}
  </div></main>
}

function Button({children,onClick,disabled=false,secondary=false}:{children:React.ReactNode;onClick:()=>void;disabled?:boolean;secondary?:boolean}) { return <button onClick={onClick} disabled={disabled} className={`${secondary?'border border-zinc-700':'bg-white text-black'} rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-35`}>{children}</button> }
function Panel({title,children,className=''}:{title:string;children:React.ReactNode;className?:string}) { return <section className={`${className} rounded-2xl border border-zinc-800 bg-zinc-950 p-5`}><h2 className="mb-4 font-semibold">{title}</h2><div className="space-y-3">{children}</div></section> }
function Row({k,v}:{k:string;v?:string|null}) { return <div className="flex items-start justify-between gap-4 text-sm"><span className="text-zinc-500">{k}</span><span className="max-w-[70%] text-right break-all">{v||'—'}</span></div> }
