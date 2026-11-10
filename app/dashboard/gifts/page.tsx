export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function GiftsPage() {
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

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <Link href="/dashboard" style={{ fontSize: '14px', color: '#2d6a4f', textDecoration: 'none' }}>← Dashboard</Link>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a', margin: '16px 0 8px' }}>Gifts &amp; Giving</h1>
      <p style={{ color: '#555', marginBottom: '32px' }}>Send thoughtful gifts to friends and family in the community.</p>
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '24px' }}>
        <p style={{ color: '#166534', marginBottom: '16px' }}>Gift sending is available on the Thrive Complete plan.</p>
        <Link href="/dashboard/plan" style={{ color: '#2d6a4f', fontWeight: 600, textDecoration: 'none' }}>See plans →</Link>
      </div>
    </div>
  )
}
