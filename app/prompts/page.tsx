const categories = ['System','Planning','Coding','Review','Debugging','Release']

export default function PromptsPage() {
  return <main className="min-h-screen p-6 md:p-10"><div className="mx-auto max-w-6xl"><header className="mb-8"><p className="text-sm tracking-[.2em] text-zinc-500">VIBEBASE / PROMPTS</p><h1 className="mt-2 text-3xl font-bold">Prompt library</h1><p className="mt-2 text-zinc-400">Keep reusable instructions and project context close to the work.</p></header><div className="grid gap-3 md:grid-cols-3">{categories.map(category => <article key={category} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><div className="text-xs text-zinc-500">CATEGORY</div><h2 className="mt-2 font-semibold">{category}</h2><p className="mt-2 text-sm text-zinc-600">No saved prompts yet.</p></article>)}</div><button className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black">Create prompt</button></div></main>
}
