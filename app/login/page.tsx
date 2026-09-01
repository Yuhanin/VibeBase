'use client'

import { useState } from 'react'
import { createSupabaseBrowser } from '../../lib/supabase-browser'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    const { error } = await createSupabaseBrowser().auth.signInWithPassword({ email, password })
    if (error) setError(error.message); else window.location.href = '/projects'
    setLoading(false)
  }

  return <main className="flex min-h-screen items-center justify-center p-6"><form onSubmit={signIn} className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8"><p className="text-sm tracking-[.2em] text-zinc-500">VIBEBASE</p><h1 className="mt-3 text-3xl font-bold">Welcome back</h1><p className="mt-2 text-sm text-zinc-500">Sign in to your project workspace.</p><label className="mt-8 block text-sm">Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none" /></label><label className="mt-4 block text-sm">Password<input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none" /></label>{error && <p className="mt-4 text-sm text-red-400">{error}</p>}<button disabled={loading} className="mt-6 w-full rounded-xl bg-white p-3 font-medium text-black disabled:opacity-50">{loading ? 'Signing in…' : 'Sign in'}</button></form></main>
}
