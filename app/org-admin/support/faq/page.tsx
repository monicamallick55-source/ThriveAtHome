'use client'
import Link from 'next/link'
import { useState } from 'react'
const FAQS = [
  { category: 'Member Management', items: [
    { q: "How do I add members to our organization?", a: "Go to Partner Portal → Members → Add Member. You can add members one at a time or bulk-import via CSV." },
    { q: "How do I remove a member from our program?", a: "Go to Partner Portal → Members → find the member → Remove from Program. Their ThriveAtHome account remains active." },
    { q: "Can I export a list of our members?", a: "Yes — Partner Portal → Reports → Member Export. Available as CSV or PDF with enrollment dates and activity summaries." },
  ]},
  { category: 'Billing & Contracts', items: [
    { q: "When is my monthly invoice generated?", a: "Invoices are generated on the 1st of each month for the prior month's usage. You'll receive an email with a PDF invoice." },
    { q: "How is per-member pricing calculated?", a: "Your per-member rate is set in your contract (In-Development, Established, or Scale tier). You're billed for peak member count." },
    { q: "How do I update our billing contact?", a: "Submit a billing support ticket or email your Account Manager. Changes require authorization from the primary account holder." },
  ]},
  { category: 'Platform & Integration', items: [
    { q: "How does data sharing work?", a: "ThriveAtHome supports FHIR R4 referrals for healthcare partners, CSV imports, and webhook notifications. Contact your Account Manager to set up an integration." },
    { q: "Can we white-label the member experience?", a: "Yes — Enterprise and Scale tier partners can configure custom branding. Go to Portal Settings → Branding." },
    { q: "What SLA does ThriveAtHome guarantee?", a: "We target 99.9% uptime. Planned maintenance windows are communicated at least 48 hours in advance." },
  ]},
  { category: 'Support & Escalations', items: [
    { q: "What's the partner support SLA?", a: "Standard tickets: 24-hour response. Urgent: 2-hour escalation to your Account Manager. Critical outages: 1-hour response." },
    { q: "How do I escalate a critical issue?", a: "Submit a ticket with Priority: Urgent, or call Jordan directly (Partner Support line shown in your portal). Jordan handles critical escalations 24/7." },
    { q: "Who is my Account Manager?", a: "Your assigned Account Manager is listed in Portal → Settings → Account. If not assigned yet, submit a ticket and we'll connect you within one business day." },
  ]},
]
export default function B2BFaqPage() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (k: string) => setOpen(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n })
  const q = search.toLowerCase()
  const filtered = FAQS.map(c => ({ ...c, items: c.items.filter(i => !q || i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q)) })).filter(c => c.items.length > 0)
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <Link href="/org-admin/support" style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none' }}>← Back to Partner Support</Link>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1f2937', margin: '12px 0 4px' }}>Partner Help &amp; FAQ</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 24px' }}>Answers for organization administrators</p>
      <input type="text" placeholder="Search partner help articles…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', marginBottom: 28, boxSizing: 'border-box' }} />
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b7280' }}>
          <p>No results for "{search}" — <Link href="/org-admin/support" style={{ color: '#6366f1' }}>submit a ticket</Link></p>
        </div>
      ) : filtered.map(cat => (
        <div key={cat.category} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>{cat.category}</h2>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            {cat.items.map((item, i) => {
              const k = `${cat.category}-${i}`
              return (
                <div key={k} style={{ borderTop: i > 0 ? '1px solid #f3f4f6' : 'none' }}>
                  <button onClick={() => toggle(k)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>
                    {item.q}<span style={{ color: '#9ca3af', marginLeft: 8 }}>{open.has(k) ? '−' : '+'}</span>
                  </button>
                  {open.has(k) && <div style={{ padding: '0 18px 14px', fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.6 }}>{item.a}</div>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      <div style={{ marginTop: 32, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, color: '#1e40af', margin: '0 0 4px' }}>Need more help?</p>
          <p style={{ fontSize: '0.85rem', color: '#3b82f6', margin: 0 }}>Urgent issues escalated to your Account Manager within 2 hours. Call Jordan 24/7 for critical issues.</p>
        </div>
        <Link href="/org-admin/support" style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>Submit Ticket</Link>
      </div>
    </div>
  )
}
