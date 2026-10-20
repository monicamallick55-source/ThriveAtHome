// app/api/nonprofit/orgs/route.ts
// GET  /api/nonprofit/orgs        — list all orgs (admin)
// POST /api/nonprofit/orgs        — register a new nonprofit org

import { NextRequest, NextResponse } from 'next/server'
import { createNonprofitOrg, getAllNonprofitOrgs, getNonprofitOrgByEmail } from '@/lib/nonprofit/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (email) {
      const org = await getNonprofitOrgByEmail(email)
      return NextResponse.json({ orgs: org ? [org] : [] })
    }

    const orgs = await getAllNonprofitOrgs()
    return NextResponse.json({ orgs })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name,
      org_type,
      ein,
      contact_name,
      contact_email,
      contact_phone,
      address_city,
      address_state,
      website,
    } = body

    if (!name || !org_type || !contact_name || !contact_email) {
      return NextResponse.json(
        { error: 'name, org_type, contact_name, and contact_email are required' },
        { status: 400 }
      )
    }

    const { data, error } = await createNonprofitOrg({
      name,
      org_type,
      ein,
      contact_name,
      contact_email,
      contact_phone,
      address_city,
      address_state,
      website,
    })

    if (error) return NextResponse.json({ error }, { status: 400 })
    return NextResponse.json({ org: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
