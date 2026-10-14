'use client'
// G7.23 — Premium add-on SKU store for family members
import { useState, useEffect } from 'react'

interface Sku {
  slug: string
  name: string
  description: string
  price_cents: number
  billing_interval: string
}

interface ActiveAddon {
  id: string
  sku: string
  quantity: number
  paid_through_date: string | null
  sku_detail: { name: string; billing_interval: string; price_cents: number }
}

interface Props {
  memberId: string
}

const SKU_EMOJI: Record<string, string> = {
  family_onboarding: '🎓',
  navigator_hour: '🧭',
  companion_bundle: '💜',
  cosigned_card: '💳',
}

const SKU_HIGHLIGHTS: Record<string, string[]> = {
  family_onboarding: ['Guided setup call with your navigator', 'Onboarding all family accounts', 'First check-in call scheduled'],
  navigator_hour: ['Use for research, care coordination', 'Doctor appointment prep', 'Benefit applications or housing search'],
  companion_bundle: ['Daily personalized companion calls', 'Priority connection routing', 'Expanded conversation memory'],
  cosigned_card: ['Prepaid card in member\'s name', 'Family sets spending limits', 'Real-time spend alerts'],
}

function formatPrice(cents: number, billing: string) {
  const dollars = (cents / 100).toFixed(2).replace('.00', '')
  if (billing === 'month') return `$${dollars}/mo`
  if (billing === 'year') return `$${dollars}/yr`
  return `$${dollars} one-time`
}

export default function AddonStore({ memberId }: Props) {
  const [skus, setSkus] = useState<Sku[]>([])
  const [activeAddons, setActiveAddons] = useState<ActiveAddon[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [purchased, setPurchased] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/addons?memberId=${memberId}`)
      .then(r => r.json())
      .then(d => {
        setSkus(d.skus ?? [])
        setActiveAddons(d.memberAddons ?? [])
        const activeSku = new Set<string>((d.memberAddons ?? []).map((a: ActiveAddon) => a.sku_detail?.name ?? a.sku))
        setPurchased(activeSku)
      })
      .catch(() => setError('Unable to load add-ons'))
      .finally(() => setLoading(false))
  }, [memberId])

  const purchase = async (sku: string, isPerUnit?: boolean, quantity: number = 1) => {
    setPurchasing(sku)
    setError(null)
    try {
      const res = await fetch('/api/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, sku, quantity }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Purchase failed')
      if (!isPerUnit) {
        setPurchased(prev => new Set([...prev, sku]))
      }
      // Refresh
      const updated = await fetch(`/api/addons?memberId=${memberId}`).then(r => r.json())
      setActiveAddons(updated.memberAddons ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setPurchasing(null)
    }
  }

  if (loading) return <div style={{ color: '#9ca3af', fontSize: '14px', padding: '20px 0' }}>Loading…</div>

  return (
    <div style={{ fontFamily: 'var(--font-body, system-ui, sans-serif)' }}>
      <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1e3a5f', margin: '0 0 6px' }}>✨ Premium Add-ons</h3>
      <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px', lineHeight: 1.5 }}>
        Enhance your loved one's experience with additional services.
      </p>

      {error && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', color: '#991b1b', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}

      {/* Active add-ons */}
      {activeAddons.length > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534', marginBottom: '10px' }}>✓ Active add-ons</div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {activeAddons.map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ color: '#166534', fontWeight: 600 }}>{SKU_EMOJI[a.sku] ?? '✦'} {a.sku_detail.name}</span>
                <span style={{ color: '#9ca3af' }}>
                  {a.paid_through_date ? `Active through ${new Date(a.paid_through_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Active'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SKU cards */}
      <div style={{ display: 'grid', gap: '14px' }}>
        {skus.map(sku => {
          const isActive = purchased.has(sku.slug)
          const isPerUnit = false // per_unit not supported by DB; navigator_hour is one_time
          const highlights = SKU_HIGHLIGHTS[sku.slug] ?? []

          return (
            <div key={sku.slug} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: isActive ? '1px solid #bbf7d0' : '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '22px' }}>{SKU_EMOJI[sku.slug] ?? '✦'}</span>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e3a5f' }}>{sku.name}</h4>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#166534', marginLeft: 'auto' }}>{formatPrice(sku.price_cents, sku.billing_interval)}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px', lineHeight: 1.5 }}>{sku.description}</p>
                  {highlights.length > 0 && (
                    <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                      {highlights.map((h, i) => (
                        <li key={i} style={{ fontSize: '12px', color: '#4b5563', marginBottom: '3px' }}>{h}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '14px' }}>
                {isActive && !isPerUnit ? (
                  <div style={{ fontSize: '13px', color: '#166534', fontWeight: 600 }}>✓ Active</div>
                ) : (
                  <button
                    onClick={() => purchase(sku.slug, isPerUnit)}
                    disabled={purchasing === sku.slug}
                    style={{ padding: '9px 20px', background: purchasing === sku.slug ? '#9ca3af' : '#1e3a5f', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
                  >
                    {purchasing === sku.slug ? 'Processing…' : `Get started — ${formatPrice(sku.price_cents, sku.billing_interval)}`}
                  </button>
                )}
                {isActive && !isPerUnit && (
                  <span style={{ marginLeft: '12px', fontSize: '12px', color: '#9ca3af' }}>To cancel, contact your navigator.</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '16px', lineHeight: 1.5 }}>
        Payment processing powered by Stripe. Questions? Contact your ThriveAtHome navigator.
      </p>
    </div>
  )
}
