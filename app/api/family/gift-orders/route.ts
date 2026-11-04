import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GIFT_CATALOG, calculateOrderTotals, requiresFamilyApproval } from '@/lib/gifts/catalog'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memberId = req.nextUrl.searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

  const { data, error } = await (supabase as any)
    .from('gift_orders')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { member_id, catalog_item_id, recipient_name, recipient_address, recipient_email, message, sign_as, family_event_id } = body

  const item = GIFT_CATALOG.find(i => i.id === catalog_item_id)
  if (!item) return NextResponse.json({ error: 'Invalid catalog item' }, { status: 400 })

  const totals = calculateOrderTotals(item)

  // Check if recipient is a known family member
  const { data: knownFamily } = await (supabase as any)
    .from('family_members')
    .select('id')
    .eq('member_id', member_id)
    .eq('email', recipient_email ?? '')
    .maybeSingle()

  const needsApproval = requiresFamilyApproval(item, totals.total_cents, !!knownFamily)
  const paymentStatus = totals.total_cents === 0 ? 'not_required' : 'pending'
  const fulfillmentStatus = needsApproval ? 'awaiting_approval' : (totals.total_cents === 0 ? 'ordered' : 'draft')

  const { data, error } = await (supabase as any)
    .from('gift_orders')
    .insert({
      member_id,
      direction: 'from_member',
      family_event_id: family_event_id || null,
      kind: item.kind,
      recipient_name,
      recipient_address: recipient_address || null,
      recipient_email: recipient_email || null,
      message: message || null,
      sign_as: sign_as || null,
      catalog_item_id,
      ...totals,
      payment_status: paymentStatus,
      fulfillment_status: fulfillmentStatus,
      fulfillment_partner: item.partner,
      needs_family_approval: needsApproval,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Free notes: stub-fulfill immediately
  if (item.kind === 'note' && !needsApproval) {
    console.log(`[STUB][Goods] Note sent from member ${member_id} to ${recipient_email}: "${message}"`)
    await (supabase as any)
      .from('gift_orders')
      .update({ fulfillment_status: 'delivered', partner_order_id: `stub-note-${Date.now()}` })
      .eq('id', data.id)
  }

  return NextResponse.json({ data, needs_payment: totals.total_cents > 0 && !needsApproval })
}

export async function PATCH(req: NextRequest) {
  // Family approves a pending gift order
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, action } = await req.json()
  if (!id || !['approve', 'cancel'].includes(action)) {
    return NextResponse.json({ error: 'id and action required' }, { status: 400 })
  }

  const newStatus = action === 'approve' ? 'draft' : 'cancelled'
  const { data, error } = await (supabase as any)
    .from('gift_orders')
    .update({ fulfillment_status: newStatus, needs_family_approval: false })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (action === 'approve') {
    console.log(`[STUB][Goods] Order ${id} approved by family — ready for Stripe checkout or fulfillment`)
  }

  return NextResponse.json({ data })
}