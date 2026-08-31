const modules = [
  ['Projects', 'Plan and manage every vibe-coding project.'],
  ['Features', 'Turn product ideas into prioritized MVP scope.'],
  ['Tasks', 'Execute work with a focused Kanban workflow.'],
  ['Prompts', 'Store reusable AI prompts and project context.'],
  ['Knowledge', 'Keep specifications, decisions and docs together.'],
  ['Releases', 'Track milestones from build to production.'],
]

export default function Home() {
  return <main className="min-h-screen p-6 md:p-10">
    <div className="mx-auto max-w-7xl">
      <header className="mb-12 flex items-center justify-between">
        <div><div className="text-sm font-semibold tracking-[.2em] text-zinc-400">VIBEBASE</div><h1 className="mt-2 text-4xl font-bold tracking-tight">Build ideas into products.</h1></div>
        <button className="rounded-xl border border-zinc-700 px-4 py-2 text-sm">Sign in</button>
      </header>
      <section className="mb-10 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8">
        <p className="mb-3 text-sm text-zinc-400">Vibe-coding workspace</p><h2 className="max-w-3xl text-3xl font-semibold">From idea → specification → AI coding → testing → release.</h2>
        <p className="mt-4 max-w-2xl text-zinc-400">A single workspace for planning, prompting, documenting and shipping your AI-assisted projects.</p>
        <button className="mt-7 rounded-xl bg-white px-5 py-3 font-medium text-black">Create project</button>
      </section>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{modules.map(([title, text]) => <article key={title} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"><h3 className="text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p></article>)}</div>
    </div>
  </main>
}
