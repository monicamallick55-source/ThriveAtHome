#!/bin/bash
set -e
cd /workspaces/ThriveAtHome

mkdir -p components app/dashboard/support app/org-admin/support app/admin/support \
  app/api/support/ticket app/api/admin/support "app/api/admin/support/[id]"

# ── 1. SupportWidget ──────────────────────────────────────────────────────────
cat > components/SupportWidget.tsx << 'EOF'
'use client'
type SupportVariant = 'member' | 'family' | 'b2b' | 'navigator' | 'volunteer'
interface SupportWidgetProps { variant: SupportVariant; orgName?: string; compact?: boolean }
const PHONE = {
  rosa: process.env.NEXT_PUBLIC_PHONE_ROSA ?? '1-800-TAH-CARE',
  quinn: process.env.NEXT_PUBLIC_PHONE_QUINN ?? '1-800-TAH-24HR',
  hope: process.env.NEXT_PUBLIC_PHONE_HOPE ?? '1-800-TAH-HOPE',
  claire: process.env.NEXT_PUBLIC_PHONE_CLAIRE ?? '1-800-TAH-FMLY',
  jordan: process.env.NEXT_PUBLIC_PHONE_JORDAN ?? '1-800-TAH-B2BP',
  sam: process.env.NEXT_PUBLIC_PHONE_SAM ?? '1-800-TAH-VOLV',
  nova: process.env.NEXT_PUBLIC_PHONE_NOVA ?? '1-800-TAH-NAVR',
}
type AgentLine = { name: string; label: string; phone: string; color: string; hours: string; emoji: string }
const AGENTS_BY_VARIANT: Record<SupportVariant, AgentLine[]> = {
  member: [
    { name: 'Rosa', label: 'Care Line', phone: PHONE.rosa, color: '#10b981', hours: 'Mon–Fri 8am–8pm', emoji: '🌿' },
    { name: 'Quinn', label: '24/7 Concierge', phone: PHONE.quinn, color: '#6366f1', hours: 'Always open', emoji: '✨' },
    { name: 'Hope', label: 'Crisis Support', phone: PHONE.hope, color: '#ef4444', hours: 'Always open', emoji: '🤝' },
  ],
  family: [
    { name: 'Claire', label: 'Family Support', phone: PHONE.claire, color: '#8b5cf6', hours: 'Mon–Fri 8am–8pm', emoji: '💜' },
    { name: 'Quinn', label: '24/7 Concierge', phone: PHONE.quinn, color: '#6366f1', hours: 'Always open', emoji: '✨' },
    { name: 'Hope', label: 'Crisis Support', phone: PHONE.hope, color: '#ef4444', hours: 'Always open', emoji: '🤝' },
  ],
  b2b: [
    { name: 'Jordan', label: 'Partner Support', phone: PHONE.jordan, color: '#6366f1', hours: 'Mon–Fri 8am–6pm PT', emoji: '💼' },
    { name: 'Quinn', label: '24/7 Concierge', phone: PHONE.quinn, color: '#10b981', hours: 'Always open', emoji: '✨' },
  ],
  navigator: [
    { name: 'Nova', label: 'Navigator Assist', phone: PHONE.nova, color: '#6366f1', hours: 'Mon–Fri 8am–6pm', emoji: '🔭' },
    { name: 'Quinn', label: '24/7 Concierge', phone: PHONE.quinn, color: '#10b981', hours: 'Always open', emoji: '✨' },
  ],
  volunteer: [
    { name: 'Sam', label: 'Volunteer Support', phone: PHONE.sam, color: '#f59e0b', hours: 'Mon–Fri 9am–5pm', emoji: '🌟' },
    { name: 'Quinn', label: '24/7 Concierge', phone: PHONE.quinn, color: '#6366f1', hours: 'Always open', emoji: '✨' },
  ],
}
const TICKET_LABEL: Record<SupportVariant, string> = {
  member: 'Submit a request', family: 'Submit a request', b2b: 'Submit a support ticket',
  navigator: 'Submit a request', volunteer: 'Submit a request',
}
export default function SupportWidget({ variant, orgName, compact = false }: SupportWidgetProps) {
  const agents = AGENTS_BY_VARIANT[variant]
  const isB2B = variant === 'b2b'
  const containerStyle: React.CSSProperties = compact
    ? { border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px', background: '#fafafa', marginTop: 24 }
    : { border: '1px solid #e5e7eb', borderRadius: 16, padding: '20px 22px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }
  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: isB2B ? '#ede9fe' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
          {isB2B ? '💼' : '🤝'}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1f2937' }}>{isB2B ? 'Partner Support' : 'Need Help?'}</div>
          {orgName && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{orgName}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {agents.map(agent => (
          <div key={agent.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: '#f9fafb', border: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: agent.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1f2937' }}>{agent.emoji} {agent.name} — {agent.label}</div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 1 }}>{agent.hours}</div>
              </div>
            </div>
            <a href={`tel:${agent.phone.replace(/[^0-9+]/g, '')}`} style={{ fontSize: '0.78rem', fontWeight: 700, color: agent.color, textDecoration: 'none', whiteSpace: 'nowrap', padding: '4px 10px', border: `1px solid ${agent.color}`, borderRadius: 6, background: 'white' }}>
              {agent.phone}
            </a>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
        <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 10 }}>
          {isB2B ? "Can't call right now? Submit a ticket and we'll respond within 24 hours." : "Prefer to write? Submit a request and we'll follow up."}
        </div>
        <a href={isB2B ? '/org-admin/support' : '/dashboard/support'} style={{ display: 'block', textAlign: 'center', padding: '9px 16px', borderRadius: 8, background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none' }}>
          {TICKET_LABEL[variant]}
        </a>
      </div>
    </div>
  )
}
EOF
echo "✓ components/SupportWidget.tsx"

# ── 2. API: POST /api/support/ticket ─────────────────────────────────────────
cat > app/api/support/ticket/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? 'support@thrivathome.com'

const SLA_HOURS: Record<string, number> = {
  member: 48, family: 48,
  'org-admin': 24, 'employer-admin': 24, 'agency-admin': 24,
  'network-admin': 24, 'senior-center-admin': 24, 'aaa-admin': 24,
  'vso-admin': 24, 'university-admin': 24, 'school-admin': 24,
  navigator: 8,
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { category, subject, description, portal_type, priority = 'normal', org_id } = body
    if (!subject?.trim() || !description?.trim() || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const { createServerClient } = await import('@supabase/ssr')
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    let submitterEmail = user?.email ?? 'unknown@thrivathome.com'
    let submitterName = ''
    if (user?.id) {
      const admin = createAdminClient() as any
      const { data: member } = await admin.from('members').select('first_name, last_name, email').eq('supabase_auth_id', user.id).maybeSingle()
      if (member) { submitterEmail = member.email ?? submitterEmail; submitterName = `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim() }
    }
    const sla_hours = SLA_HOURS[portal_type ?? 'member'] ?? 48
    const sla_breach_at = new Date(Date.now() + sla_hours * 3600000).toISOString()
    const admin = createAdminClient() as any
    const { data: ticket, error: dbError } = await admin.from('support_tickets').insert({
      submitted_by_auth_id: user?.id ?? null, submitter_email: submitterEmail,
      submitter_name: submitterName || null, org_id: org_id ?? null,
      subject, description, category, priority, portal_type: portal_type ?? 'member',
      sla_hours, sla_breach_at,
    }).select('id').single()
    if (dbError) console.error('support_tickets insert error:', dbError)
    const ticketId = ticket?.id?.slice(0, 8) ?? 'new'
    try {
      await resend.emails.send({
        from: 'ThriveAtHome Support <noreply@thrivathome.com>',
        to: SUPPORT_EMAIL,
        subject: `[${priority.toUpperCase()}] ${portal_type ?? 'member'} ticket: ${subject}`,
        html: `<h2>New Support Ticket #${ticketId}</h2><p><b>From:</b> ${submitterName || 'Unknown'} &lt;${submitterEmail}&gt;<br><b>Portal:</b> ${portal_type}<br><b>Category:</b> ${category}<br><b>Priority:</b> ${priority}<br><b>SLA:</b> respond by ${new Date(sla_breach_at).toLocaleString()}</p><hr><h3>${subject}</h3><p style="white-space:pre-wrap">${description}</p>`,
      })
    } catch (emailErr) { console.error('support ticket email failed:', emailErr) }
    return NextResponse.json({ ok: true, ticket_id: ticket?.id ?? null })
  } catch (err) {
    console.error('POST /api/support/ticket error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
EOF
echo "✓ app/api/support/ticket/route.ts"

# ── 3. API: GET /api/admin/support ───────────────────────────────────────────
cat > app/api/admin/support/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get('status') ?? 'open'
    const admin = createAdminClient() as any
    let query = admin.from('support_tickets')
      .select('id,created_at,submitter_name,submitter_email,portal_type,category,priority,subject,description,status,assigned_to,sla_breach_at,resolved_at')
      .order('created_at', { ascending: false }).limit(100)
    if (status !== 'all') query = query.eq('status', status)
    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ tickets: data ?? [] })
  } catch (err) {
    console.error('GET /api/admin/support error:', err)
    return NextResponse.json({ tickets: [], error: 'Failed to load tickets' }, { status: 500 })
  }
}
EOF
echo "✓ app/api/admin/support/route.ts"

# ── 4. API: PATCH /api/admin/support/[id] ────────────────────────────────────
cat > "app/api/admin/support/[id]/route.ts" << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status, assigned_to, resolution_notes } = await req.json()
    const admin = createAdminClient() as any
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status) update.status = status
    if (assigned_to) update.assigned_to = assigned_to
    if (resolution_notes) update.resolution_notes = resolution_notes
    if (status === 'resolved' || status === 'closed') update.resolved_at = new Date().toISOString()
    const { error } = await admin.from('support_tickets').update(update).eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PATCH /api/admin/support/[id] error:', err)
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}
EOF
echo "✓ app/api/admin/support/[id]/route.ts"

# ── 5. /dashboard/support ────────────────────────────────────────────────────
cat > app/dashboard/support/page.tsx << 'EOF'
'use client'
import { useState } from 'react'
const CATEGORIES = [
  { value: 'billing', label: '💳 Billing or payment question' },
  { value: 'account', label: '👤 Account or login issue' },
  { value: 'aria', label: '📞 Aria call question' },
  { value: 'technical', label: '🔧 Technical problem' },
  { value: 'care', label: '💙 Care or navigation question' },
  { value: 'other', label: '💬 Something else' },
]
export default function MemberSupportPage() {
  const [category, setCategory] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle')
  const [error, setError] = useState('')
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category || !subject.trim() || !message.trim()) { setError('Please fill in all fields.'); return }
    setError(''); setStatus('sending')
    try {
      const res = await fetch('/api/support/ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category, subject, description: message, portal_type: 'member' }) })
      if (!res.ok) throw new Error('Failed')
      setStatus('sent')
    } catch { setStatus('error') }
  }
  if (status === 'sent') return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 16px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937', margin: '0 0 12px' }}>Request received</h1>
      <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 24 }}>We'll follow up within 24 hours. For urgent help call Quinn 24/7: <strong>{process.env.NEXT_PUBLIC_PHONE_QUINN ?? '1-800-TAH-24HR'}</strong>.</p>
      <a href="/dashboard" style={{ display: 'inline-block', padding: '10px 24px', background: '#6366f1', color: '#fff', borderRadius: 8, fontWeight: 700, textDecoration: 'none' }}>Back to dashboard</a>
    </div>
  )
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <a href="/dashboard" style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none', marginBottom: 24, display: 'inline-block' }}>← Back to dashboard</a>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937', margin: '0 0 6px' }}>Submit a request</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 28px' }}>We'll respond within 24 hours. Need help now? <a href={`tel:${(process.env.NEXT_PUBLIC_PHONE_QUINN ?? '').replace(/[^0-9+]/g,'')}`} style={{ color: '#6366f1', fontWeight: 700 }}>Call Quinn 24/7</a></p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 8 }}>What's this about?</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CATEGORIES.map(c => (
              <label key={c.value} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', border: category === c.value ? '2px solid #6366f1' : '1px solid #e5e7eb', background: category === c.value ? '#eef2ff' : '#fff', fontSize: '0.875rem', color: '#1f2937', fontWeight: category === c.value ? 600 : 400 }}>
                <input type="radio" name="category" value={c.value} checked={category === c.value} onChange={() => setCategory(c.value)} style={{ accentColor: '#6366f1' }} />
                {c.label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Subject</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description" style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Details</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell us what's happening…" rows={5} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
        </div>
        {error && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: 0 }}>{error}</p>}
        {status === 'error' && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: 0 }}>Something went wrong — please try again or call Quinn directly.</p>}
        <button type="submit" disabled={status === 'sending'} style={{ padding: '12px 24px', background: status === 'sending' ? '#a5b4fc' : '#6366f1', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: status === 'sending' ? 'not-allowed' : 'pointer' }}>
          {status === 'sending' ? 'Sending…' : 'Submit request'}
        </button>
      </form>
    </div>
  )
}
EOF
echo "✓ app/dashboard/support/page.tsx"

