import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../../lib/api-auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const { id } = await params
  const body = await request.json()
  const patch: Record<string, unknown> = {}
  if (body.title !== undefined || body.name !== undefined) patch.title = String(body.title ?? body.name).trim()
  if (body.description !== undefined) patch.description = body.description
  if (body.priority !== undefined) patch.priority = body.priority
  if (body.status !== undefined) patch.status = body.status
  if (body.mvp !== undefined) patch.mvp = Boolean(body.mvp)
  if (body.acceptanceCriteria !== undefined) patch.acceptance_criteria = Array.isArray(body.acceptanceCriteria) ? body.acceptanceCriteria : []
  const { data, error } = await supabase.from('features').update(patch).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ feature: data })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const { id } = await params
  const { error } = await supabase.from('features').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
