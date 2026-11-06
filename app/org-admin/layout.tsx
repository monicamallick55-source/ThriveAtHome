import { redirect } from 'next/navigation'
import { getCurrentUser, getUserRole } from '@/lib/auth'

const ALLOWED_ROLES = ['org_admin', 'admin', 'vso_admin', 'school_admin'] as const

export default async function OrgAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const role = await getUserRole(user.id)
  if (!role || !(ALLOWED_ROLES as readonly string[]).includes(role)) {
    redirect('/login')
  }
  return <>{children}</>
}
