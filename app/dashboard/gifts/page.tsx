'use client'

/**
 * app/dashboard/gifts/page.tsx — G7.3 Senior-to-Family Gifts
 *
 * Member browses the gift catalog, picks an item, personalises it,
 * and sends it to a family member. Orders under $75 go immediately;
 * orders ≥$75 are flagged for family approval first.
 */

import { useState, useEffect } from 'react'

type CatalogItem = {
  id: string
  kind: string
  title: string
  description: string
  price_cents: number
  image_emoji: string
  requires_email: boolean
  needs_family_approval_above?: number
  available: boolean
}

type FamilyMember = {
  id: string
  name: string
  email?: string
  relationship?: string
}

type GiftOrder = {
  id: string
  created_at: string
  catalog_item_id: string
  to_family_member_id: string
  personalization?: string
  price_cents: number
  status: string
  needs_family_approval: boolean
  to_family_member?: { id: string; name: string; email: string }
}

const CATALOG: CatalogItem[] = [
  { id: 'note_personal',       kind: 'note',        title: 'Personal Note',          description: 'A heartfelt message, delivered digitally.',               price_cents: 0,     image_emoji: '💌', requires_email: true,  available: true },
  { id: 'card_birthday',       kind: 'card',        title: 'Birthday Card',          description: 'A beautiful card you personalise and we deliver.',         price_cents: 499,   image_emoji: '🎂', requires_email: true,  available: true },
  { id: 'card_thinking_of_you',kind: 'card',        title: 'Thinking of You',        description: "Let them know you're thinking of them.",                   price_cents: 499,   image_emoji: '💛', requires_email: true,  available: true },
  { id: 'card_anniversary',    kind: 'card',        title: 'Anniversary Card',       description: 'Celebrate a special anniversary.',                         price_cents: 499,   image_emoji: '💍', requires_email: true,  available: true },
  { id: 'flowers_mixed',       kind: 'flowers',     title: 'Mixed Flowers',          description: 'A beautiful seasonal bouquet delivered to their door.',    price_cents: 5999,  image_emoji: '💐', requires_email: false, available: true },
  { id: 'flowers_roses',       kind: 'flowers',     title: 'Roses',                  description: 'Classic red roses — a timeless gift.',                    price_cents: 6999,  image_emoji: '🌹', requires_email: false, available: true },
  { id: 'food_basket_classic', kind: 'food_basket', title: 'Classic Gift Basket',    description: 'Fruit, nuts, chocolates, and snacks — curated with care.', price_cents: 7999,  image_emoji: '🧺', requires_email: false, available: true },
  { id: 'food_basket_tea',     kind: 'food_basket', title: 'Tea & Treats',           description: 'Premium teas, biscuits, and chocolates.',                 price_cents: 5999,  image_emoji: '🍵', requires_email: false, available: true },
]

