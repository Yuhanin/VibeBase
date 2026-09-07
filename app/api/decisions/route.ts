import { NextResponse } from 'next/server'
import { getAuthenticatedApiContext, unauthorized } from '../../../lib/api-auth'
import { isDecisionStatus } from '../../../lib/domain'

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const projectId = new URL(request.url).searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  const { data, error } = await supabase.from('decisions').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ decisions: data ?? [] })
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedApiContext()
  if (!user) return unauthorized()
  const body = await request.json()
  if (!body.projectId || !body.title?.trim() || !body.decision?.trim()) return NextResponse.json({ error: 'projectId, title and decision are required' }, { status: 400 })
  const status = body.status ?? 'approved'
  if (!isDecisionStatus(status)) return NextResponse.json({ error: 'Invalid decision status' }, { status: 400 })
  const { data, error } = await supabase.from('decisions').insert({
    project_id: body.projectId,
    title: body.title.trim(),
    context: body.context ?? '',
    decision: body.decision.trim(),
    status,
    created_by: user.id,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ decision: data }, { status: 201 })
}