# ── 6. /org-admin/support ────────────────────────────────────────────────────
cat > app/org-admin/support/page.tsx << 'EOF'
'use client'
import { useState } from 'react'
import SupportWidget from '@/components/SupportWidget'
const CATEGORIES = [
  { value: 'member_mgmt', label: '👥 Member management' },
  { value: 'billing', label: '💳 Billing or invoicing' },
  { value: 'data_export', label: '📊 Data export / reporting' },
  { value: 'technical', label: '🔧 Technical / portal issue' },
  { value: 'onboarding', label: '🚀 Onboarding question' },
  { value: 'integration', label: '🔗 Integration question' },
  { value: 'other', label: '💬 Other' },
]
const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal — 24h' },
  { value: 'urgent', label: 'Urgent — 2h' },
]
export default function OrgAdminSupportPage() {
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('normal')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle')
  const [error, setError] = useState('')
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category || !subject.trim() || !message.trim()) { setError('Please fill in all fields.'); return }
    setError(''); setStatus('sending')
    try {
      const res = await fetch('/api/support/ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category, subject, description: message, priority, portal_type: 'org-admin' }) })
      if (!res.ok) throw new Error('Failed')
      setStatus('sent')
    } catch { setStatus('error') }
  }
  if (status === 'sent') return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 16px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937', margin: '0 0 12px' }}>Ticket submitted</h1>
      <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 24 }}>Our partner success team will respond within {priority === 'urgent' ? '2 hours' : '24 hours'}.<br/>For critical issues call Jordan: <strong>{process.env.NEXT_PUBLIC_PHONE_JORDAN ?? '1-800-TAH-B2BP'}</strong>.</p>
      <a href="/org-admin" style={{ display: 'inline-block', padding: '10px 24px', background: '#6366f1', color: '#fff', borderRadius: 8, fontWeight: 700, textDecoration: 'none' }}>Back to portal</a>
    </div>
  )
  return (
    <div style={{ maxWidth: 740, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <a href="/org-admin" style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>← Back to portal</a>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32, alignItems: 'start' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937', margin: '0 0 6px' }}>Submit a support ticket</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 28px' }}>Partner success team responds within 24h (urgent: 2h).</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit', background: '#fff' }}>
                <option value="">Select…</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Priority</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {PRIORITIES.map(p => (
                  <label key={p.value} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', border: priority === p.value ? '2px solid #6366f1' : '1px solid #e5e7eb', background: priority === p.value ? '#eef2ff' : '#fff', fontWeight: priority === p.value ? 600 : 400, color: '#1f2937' }}>
                    <input type="radio" name="priority" value={p.value} checked={priority === p.value} onChange={() => setPriority(p.value)} style={{ accentColor: '#6366f1' }} />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Subject</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description" style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Details</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe the issue in detail…" rows={6} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: 0 }}>{error}</p>}
            {status === 'error' && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: 0 }}>Something went wrong — please try again or call Jordan.</p>}
            <button type="submit" disabled={status === 'sending'} style={{ padding: '12px 24px', background: status === 'sending' ? '#a5b4fc' : '#6366f1', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: status === 'sending' ? 'not-allowed' : 'pointer' }}>
              {status === 'sending' ? 'Submitting…' : 'Submit ticket'}
            </button>
          </form>
        </div>
        <div style={{ position: 'sticky', top: 24 }}>
          <SupportWidget variant="b2b" />
        </div>
      </div>
    </div>
  )
}
EOF
echo "✓ app/org-admin/support/page.tsx"

