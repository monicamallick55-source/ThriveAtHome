import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function NavigatorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: prof } = await supabase
    .from('family_members')
    .select('role')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  if (!prof || !['navigator', 'admin', 'super_admin', 'org_admin'].includes(prof.role ?? '')) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
