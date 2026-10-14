// app/api/campaigns/[id]/contribute/route.ts
// G6.4 — POST pledge, PATCH confirm, GET contributions for a campaign
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: fm } = await (supabase as any)
      .from('family_members')
      .select('id, member_id, role')
      .eq('supabase_auth_id', user.id)
      .single()
    if (!fm) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Campaign must be active
    const { data: campaign } = await (supabase as any)
      .from('member_campaigns')
      .select('id, status, total_pledged_cents')
      .eq('id', campaignId)
      .single()
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    if (campaign.status !== 'active') {
      return NextResponse.json({ error: 'Campaign is not currently accepting contributions' }, { status: 400 })
    }

    const body = await req.json()
    const {
      contribution_type = 'financial',
      amount_cents,
      in_kind_description,
      volunteer_date,
      message,
      anonymous = false,
      payment_method,
    } = body

    const { data, error } = await (supabase as any)
      .from('campaign_contributions')
      .insert({
        campaign_id:          campaignId,
        contributor_fm_id:    fm.id,
        contribution_type,
        amount_cents:         amount_cents ?? null,
        in_kind_description:  in_kind_description ?? null,
        volunteer_date:       volunteer_date ?? null,
        message:              message ?? null,
        anonymous:            !!anonymous,
        payment_method:       payment_method ?? null,
        status:               'pledged',
      })
      .select()
      .single()

    if (error) {
      console.error('[contribute POST]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update denormalized total_pledged_cents on campaign
    if (amount_cents && amount_cents > 0) {
      await (supabase as any)
        .from('member_campaigns')
        .update({ total_pledged_cents: campaign.total_pledged_cents + amount_cents })
        .eq('id', campaignId)
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[contribute POST] unexpected', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only navigators/admins can confirm contributions
    const { data: fm } = await (supabase as any)
      .from('family_members')
      .select('id, role')
      .eq('supabase_auth_id', user.id)
      .single()
    if (!fm || !['admin', 'navigator'].includes(fm.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { contribution_id, status, navigator_notes } = await req.json()
    if (!contribution_id) return NextResponse.json({ error: 'contribution_id required' }, { status: 400 })

    // Fetch contribution to check amount
    const { data: contrib } = await (supabase as any)
      .from('campaign_contributions')
      .select('id, campaign_id, amount_cents, status')
      .eq('id', contribution_id)
      .eq('campaign_id', campaignId)
      .single()
    if (!contrib) return NextResponse.json({ error: 'Contribution not found' }, { status: 404 })

    const patch: Record<string, unknown> = {}
    if (status)           patch.status           = status
    if (navigator_notes)  patch.navigator_notes  = navigator_notes
    if (status === 'confirmed') {
      patch.confirmed_at       = new Date().toISOString()
      patch.confirmed_by_fm_id = fm.id
    }

    const { data, error } = await (supabase as any)
      .from('campaign_contributions')
      .update(patch)
      .eq('id', contribution_id)
      .select()
      .single()

    if (error) {
      console.error('[contribute PATCH]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update denormalized total_confirmed_cents on campaign
    if (status === 'confirmed' && contrib.amount_cents && contrib.status !== 'confirmed') {
      const { data: camp } = await (supabase as any)
        .from('member_campaigns')
        .select('total_confirmed_cents')
        .eq('id', campaignId)
        .single()
      if (camp) {
        await (supabase as any)
          .from('member_campaigns')
          .update({ total_confirmed_cents: camp.total_confirmed_cents + contrib.amount_cents })
          .eq('id', campaignId)
      }
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[contribute PATCH] unexpected', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await (supabase as any)
      .from('campaign_contributions')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'confirmed')
      .order('confirmed_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Mask anonymous contributors
    const masked = (data ?? []).map((c: Record<string, unknown>) => ({
      ...c,
      contributor_fm_id:     c.anonymous ? null : c.contributor_fm_id,
      contributor_member_id: c.anonymous ? null : c.contributor_member_id,
    }))

    return NextResponse.json(masked)
  } catch (err) {
    console.error('[contribute GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
