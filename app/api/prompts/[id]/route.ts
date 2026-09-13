import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../../lib/api-auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const { id } = await params
  const body = await request.json()
  const patch: Record<string, unknown> = {}
  for (const key of ['title','content','category','tags']) if (body[key] !== undefined) patch[key] = body[key]
  if (body.systemContext !== undefined) patch.system_context = body.systemContext
  const { data, error } = await supabase.from('prompts').update(patch).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ prompt: data })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const { id } = await params
  const { error } = await supabase.from('prompts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
