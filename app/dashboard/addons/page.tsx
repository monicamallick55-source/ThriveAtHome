'use client'

/**
 * app/dashboard/addons/page.tsx — G7.23 Premium Add-Ons
 *
 * Member-facing page to browse and purchase premium add-on SKUs.
 */

import { useState, useEffect } from 'react'

type Addon = {
  id: string
  kind: string
  title: string
  description: string
  price_cents: number
  image_emoji: string
  available: boolean
}

const KIND_BADGES: Record<string, { label: string; color: string }> = {
  call: { label: 'Live call', color: '#6366f1' },
  time: { label: 'Navigator time', color: '#8b5cf6' },
  credits: { label: 'Credits', color: '#10b981' },
  gift: { label: 'Physical gift', color: '#f59e0b' },
}

export default function AddonsPage() {
  const [addons, setAddons] = useState<Addon[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [qty, setQty] = useState<Record<string, number>>({})

  useEffect(() => {
    fetch('/api/premium-addons')
      .then((r) => r.json())
      .then(({ addons: list }) => setAddons(list ?? []))
      .finally(() => setLoading(false))
  }, [])

  const handlePurchase = async (addon: Addon) => {
    setPurchasing(addon.id)
    setError('')
    try {
      const res = await fetch('/api/premium-addons/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku_id: addon.id,
          member_id: 'self', // server resolves from session
          quantity: qty[addon.id] ?? 1,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.checkout_url
    } catch (e) {
      setError((e as Error).message)
      setPurchasing(null)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>Premium Add-Ons</h1>
      <p style={{ color: '#6b7280', marginBottom: 28 }}>
        Extend your ThriveAtHome plan with extra navigator time, companion credits, and more.
      </p>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: 12, marginBottom: 20, color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#9ca3af', textAlign: 'center', paddingTop: 40 }}>Loading add-ons…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {addons.map((addon) => {
            const badge = KIND_BADGES[addon.kind]
            const isQtyAddon = addon.id === 'extra_navigator_hours'
            const quantity = qty[addon.id] ?? 1
            const totalCents = addon.price_cents * quantity

            return (
              <div key={addon.id} style={{
                border: '1px solid #e5e7eb', borderRadius: 14, padding: 20,
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '2.2rem' }}>{addon.image_emoji}</div>
                  {badge && (
                    <span style={{
                      background: badge.color + '15', color: badge.color,
                      padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600
                    }}>
                      {badge.label}
                    </span>
                  )}
                </div>

                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>{addon.title}</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: 4 }}>{addon.description}</p>
                </div>

                <div style={{ marginTop: 'auto' }}>
                  {isQtyAddon && (
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginBottom: 4 }}>
                        Hours (1–5)
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => setQty((prev) => ({ ...prev, [addon.id]: Math.max(1, (prev[addon.id] ?? 1) - 1) }))}
                          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                          −
                        </button>
                        <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 600 }}>{quantity}</span>
                        <button
                          onClick={() => setQty((prev) => ({ ...prev, [addon.id]: Math.min(5, (prev[addon.id] ?? 1) + 1) }))}
                          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111' }}>
                      ${(totalCents / 100).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handlePurchase(addon)}
                      disabled={purchasing === addon.id}
                      style={{
                        padding: '8px 18px', background: purchasing === addon.id ? '#e5e7eb' : '#6366f1',
                        color: purchasing === addon.id ? '#9ca3af' : '#fff',
                        border: 'none', borderRadius: 8, cursor: purchasing === addon.id ? 'default' : 'pointer',
                        fontWeight: 600, fontSize: '0.875rem'
                      }}>
                      {purchasing === addon.id ? 'Redirecting…' : 'Add →'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: 32, padding: '14px 18px', background: '#f9fafb', borderRadius: 10, fontSize: '0.85rem', color: '#6b7280' }}>
        💳 Secure checkout via Stripe. Add-ons are applied to your account immediately after payment.
        Questions? Ask your navigator.
      </div>
    </div>
  )
}
