const columns = ['Backlog','In Progress','Review','Done']

export default function TasksPage() {
  return <main className="min-h-screen p-6 md:p-10"><div className="mx-auto max-w-7xl"><header className="mb-8"><p className="text-sm tracking-[.2em] text-zinc-500">VIBEBASE / TASKS</p><h1 className="mt-2 text-3xl font-bold">Execution board</h1></header><div className="grid gap-4 lg:grid-cols-4">{columns.map((column, i) => <section key={column} className="min-h-72 rounded-2xl border border-zinc-800 bg-zinc-950 p-4"><div className="flex justify-between"><h2 className="font-semibold">{column}</h2><span className="text-xs text-zinc-600">{i === 0 ? 0 : 0}</span></div>{i === 0 && <div className="mt-4 rounded-xl border border-dashed border-zinc-800 p-4 text-sm text-zinc-600">No tasks yet. Add work from your project.</div>}</section>)}</div></div></main>
}
