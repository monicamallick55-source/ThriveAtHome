import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/auth'
import { getAAAForAdmin, getNAPISExportData } from '@/lib/data/aaa'
import type { AAAServiceUnitRow } from '@/lib/data/aaa'

function ageFromDOB(dob: string | null | undefined): string {
  if (!dob) return 'not_reported'
  const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))
  if (age < 65) return '60-64'
  if (age < 75) return '65-74'
  if (age < 85) return '75-84'
  return '85+'
}

function boolToYN(val: boolean | null | undefined): string {
  if (val === null || val === undefined) return ''
  return val ? 'Yes' : 'No'
}

function csvRow(row: AAAServiceUnitRow): string {
  const ageGroup = row.client_age_group ?? ageFromDOB(row.member?.date_of_birth)
  const fields = [
    row.service_date,
    row.title3_category,
    row.service_type,
    String(row.units_provided),
    row.unit_type,
    ageGroup,
    row.client_gender ?? 'not_reported',
    boolToYN(row.poverty_status),
    boolToYN(row.minority_status),
    boolToYN(row.rural_status),
    boolToYN(row.disability_status),
    boolToYN(row.at_risk_status),
    boolToYN(row.nutritional_risk),
    boolToYN(row.lives_alone),
    row.county ?? '',
    row.worker_name ?? '',
    row.notes ?? '',
  ]
  return fields.map((f: any) => `"${String(f).replace(/"/g, '""')}"`).join(',')
}

const CSV_HEADER = [
  'Service Date',
  'Title III Category',
  'Service Type',
  'Units Provided',
  'Unit Type',
  'Client Age Group',
  'Client Gender',
  'At/Below Poverty Line',
  'Minority Status',
  'Rural/Isolated',
  'Disability Status',
  'At Risk of Institutionalization',
  'Nutritional Risk',
  'Lives Alone',
  'County',
  'Worker Name',
  'Notes',
].join(',')

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getUserRole(user.id)
  if (role !== 'aaa_admin' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: aaa } = await getAAAForAdmin(user.id)
  if (!aaa) return NextResponse.json({ error: 'No AAA found' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const fiscalYear = parseInt(searchParams.get('fiscal_year') ?? String(new Date().getFullYear()))

  const { data, error } = await getNAPISExportData(aaa.id, fiscalYear)
  if (error) return NextResponse.json({ error }, { status: 400 })

  const rows = (data ?? []).map(csvRow)
  const csv = [CSV_HEADER, ...rows].join('\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="NAPIS_Export_FY${fiscalYear}_${aaa.psa_number ?? aaa.agency_name.replace(/\s+/g, '_')}.csv"`,
    },
  })
}
