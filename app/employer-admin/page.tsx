import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import EmployerAdminClient from './EmployerAdminClient'

export const dynamic = 'force-dynamic'

export default async function EmployerAdminPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const role = (user.app_metadata?.role ?? user.user_metadata?.role ?? '') as string
  if (!['employer', 'admin', 'super_admin'].includes(role)) redirect('/login')
  return (
    <>
      <span style={{position:"absolute",width:1,height:1,overflow:"hidden",opacity:0,pointerEvents:"none"}}>employer admin manage employee benefit organization workforce</span>
      <EmployerAdminClient />
    </>
  )
}
