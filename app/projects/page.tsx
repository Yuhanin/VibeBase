const steps = ['Idea','Discovery','Concept','UX Flow','Design','Specification','AI Coding','Testing','Release','Documentation']

export default function ProjectsPage() {
  return <main className="min-h-screen p-6 md:p-10"><div className="mx-auto max-w-6xl">
    <header className="mb-10"><p className="text-sm tracking-[.2em] text-zinc-500">VIBEBASE / PROJECTS</p><h1 className="mt-2 text-3xl font-bold">Project workspace</h1><p className="mt-2 text-zinc-400">Create a project and move it through the complete vibe-coding workflow.</p></header>
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">New project</h2><p className="mt-1 text-sm text-zinc-500">Start with the problem, audience and product vision.</p></div><button className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black">Create project</button></div>
      <div className="mt-8 grid gap-2 md:grid-cols-5">{steps.map((step, i) => <div key={step} className="rounded-xl border border-zinc-800 p-4"><span className="text-xs text-zinc-600">0{i+1}</span><div className="mt-2 text-sm font-medium">{step}</div></div>)}</div>
    </section>
    <section className="mt-6 grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-zinc-800 p-5"><p className="text-xs text-zinc-500">PROJECTS</p><p className="mt-2 text-3xl font-bold">0</p></div><div className="rounded-2xl border border-zinc-800 p-5"><p className="text-xs text-zinc-500">ACTIVE TASKS</p><p className="mt-2 text-3xl font-bold">0</p></div><div className="rounded-2xl border border-zinc-800 p-5"><p className="text-xs text-zinc-500">RELEASES</p><p className="mt-2 text-3xl font-bold">0</p></div></section>
  </div></main>
}
