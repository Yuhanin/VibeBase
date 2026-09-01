import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../lib/auth'

export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  return NextResponse.json({ authenticated: Boolean(user), user: user ? { id: user.id, email: user.email } : null })
}
