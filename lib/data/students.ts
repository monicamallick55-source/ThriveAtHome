// Data access layer for student volunteers — Phase 32
import { createAdminClient } from '@/lib/supabase/admin'

export interface StudentVolunteer {
  id: string
  created_at: string
  supabase_auth_id: string | null
  full_name: string
  email: string
  university_name: string | null
  major: string | null
  graduation_year: number | null
  interests: string[]
  languages: string[]
  total_hours_logged: number
  status: string
}

export interface StudentVisit {
  id: string
  created_at: string
  visit_date: string
  duration_minutes: number
  visit_type: string
  reflection: string
  notes: string | null
  verified: boolean
}

export async function getStudentByAuthId(authId: string): Promise<StudentVolunteer | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('student_volunteers')
    .select('*')
    .eq('supabase_auth_id', authId)
    .maybeSingle()
  if (error) console.error('[students/getStudentByAuthId]', error)
  return data
}

export async function getStudentVisits(studentId: string): Promise<StudentVisit[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('student_visits')
    .select('*')
    .eq('student_id', studentId)
    .order('visit_date', { ascending: false })
  if (error) {
    console.error('[students/getStudentVisits]', error)
    return []
  }
  return data ?? []
}

export async function logStudentVisit(params: {
  studentId: string
  visitDate: string
  durationMinutes: number
  visitType: string
  reflection: string
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient()

  const { error: insertError } = await admin
    .from('student_visits')
    .insert({
      student_id: params.studentId,
      visit_date: params.visitDate,
      duration_minutes: params.durationMinutes,
      visit_type: params.visitType,
      reflection: params.reflection,
      notes: params.notes ?? null,
      verified: false,
    })

  if (insertError) {
    console.error('[students/logStudentVisit insert]', insertError)
    return { success: false, error: insertError.message }
  }

  // Update total_hours_logged on student record
  const { data: current } = await admin
    .from('student_volunteers')
    .select('total_hours_logged')
    .eq('id', params.studentId)
    .maybeSingle()

  const currentHours = current?.total_hours_logged ?? 0
  const additionalHours = params.durationMinutes / 60

  await admin
    .from('student_volunteers')
    .update({ total_hours_logged: currentHours + additionalHours })
    .eq('id', params.studentId)

  return { success: true }
}
