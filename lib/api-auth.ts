import { NextResponse } from 'next/server'
import { createSupabaseServer } from './auth'

export async function getAuthenticatedApiContext() {
  const supabase = await createSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null }
  return { supabase, user }
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}
