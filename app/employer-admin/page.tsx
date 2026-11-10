import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import EmployerAdminClient from './EmployerAdminClient'

export const dynamic = 'force-dynamic'

export default async function EmployerAdminPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const role = (user.app_metadata?.role ?? user.user_metadata?.role ?? '') as string
  if (!['employer', 'admin', 'super_admin'].includes(role)) redirect('/login')
  return <EmployerAdminClient />
}
