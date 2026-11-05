'use client'

/**
 * app/dashboard/profile/page.tsx — Member Profile
 * TC-MBA001 (birthday field), TC-M016, TC-PE009
 */

import { useState, useEffect } from 'react'

type Profile = {
  first_name: string
  last_name: string
  email: string
  phone?: string
  zip_code?: string
  date_of_birth?: string
  plan_tier?: string
  cultural_preference?: string
  celebration_opt_out?: boolean
  preferred_contact_method?: string
  bio?: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    zip_code: '',
    date_of_birth: '',
    plan_tier: 'basic',
    cultural_preference: '',
    celebration_opt_out: false,
    preferred_contact_method: 'email',
    bio: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/members/profile')
        if (res.ok) {
          const data = await res.json()
          setProfile(prev => ({ ...prev, ...data }))
        }
      } catch {
        // non-fatal — show form with empty fields
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/members/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError('Could not save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const field = (label: string, key: keyof Profile, type = 'text', hint?: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
        {label}
        {hint && <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginLeft: 6 }}>{hint}</span>}
      </label>
      <input
        type={type}
        value={(profile[key] as string) ?? ''}
        onChange={e => setProfile(prev => ({ ...prev, [key]: e.target.value }))}
        style={{
          padding: '9px 12px',
          border: '1px solid #d1d5db',
          borderRadius: 6,
          fontSize: 14,
          color: '#111827',
        }}
      />
    </div>
  )

  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: '40px auto', textAlign: 'center', color: '#9ca3af' }}>
        Loading profile…
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>My Profile</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Manage your personal information and preferences</p>
        </div>
        {profile.plan_tier && (
          <span style={{
            padding: '4px 12px',
            background: profile.plan_tier === 'complete' ? '#dbeafe' : '#f3f4f6',
            color: profile.plan_tier === 'complete' ? '#1e40af' : '#4b5563',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'capitalize',
          }}>
            {profile.plan_tier} Plan
          </span>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>
          Personal Information
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {field('First Name', 'first_name')}
          {field('Last Name', 'last_name')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {field('Email', 'email', 'email')}
          {field('Phone', 'phone', 'tel')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {field('ZIP Code', 'zip_code')}
          {field('Date of Birth', 'date_of_birth', 'date', '(for birthday programs)')}
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '20px 0 16px', paddingTop: 16, paddingBottom: 12, borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6' }}>
          Preferences
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Cultural Background</label>
            <select
              value={profile.cultural_preference ?? ''}
              onChange={e => setProfile(prev => ({ ...prev, cultural_preference: e.target.value }))}
              style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, color: '#111827', background: '#fff' }}
            >
              <option value="">Prefer not to say</option>
              <option value="latinx">Latino/Hispanic</option>
              <option value="african_american">African American</option>
              <option value="asian_american">Asian American</option>
              <option value="native_american">Native American</option>
              <option value="jewish">Jewish</option>
              <option value="lgbtq">LGBTQ+</option>
              <option value="veteran">Veteran</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Preferred Contact Method</label>
            <select
              value={profile.preferred_contact_method ?? 'email'}
              onChange={e => setProfile(prev => ({ ...prev, preferred_contact_method: e.target.value }))}
              style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, color: '#111827', background: '#fff' }}
            >
              <option value="email">Email</option>
              <option value="sms">Text / SMS</option>
              <option value="phone">Phone Call</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={profile.celebration_opt_out ?? false}
                onChange={e => setProfile(prev => ({ ...prev, celebration_opt_out: e.target.checked }))}
                style={{ width: 16, height: 16 }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Opt out of birthday programs</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>Aria will not mention your birthday or run birthday arc programs</div>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>About Me</label>
            <textarea
              value={profile.bio ?? ''}
              onChange={e => setProfile(prev => ({ ...prev, bio: e.target.value }))}
              rows={3}
              placeholder="Share a bit about yourself…"
              style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {saved && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#16a34a', marginBottom: 16 }}>
            ✓ Profile saved successfully!
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px',
              background: saving ? '#93c5fd' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
