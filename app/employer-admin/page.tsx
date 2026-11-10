import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EmployerAdminClient from './EmployerAdminClient'
export default async function EmployerAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const role = (user.app_metadata?.role ?? user.user_metadata?.role ?? '') as string
  if (!['employer', 'admin', 'super_admin'].includes(role)) redirect('/login')
  return <EmployerAdminClient />
}
