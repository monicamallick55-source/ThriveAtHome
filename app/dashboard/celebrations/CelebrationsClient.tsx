'use client'
// app/dashboard/celebrations/CelebrationsClient.tsx
// G7.2 / G7.3 — Celebrations hub: Events, Celebrate (family), Gifts (member send)

import { useState, useEffect, useRef } from 'react'

const EVENT_TYPE_LABELS: Record<string, string> = {
  birthday: '🎂 Birthday',
  anniversary: '💍 Anniversary',
  holiday: '🎄 Holiday',
  milestone: '⭐ Milestone',
  graduation: '🎓 Graduation',
  homecoming: '🏠 Homecoming',
  other: '📅 Other',
}

const STATUS_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  pending:    { label: 'Pending',    bg: '#fef3c7', color: '#92400e' },
  processing: { label: 'Processing', bg: '#dbeafe', color: '#1e40af' },
  shipped:    { label: 'Shipped',    bg: '#d1fae5', color: '#065f46' },
  delivered:  { label: 'Delivered',  bg: '#ecfdf5', color: '#047857' },
  paid:       { label: 'Paid',       bg: '#d1fae5', color: '#065f46' },
  active:     { label: 'Active',     bg: '#dbeafe', color: '#1e40af' },
  completed:  { label: 'Completed',  bg: '#f3f4f6', color: '#6b7280' },
  in_review:  { label: 'In Review',  bg: '#fef3c7', color: '#92400e' },
}

interface FamilyEvent {
  id: string; created_at: string; event_type: string; title: string
  event_date: string; recurring: boolean; notes: string | null
}
interface GiftOrder {
  id: string; created_at: string; gift_type: string; gift_label: string
  recipient_name: string; amount_cents: number | null; status: string; message: string | null
}
interface CelebrationRequest {
  id: string; tier: string; status: string; celebration_date: string
  amount_cents: number; special_message: string | null
}
interface GiftItem {
  id: string; type: string; label: string; description: string
  amountCents: number | null; emoji: string
  category: 'card' | 'flowers' | 'food' | 'experience' | 'keepsake'
  digitalDelivery: boolean
}

const GIFT_CATALOG: GiftItem[] = [
  { id: 'greeting_card_free',     type: 'greeting_card',   label: 'Heartfelt card message',     description: "Send a warm written message delivered to your family member's inbox.", amountCents: null, emoji: '💌', category: 'card',       digitalDelivery: true },
  { id: 'greeting_card_physical', type: 'greeting_card',   label: 'Physical greeting card',     description: 'A beautiful card printed and mailed to your family member.',            amountCents: 999,  emoji: '✉️', category: 'card',       digitalDelivery: false },
  { id: 'flower_bouquet_classic', type: 'flower_bouquet',  label: 'Classic flower bouquet',     description: 'A seasonal arrangement of fresh flowers delivered to their door.',      amountCents: 4999, emoji: '💐', category: 'flowers',    digitalDelivery: false },
  { id: 'flower_bouquet_premium', type: 'flower_bouquet',  label: 'Premium bouquet with vase',  description: 'An elegant arrangement with a keepsake vase, same-day when possible.',  amountCents: 7999, emoji: '🌸', category: 'flowers',    digitalDelivery: false },
  { id: 'gift_basket_sweet',      type: 'gift_basket',     label: 'Sweet treats basket',        description: 'Chocolates, cookies, and treats in a reusable basket.',                amountCents: 5999, emoji: '🧺', category: 'food',       digitalDelivery: false },
  { id: 'gift_basket_gourmet',    type: 'gift_basket',     label: 'Gourmet food basket',        description: 'Artisan cheeses, crackers, nuts, and preserves.',                      amountCents: 8999, emoji: '🍇', category: 'food',       digitalDelivery: false },
  { id: 'meal_delivery',          type: 'meal_delivery',   label: 'Home-cooked meal delivery',  description: 'A chef-prepared meal delivered fresh for a family dinner.',             amountCents: 9999, emoji: '🍱', category: 'food',       digitalDelivery: false },
  { id: 'photo_book',             type: 'photo_book',      label: 'Family photo book',          description: 'A printed 20-page photo book — upload photos and we handle the rest.', amountCents: 3999, emoji: '📸', category: 'keepsake',  digitalDelivery: false },
  { id: 'donation_in_honor',      type: 'donation_in_honor', label: 'Donation in their honor', description: "We make a $25 donation to a cause they love in their name.",            amountCents: 2500, emoji: '💝', category: 'experience', digitalDelivery: true },
  { id: 'amazon_gift_card_25',    type: 'amazon_gift_card', label: 'Amazon gift card — $25',   description: 'Sent digitally to their email so they can choose what they want.',       amountCents: 2500, emoji: '🛍️', category: 'experience', digitalDelivery: true },
  { id: 'book',                   type: 'book',            label: "Book they'll love",          description: "Tell us their interests and we'll pick a best-seller and ship it.",     amountCents: 1999, emoji: '📚', category: 'keepsake',  digitalDelivery: false },
  { id: 'plant',                  type: 'plant',           label: 'Live succulent or plant',    description: "A low-maintenance plant that'll brighten their home for years.",        amountCents: 3499, emoji: '🪴', category: 'keepsake',  digitalDelivery: false },
]