function formatPrice(cents: number) {
  if (cents === 0) return 'Free'
  return `$${(cents / 100).toFixed(2)}`
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    pending:           { label: 'Pending',           bg: '#fef3c7', color: '#92400e' },
    awaiting_approval: { label: 'Awaiting Approval', bg: '#ede9fe', color: '#5b21b6' },
    approved:          { label: 'Approved',          bg: '#d1fae5', color: '#065f46' },
    fulfilled:         { label: 'Sent!',             bg: '#d1fae5', color: '#065f46' },
    cancelled:         { label: 'Cancelled',         bg: '#fee2e2', color: '#991b1b' },
  }
  const s = map[status] ?? { label: status, bg: '#f3f4f6', color: '#374151' }
  return (
    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

export default function GiftsPage() {
  const [view, setView] = useState<'catalog' | 'send' | 'orders'>('catalog')
  const [selected, setSelected] = useState<CatalogItem | null>(null)
  const [family, setFamily] = useState<FamilyMember[]>([])
  const [toId, setToId] = useState('')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [orders, setOrders] = useState<GiftOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    // Load family members
    fetch('/api/family-members')
      .then(r => r.ok ? r.json() : { family_members: [] })
      .then(d => setFamily(d.family_members ?? []))
      .catch(() => {})
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function pickItem(item: CatalogItem) {
    setSelected(item)
    setToId(family[0]?.id ?? '')
    setNote('')
    setView('send')
  }

  async function sendGift() {
    if (!selected || !toId) return
    setSending(true)
    try {
      const res = await fetch('/api/gift-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catalog_item_id: selected.id,
          to_family_member_id: toId,
          personalization: note || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Something went wrong'); return }
      if (data.checkout_url) {
        window.location.href = data.checkout_url
        return
      }
      showToast(data.order?.needs_family_approval
        ? '🎁 Gift queued — your family will be notified for approval.'
        : '🎁 Gift sent successfully!')
      setView('catalog')
      setSelected(null)
    } finally {
      setSending(false)
    }
  }

  async function loadOrders() {
    setLoadingOrders(true)
    setView('orders')
    try {
      const res = await fetch('/api/gift-orders?view=sent')
      const data = await res.json()
      setOrders(data.orders ?? [])
    } finally {
      setLoadingOrders(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1f2937', color: '#fff', padding: '10px 24px', borderRadius: 10, fontSize: '0.9rem', zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Send a Gift</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '0.9rem' }}>
            Share your love with cards, flowers, and more.
          </p>
        </div>
        <button
          onClick={view === 'orders' ? () => setView('catalog') : loadOrders}
          style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
          {view === 'orders' ? '← Catalog' : 'My Orders'}
        </button>
      </div>

      {/* ── Catalog view ── */}
      {view === 'catalog' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {CATALOG.filter(i => i.available).map(item => (
            <button
              key={item.id}
              onClick={() => pickItem(item)}
              style={{
                border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 16px',
                background: '#fff', cursor: 'pointer', textAlign: 'left',
                transition: 'box-shadow 0.15s', display: 'flex', flexDirection: 'column', gap: 8,
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
              <div style={{ fontSize: '2.2rem' }}>{item.image_emoji}</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1f2937' }}>{item.title}</div>
              <div style={{ fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.4 }}>{item.description}</div>
              <div style={{ marginTop: 'auto', fontWeight: 700, color: item.price_cents === 0 ? '#10b981' : '#6366f1', fontSize: '0.9rem' }}>
                {formatPrice(item.price_cents)}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Send form ── */}
      {view === 'send' && selected && (
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <button onClick={() => { setView('catalog'); setSelected(null) }}
            style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', padding: 0, marginBottom: 20 }}>
            ← Back to catalog
          </button>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, background: '#fafafa', marginBottom: 20 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>{selected.image_emoji}</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1f2937' }}>{selected.title}</div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 4 }}>{selected.description}</div>
            <div style={{ marginTop: 10, fontWeight: 700, fontSize: '1rem', color: selected.price_cents === 0 ? '#10b981' : '#6366f1' }}>
              {formatPrice(selected.price_cents)}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6, color: '#374151' }}>
                Send to
              </label>
              {family.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>No family members found. Add family members in your profile settings.</p>
              ) : (
                <select
                  value={toId}
                  onChange={e => setToId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem', background: '#fff' }}>
                  {family.map(f => (
                    <option key={f.id} value={f.id}>{f.name}{f.relationship ? ` (${f.relationship})` : ''}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6, color: '#374151' }}>
                Personal message <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Write a note to include with your gift…"
                rows={4}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            {selected.price_cents >= 7500 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 14px', fontSize: '0.82rem', color: '#92400e' }}>
                ⚠️ Gifts over $75 require your family's approval before we process them — they'll get a notification to review.
              </div>
            )}

            <button
              onClick={sendGift}
              disabled={sending || !toId || family.length === 0}
              style={{
                padding: '13px 0', borderRadius: 10, border: 'none',
                background: sending || !toId ? '#e5e7eb' : '#6366f1',
                color: sending || !toId ? '#9ca3af' : '#fff',
                fontWeight: 700, fontSize: '1rem', cursor: sending || !toId ? 'default' : 'pointer',
              }}>
              {sending ? 'Sending…' : selected.price_cents === 0 ? 'Send Gift 💌' : `Send Gift — ${formatPrice(selected.price_cents)}`}
            </button>
          </div>
        </div>
      )}

      {/* ── Orders view ── */}
      {view === 'orders' && (
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: '#374151' }}>My Gift Orders</h2>
          {loadingOrders ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', paddingTop: 32 }}>Loading orders…</p>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 40, color: '#9ca3af' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎁</div>
              <p>You haven't sent any gifts yet.</p>
              <button onClick={() => setView('catalog')}
                style={{ marginTop: 12, padding: '10px 20px', border: 'none', borderRadius: 8, background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                Browse Gifts
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {orders.map(order => {
                const item = CATALOG.find(c => c.id === order.catalog_item_id)
                return (
                  <div key={order.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', background: '#fff', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>{item?.image_emoji ?? '🎁'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.925rem', color: '#1f2937' }}>{item?.title ?? order.catalog_item_id}</div>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>
                        To: {order.to_family_member?.name ?? '—'} · {new Date(order.created_at).toLocaleDateString()}
                        {order.personalization ? ` · "${order.personalization.slice(0, 40)}${order.personalization.length > 40 ? '…' : ''}"` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      {statusBadge(order.status)}
                      <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{formatPrice(order.price_cents)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
