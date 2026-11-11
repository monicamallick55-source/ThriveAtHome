import { redirect } from 'next/navigation'
import { requireAuth, getUserRole } from '@/lib/auth'
export default async function AdminSubPage() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'admin') redirect('/dashboard')
  return (
    <div style={{ padding: '40px 32px', fontFamily: 'system-ui', maxWidth: '960px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#1e3a5f' }}>Grief Circles</h1>
      <p style={{ color: '#6b7280', marginTop: '8px' }}>Admin management area.</p>
    </div>
  )
}
