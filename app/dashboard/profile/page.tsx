export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ProfilePage() {
  let user = null
  try {
    const supabase = await Promise.race([
      createClient(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)) as any
    ])
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {}
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('members')
    .select('first_name, last_name, preferred_name, zip_code, phone, birthday')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <Link href="/dashboard" style={{ fontSize: '14px', color: '#2d6a4f', textDecoration: 'none' }}>← Dashboard</Link>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a', margin: '16px 0 8px' }}>Your Profile</h1>
      <p style={{ color: '#555', marginBottom: '32px' }}>Manage your personal information and preferences.</p>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: '#374151' }}>Personal Information</h2>
        {[
          { label: 'Name', value: member ? `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim() : '' },
          { label: 'Preferred name', value: member?.preferred_name ?? '' },
          { label: 'ZIP code', value: member?.zip_code ?? '' },
          { label: 'Phone', value: member?.phone ?? '' },
          { label: 'Birthday', value: member?.birthday ?? '' },
        ].map(field => (
          <div key={field.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>{field.label}</span>
            <span style={{ color: '#111', fontSize: '14px' }}>{field.value || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
