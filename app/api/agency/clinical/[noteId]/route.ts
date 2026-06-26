// SOAP note actions — PATCH to update/sign/lock, DELETE to remove draft
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { updateSoapNote, signSoapNote, lockSoapNote, deleteSoapNote, getSoapNoteById } from '@/lib/data/clinicalDocs'

async function verifyAgencyAccess(userId: string, agencyId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data: fm } = await admin.from('family_members').select('role, agency_id').eq('supabase_auth_id', userId).maybeSingle()
  return !!(fm && fm.role === 'agency_admin' && fm.agency_id === agencyId)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ noteId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { noteId } = await params

  // Load note to get agency_id for auth check
  const { data: note, error: loadErr } = await getSoapNoteById(noteId)
  if (loadErr || !note) return NextResponse.json({ error: loadErr ?? 'Not found' }, { status: 404 })
  if (note.status === 'locked') return NextResponse.json({ error: 'Note is locked and cannot be modified' }, { status: 409 })

  const allowed = await verifyAgencyAccess(user.id, note.agency_id)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const action = body.action as string | undefined

  if (action === 'sign') {
    const signerName = (body.signer_name as string) || 'Agency Admin'
    const { data, error } = await signSoapNote(noteId, signerName)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (action === 'lock') {
    const { data, error } = await lockSoapNote(noteId)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ data })
  }

  // Default: content update (only allowed in draft)
  if (note.status !== 'draft') return NextResponse.json({ error: 'Only draft notes can be edited' }, { status: 409 })

  const { data, error } = await updateSoapNote(noteId, {
    subjective: body.subjective as string | undefined,
    objective: body.objective as string | undefined,
    assessment: body.assessment as string | undefined,
    plan: body.plan as string | undefined,
    billing_codes: body.billing_codes as string[] | undefined,
    visit_type: body.visit_type as string | null | undefined,
    duration_minutes: body.duration_minutes as number | null | undefined,
  })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ noteId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { noteId } = await params

  const { data: note, error: loadErr } = await getSoapNoteById(noteId)
  if (loadErr || !note) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (note.status !== 'draft') return NextResponse.json({ error: 'Only draft notes can be deleted' }, { status: 409 })

  const allowed = await verifyAgencyAccess(user.id, note.agency_id)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await deleteSoapNote(noteId)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
