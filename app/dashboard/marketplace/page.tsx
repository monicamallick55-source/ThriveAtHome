'use client'

/**
 * app/dashboard/marketplace/page.tsx — Services Marketplace
 * TC-REG006, TC-M019, TC-M062, TC-SVC009, TC-PE010
 */

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Provider = {
  id: string
  name: string
  category: string
  partner_name: string | null
  description: string | null
  pricing_model: string | null
  base_price_cents: number | null
  requires_plan: string | null
  rating: number | null
  review_count: number
  booking_url: string | null
  phone: string | null
  is_active: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  transport: '🚗 Transportation',
  home_care: '🏠 Home Care',
  home_repair: '🔧 Home Repair',
  meals: '🍽️ Meals',
  legal: '⚖️ Legal & Financial',
  health: '💪 Health & Wellness',
  pet_care: '🐾 Pet Care',
  tech_help: '💻 Tech Help',
  companion: '🤝 Companion',
  other: '📦 Other',
}

const PLAN_BADGE: Record<string, { label: string; color: string }> = {
  basics:   { label: 'Basics+', color: '#2563eb' },
  complete: { label: 'Complete+', color: '#7c3aed' },
  premier:  { label: 'Premier', color: '#d97706' },
  any:      { label: 'All Plans', color: '#059669' },
}

export default function MarketplacePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    fetch('/api/features')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.marketplace_live === true) setIsLive(true) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!isLive) { setLoading(false); return }
    supabase
      .from('marketplace_providers')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .then(({ data }) => {
        setProviders(data ?? [])
        setLoading(false)
      })
  }, [isLive])

  if (loading) {
    return <div style={{ maxWidth: 640, margin: '60px auto', textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
  }

  if (!isLive) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 0', textAlign: 'center' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 48 }}>🛍️</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Marketplace</h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fef9c3', color: '#854d0e', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
            🔒 Coming Soon
          </div>
          <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 400, lineHeight: 1.6, margin: 0 }}>
            The ThriveAtHome Marketplace is launching soon. Browse and book trusted local services — home care, transportation, meals, tech help, and more.
          </p>
        </div>
      </div>
    )
  }

  const categories = ['all', ...Array.from(new Set(providers.map(p => p.category)))]
  const filtered = activeCategory === 'all' ? providers : providers.filter(p => p.category === activeCategory)

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Marketplace</h1>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
        Browse and book trusted services from vetted providers.
      </p>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: '1px solid #e5e7eb',
              background: activeCategory === cat ? '#2563eb' : '#fff',
              color: activeCategory === cat ? '#fff' : '#374151',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {cat === 'all' ? '✦ All Services' : (CATEGORY_LABELS[cat] ?? cat)}
          </button>
        ))}
      </div>

      {/* Provider grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {filtered.map(p => {
          const badge = CATEGORY_LABELS[p.category] ?? p.category
          const planBadge = p.requires_plan ? PLAN_BADGE[p.requires_plan] : null
          const price = p.base_price_cents
            ? `$${(p.base_price_cents / 100).toFixed(0)}${p.pricing_model === 'hourly' ? '/hr' : p.pricing_model === 'per_service' ? '/trip' : ''}`
            : null

          return (
            <div key={p.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>{badge}</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                  {p.partner_name && <div style={{ fontSize: 12, color: '#9ca3af' }}>via {p.partner_name}</div>}
                </div>
                {p.rating && (
                  <div style={{ fontSize: 12, color: '#d97706', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    ★ {Number(p.rating).toFixed(1)} ({p.review_count})
                  </div>
                )}
              </div>

              {p.description && (
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, margin: 0 }}>{p.description}</p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto', flexWrap: 'wrap' }}>
                {price && (
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{price}</span>
                )}
                {planBadge && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: planBadge.color, background: planBadge.color + '18', padding: '2px 8px', borderRadius: 10 }}>
                    {planBadge.label}
                  </span>
                )}
              </div>

              <a
                href={p.booking_url ?? '/dashboard/plan'}
                target={p.booking_url ? '_blank' : undefined}
                rel="noopener noreferrer"
                style={{ display: 'block', textAlign: 'center', padding: '8px 0', background: '#2563eb', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', marginTop: 4 }}
              >
                {p.booking_url ? 'Book Now' : 'Learn More'}
              </a>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '48px 0' }}>
          No services in this category yet.
        </div>
      )}
    </div>
  )
}
