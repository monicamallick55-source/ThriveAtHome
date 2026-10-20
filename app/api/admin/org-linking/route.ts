import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth, getUserRole } from '@/lib/auth'

const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

const VALID_FKS = ['aaa_id', 'org_id', 'agency_id', 'senior_center_id', 'network_id'] as const
const FK_TO_TABLE: Record<string, string> = {
  aaa_id:           'area_agencies_on_aging',
  org_id:           'community_orgs',
  agency_id:        'care_agencies',
  senior_center_id: 'senior_centers',
  network_id:       'network_accounts',
}

// GET — list org-admin users + all org options
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    const role = await getUserRole(user.id)
    if (role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const sb = supabaseAdmin()

    // Fetch all users with org-portal roles
    const ORG_ROLES = ['aaa_admin', 'org_admin', 'agency_admin', 'senior_center_admin', 'network_admin', 'navigator']
    const { data: fmRows, error: fmErr } = await sb
      .from('family_members')
      .select(`
        id,
        user_id,
        full_name,
        role,
        aaa_id,
        org_id,
        agency_id,
        senior_center_id,
        network_id
      `)
      .in('role', ORG_ROLES)
      .order('role')

    if (fmErr) throw fmErr

    // Fetch email from auth.users via RPC (service role can read)
    const userIds = (fmRows ?? []).map(r => r.user_id).filter(Boolean)
    let emailMap: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: authUsers } = await sb.auth.admin.listUsers({ perPage: 1000 })
      for (const au of authUsers?.users ?? []) {
        emailMap[au.id] = au.email ?? ''
      }
    }

    const users = (fmRows ?? []).map(r => ({
      family_member_id:  r.id,
      user_id:           r.user_id,
      email:             emailMap[r.user_id] ?? '',
      full_name:         r.full_name,
      role:              r.role,
      aaa_id:            r.aaa_id,
      org_id:            r.org_id,
      agency_id:         r.agency_id,
      senior_center_id:  r.senior_center_id,
      network_id:        r.network_id,
    }))

    // Fetch all org options for each type
    const [aaaRes, orgRes, agencyRes, scRes, networkRes] = await Promise.all([
      sb.from('area_agencies_on_aging').select('id, name').order('name'),
      sb.from('community_orgs').select('id, name').order('name'),
      sb.from('care_agencies').select('id, name').order('name'),
      sb.from('senior_centers').select('id, name').order('name'),
      sb.from('network_accounts').select('id, name').order('name'),
    ])

    return NextResponse.json({
      users,
      orgs: {
        aaa:           aaaRes.data ?? [],
        org:           orgRes.data ?? [],
        agency:        agencyRes.data ?? [],
        senior_center: scRes.data ?? [],
        network:       networkRes.data ?? [],
      },
    })
  } catch (err) {
    console.error('org-linking GET error', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

// PATCH — set a single FK on a family_members row
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth()
    const role = await getUserRole(user.id)
    if (role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const body = await req.json()
    const { family_member_id, fk, org_id } = body

    if (!family_member_id) return NextResponse.json({ error: 'family_member_id required' }, { status: 400 })
    if (!VALID_FKS.includes(fk)) return NextResponse.json({ error: `invalid fk: ${fk}` }, { status: 400 })

    const sb = supabaseAdmin()

    // Validate org_id if provided
    if (org_id) {
      const table = FK_TO_TABLE[fk]
      const { data, error } = await sb.from(table).select('id').eq('id', org_id).single()
      if (error || !data) return NextResponse.json({ error: `org not found in ${table}` }, { status: 400 })
    }

    const { error: updateErr } = await sb
      .from('family_members')
      .update({ [fk]: org_id ?? null })
      .eq('id', family_member_id)

    if (updateErr) throw updateErr

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('org-linking PATCH error', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
