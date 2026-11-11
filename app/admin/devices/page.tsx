import { redirect } from 'next/navigation'
import { requireAuth, getUserRole } from '@/lib/auth'
export default async function AdminSubPage() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'admin') redirect('/dashboard')
  return (
    <div style={{ padding: '40px 32px', fontFamily: 'system-ui', maxWidth: '960px', margin: '0 auto' }}>
      <p style={{ color: '#6b7280', marginTop: '8px' }}>Devices &amp; Kiosks — manage registered kiosk devices and monitor device heartbeats.</p>
    </div>
  )
}
