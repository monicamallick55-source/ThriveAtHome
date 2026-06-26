// Senior Center data layer (migration 046)
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type {
  SeniorCenterRow,
  CenterDropinRow,
  CenterActivityRow,
  ActivityRegistrationRow,
  RoomBookingRow,
  CongregrateMealRow,
  SeniorCenterStats,
  CenterDropinInsert,
  CenterActivityInsert,
  RoomBookingInsert,
  CongregrateMealInsert,
} from '@/types/database'

type Result<T> = { data: T | null; error: string | null }

export async function getSeniorCenterForAdmin(authUserId: string): Promise<Result<SeniorCenterRow>> {
  try {
    const admin = createAdminClient()
    const { data: fm, error: fmError } = await admin
      .from('family_members')
      .select('senior_center_id')
      .eq('supabase_auth_id', authUserId)
      .maybeSingle()
    if (fmError || !fm?.senior_center_id) return { data: null, error: 'not_linked' }

    const { data, error } = await (admin.from as any)('senior_centers')
      .select('*')
      .eq('id', fm.senior_center_id)
      .maybeSingle()
    if (error) return { data: null, error: error.message }
    if (!data) return { data: null, error: 'not_found' }
    return { data: data as SeniorCenterRow, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

export async function getTodaysDropins(centerId: string): Promise<Result<CenterDropinRow[]>> {
  try {
    const admin = createAdminClient()
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await (admin.from as any)('center_dropins')
      .select('*')
      .eq('center_id', centerId)
      .gte('check_in_at', `${today}T00:00:00.000Z`)
      .lte('check_in_at', `${today}T23:59:59.999Z`)
      .order('check_in_at', { ascending: false })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []) as CenterDropinRow[], error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

export async function checkInVisitor(fields: CenterDropinInsert): Promise<Result<CenterDropinRow>> {
  try {
    const admin = createAdminClient()
    const { data, error } = await (admin.from as any)('center_dropins')
      .insert(fields)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data as CenterDropinRow, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

export async function checkOutVisitor(dropinId: string): Promise<Result<CenterDropinRow>> {
  try {
    const admin = createAdminClient()
    const { data, error } = await (admin.from as any)('center_dropins')
      .update({ check_out_at: new Date().toISOString() })
      .eq('id', dropinId)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data as CenterDropinRow, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

export async function getUpcomingActivities(centerId: string, limit = 50): Promise<Result<CenterActivityRow[]>> {
  try {
    const admin = createAdminClient()
    const now = new Date().toISOString()
    const { data, error } = await (admin.from as any)('center_activities')
      .select('*')
      .eq('center_id', centerId)
      .gte('scheduled_at', now)
      .neq('status', 'cancelled')
      .order('scheduled_at', { ascending: true })
      .limit(limit)
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []) as CenterActivityRow[], error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

export async function createActivity(fields: CenterActivityInsert): Promise<Result<CenterActivityRow>> {
  try {
    const admin = createAdminClient()
    const { data, error } = await (admin.from as any)('center_activities')
      .insert(fields)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data as CenterActivityRow, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

export async function getActivityRegistrations(activityId: string): Promise<Result<ActivityRegistrationRow[]>> {
  try {
    const admin = createAdminClient()
    const { data, error } = await (admin.from as any)('activity_registrations')
      .select('*')
      .eq('activity_id', activityId)
      .order('registered_at', { ascending: true })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []) as ActivityRegistrationRow[], error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

export async function registerForActivity(activityId: string, centerId: string, visitorName: string, memberId?: string | null): Promise<Result<ActivityRegistrationRow>> {
  try {
    const admin = createAdminClient()
    const { data, error } = await (admin.from as any)('activity_registrations')
      .insert({ activity_id: activityId, center_id: centerId, visitor_name: visitorName, member_id: memberId ?? null })
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    // Increment registration_count on activity
    const { data: act } = await (admin.from as any)('center_activities')
      .select('registration_count')
      .eq('id', activityId)
      .maybeSingle()
    await (admin.from as any)('center_activities')
      .update({ registration_count: ((act as { registration_count: number } | null)?.registration_count ?? 0) + 1 })
      .eq('id', activityId)
    return { data: data as ActivityRegistrationRow, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

export async function getTodaysRoomBookings(centerId: string): Promise<Result<RoomBookingRow[]>> {
  try {
    const admin = createAdminClient()
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await (admin.from as any)('room_bookings')
      .select('*')
      .eq('center_id', centerId)
      .gte('start_time', `${today}T00:00:00.000Z`)
      .lte('start_time', `${today}T23:59:59.999Z`)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true })
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []) as RoomBookingRow[], error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

export async function createRoomBooking(fields: RoomBookingInsert): Promise<Result<RoomBookingRow>> {
  try {
    const admin = createAdminClient()
    const { data, error } = await (admin.from as any)('room_bookings')
      .insert(fields)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data as RoomBookingRow, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

export async function cancelRoomBooking(bookingId: string): Promise<Result<RoomBookingRow>> {
  try {
    const admin = createAdminClient()
    const { data, error } = await (admin.from as any)('room_bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data as RoomBookingRow, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

export async function getRecentMeals(centerId: string, limit = 30): Promise<Result<CongregrateMealRow[]>> {
  try {
    const admin = createAdminClient()
    const { data, error } = await (admin.from as any)('congregate_meals')
      .select('*')
      .eq('center_id', centerId)
      .order('meal_date', { ascending: false })
      .limit(limit)
    if (error) return { data: null, error: error.message }
    return { data: (data ?? []) as CongregrateMealRow[], error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

export async function upsertMeal(fields: CongregrateMealInsert): Promise<Result<CongregrateMealRow>> {
  try {
    const admin = createAdminClient()
    const { data, error } = await (admin.from as any)('congregate_meals')
      .upsert(fields, { onConflict: 'center_id,meal_date,meal_type' })
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    return { data: data as CongregrateMealRow, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

export async function getSeniorCenterStats(centerId: string): Promise<Result<SeniorCenterStats>> {
  try {
    const admin = createAdminClient()
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

    const [todayDropinsRes, weekDropinsRes, mealsRes, upcomingActivitiesRes, todayRoomsRes] = await Promise.all([
      (admin.from as any)('center_dropins').select('id', { count: 'exact', head: true }).eq('center_id', centerId).gte('check_in_at', `${today}T00:00:00Z`).lte('check_in_at', `${today}T23:59:59Z`),
      (admin.from as any)('center_dropins').select('id', { count: 'exact', head: true }).eq('center_id', centerId).gte('check_in_at', weekAgo),
      (admin.from as any)('congregate_meals').select('attendee_count').eq('center_id', centerId).gte('meal_date', monthStart),
      (admin.from as any)('center_activities').select('id', { count: 'exact', head: true }).eq('center_id', centerId).gte('scheduled_at', now.toISOString()).neq('status', 'cancelled'),
      (admin.from as any)('room_bookings').select('id', { count: 'exact', head: true }).eq('center_id', centerId).gte('start_time', `${today}T00:00:00Z`).lte('start_time', `${today}T23:59:59Z`).neq('status', 'cancelled'),
    ])

    const totalMealAttendees = ((mealsRes.data ?? []) as { attendee_count: number }[]).reduce((sum, m) => sum + (m.attendee_count ?? 0), 0)

    return {
      data: {
        today_dropins: todayDropinsRes.count ?? 0,
        this_week_dropins: weekDropinsRes.count ?? 0,
        this_month_meals: ((mealsRes.data ?? []) as unknown[]).length,
        total_meals_attendees_this_month: totalMealAttendees,
        upcoming_activities: upcomingActivitiesRes.count ?? 0,
        rooms_booked_today: todayRoomsRes.count ?? 0,
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

// Verify auth user is linked to this center (for API routes)
export async function verifyCenterAdmin(authUserId: string, centerId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: fm } = await supabase
      .from('family_members')
      .select('role, senior_center_id')
      .eq('supabase_auth_id', authUserId)
      .maybeSingle()
    if (!fm) return false
    if (fm.role === 'admin') return true
    return fm.role === 'senior_center_admin' && fm.senior_center_id === centerId
  } catch {
    return false
  }
}
