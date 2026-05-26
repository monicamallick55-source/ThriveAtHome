import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { getStudentByAuthId } from '@/lib/data/students'
import { getStudentVisits } from '@/lib/data/students'
import StudentPortal from '@/components/student/StudentPortal'
import StudentRegisterForm from '@/components/student/StudentRegisterForm'

export const metadata: Metadata = { title: 'Student Portal — ThriveAtHome' }

export default async function StudentPage() {
  const user = await requireAuth()
  const student = await getStudentByAuthId(user.id)

  if (!student) {
    return <StudentRegisterForm email={user.email ?? ''} />
  }

  const visits = await getStudentVisits(student.id)

  return <StudentPortal student={student} initialVisits={visits} />
}
