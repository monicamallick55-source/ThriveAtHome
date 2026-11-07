/**
 * app/admin/layout.tsx
 * Guards the entire /admin subtree — only the 'admin' role may enter.
 * Volunteers, members, and all other roles are redirected to their home.
 */
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getUserRole } from '@/lib/auth'
import { roleHome } from '@/lib/roles'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()
  const role = await getUserRole(user.id)

  if (role !== 'admin') {
    // Send each role to its own home; non-authed users already redirected by requireAuth
    redirect(roleHome(role))
  }

  return <>{children}</>
}
