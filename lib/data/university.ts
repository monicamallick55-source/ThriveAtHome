// Data access layer for university admin portal — Phase 52
import { createAdminClient } from '@/lib/supabase/admin'

export interface UniversityStudent {
  id: string
  full_name: string
  email: string
  university_name: string | null
  major: string | null
  graduation_year: number | null
  total_hours_logged: number
  status: string
  created_at: string
}

export interface StudentVisitRow {
  id: string
  student_id: string
  visit_date: string
  duration_minutes: number
  visit_type: string
  reflection: string
  notes: string | null
  verified: boolean
  created_at: string
}

export interface StudentWithVisits extends UniversityStudent {
  visits: StudentVisitRow[]
}

/** Returns the university_name for a university_admin account, or null if not set. */
export async function getUniversityForAdmin(authId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('family_members')
    .select('university_name')
    .eq('supabase_auth_id', authId)
    .maybeSingle()
  if (error) console.error('[university/getUniversityForAdmin]', error)
  return data?.university_name ?? null
}

/** Returns all student_volunteers for a given university, sorted by name. */
export async function getStudentsByUniversity(universityName: string): Promise<UniversityStudent[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('student_volunteers')
    .select('id, full_name, email, university_name, major, graduation_year, total_hours_logged, status, created_at')
    .eq('university_name', universityName)
    .order('full_name', { ascending: true })
  if (error) {
    console.error('[university/getStudentsByUniversity]', error)
    return []
  }
  return data ?? []
}

/** Returns all student visits for a given student — used for per-student PDF generation. */
export async function getVisitsForStudent(studentId: string): Promise<StudentVisitRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('student_visits')
    .select('*')
    .eq('student_id', studentId)
    .order('visit_date', { ascending: false })
  if (error) {
    console.error('[university/getVisitsForStudent]', error)
    return []
  }
  return data ?? []
}

/** Returns all visits for all students at a university, optionally filtered to a date range. */
export async function getVisitsByUniversity(
  universityName: string,
  startDate?: string,
  endDate?: string
): Promise<(StudentVisitRow & { student_name: string; student_email: string; student_major: string | null; graduation_year: number | null })[]> {
  const admin = createAdminClient()

  // Get all students for this university first
  const students = await getStudentsByUniversity(universityName)
  if (students.length === 0) return []

  const studentIds = students.map((s) => s.id)
  const studentMap = new Map(students.map((s) => [s.id, s]))

  let query = admin
    .from('student_visits')
    .select('*')
    .in('student_id', studentIds)
    .order('visit_date', { ascending: true })

  if (startDate) query = query.gte('visit_date', startDate)
  if (endDate) query = query.lte('visit_date', endDate)

  const { data, error } = await query
  if (error) {
    console.error('[university/getVisitsByUniversity]', error)
    return []
  }

  return (data ?? []).map((v) => {
    const student = studentMap.get(v.student_id)
    return {
      ...v,
      student_name: student?.full_name ?? 'Unknown',
      student_email: student?.email ?? '',
      student_major: student?.major ?? null,
      graduation_year: student?.graduation_year ?? null,
    }
  })
}
