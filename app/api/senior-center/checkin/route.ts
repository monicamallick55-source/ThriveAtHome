import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyCenterAdmin, checkInVisitor } from '@/lib/data/seniorCenters'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { center_id, visitor_name, visitor_type, notes } = body

    if (!center_id || !visitor_name?.trim()) {
      return NextResponse.json({ error: 'center_id and visitor_name are required' }, { status: 400 })
    }

    const isAdmin = await verifyCenterAdmin(user.id, center_id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await checkInVisitor({
      center_id,
      visitor_name: visitor_name.trim(),
      visitor_type: visitor_type ?? 'member',
      notes: notes ?? null,
    })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
