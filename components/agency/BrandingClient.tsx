'use client'
import type { Tables } from '@/types/database'
type CareAgencyRow = Tables<'care_agencies'>
type BrandConfigRow = Tables<'brand_configs'>

// Branding customization UI for agency admins.
// Allows setting display name, colors, logo URL, and tagline.
// "Powered by ThriveAtHome" is always shown — this is enforced both in the UI and on the server.
import { useState, useTransition } from 'react'

interface BrandingClientProps {
  agency: CareAgencyRow
  brandConfig: BrandConfigRow | null
}

const NAVY = '#1B3A6B'
const TEAL = '#2A9D8F'

export default function BrandingClient({ agency, brandConfig }: BrandingClientProps) {
  const [displayName, setDisplayName] = useState(brandConfig?.agency_display_name ?? agency.name)
  const [primaryColor, setPrimaryColor] = useState(brandConfig?.primary_color ?? NAVY)
  const [secondaryColor, setSecondaryColor] = useState(brandConfig?.secondary_color ?? TEAL)
  const [tagline, setTagline] = useState(brandConfig?.tagline ?? '')
  const [logoUrl, setLogoUrl] = useState(brandConfig?.logo_url ?? '')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      setSaveStatus('saving')
      setErrorMsg('')
      try {
        const res = await fetch('/api/agency/brand-config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agency_display_name: displayName || null,
            primary_color: primaryColor,
            secondary_color: secondaryColor,
            tagline: tagline || null,
            logo_url: logoUrl || null,
          }),
        })
        if (!res.ok) {
          const d = await res.json()
          setErrorMsg(d.error ?? 'Save failed')
          setSaveStatus('error')
        } else {
          setSaveStatus('saved')
        }
      } catch {
        setErrorMsg('Network error — please try again')
        setSaveStatus('error')
      }
    })
  }

  const previewName = displayName || agency.name

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', fontFamily: 'system-ui, sans-serif' }}>
      {/* Nav */}
      <nav style={{ backgroundColor: NAVY, padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <a href="/agency-admin" style={{ color: '#FAFAF8', textDecoration: 'none', fontSize: '22px', fontWeight: 500 }}>ThriveAtHome</a>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>›</span>
          <a href="/agency-admin" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', textDecoration: 'none' }}>{agency.name}</a>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>›</span>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>Branding</span>
        </div>
        <a href="/api/auth/signout" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)' }}>
          Sign out
        </a>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 600, color: NAVY, margin: 0 }}>Co-Branding Settings</h1>
          <p style={{ fontSize: '16px', color: '#6B7280', marginTop: '8px' }}>
            Customize how your agency appears on the ThriveAtHome family dashboard.
            ThriveAtHome branding is always shown — families trust the ThriveAtHome name.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Left: settings form */}
          <div>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '28px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: NAVY, marginTop: 0, marginBottom: '24px' }}>Agency Identity</h2>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Agency Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => { setDisplayName(e.target.value); setSaveStatus('idle') }}
                  placeholder={agency.name}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                  How your agency name appears on the family dashboard
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Tagline (optional)
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => { setTagline(e.target.value); setSaveStatus('idle') }}
                  placeholder="Compassionate care at home"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Logo URL (optional)
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={e => { setLogoUrl(e.target.value); setSaveStatus('idle') }}
                  placeholder="https://your-agency.com/logo.png"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                  Enter a public URL to your logo image (PNG or SVG recommended)
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '28px', marginTop: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: NAVY, marginTop: 0, marginBottom: '24px' }}>Color Theme</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Primary Color
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={e => { setPrimaryColor(e.target.value); setSaveStatus('idle') }}
                      style={{ width: '48px', height: '40px', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer', padding: '2px' }}
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) { setPrimaryColor(e.target.value); setSaveStatus('idle') } }}
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Accent Color
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={e => { setSecondaryColor(e.target.value); setSaveStatus('idle') }}
                      style={{ width: '48px', height: '40px', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer', padding: '2px' }}
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) { setSecondaryColor(e.target.value); setSaveStatus('idle') } }}
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Brand integrity notice */}
            <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '16px', marginTop: '20px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#1E40AF', lineHeight: 1.6 }}>
                <strong>Brand Integrity:</strong> The &ldquo;Powered by ThriveAtHome&rdquo; label is always shown on all family-facing pages. Families trust ThriveAtHome — your agency benefits from that trust.
              </p>
            </div>

            {/* Save button */}
            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={handleSave}
                disabled={isPending || saveStatus === 'saving'}
                style={{
                  padding: '12px 28px',
                  backgroundColor: saveStatus === 'saved' ? '#059669' : primaryColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  opacity: isPending ? 0.7 : 1,
                  transition: 'background-color 0.2s',
                }}
              >
                {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : 'Save Branding'}
              </button>
              {saveStatus === 'error' && (
                <span style={{ fontSize: '14px', color: '#DC2626' }}>{errorMsg}</span>
              )}
            </div>
          </div>

          {/* Right: live preview */}
          <div>
            <div style={{ position: 'sticky', top: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: NAVY, marginTop: 0, marginBottom: '16px' }}>
                Preview — Family Dashboard Header
              </h2>
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
                This is how the header appears on the family dashboard when a member is linked to your agency.
              </p>

              {/* Co-branded header preview */}
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                <div style={{ backgroundColor: primaryColor, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {logoUrl && (
                      <img src={logoUrl} alt={previewName} style={{ height: '36px', objectFit: 'contain', backgroundColor: 'transparent' }} />
                    )}
                    <div>
                      <div style={{ color: 'white', fontSize: '18px', fontWeight: 600, lineHeight: 1.2 }}>
                        {previewName}
                      </div>
                      {tagline && (
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginTop: '2px' }}>
                          {tagline}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '5px 12px', borderRadius: '20px', color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: 500 }}>
                    Powered by ThriveAtHome
                  </div>
                </div>

                {/* Simulated dashboard content */}
                <div style={{ backgroundColor: '#FAFAF8', padding: '20px 24px' }}>
                  <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', border: '1px solid #E5E7EB', marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Today&apos;s check-in</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: secondaryColor }}></div>
                      <span style={{ fontSize: '15px', color: '#111827' }}>Margaret is feeling great today — mood 9/10</span>
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', border: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Upcoming visit</div>
                    <div style={{ fontSize: '15px', color: '#111827' }}>Care visit scheduled — Tomorrow 9:00 AM</div>
                  </div>
                </div>

                <div style={{ backgroundColor: primaryColor, opacity: 0.08, height: '4px' }}></div>
                <div style={{ backgroundColor: '#F9FAFB', padding: '10px 24px', display: 'flex', justifyContent: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>
                    ThriveAtHome · Your partner in family peace of mind
                  </span>
                </div>
              </div>

              {/* ThriveAtHome-only header preview */}
              <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#6B7280', marginTop: '28px', marginBottom: '12px' }}>
                Default header (members without agency link)
              </h3>
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', opacity: 0.7 }}>
                <div style={{ backgroundColor: NAVY, padding: '16px 24px' }}>
                  <div style={{ color: 'white', fontSize: '18px', fontWeight: 600 }}>ThriveAtHome</div>
                </div>
                <div style={{ backgroundColor: '#FAFAF8', padding: '12px 24px' }}>
                  <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Standard family dashboard</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
