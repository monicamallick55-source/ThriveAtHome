export const dynamic = 'force-dynamic'
// /dashboard/vault — alias for /dashboard/documents
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function VaultPage() {
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
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a', margin: '16px 0 8px' }}>Document Vault</h1>
      <p style={{ color: '#555', marginBottom: '32px' }}>Securely store and share important documents, life stories, and records.</p>

      <div style={{ display: 'grid', gap: '16px' }}>
        {[
          { icon: '📄', label: 'Important Documents', desc: 'Medical records, legal documents, insurance' },
          { icon: '📖', label: 'Life Story', desc: 'Share your story with family' },
          { icon: '🔐', label: 'Secure Vault', desc: 'Password-protected private storage' },
        ].map(item => (
          <Link key={item.label} href="/dashboard/documents" style={{ display: 'flex', gap: '16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', textDecoration: 'none', alignItems: 'center' }}>
            <span style={{ fontSize: '32px' }}>{item.icon}</span>
            <div>
              <div style={{ fontWeight: 600, color: '#111', marginBottom: '4px' }}>{item.label}</div>
              <div style={{ fontSize: '13px', color: '#666' }}>{item.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
