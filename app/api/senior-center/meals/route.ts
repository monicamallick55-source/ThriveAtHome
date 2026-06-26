import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyCenterAdmin, upsertMeal } from '@/lib/data/seniorCenters'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { center_id, meal_date, meal_type, attendee_count, menu_description, notes } = body

    if (!center_id || !meal_date || attendee_count === undefined || attendee_count === null) {
      return NextResponse.json({ error: 'center_id, meal_date, and attendee_count are required' }, { status: 400 })
    }
    const count = parseInt(String(attendee_count))
    if (isNaN(count) || count < 0) {
      return NextResponse.json({ error: 'attendee_count must be a non-negative integer' }, { status: 400 })
    }

    const isAdmin = await verifyCenterAdmin(user.id, center_id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await upsertMeal({
      center_id,
      meal_date,
      meal_type: meal_type ?? 'lunch',
      attendee_count: count,
      menu_description: menu_description ?? null,
      notes: notes ?? null,
    })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ data }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
