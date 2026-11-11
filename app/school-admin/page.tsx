import { redirect } from 'next/navigation'
import { requireAuth, getUserRole } from '@/lib/auth'
export default async function SchoolAdminPage() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (!['school_admin', 'admin'].includes(role ?? '')) redirect('/dashboard')
  return (
    <div style={{ padding: '40px 32px', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#1e3a5f' }}>School Admin Portal</h1>
      <p style={{ color: '#6b7280', marginTop: '8px' }}>Manage student and faculty volunteer programs.</p>
    </div>
  )
}
