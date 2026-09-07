import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../../../lib/api-auth'

const PHASE_STATUSES = ['pending','in_progress','completed','blocked'] as const

export async function GET(_: Request, { params }: { params: Promise<{ id:string }> }) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const { id } = await params
  const { data, error } = await supabase.from('project_phases').select('*').eq('project_id', id).order('sort_order')
  if (error) return NextResponse.json({ error:error.message }, { status:500 })
  return NextResponse.json({ phases:data ?? [] })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id:string }> }) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const { id:projectId } = await params
  const body = await request.json()
  if (!body.phase || !PHASE_STATUSES.includes(body.status)) return NextResponse.json({ error:'phase and valid status are required' }, { status:400 })

  if (body.status === 'in_progress') {
    await supabase.from('project_phases').update({ status:'pending' }).eq('project_id', projectId).eq('status','in_progress').neq('phase', body.phase)
  }
  const patch: Record<string,unknown> = { status:body.status }
  if (body.notes !== undefined) patch.notes = body.notes
  const { data, error } = await supabase.from('project_phases').update(patch).eq('project_id', projectId).eq('phase', body.phase).select().single()
  if (error) return NextResponse.json({ error:error.message }, { status:500 })
  return NextResponse.json({ phase:data })
}
