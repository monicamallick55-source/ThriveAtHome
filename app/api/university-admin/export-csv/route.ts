// Phase 52 — Semester CSV export for university admins
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserRole } from '@/lib/auth'
import { getUniversityForAdmin, getVisitsByUniversity } from '@/lib/data/university'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    const role = await getUserRole(user.id)
    if (role !== 'university_admin' && role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('start') ?? undefined
    const endDate = searchParams.get('end') ?? undefined

    // Get this admin's university
    const universityName = role === 'admin'
      ? (searchParams.get('university') ?? null)
      : await getUniversityForAdmin(user.id)

    if (!universityName) {
      return NextResponse.json({ error: 'University not configured for this account' }, { status: 400 })
    }

    const visits = await getVisitsByUniversity(universityName, startDate, endDate)

    const rows: string[] = [
      ['Student Name', 'Email', 'University', 'Major', 'Graduation Year', 'Visit Date', 'Duration (Hours)', 'Visit Type', 'Reflection', 'Verified'].join(',')
    ]

    const VISIT_TYPE_LABELS: Record<string, string> = {
      phone_call: 'Phone call',
      in_person_visit: 'In-person visit',
      virtual_event: 'Virtual event',
      reading_aloud: 'Reading aloud',
      tech_help: 'Tech help',
      other: 'Other',
    }

    for (const v of visits) {
      const hours = (v.duration_minutes / 60).toFixed(2)
      const typeLabel = VISIT_TYPE_LABELS[v.visit_type] ?? v.visit_type
      // Escape CSV fields that may contain commas or quotes
      const escape = (s: string | null | undefined) => {
        const str = String(s ?? '')
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }
      rows.push([
        escape(v.student_name),
        escape(v.student_email),
        escape(universityName),
        escape(v.student_major),
        String(v.graduation_year ?? ''),
        v.visit_date,
        hours,
        escape(typeLabel),
        escape(v.reflection),
        v.verified ? 'Yes' : 'No',
      ].join(','))
    }

    const csv = rows.join('\n')
    const filename = `semester-hours-${universityName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[university-admin/export-csv]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