# ── 7. /admin/support ─────────────────────────────────────────────────────────
cat > app/admin/support/page.tsx << 'EOF'
'use client'
import { useState, useEffect } from 'react'
type Ticket = { id: string; created_at: string; submitter_name: string|null; submitter_email: string; portal_type: string; category: string; priority: string; subject: string; description: string; status: string; assigned_to: string|null; sla_breach_at: string|null; resolved_at: string|null }
const SC: Record<string,string> = { open:'#ef4444', in_progress:'#f59e0b', waiting:'#6366f1', resolved:'#10b981', closed:'#9ca3af' }
const PC: Record<string,string> = { low:'#9ca3af', normal:'#6b7280', urgent:'#f59e0b', critical:'#ef4444' }
export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('open')
  const [selected, setSelected] = useState<Ticket|null>(null)
  const [updating, setUpdating] = useState(false)
  useEffect(() => { fetchTickets() }, [filterStatus])
  async function fetchTickets() {
    setLoading(true)
    try { const res = await fetch(`/api/admin/support?status=${filterStatus}`); const d = await res.json(); setTickets(d.tickets ?? []) }
    catch { setTickets([]) }
    finally { setLoading(false) }
  }
  async function updateStatus(id: string, status: string) {
    setUpdating(true)
    await fetch(`/api/admin/support/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setUpdating(false)
    if (selected?.id === id) setSelected({ ...selected, status })
    fetchTickets()
  }
  function slaColor(breach: string|null, status: string) {
    if (!breach || status === 'resolved' || status === 'closed') return '#10b981'
    const h = (new Date(breach).getTime() - Date.now()) / 3600000
    return h < 0 ? '#ef4444' : h < 2 ? '#f59e0b' : '#10b981'
  }
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937', margin: 0 }}>Support Tickets</h1>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 3 }}>{tickets.length} {filterStatus} ticket{tickets.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['open','in_progress','waiting','resolved','all'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: filterStatus===s?700:400, background: filterStatus===s?'#1f2937':'#f3f4f6', color: filterStatus===s?'#fff':'#6b7280' }}>
              {s.replace('_',' ')}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Loading…</p>}
          {!loading && tickets.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem', border: '1px dashed #e5e7eb', borderRadius: 12 }}>No {filterStatus} tickets</div>}
          {tickets.map(t => (
            <div key={t.id} onClick={() => setSelected(t===selected?null:t)} style={{ padding: '16px 18px', border: `1px solid ${selected?.id===t.id?'#6366f1':'#e5e7eb'}`, borderRadius: 12, background: selected?.id===t.id?'#fafafe':'#fff', cursor: 'pointer', boxShadow: selected?.id===t.id?'0 0 0 2px #c7d2fe':'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, background: SC[t.status]+'20', color: SC[t.status], padding: '2px 8px', borderRadius: 99 }}>{t.status.replace('_',' ')}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, background: PC[t.priority]+'20', color: PC[t.priority], padding: '2px 8px', borderRadius: 99 }}>{t.priority}</span>
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af', background: '#f3f4f6', padding: '2px 8px', borderRadius: 99 }}>{t.portal_type}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1f2937', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{t.submitter_name ?? t.submitter_email} · {t.category.replace('_',' ')}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{new Date(t.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                  {t.sla_breach_at && t.status!=='resolved' && t.status!=='closed' && (
                    <div style={{ fontSize: '0.68rem', marginTop: 2, color: slaColor(t.sla_breach_at, t.status), fontWeight: 700 }}>
                      SLA {new Date(t.sla_breach_at)<new Date()?'BREACHED':`by ${new Date(t.sla_breach_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {selected && (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: '22px', background: '#fff', position: 'sticky', top: 20, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: 4 }}>#{selected.id.slice(0,8)}</div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1f2937', margin: 0 }}>{selected.subject}</h2>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, fontSize: '0.82rem' }}>
              {[['From', `${selected.submitter_name??''} ${selected.submitter_email}`],['Portal',selected.portal_type],['Category',selected.category.replace('_',' ')],['Priority',selected.priority],['Submitted',new Date(selected.created_at).toLocaleString()]]
                .map(([k,v]) => <div key={k} style={{ display:'flex', gap:8 }}><span style={{ color:'#9ca3af', minWidth:80 }}>{k}</span><span style={{ color:'#1f2937', fontWeight:500 }}>{v}</span></div>)}
            </div>
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '14px', marginBottom: 20, fontSize: '0.875rem', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selected.description}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: 10 }}>Update status</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['open','in_progress','waiting','resolved','closed'].map(s => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)} disabled={updating||selected.status===s} style={{ padding: '7px 14px', borderRadius: 7, border: `1px solid ${SC[s]}`, cursor: selected.status===s?'default':'pointer', background: selected.status===s?SC[s]:'#fff', color: selected.status===s?'#fff':SC[s], fontWeight: 600, fontSize: '0.78rem', opacity: updating?0.5:1 }}>
                    {s.replace('_',' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
EOF
echo "✓ app/admin/support/page.tsx"

echo ""
echo "✅ All support files created. Now run:"
echo "   git add components/SupportWidget.tsx app/dashboard/support/ app/org-admin/support/ app/admin/support/ app/api/support/ app/api/admin/support/"
echo "   git commit -m 'feat(support): support widgets, ticket forms, admin view'"
echo "   git push origin main"
