import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/auth'
import { getAAAForAdmin, logServiceUnit } from '@/lib/data/aaa'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getUserRole(user.id)
  if (role !== 'aaa_admin' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: aaa } = await getAAAForAdmin(user.id)
  if (!aaa) return NextResponse.json({ error: 'No AAA found for this user' }, { status: 400 })

  const body = await req.json()
  const {
    member_id, service_date, title3_category, service_type, units_provided, unit_type,
    county, client_age_group, client_gender, poverty_status, minority_status, rural_status,
    disability_status, at_risk_status, nutritional_risk, lives_alone, worker_name, notes, fiscal_year,
  } = body

  if (!service_date || !title3_category || !service_type) {
    return NextResponse.json({ error: 'service_date, title3_category, and service_type are required' }, { status: 400 })
  }

  const validCategories = ['III-B', 'III-C1', 'III-C2', 'III-D', 'III-E']
  if (!validCategories.includes(title3_category)) {
    return NextResponse.json({ error: 'Invalid title3_category' }, { status: 400 })
  }

  const fy = fiscal_year ?? new Date().getFullYear()

  const { data, error } = await logServiceUnit(aaa.id, {
    member_id: member_id || null,
    service_date,
    title3_category,
    service_type,
    units_provided: Number(units_provided) || 1,
    unit_type: unit_type || 'hour',
    county: county || null,
    client_age_group: client_age_group || null,
    client_gender: client_gender || null,
    poverty_status: poverty_status ?? null,
    minority_status: minority_status ?? null,
    rural_status: rural_status ?? null,
    disability_status: disability_status ?? null,
    at_risk_status: at_risk_status ?? null,
    nutritional_risk: nutritional_risk ?? null,
    lives_alone: lives_alone ?? null,
    worker_name: worker_name || null,
    notes: notes || null,
    fiscal_year: fy,
  })

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ data }, { status: 201 })
}