const TIERS = [
  { value: 'basic',    label: '💌 Basic — Free', desc: 'Digital card + Aria shout-out on call day', price: 0 },
  { value: 'enhanced', label: '🌸 Enhanced — $25', desc: 'Physical card + small gift + digital card', price: 2500 },
  { value: 'premium',  label: '⭐ Premium — $75', desc: 'Printed photo book + personal note from care team', price: 7500 },
]

const EVENT_TYPES = ['birthday','anniversary','holiday','milestone','graduation','homecoming','other']

function fmt(cents: number | null) {
  if (!cents) return 'Free'
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`
}

// ── Stripe card element (loads stripe.js lazily) ─────────────────────────────
function StripeCardForm({
  clientSecret,
  onSuccess,
  onCancel,
}: {
  clientSecret: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stripeRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cardElementRef = useRef<any>(null)
  const [paying, setPaying] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!pk) { setCardError('Stripe not configured (missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)'); return }

    let cancelled = false
    async function init() {
      // Load stripe.js if not already loaded
      if (!(window as any).Stripe) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://js.stripe.com/v3/'
          s.onload = () => resolve()
          s.onerror = () => reject(new Error('Failed to load Stripe.js'))
          document.head.appendChild(s)
        })
      }
      if (cancelled) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stripeRef.current = (window as any).Stripe(pk)
      const elements = stripeRef.current.elements()
      cardElementRef.current = elements.create('card', {
        style: {
          base: { fontSize: '16px', color: '#1f2937', '::placeholder': { color: '#9ca3af' } },
          invalid: { color: '#dc2626' },
        },
      })
      if (cardRef.current) {
        cardElementRef.current.mount(cardRef.current)
        cardElementRef.current.on('ready', () => !cancelled && setReady(true))
        cardElementRef.current.on('change', (e: any) => {
          if (!cancelled) setCardError(e.error?.message ?? null)
        })
      }
    }
    init().catch((e) => !cancelled && setCardError(e.message))
    return () => {
      cancelled = true
      cardElementRef.current?.destroy()
    }
  }, [])

  async function handlePay() {
    if (!stripeRef.current || !cardElementRef.current) return
    setPaying(true); setCardError(null)
    try {
      const { error, paymentIntent } = await stripeRef.current.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElementRef.current },
      })
      if (error) { setCardError(error.message ?? 'Payment failed'); setPaying(false); return }
      if (paymentIntent?.status === 'succeeded') { onSuccess() }
    } catch (e: any) {
      setCardError(e.message ?? 'Payment error')
      setPaying(false)
    }
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, background: '#fafafa', marginTop: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>💳 Enter payment details</div>
      <div
        ref={cardRef}
        style={{
          border: '1px solid #d1d5db', borderRadius: 7, padding: '12px 14px',
          background: '#fff', minHeight: 44, marginBottom: 12,
        }}
      />
      {!ready && !cardError && <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>Loading payment form…</div>}
      {cardError && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 8 }}>{cardError}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handlePay}
          disabled={paying || !ready}
          style={{
            flex: 1, padding: '10px 0', background: paying ? '#6b7280' : '#1d4ed8',
            color: '#fff', border: 'none', borderRadius: 7, fontSize: 14,
            fontWeight: 700, cursor: paying ? 'wait' : 'pointer',
          }}
        >{paying ? 'Processing…' : 'Pay now'}</button>
        <button
          onClick={onCancel}
          disabled={paying}
          style={{
            padding: '10px 16px', background: '#f3f4f6', border: 'none',
            borderRadius: 7, fontSize: 13, cursor: 'pointer',
          }}
        >Cancel</button>
      </div>
      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>
        Secured by Stripe · Your card details are never stored on our servers
      </p>
    </div>
  )
}

// ── Gift send modal ───────────────────────────────────────────────────────────
function GiftSendModal({
  gift,
  onClose,
  onSent,
}: {
  gift: GiftItem
  onClose: () => void
  onSent: (order: GiftOrder) => void
}) {
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true); setError(null)
    try {
      const res = await fetch('/api/gift-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftId: gift.id,
          recipientName: recipientName.trim(),
          recipientEmail: recipientEmail.trim() || undefined,
          message: message.trim() || undefined,
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? 'Failed to place order')

      if (!j.requiresPayment) {
        // Free gift — done
        onSent({
          id: j.orderId, created_at: new Date().toISOString(),
          gift_type: gift.type, gift_label: gift.label,
          recipient_name: recipientName, amount_cents: 0,
          status: 'delivered', message: message || null,
        })
      } else {
        // Paid — show Stripe card form
        setOrderId(j.orderId)
        setClientSecret(j.clientSecret)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSending(false)
    }
  }

  function handlePaySuccess() {
    onSent({
      id: orderId!, created_at: new Date().toISOString(),
      gift_type: gift.type, gift_label: gift.label,
      recipient_name: recipientName, amount_cents: gift.amountCents ?? 0,
      status: 'paid', message: message || null,
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: 24, width: '100%',
        maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 32 }}>{gift.emoji}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{gift.label}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{gift.description}</div>
          </div>
        </div>

        {!clientSecret ? (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                Recipient name *
              </label>
              <input
                required value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. My daughter Sarah"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                Recipient email {gift.digitalDelivery ? '*' : '(optional)'}
              </label>
              <input
                required={gift.digitalDelivery} type="email"
                value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="sarah@email.com"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                Personal message (optional)
              </label>
              <textarea
                rows={3} value={message} onChange={(e) => setMessage(e.target.value)}
                maxLength={500} placeholder="Thinking of you and sending love…"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
            {error && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="submit" disabled={sending}
                style={{
                  flex: 1, padding: '10px 0', background: sending ? '#6b7280' : '#1d4ed8',
                  color: '#fff', border: 'none', borderRadius: 7, fontSize: 14,
                  fontWeight: 700, cursor: sending ? 'wait' : 'pointer',
                }}
              >
                {sending ? 'Processing…' : gift.amountCents ? `Continue — ${fmt(gift.amountCents)}` : 'Send free card'}
              </button>
              <button
                type="button" onClick={onClose} disabled={sending}
                style={{ padding: '10px 16px', background: '#f3f4f6', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}
              >Cancel</button>
            </div>
          </form>
        ) : (
          <StripeCardForm
            clientSecret={clientSecret}
            onSuccess={handlePaySuccess}
            onCancel={() => { setClientSecret(null); setOrderId(null) }}
          />
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CelebrationsClient({
  memberId, memberName, isFamily, familyMemberId,
  events: initialEvents, celebrations, gifts: initialGifts,
}: {
  memberId: string
  memberName: string
  isFamily: boolean
  familyMemberId: string | null
  events: FamilyEvent[]
  celebrations: CelebrationRequest[]
  gifts: GiftOrder[]
}) {
  const [activeTab, setActiveTab] = useState<'events' | 'celebrate' | 'gifts'>('events')
  const [events, setEvents] = useState(initialEvents)
  const [gifts, setGifts] = useState(initialGifts)

  // Event form
  const [showEventForm, setShowEventForm] = useState(false)
  const [eType, setEType] = useState('birthday')
  const [eTitle, setETitle] = useState('')
  const [eDate, setEDate] = useState('')
  const [eRecurring, setERecurring] = useState(false)
  const [eNotes, setENotes] = useState('')
  const [eSaving, setESaving] = useState(false)
  const [eError, setEError] = useState<string | null>(null)

  // Celebration form
  const [showCelebForm, setShowCelebForm] = useState(false)
  const [cTier, setCTier] = useState('basic')
  const [cDate, setCDate] = useState('')
  const [cMessage, setCMessage] = useState('')
  const [cSaving, setCSaving] = useState(false)
  const [cDone, setCDone] = useState(false)
  const [cClientSecret, setCClientSecret] = useState<string | null>(null)
  const [cOrderId, setCOrderId] = useState<string | null>(null)

  // Gift catalog
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null)
  const [giftCategory, setGiftCategory] = useState<string>('all')
  const [giftSentSuccess, setGiftSentSuccess] = useState<string | null>(null)

  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function formatDate(s: string) {
    const d = new Date(s.length === 10 ? s + 'T12:00:00Z' : s)
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  function daysUntil(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00Z')
    const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today!'
    if (diff === 1) return 'Tomorrow'
    return `${diff} days`
  }

  async function saveEvent(e: React.FormEvent) {
    e.preventDefault()
    setESaving(true); setEError(null)
    try {
      const res = await fetch('/api/family-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: eType, title: eTitle, eventDate: eDate, recurring: eRecurring, notes: eNotes }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Failed')
      const j = await res.json()
      const newEvent: FamilyEvent = {
        id: j.eventId, created_at: new Date().toISOString(),
        event_type: eType, title: eTitle, event_date: eDate,
        recurring: eRecurring, notes: eNotes || null,
      }
      setEvents((prev) => [...prev, newEvent].sort((a, b) => a.event_date.localeCompare(b.event_date)))
      setShowEventForm(false)
      setETitle(''); setEDate(''); setENotes('')
      showToast('Event saved!')
    } catch (err: unknown) {
      setEError(err instanceof Error ? err.message : 'Error')
    } finally {
      setESaving(false)
    }
  }

  async function saveCelebration(e: React.FormEvent) {
    e.preventDefault()
    setCSaving(true)
    try {
      const res = await fetch('/api/celebration-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: cTier, celebrationDate: cDate, specialMessage: cMessage }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error ?? 'Failed')

      if (j.requiresPayment && j.clientSecret) {
        setCClientSecret(j.clientSecret)
        setCOrderId(j.orderId ?? null)
      } else {
        setCDone(true)
        showToast('Celebration planned!')
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error saving celebration')
    } finally {
      setCSaving(false)
    }
  }

  async function cancelEvent(eventId: string) {
    await fetch(`/api/family-events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancel: true }),
    })
    setEvents((prev) => prev.filter((ev) => ev.id !== eventId))
    showToast('Event removed')
  }

  function handleGiftSent(order: GiftOrder) {
    setGifts((prev) => [order, ...prev])
    setSelectedGift(null)
    setGiftSentSuccess(order.gift_label)
    showToast(`🎁 ${order.gift_label} sent to ${order.recipient_name}!`)
    setTimeout(() => setGiftSentSuccess(null), 5000)
  }

  const CATEGORIES = ['all', 'card', 'flowers', 'food', 'keepsake', 'experience'] as const
  const filteredCatalog = giftCategory === 'all'
    ? GIFT_CATALOG
    : GIFT_CATALOG.filter((g) => g.category === giftCategory)

  const tabs = [
    { id: 'events' as const,    label: `📅 Upcoming (${events.length})` },
    { id: 'celebrate' as const, label: '🎉 Plan a Celebration' },
    { id: 'gifts' as const,     label: `🎁 Send a Gift` },
  ]

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, background: '#1f2937', color: '#fff',
          padding: '10px 18px', borderRadius: 8, fontSize: 14, zIndex: 1100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>{toast}</div>
      )}

      {selectedGift && (
        <GiftSendModal
          gift={selectedGift}
          onClose={() => setSelectedGift(null)}
          onSent={handleGiftSent}
        />
      )}

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🎊 Celebrations</h1>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
        {isFamily
          ? `Plan events, send gifts, and keep ${memberName} feeling celebrated.`
          : 'See upcoming events your family has planned, and send a gift to someone you love.'}
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 24, gap: 0, overflowX: 'auto' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: activeTab === t.id ? 700 : 400, whiteSpace: 'nowrap',
              color: activeTab === t.id ? '#1d4ed8' : '#6b7280',
              borderBottom: activeTab === t.id ? '2px solid #1d4ed8' : '2px solid transparent',
              marginBottom: -2,
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── EVENTS TAB ── */}
      {activeTab === 'events' && (
        <div>
          {isFamily && !showEventForm && (
            <button
              onClick={() => setShowEventForm(true)}
              style={{
                padding: '9px 18px', background: '#1d4ed8', color: '#fff',
                border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', marginBottom: 20,
              }}
            >+ Add event</button>
          )}

          {showEventForm && (
            <form onSubmit={saveEvent} style={{
              border: '1px solid #e5e7eb', borderRadius: 10, padding: '18px',
              marginBottom: 20, background: '#f9fafb',
            }}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>New Event</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Event type *</label>
                  <select
                    value={eType} onChange={(e) => setEType(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>{EVENT_TYPE_LABELS[t] ?? t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Date *</label>
                  <input
                    required type="date" value={eDate} onChange={(e) => setEDate(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Title *</label>
                <input
                  required value={eTitle} onChange={(e) => setETitle(e.target.value)}
                  maxLength={120} placeholder="e.g. Dad's 80th birthday"
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Notes (optional)</label>
                <textarea
                  rows={2} value={eNotes} onChange={(e) => setENotes(e.target.value)}
                  placeholder="Any context for the care team or Aria…"
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={eRecurring} onChange={(e) => setERecurring(e.target.checked)} />
                Repeat every year
              </label>
              {eError && (
                <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 10 }}>
                  {eError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={eSaving} style={{
                  padding: '8px 18px', background: '#1d4ed8', color: '#fff', border: 'none',
                  borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                  {eSaving ? 'Saving…' : 'Save event'}
                </button>
                <button type="button" onClick={() => setShowEventForm(false)} style={{
                  padding: '8px 16px', background: '#f3f4f6', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer',
                }}>Cancel</button>
              </div>
            </form>
          )}

          {events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af', background: '#f9fafb', borderRadius: 10 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
              <div style={{ fontWeight: 600 }}>No upcoming events</div>
              {isFamily && <div style={{ fontSize: 13, marginTop: 4 }}>Add a birthday, anniversary, or milestone above.</div>}
            </div>
          ) : (
            events.map((ev) => (
              <div key={ev.id} style={{
                border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px',
                marginBottom: 10, background: '#fff', display: 'flex', gap: 16, alignItems: 'center',
              }}>
                <div style={{ fontSize: 28, lineHeight: 1 }}>
                  {ev.event_type === 'birthday' ? '🎂' : ev.event_type === 'anniversary' ? '💍' : '📅'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{ev.title}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    {formatDate(ev.event_date)} · {ev.recurring ? 'Annual' : 'One-time'}
                  </div>
                  {ev.notes && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{ev.notes}</div>}
                </div>
                <div style={{
                  background: '#eff6ff', color: '#1d4ed8',
                  padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                  {daysUntil(ev.event_date)}
                </div>
                {isFamily && (
                  <button
                    onClick={() => cancelEvent(ev.id)}
                    style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 16, padding: 4 }}
                    title="Remove event"
                  >✕</button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── CELEBRATE TAB ── */}
      {activeTab === 'celebrate' && (
        <div>
          {!isFamily ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280', background: '#f9fafb', borderRadius: 10 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
              <div style={{ fontWeight: 600 }}>Ask your family to plan a celebration for you!</div>
            </div>
          ) : cDone ? (
            <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 10, padding: '20px 18px' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🎉</div>
              <div style={{ fontWeight: 700, color: '#065f46' }}>Celebration planned!</div>
              <div style={{ fontSize: 13, color: '#047857', marginTop: 4 }}>
                A care navigator will be in touch to help coordinate.
              </div>
            </div>
          ) : cClientSecret ? (
            <StripeCardForm
              clientSecret={cClientSecret}
              onSuccess={() => { setCClientSecret(null); setCDone(true); showToast('Celebration booked!') }}
              onCancel={() => { setCClientSecret(null); setCOrderId(null) }}
            />
          ) : (
            <form onSubmit={saveCelebration}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Choose a celebration tier</div>
                {TIERS.map((t) => (
                  <label
                    key={t.value}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '14px 16px', border: `2px solid ${cTier === t.value ? '#1d4ed8' : '#e5e7eb'}`,
                      borderRadius: 10, marginBottom: 10, cursor: 'pointer',
                      background: cTier === t.value ? '#eff6ff' : '#fff',
                    }}
                  >
                    <input
                      type="radio" name="tier" value={t.value}
                      checked={cTier === t.value} onChange={() => setCTier(t.value)}
                      style={{ marginTop: 2, accentColor: '#1d4ed8' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{t.label}</div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{t.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Celebration date *</label>
                <input
                  required type="date" value={cDate} onChange={(e) => setCDate(e.target.value)}
                  style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Special message (optional)</label>
                <textarea
                  rows={3} value={cMessage} onChange={(e) => setCMessage(e.target.value)}
                  maxLength={500} placeholder="We love you so much and want you to know how special you are…"
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit" disabled={cSaving || !cDate}
                style={{
                  padding: '10px 24px', background: '#1d4ed8', color: '#fff',
                  border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 700,
                  cursor: cSaving ? 'wait' : 'pointer', opacity: !cDate ? 0.5 : 1, width: '100%',
                }}
              >
                {cSaving ? 'Processing…' : cTier === 'basic' ? 'Plan Celebration (Free)' : `Continue to Payment — $${(TIERS.find((t) => t.value === cTier)!.price / 100).toFixed(0)}`}
              </button>
              {cTier !== 'basic' && (
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>
                  You'll enter payment details on the next step.
                </p>
              )}
            </form>
          )}
        </div>
      )}

      {/* ── GIFTS TAB ── */}
      {activeTab === 'gifts' && (
        <div>
          {giftSentSuccess && (
            <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
              🎉 <strong>{giftSentSuccess}</strong> sent successfully!
            </div>
          )}

          {/* Category filter */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setGiftCategory(cat)}
                style={{
                  padding: '5px 14px', border: `1px solid ${giftCategory === cat ? '#1d4ed8' : '#d1d5db'}`,
                  borderRadius: 20, fontSize: 12, fontWeight: giftCategory === cat ? 700 : 400,
                  background: giftCategory === cat ? '#eff6ff' : '#fff',
                  color: giftCategory === cat ? '#1d4ed8' : '#6b7280',
                  cursor: 'pointer', textTransform: 'capitalize',
                }}
              >{cat}</button>
            ))}
          </div>

          {/* Gift catalog grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 28 }}>
            {filteredCatalog.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGift(g)}
                style={{
                  border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px',
                  background: '#fff', textAlign: 'left', cursor: 'pointer',
                  transition: 'box-shadow 0.15s, border-color 0.15s',
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#1d4ed8'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(29,78,216,0.1)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none' }}
              >
                <div style={{ fontSize: 28 }}>{g.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', lineHeight: 1.3 }}>{g.label}</div>
                <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>{g.description}</div>
                <div style={{
                  marginTop: 4, fontWeight: 700, fontSize: 14,
                  color: g.amountCents ? '#1d4ed8' : '#059669',
                }}>{fmt(g.amountCents)}</div>
              </button>
            ))}
          </div>

          {/* Past orders */}
          {gifts.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#374151', marginBottom: 10 }}>Recent gifts sent</div>
              {gifts.map((g) => {
                const badge = STATUS_BADGES[g.status] ?? { label: g.status, bg: '#f3f4f6', color: '#6b7280' }
                return (
                  <div key={g.id} style={{
                    border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px',
                    marginBottom: 8, background: '#fff', display: 'flex', gap: 12, alignItems: 'center',
                  }}>
                    <div style={{ fontSize: 22 }}>
                      {g.gift_type === 'flower_bouquet' ? '💐' : g.gift_type === 'greeting_card' ? '💌' : '🎁'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{g.gift_label}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        To: {g.recipient_name}{g.amount_cents ? ` · $${(g.amount_cents / 100).toFixed(2)}` : ''}
                      </div>
                      {g.message && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, fontStyle: 'italic' }}>"{g.message}"</div>}
                    </div>
                    <span style={{
                      background: badge.bg, color: badge.color,
                      padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                    }}>{badge.label}</span>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
