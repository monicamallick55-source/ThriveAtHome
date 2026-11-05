'use client'

/**
 * app/dashboard/marketplace/page.tsx — Services Marketplace
 * TC-REG006, TC-M019, TC-M062, TC-SVC009, TC-PE010
 *
 * Marketplace is not yet live (marketplace_live feature flag = false).
 * Shows a "coming soon" / locked state for all members.
 */

import { useEffect, useState } from 'react'

export default function MarketplacePage() {
  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check feature flag — marketplace_live
    fetch('/api/features')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.marketplace_live === true) setIsLive(true)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: '60px auto', textAlign: 'center', color: '#9ca3af' }}>
        Loading…
      </div>
    )
  }

  if (!isLive) {
    // Coming soon / locked state — TC-REG006, TC-M062, TC-SVC009, TC-PE010
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 0', textAlign: 'center' }}>
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          padding: 48,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}>
          <div style={{ fontSize: 48 }}>🛍️</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Marketplace</h1>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#fef9c3',
            color: '#854d0e',
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
          }}>
            🔒 Coming Soon
          </div>
          <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 400, lineHeight: 1.6, margin: 0 }}>
            The ThriveAtHome Marketplace is launching soon. You&apos;ll be able to browse and
            book trusted local services — from home care and transportation to meal prep,
            tech support, and more.
          </p>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
            Complete members get early access when the marketplace opens.
          </p>
          <a
            href="/dashboard/plan"
            style={{
              marginTop: 8,
              padding: '10px 24px',
              background: '#2563eb',
              color: '#fff',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            View Plan Options
          </a>
        </div>
      </div>
    )
  }

  // Full marketplace UI (when feature flag is on — future state)
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 0' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Marketplace</h1>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
        Browse and book trusted local services from vetted providers.
      </p>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, textAlign: 'center', color: '#9ca3af' }}>
        Service listings will appear here when the marketplace launches.
      </div>
    </div>
  )
}
