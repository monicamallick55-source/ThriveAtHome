'use client'
// components/gifts/GiftPickerModal.tsx
// G7.3 — Modal for senior to choose and send a gift to family

import { useState } from 'react'
import { GIFT_CATALOG, type GiftItem } from '@/lib/gifts/catalog'

const CATEGORIES = [
  { id: 'all',        label: 'All gifts' },
  { id: 'card',       label: '💌 Cards' },
  { id: 'flowers',    label: '💐 Flowers' },
  { id: 'food',       label: '🍱 Food' },
  { id: 'keepsake',   label: '📸 Keepsakes' },
  { id: 'experience', label: '🎁 Digital' },
]

interface Props {
  onClose: () => void
  onSent: (giftLabel: string) => void
  recipientSuggestion?: string
}

export default function GiftPickerModal({ onClose, onSent, recipientSuggestion }: Props) {
  const [category, setCategory] = useState<string>('all')
  const [selected, setSelected] = useState<GiftItem | null>(null)
  const [recipientName, setRecipientName] = useState(recipientSuggestion ?? '')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = category === 'all'
    ? GIFT_CATALOG
    : GIFT_CATALOG.filter((g) => g.category === category)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !recipientName) return
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/gift-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftId: selected.id,
          recipientName,
          recipientEmail: recipientEmail || undefined,
          message: message || undefined,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error ?? 'Failed to place order')
      }
      onSent(selected.label)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, maxWidth: 640, width: '100%',
        maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px', borderBottom: '1px solid #e5e7eb',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: '#fff', zIndex: 1,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>🎁 Send a gift</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Choose something special for your family</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f3f4f6', border: 'none', borderRadius: 20, padding: '6px 12px', cursor: 'pointer', fontSize: 14 }}
          >✕</button>
        </div>

        {!selected ? (
          <div style={{ padding: '18px 20px' }}>
            {/* Category filter */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  style={{
                    padding: '6px 14px', border: '1px solid',
                    borderColor: category === c.id ? '#1d4ed8' : '#e5e7eb',
                    background: category === c.id ? '#eff6ff' : '#fff',
                    color: category === c.id ? '#1d4ed8' : '#374151',
                    borderRadius: 20, fontSize: 13, cursor: 'pointer', fontWeight: category === c.id ? 600 : 400,
                  }}
                >{c.label}</button>
              ))}
            </div>

            {/* Gift grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
              {filtered.map((gift) => (
                <div
                  key={gift.id}
                  onClick={() => setSelected(gift)}
                  style={{
                    border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 12px',
                    cursor: 'pointer', transition: 'border-color 0.15s',
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#1d4ed8')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                >
                  <div style={{ fontSize: 28 }}>{gift.emoji}</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{gift.label}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', flexGrow: 1 }}>{gift.description}</div>
                  <div style={{ fontWeight: 700, color: gift.amountCents ? '#1d4ed8' : '#059669', fontSize: 14, marginTop: 4 }}>
                    {gift.amountCents ? `$${(gift.amountCents / 100).toFixed(2)}` : 'Free'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} style={{ padding: '18px 20px' }}>
            {/* Selected gift summary */}
            <div style={{
              background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10,
              padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center',
            }}>
              <div style={{ fontSize: 32 }}>{selected.emoji}</div>
              <div>
                <div style={{ fontWeight: 700 }}>{selected.label}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{selected.description}</div>
                <div style={{ fontWeight: 700, color: '#1d4ed8', marginTop: 4 }}>
                  {selected.amountCents ? `$${(selected.amountCents / 100).toFixed(2)}` : 'Free'}
                </div>
              </div>
              <button
                type="button" onClick={() => setSelected(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 13 }}
              >Change</button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                Who is this for? *
              </label>
              <input
                required value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. My daughter Sarah"
                style={{ width: '100%', padding: '9px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            {selected.digitalDelivery && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                  Their email address (for digital delivery)
                </label>
                <input
                  type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="sarah@example.com"
                  style={{ width: '100%', padding: '9px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                Personal message (optional)
              </label>
              <textarea
                rows={3} value={message} onChange={(e) => setMessage(e.target.value)}
                maxLength={500} placeholder="I'm thinking of you and wanted to send something special…"
                style={{ width: '100%', padding: '9px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 14, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 12px', borderRadius: 7, fontSize: 13, marginBottom: 14 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit" disabled={loading || !recipientName}
                style={{
                  flex: 1, padding: '11px 0', background: '#1d4ed8', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
                  cursor: loading ? 'wait' : 'pointer', opacity: !recipientName ? 0.5 : 1,
                }}
              >
                {loading ? 'Sending…' : selected.amountCents ? `Pay & send — $${(selected.amountCents / 100).toFixed(2)}` : 'Send gift 🎁'}
              </button>
              <button
                type="button" onClick={onClose}
                style={{ padding: '11px 18px', background: '#f3f4f6', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}
              >Cancel</button>
            </div>

            {selected.amountCents && selected.amountCents > 0 && (
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>
                Secure payment powered by Stripe. Your card is never stored.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
