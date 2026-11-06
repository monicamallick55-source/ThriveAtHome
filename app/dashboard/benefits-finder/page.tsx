import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function BenefitsFinderPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <Link href="/dashboard" style={{ fontSize: '14px', color: '#2d6a4f', textDecoration: 'none' }}>← Dashboard</Link>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a', margin: '16px 0 8px' }}>Benefits Finder</h1>
      <p style={{ color: '#555', marginBottom: '32px' }}>Discover Medicare, Medicaid, Social Security, and local assistance programs you may qualify for.</p>
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#14532d', marginBottom: '12px' }}>Common Benefits</h2>
        {['Medicare Part D — Prescription Drug Coverage', 'Extra Help / Low Income Subsidy', 'SNAP Food Assistance', 'LIHEAP Energy Assistance', 'Medicaid Home Care Waiver', 'Veterans Benefits (VA)'].map(b => (
          <div key={b} style={{ padding: '12px 0', borderBottom: '1px solid #d1fae5', fontSize: '15px', color: '#166534' }}>✓ {b}</div>
        ))}
      </div>
      <Link href="/dashboard/medicare-help" style={{ color: '#2d6a4f', fontWeight: 600, textDecoration: 'none' }}>
        → Get Medicare help from your navigator
      </Link>
    </div>
  )
}
