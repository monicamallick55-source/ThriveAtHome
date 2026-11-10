'use client'
import Link from 'next/link'
import { useState } from 'react'
const FAQS = [
  { category: 'Aria & Calls', items: [
    { q: "Why didn't Aria call me today?", a: "Aria calls during your preferred time window (set in your profile). If you missed a call, Aria will try again tomorrow. You can also call Aria directly at any time." },
    { q: "Can I change what time Aria calls me?", a: "Yes — go to Dashboard → Profile → Call Preferences and update your preferred call window." },
    { q: "How do I pause Aria calls?", a: "Go to Dashboard → Profile → Call Preferences and toggle \"Pause Aria calls.\" You can pause for 1 day, 1 week, or indefinitely." },
  ]},
  { category: 'Billing & Account', items: [
    { q: "How do I cancel my subscription?", a: "Go to Dashboard → Plan & Billing → Cancel Subscription. Your access continues until the end of your billing period." },
    { q: "How do I upgrade from Basic to Complete?", a: "Go to Dashboard → Plan & Billing → Upgrade. You'll be charged a prorated amount for the remaining days in your cycle." },
    { q: "How do I update my payment method?", a: "Go to Dashboard → Plan & Billing → Manage Payment to update your card securely via Stripe." },
  ]},
  { category: 'Family & Navigator', items: [
    { q: "How do I add a family member?", a: "Go to Dashboard → Family → Invite Family Member. Enter their email and they'll receive an invitation." },
    { q: "What can my family see?", a: "Family members can see wellness summaries and Aria call logs. They cannot see your vault, health details, or billing." },
    { q: "How do I contact my Navigator?", a: "Your Navigator's contact info is on Dashboard → Navigator. Available Monday–Friday, 9am–5pm PT." },
  ]},
  { category: 'Technical', items: [
    { q: "The website isn't loading correctly.", a: "Try refreshing (Ctrl+R or Cmd+R) or clearing your browser cache. If it persists, submit a support ticket." },
    { q: "I forgot my password.", a: "On the login page, click \"Forgot password?\" and enter your email. Check your spam folder if you don't see the reset email." },
    { q: "Can I use ThriveAtHome on my phone?", a: "Yes — ThriveAtHome works in any modern web browser on phones, tablets, and computers." },
  ]},
]
export default function MemberFaqPage() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (k: string) => setOpen(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n })
  const q = search.toLowerCase()
  const filtered = FAQS.map(c => ({ ...c, items: c.items.filter(i => !q || i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q)) })).filter(c => c.items.length > 0)
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <Link href="/dashboard/support" style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none' }}>← Back to Support</Link>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1f2937', margin: '12px 0 4px' }}>Help &amp; FAQ</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 24px' }}>Find answers to common questions</p>
      <input type="text" placeholder="Search help articles…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', marginBottom: 28, boxSizing: 'border-box' }} />
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b7280' }}>
          <p>No results for "{search}" — <Link href="/dashboard/support" style={{ color: '#6366f1' }}>submit a ticket</Link></p>
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
      <div style={{ marginTop: 32, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontWeight: 700, color: '#1e40af', margin: '0 0 8px' }}>Still need help?</p>
        <p style={{ fontSize: '0.85rem', color: '#3b82f6', margin: '0 0 16px' }}>Quinn is available 24/7 for urgent questions. Our team responds within 48 hours.</p>
        <Link href="/dashboard/support" style={{ display: 'inline-block', padding: '10px 24px', background: '#6366f1', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none' }}>Submit a Support Ticket</Link>
      </div>
    </div>
  )
}
