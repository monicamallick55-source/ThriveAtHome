'use client'
// Community Organization Admin Portal — tabbed dashboard for village networks and community orgs.
import { useState, useEffect } from 'react'
import type { CommunityOrgRow, OrgProgramRow, MemberNeedRow, OrgMembershipRow, OrgStats, OrgMembershipTierRow, OrgDonationRow } from '@/lib/data/communityOrgs'

const PROGRAM_TYPES = [
  { value: 'social', label: '🤝 Social & Companionship' },
  { value: 'transport', label: '🚗 Transportation' },
  { value: 'meals', label: '🍽️ Meals & Nutrition' },
  { value: 'technology', label: '💻 Technology Help' },
  { value: 'health', label: '🩺 Health & Wellness' },
  { value: 'education', label: '📚 Education & Enrichment' },
  { value: 'advocacy', label: '📢 Advocacy & Benefits' },
  { value: 'home_maintenance', label: '🔧 Home Maintenance' },
  { value: 'general', label: '⭐ General Programs' },
]

const NEED_TYPES = [
  { value: 'transport', label: '🚗 Ride needed' },
  { value: 'meals', label: '🍽️ Meal delivery' },
  { value: 'companionship', label: '🤝 Friendly visit / call' },
  { value: 'tech_help', label: '💻 Tech help' },
  { value: 'home_maintenance', label: '🔧 Home task' },
  { value: 'medical', label: '🩺 Medical appointment' },
  { value: 'other', label: '❓ Other' },
]

const MEMBERSHIP_TIERS = [
  { value: 'sliding_scale_low', label: 'Sliding Scale — Low' },
  { value: 'sliding_scale_mid', label: 'Sliding Scale — Mid' },
  { value: 'standard', label: 'Standard' },
  { value: 'supporting', label: 'Supporting' },
  { value: 'organizational', label: 'Organizational' },
]

const URGENCY_COLORS: Record<string, string> = {
  urgent: '#D62828',
  normal: '#1B3A6B',
  low: '#4A4A4A',
}

const NEED_STATUS_LABELS: Record<string, string> = {
  open: '🟢 Open',
  claimed: '🟡 Claimed',
  fulfilled: '✅ Fulfilled',
  cancelled: '⛔ Cancelled',
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`
}

function tierDues(fees: { annual_dues_standard_cents: number; annual_dues_sliding_low_cents: number; annual_dues_sliding_mid_cents: number }, tier: string): number {
  if (tier === 'sliding_scale_low') return fees.annual_dues_sliding_low_cents
  if (tier === 'sliding_scale_mid') return fees.annual_dues_sliding_mid_cents
  return fees.annual_dues_standard_cents
}

interface Props {
  org: CommunityOrgRow
  programs: OrgProgramRow[]
  memberNeeds: MemberNeedRow[]
  memberships: OrgMembershipRow[]
  stats: OrgStats
  initialTiers: OrgMembershipTierRow[]
}

function HvIntegrationSection({ orgId }: { orgId: string }) {
  const [hvOrgId, setHvOrgId] = useState('')
  const [hvSyncEnabled, setHvSyncEnabled] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [memberCount, setMemberCount] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/org-admin/integrations')
      .then(r => r.json())
      .then(j => {
        if (j.data) {
          setHvOrgId(j.data.helpful_village_org_id ?? '')
          setHvSyncEnabled(j.data.hv_sync_enabled ?? false)
          setApiKey(j.data.org_api_key ?? '')
          setMemberCount(j.data.member_count ?? null)
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [orgId])

  async function handleSave() {
    setSaving(true); setError(''); setSaved(false)
    const res = await fetch('/api/org-admin/integrations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ helpful_village_org_id: hvOrgId, hv_sync_enabled: hvSyncEnabled }),
    })
    setSaving(false)
    if (!res.ok) {
      let msg = 'Failed to save'
      try { const j = await res.json(); msg = j.error ?? msg } catch {}
      setError(msg); return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!loaded) return <div style={{ padding: '24px', textAlign: 'center', fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>Loading integration settings…</div>

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E8E4DC', marginTop: '24px' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '6px' }}>Integrations</h3>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
        Connect your organization to Helpful Village or Mon Ami to sync member records automatically.
      </p>

      {saved && <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#F0FFF4', borderRadius: '8px', border: '1px solid #22C55E40', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#15803D' }}>Integration settings saved.</div>}
      {error && <p style={{ color: '#D62828', fontFamily: 'var(--font-body)', fontSize: '14px', marginBottom: '12px' }}>{error}</p>}

      {/* Your API key */}
      {apiKey && (
        <div style={{ marginBottom: '24px', padding: '16px 20px', backgroundColor: '#F0F9F7', borderRadius: '10px', border: '1px solid #2A9D8F30' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '6px' }}>Your ThriveAtHome Org API Key</div>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '13px', color: 'var(--color-teal)', backgroundColor: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #D1C9BC', wordBreak: 'break-all' }}>{apiKey}</div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px', margin: '8px 0 0' }}>
            Use this key in the Authorization header when posting to <code>POST /api/v1/org/members</code> to sync members programmatically.
          </p>
          {memberCount !== null && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-navy)', marginTop: '8px' }}>
              <strong>{memberCount}</strong> members synced via API
            </p>
          )}
        </div>
      )}

      {/* Connect to Helpful Village */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>
          Helpful Village Organization ID
        </label>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
          Enter your Helpful Village org ID to enable member sync. Find it in your Helpful Village admin settings.
        </p>
        <input
          value={hvOrgId}
          onChange={e => setHvOrgId(e.target.value)}
          placeholder="e.g. hv-bay-area-123"
          style={{ width: '100%', maxWidth: '360px', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button
          role="switch"
          aria-checked={hvSyncEnabled}
          onClick={() => setHvSyncEnabled(v => !v)}
          style={{ width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer', backgroundColor: hvSyncEnabled ? 'var(--color-teal)' : '#D1C9BC', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}
        >
          <span style={{ position: 'absolute', top: '3px', left: hvSyncEnabled ? '23px' : '3px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.2s' }} />
        </button>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-navy)' }}>
          {hvSyncEnabled ? 'Sync enabled — new members from Helpful Village will appear here automatically' : 'Sync disabled'}
        </span>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ padding: '10px 24px', backgroundColor: saving ? '#9CA3AF' : 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: saving ? 'default' : 'pointer' }}
      >
        {saving ? 'Saving…' : 'Save integration settings'}
      </button>
    </div>
  )
}

export default function OrgAdminPortal({ org, programs: initialPrograms, memberNeeds: initialNeeds, memberships: initialMemberships, stats: initialStats, initialTiers }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'programs' | 'needs' | 'members' | 'dues' | 'settings' | 'donations' | 'email' | 'documents'>('overview')
  const [programs, setPrograms] = useState(initialPrograms)
  const [memberNeeds, setMemberNeeds] = useState(initialNeeds)
  const [memberships, setMemberships] = useState(initialMemberships)
  const [stats] = useState(initialStats)
  const [orgMembers, setOrgMembers] = useState<Array<{ id: string; full_name: string; preferred_name: string | null }>>([])

  useEffect(() => {
    fetch('/api/org-admin/members-list')
      .then(r => r.json())
      .then(j => { if (j.data) setOrgMembers(j.data) })
      .catch(() => {})
  }, [])

  // Program form
  const [showProgramForm, setShowProgramForm] = useState(false)
  const [programForm, setProgramForm] = useState({ program_name: '', program_type: 'social', description: '', volunteers_needed: '', schedule_description: '', contact_name: '', contact_phone: '' })
  const [programSaving, setProgramSaving] = useState(false)
  const [programError, setProgramError] = useState('')
  const [programSuccess, setProgramSuccess] = useState('')

  // Dues form
  const [showDuesForm, setShowDuesForm] = useState(false)
  const [duesForm, setDuesForm] = useState({ member_id: '', membership_tier: 'standard', dues_paid_date: new Date().toISOString().split('T')[0], notes: '' })
  const [duesSaving, setDuesSaving] = useState(false)
  const [duesError, setDuesError] = useState('')
  const [duesSuccess, setDuesSuccess] = useState('')

  // New need form
  const [showNeedForm, setShowNeedForm] = useState(false)
  const [needForm, setNeedForm] = useState({ member_id: '', need_type: 'other', title: '', description: '', urgency: 'normal', preferred_date: '', preferred_time: '' })
  const [needSaving, setNeedSaving] = useState(false)
  const [needFormError, setNeedFormError] = useState('')
  const [needSuccess, setNeedSuccess] = useState('')

  // Need status update
  const [updatingNeedId, setUpdatingNeedId] = useState<string | null>(null)
  const [needError, setNeedError] = useState('')

  // Fee settings
  const [feeForm, setFeeForm] = useState({
    standard: (org.annual_dues_standard_cents / 100).toFixed(0),
    sliding_mid: (org.annual_dues_sliding_mid_cents / 100).toFixed(0),
    sliding_low: (org.annual_dues_sliding_low_cents / 100).toFixed(0),
    dues_description: org.dues_description ?? '',
  })
  const [feeSaving, setFeeSaving] = useState(false)
  const [feeError, setFeeError] = useState('')
  const [feeSuccess, setFeeSuccess] = useState('')
  const [orgFees, setOrgFees] = useState({
    annual_dues_standard_cents: org.annual_dues_standard_cents,
    annual_dues_sliding_mid_cents: org.annual_dues_sliding_mid_cents,
    annual_dues_sliding_low_cents: org.annual_dues_sliding_low_cents,
    dues_description: org.dues_description,
  })

  // Custom tiers
  const [tiers, setTiers] = useState<OrgMembershipTierRow[]>(initialTiers)
  const [showTierForm, setShowTierForm] = useState(false)
  const [tierForm, setTierForm] = useState({ tier_name: '', amount: '', description: '' })
  const [tierSaving, setTierSaving] = useState(false)
  const [tierError, setTierError] = useState('')
  const [tierSuccess, setTierSuccess] = useState('')

  // Donations
  const [donations, setDonations] = useState<OrgDonationRow[]>([])
  const [donationsLoaded, setDonationsLoaded] = useState(false)
  const [showDonationForm, setShowDonationForm] = useState(false)
  const [donationForm, setDonationForm] = useState({ donor_name: '', donor_email: '', amount: '', donation_date: new Date().toISOString().split('T')[0], payment_method: 'cash', notes: '', is_anonymous: false })
  const [donationSaving, setDonationSaving] = useState(false)
  const [donationError, setDonationError] = useState('')
  const [donationSuccess, setDonationSuccess] = useState('')

  // Email
  const [emailForm, setEmailForm] = useState({ subject: '', message: '', recipient_group: 'all' })
  const [emailSending, setEmailSending] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailResult, setEmailResult] = useState('')
  const [sentEmails, setSentEmails] = useState<Array<{ id: string; created_at: string; subject: string; recipient_group: string; recipient_count: number; sent_by_name: string | null }>>([])
  const [sentEmailsLoaded, setSentEmailsLoaded] = useState(false)
  // Templates
  const [templates, setTemplates] = useState<Array<{ id: string; org_id: string | null; name: string; subject: string; body: string; is_factory: boolean }>>([])
  const [templatesLoaded, setTemplatesLoaded] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)
  // Individual member email
  const [memberEmailTarget, setMemberEmailTarget] = useState<{ name: string; memberId: string } | null>(null)
  const [memberEmailSubject, setMemberEmailSubject] = useState('')
  const [memberEmailBody, setMemberEmailBody] = useState('')
  const [memberEmailSending, setMemberEmailSending] = useState(false)

  // Documents
  type PlatformDoc = { id: string; created_at: string; title: string; description: string | null; file_name: string; file_type: string; file_size_bytes: number | null; category: string; visibility: string; uploaded_by_name: string | null }
  const [docs, setDocs] = useState<PlatformDoc[]>([])
  const [docsLoaded, setDocsLoaded] = useState(false)
  const [docUploading, setDocUploading] = useState(false)
  const [docError, setDocError] = useState('')
  const [docSuccess, setDocSuccess] = useState('')
  const [docForm, setDocForm] = useState({ title: '', description: '', category: 'general', visibility: 'admins_only' })
  const [docFile, setDocFile] = useState<File | null>(null)

  async function loadDocs() {
    if (docsLoaded) return
    const res = await fetch('/api/org-admin/documents')
    const json = await res.json().catch(() => ({ data: [] }))
    setDocs(json.data ?? [])
    setDocsLoaded(true)
  }

  async function handleDocUpload() {
    if (!docFile || !docForm.title.trim()) { setDocError('Title and file are required'); return }
    setDocUploading(true); setDocError(''); setDocSuccess('')
    try {
      const fd = new FormData()
      fd.append('file', docFile)
      fd.append('title', docForm.title.trim())
      fd.append('description', docForm.description.trim())
      fd.append('category', docForm.category)
      fd.append('visibility', docForm.visibility)
      const res = await fetch('/api/org-admin/documents', { method: 'POST', body: fd })
      const json = await res.json().catch(() => ({ error: 'Server error — check console' }))
      if (!res.ok) { setDocError(json.error ?? 'Upload failed'); return }
      setDocs(prev => [json.data, ...prev])
      setDocForm({ title: '', description: '', category: 'general', visibility: 'admins_only' })
      setDocFile(null)
      setDocSuccess('Document uploaded successfully.')
      setTimeout(() => setDocSuccess(''), 4000)
    } catch (e) {
      setDocError('Upload failed — network error. Please try again.')
    } finally {
      setDocUploading(false)
    }
  }

  async function handleDocDownload(docId: string, fileName: string) {
    const res = await fetch(`/api/org-admin/documents/${docId}`)
    const json = await res.json().catch(() => ({}))
    if (!json.url) { alert('Download failed. Ensure the platform-documents Storage bucket is created in Supabase.'); return }
    const a = document.createElement('a')
    a.href = json.url
    a.download = fileName
    a.target = '_blank'
    a.click()
  }

  async function handleDocDelete(docId: string) {
    if (!confirm('Delete this document? This cannot be undone.')) return
    const res = await fetch(`/api/org-admin/documents/${docId}`, { method: 'DELETE' })
    if (res.ok) {
      setDocs(prev => prev.filter(d => d.id !== docId))
    } else {
      alert('Delete failed.')
    }
  }

  function formatBytes(bytes: number | null): string {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'programs', label: '📋 Programs' },
    { id: 'needs', label: '🙋 Needs Board' },
    { id: 'members', label: '👥 Members' },
    { id: 'dues', label: '💳 Membership Dues' },
    { id: 'donations', label: '🎁 Donations' },
    { id: 'email', label: '📧 Email Members' },
    { id: 'documents', label: '📎 Documents' },
    { id: 'settings', label: '⚙️ Settings' },
  ]

  async function handleSaveFeeSettings() {
    const standard = Math.round(parseFloat(feeForm.standard || '0') * 100)
    const slidingMid = Math.round(parseFloat(feeForm.sliding_mid || '0') * 100)
    const slidingLow = Math.round(parseFloat(feeForm.sliding_low || '0') * 100)
    if (isNaN(standard) || isNaN(slidingMid) || isNaN(slidingLow)) {
      setFeeError('Please enter valid dollar amounts'); return
    }
    if (standard < 0 || slidingMid < 0 || slidingLow < 0) {
      setFeeError('Amounts cannot be negative'); return
    }
    setFeeSaving(true); setFeeError('')
    const res = await fetch('/api/org-admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        annual_dues_standard_cents: standard,
        annual_dues_sliding_mid_cents: slidingMid,
        annual_dues_sliding_low_cents: slidingLow,
        dues_description: feeForm.dues_description.trim() || null,
      }),
    })
    const json = await res.json().catch(() => ({ error: 'Server error' }))
    setFeeSaving(false)
    if (!res.ok) { setFeeError(json.error ?? 'Failed to save settings'); return }
    setOrgFees({
      annual_dues_standard_cents: standard,
      annual_dues_sliding_mid_cents: slidingMid,
      annual_dues_sliding_low_cents: slidingLow,
      dues_description: feeForm.dues_description.trim() || null,
    })
    setFeeSuccess('Fee structure saved successfully.')
    setTimeout(() => setFeeSuccess(''), 4000)
  }

  async function handleAddCustomTier() {
    if (!tierForm.tier_name.trim()) { setTierError('Tier name is required'); return }
    const amount = Math.round(parseFloat(tierForm.amount || '0') * 100)
    if (isNaN(amount) || amount < 0) { setTierError('Please enter a valid dollar amount'); return }
    setTierSaving(true); setTierError('')
    const res = await fetch('/api/org-admin/membership-tiers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier_name: tierForm.tier_name.trim(), amount_cents: amount, description: tierForm.description.trim() || undefined }),
    })
    const json = await res.json().catch(() => ({ error: 'Server error' }))
    setTierSaving(false)
    if (!res.ok) { setTierError(json.error ?? 'Failed to add tier'); return }
    setTiers(prev => [...prev, json.data])
    setShowTierForm(false)
    setTierForm({ tier_name: '', amount: '', description: '' })
    setTierSuccess(`Tier "${json.data.tier_name}" added.`)
    setTimeout(() => setTierSuccess(''), 4000)
  }

  async function handleAddProgram() {
    if (!programForm.program_name.trim()) { setProgramError('Program name is required'); return }
    setProgramSaving(true); setProgramError('')
    const res = await fetch('/api/org-admin/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...programForm, volunteers_needed: parseInt(programForm.volunteers_needed || '0') }),
    })
    const json = await res.json().catch(() => ({ error: 'Server error' }))
    setProgramSaving(false)
    if (!res.ok) { setProgramError(json.error ?? 'Failed to add program'); return }
    setPrograms(prev => [json.data, ...prev])
    setShowProgramForm(false)
    setProgramForm({ program_name: '', program_type: 'social', description: '', volunteers_needed: '', schedule_description: '', contact_name: '', contact_phone: '' })
    setProgramSuccess(`Program "${json.data.program_name}" added successfully.`)
    setTimeout(() => setProgramSuccess(''), 4000)
  }

  async function handlePostNeed() {
    if (!needForm.member_id.trim()) { setNeedFormError('Member ID is required'); return }
    if (!needForm.title.trim()) { setNeedFormError('Title is required'); return }
    if (!needForm.description.trim()) { setNeedFormError('Description is required'); return }
    setNeedSaving(true); setNeedFormError('')
    const res = await fetch('/api/org-admin/member-needs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(needForm),
    })
    const json = await res.json().catch(() => ({ error: 'Server error' }))
    setNeedSaving(false)
    if (!res.ok) { setNeedFormError(json.error ?? 'Failed to post need'); return }
    setMemberNeeds(prev => [json.data, ...prev])
    setShowNeedForm(false)
    setNeedForm({ member_id: '', need_type: 'other', title: '', description: '', urgency: 'normal', preferred_date: '', preferred_time: '' })
    setNeedSuccess('Need posted to the bulletin board.')
    setTimeout(() => setNeedSuccess(''), 4000)
  }

  async function handleNeedStatusUpdate(needId: string, status: string, fulfillmentNotes?: string) {
    setUpdatingNeedId(needId); setNeedError('')
    const res = await fetch(`/api/org-admin/member-needs/${needId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, fulfillment_notes: fulfillmentNotes }),
    })
    const json = await res.json().catch(() => ({ error: 'Server error' }))
    setUpdatingNeedId(null)
    if (!res.ok) { setNeedError(json.error ?? 'Failed to update need'); return }
    setMemberNeeds(prev => prev.map(n => n.id === needId ? { ...n, status, fulfilled_at: json.data?.fulfilled_at ?? n.fulfilled_at, claimed_at: json.data?.claimed_at ?? n.claimed_at } : n))
  }

  async function handleRecordDues() {
    if (!duesForm.member_id.trim()) { setDuesError('Member ID is required'); return }
    setDuesSaving(true); setDuesError('')
    const dueCents = tierDues(orgFees, duesForm.membership_tier)
    const res = await fetch('/api/org-admin/memberships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: duesForm.member_id,
        membership_tier: duesForm.membership_tier,
        annual_dues_paid_cents: dueCents,
        dues_paid_date: duesForm.dues_paid_date,
        notes: duesForm.notes,
      }),
    })
    const json = await res.json().catch(() => ({ error: 'Server error' }))
    setDuesSaving(false)
    if (!res.ok) { setDuesError(json.error ?? 'Failed to record dues'); return }
    setMemberships(prev => {
      const idx = prev.findIndex(m => m.id === json.data.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = json.data; return next }
      return [json.data, ...prev]
    })
    setShowDuesForm(false)
    setDuesForm({ member_id: '', membership_tier: 'standard', dues_paid_date: new Date().toISOString().split('T')[0], notes: '' })
    setDuesSuccess('Membership dues recorded successfully.')
    setTimeout(() => setDuesSuccess(''), 4000)
  }

  async function loadDonations() {
    if (donationsLoaded) return
    const res = await fetch('/api/org-admin/donations')
    const json = await res.json().catch(() => ({ data: [] }))
    setDonations(json.data ?? [])
    setDonationsLoaded(true)
  }

  async function handleAddDonation() {
    if (!donationForm.donor_name.trim()) { setDonationError('Donor name is required'); return }
    const amount = Math.round(parseFloat(donationForm.amount || '0') * 100)
    if (isNaN(amount) || amount < 0) { setDonationError('Please enter a valid dollar amount'); return }
    if (!donationForm.donation_date) { setDonationError('Donation date is required'); return }
    setDonationSaving(true); setDonationError('')
    const res = await fetch('/api/org-admin/donations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        donor_name: donationForm.donor_name.trim(),
        donor_email: donationForm.donor_email.trim() || null,
        amount_cents: amount,
        donation_date: donationForm.donation_date,
        payment_method: donationForm.payment_method,
        notes: donationForm.notes.trim() || null,
        is_anonymous: donationForm.is_anonymous,
      }),
    })
    const json = await res.json().catch(() => ({ error: 'Server error' }))
    setDonationSaving(false)
    if (!res.ok) { setDonationError(json.error ?? 'Failed to record donation'); return }
    setDonations(prev => [json.data, ...prev])
    setShowDonationForm(false)
    setDonationForm({ donor_name: '', donor_email: '', amount: '', donation_date: new Date().toISOString().split('T')[0], payment_method: 'cash', notes: '', is_anonymous: false })
    setDonationSuccess('Donation recorded.')
    setTimeout(() => setDonationSuccess(''), 4000)
  }

  async function loadSentEmails() {
    if (sentEmailsLoaded) return
    const res = await fetch('/api/org-admin/sent-emails')
    const json = await res.json().catch(() => ({ data: [] }))
    setSentEmails(json.data ?? [])
    setSentEmailsLoaded(true)
  }

  async function handleSendEmail() {
    if (!emailForm.subject.trim()) { setEmailError('Subject is required'); return }
    if (!emailForm.message.trim()) { setEmailError('Message is required'); return }
    setEmailSending(true); setEmailError('')
    const res = await fetch('/api/org-admin/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: emailForm.subject, message: emailForm.message, recipient_group: emailForm.recipient_group }),
    })
    const json = await res.json().catch(() => ({ error: 'Server error' }))
    setEmailSending(false)
    if (!res.ok) { setEmailError(json.error ?? 'Failed to send email'); return }
    const sent = json.sent ?? 0
    setEmailResult(`Email sent to ${sent} member${sent !== 1 ? 's' : ''}.`)
    setEmailForm({ subject: '', message: '', recipient_group: 'all' })
    if (json.logged) setSentEmails(prev => [json.logged, ...prev])
    setTimeout(() => setEmailResult(''), 6000)
  }

  async function loadTemplates() {
    if (templatesLoaded) return
    const res = await fetch('/api/org-admin/email-templates')
    const json = await res.json().catch(() => ({ factoryTemplates: [], orgTemplates: [] }))
    setTemplates([...(json.factoryTemplates ?? []), ...(json.orgTemplates ?? [])])
    setTemplatesLoaded(true)
  }

  function applyTemplate(t: { subject: string; body: string }) {
    setEmailForm(f => ({ ...f, subject: t.subject, message: t.body }))
  }

  async function handleSaveTemplate() {
    if (!templateName.trim()) return
    if (!emailForm.subject.trim() || !emailForm.message.trim()) return
    setSavingTemplate(true)
    const res = await fetch('/api/org-admin/email-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: templateName, subject: emailForm.subject, body: emailForm.message }),
    })
    const json = await res.json().catch(() => null)
    setSavingTemplate(false)
    if (json?.data) {
      setTemplates(prev => [...prev, json.data])
      setShowSaveTemplate(false)
      setTemplateName('')
    }
  }

  async function handleDeleteTemplate(id: string) {
    await fetch(`/api/org-admin/email-templates?id=${id}`, { method: 'DELETE' })
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  async function handleSendMemberEmail() {
    if (!memberEmailTarget || !memberEmailSubject.trim() || !memberEmailBody.trim()) return
    setMemberEmailSending(true)
    const res = await fetch('/api/org-admin/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: memberEmailSubject,
        message: memberEmailBody,
        recipient_group: `member_${memberEmailTarget.memberId}`,
      }),
    })
    setMemberEmailSending(false)
    if (res.ok) {
      setMemberEmailTarget(null)
      setMemberEmailSubject('')
      setMemberEmailBody('')
    }
  }

  const openNeeds = memberNeeds.filter(n => n.status === 'open')
  const claimedNeeds = memberNeeds.filter(n => n.status === 'claimed')
  const fulfilledNeeds = memberNeeds.filter(n => n.status === 'fulfilled')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>ThriveAtHome</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '18px' }}>|</span>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px', fontFamily: 'var(--font-body)' }}>{org.org_name}</span>
        </div>
        <a href="/api/auth/signout" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontFamily: 'var(--font-body)', textDecoration: 'none' }}>Sign out</a>
      </nav>

      {/* Header */}
      <div style={{ backgroundColor: 'var(--color-navy)', padding: '24px 32px 0', color: 'white' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-cream)', marginBottom: '4px' }}>{org.org_name}</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '20px' }}>
          {org.city}{org.state ? `, ${org.state}` : ''} · {org.org_type.replace(/_/g, ' ')} · Powered by ThriveAtHome
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as typeof activeTab); if (tab.id === 'documents') loadDocs() }}
              style={{
                padding: '10px 20px',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? 'var(--color-navy)' : 'rgba(255,255,255,0.8)',
                backgroundColor: activeTab === tab.id ? 'var(--color-cream)' : 'transparent',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main style={{ flex: 1, padding: '32px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '24px' }}>Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {[
                { label: 'Total Members', value: stats.member_count, icon: '👥' },
                { label: 'Active Programs', value: stats.program_count, icon: '📋' },
                { label: 'Open Needs', value: stats.open_needs_count, icon: '🙋', highlight: stats.open_needs_count > 0 },
                { label: 'Active Members This Year', value: stats.active_memberships_count, icon: '🏷️' },
                { label: 'Dues Collected', value: formatCents(stats.dues_collected_cents), icon: '💳' },
              ].map(s => (
                <div key={s.label} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: s.highlight ? '2px solid #D62828' : '1px solid #E8E4DC' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '28px', fontWeight: 700, color: s.highlight ? '#D62828' : 'var(--color-navy)' }}>{s.value}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Org details */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E8E4DC' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>Organization Details</h3>
              {org.description && <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: '12px' }}>{org.description}</p>}
              {org.service_area_description && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  <strong>Service area:</strong> {org.service_area_description}
                </p>
              )}
              {org.dues_description && (
                <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: '#F0F9F7', borderRadius: '8px', border: '1px solid #2A9D8F20' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-teal)', margin: 0 }}>{org.dues_description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PROGRAMS TAB ── */}
        {activeTab === 'programs' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)' }}>Programs</h2>
              <button onClick={() => setShowProgramForm(v => !v)} style={{ padding: '10px 20px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                + Add Program
              </button>
            </div>

            {programSuccess && <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#F0FFF4', borderRadius: '8px', border: '1px solid #22C55E40', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#15803D' }}>{programSuccess}</div>}

            {showProgramForm && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E8E4DC', marginBottom: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '20px' }}>New Program</h3>
                {programError && <p style={{ color: '#D62828', fontFamily: 'var(--font-body)', fontSize: '14px', marginBottom: '12px' }}>{programError}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Program Name *</label>
                    <input value={programForm.program_name} onChange={e => setProgramForm(f => ({ ...f, program_name: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', boxSizing: 'border-box' }} placeholder="e.g. Friendly Visitor Program" />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Program Type *</label>
                    <select value={programForm.program_type} onChange={e => setProgramForm(f => ({ ...f, program_type: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', boxSizing: 'border-box' }}>
                      {PROGRAM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Description</label>
                    <textarea value={programForm.description} onChange={e => setProgramForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Volunteers Needed</label>
                    <input type="number" value={programForm.volunteers_needed} onChange={e => setProgramForm(f => ({ ...f, volunteers_needed: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', boxSizing: 'border-box' }} placeholder="0" />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Schedule</label>
                    <input value={programForm.schedule_description} onChange={e => setProgramForm(f => ({ ...f, schedule_description: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', boxSizing: 'border-box' }} placeholder="e.g. Weekly, flexible scheduling" />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Contact Name</label>
                    <input value={programForm.contact_name} onChange={e => setProgramForm(f => ({ ...f, contact_name: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Contact Phone</label>
                    <input value={programForm.contact_phone} onChange={e => setProgramForm(f => ({ ...f, contact_phone: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button onClick={handleAddProgram} disabled={programSaving} style={{ padding: '10px 24px', backgroundColor: programSaving ? '#9CA3AF' : 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: programSaving ? 'default' : 'pointer' }}>
                    {programSaving ? 'Saving…' : 'Add Program'}
                  </button>
                  <button onClick={() => setShowProgramForm(false)} style={{ padding: '10px 24px', backgroundColor: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}

            {programs.length === 0 ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', border: '1px solid #E8E4DC' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)' }}>No programs yet. Add your first program above.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {programs.map(p => (
                  <div key={p.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #E8E4DC' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 700, color: 'var(--color-navy)', margin: 0 }}>{p.program_name}</h3>
                      <span style={{ padding: '2px 8px', backgroundColor: '#F0F9F7', color: 'var(--color-teal)', borderRadius: '12px', fontSize: '11px', fontFamily: 'var(--font-body)', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '8px' }}>
                        {PROGRAM_TYPES.find(t => t.value === p.program_type)?.label ?? p.program_type}
                      </span>
                    </div>
                    {p.description && <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>{p.description}</p>}
                    {p.schedule_description && <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>📅 {p.schedule_description}</p>}
                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E8E4DC' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '20px', fontWeight: 700, color: 'var(--color-navy)' }}>{p.participants_count}</div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-secondary)' }}>Participants</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '20px', fontWeight: 700, color: p.volunteers_enrolled >= p.volunteers_needed ? '#22C55E' : '#F59E0B' }}>{p.volunteers_enrolled}/{p.volunteers_needed}</div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-secondary)' }}>Volunteers</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── NEEDS BOARD TAB ── */}
        {activeTab === 'needs' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)' }}>Member Needs Board</h2>
              <button onClick={() => setShowNeedForm(v => !v)} style={{ padding: '10px 20px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                + Post a Need
              </button>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              Post a need on behalf of a member — volunteers and staff can claim and fulfill them.
            </p>

            {needSuccess && <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#F0FFF4', borderRadius: '8px', border: '1px solid #22C55E40', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#15803D' }}>{needSuccess}</div>}

            {showNeedForm && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E8E4DC', marginBottom: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '20px' }}>Post a Member Need</h3>
                {needFormError && <p style={{ color: '#D62828', fontFamily: 'var(--font-body)', fontSize: '14px', marginBottom: '12px' }}>{needFormError}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Member *</label>
                    {orgMembers.length > 0 ? (
                      <select value={needForm.member_id} onChange={e => setNeedForm(f => ({ ...f, member_id: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }}>
                        <option value="">— Select a member —</option>
                        {orgMembers.map(m => (
                          <option key={m.id} value={m.id}>{m.preferred_name ? `${m.preferred_name} (${m.full_name})` : m.full_name}</option>
                        ))}
                      </select>
                    ) : (
                      <input value={needForm.member_id} onChange={e => setNeedForm(f => ({ ...f, member_id: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} placeholder="Member UUID (no enrolled members yet)" />
                    )}
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Need Type *</label>
                    <select value={needForm.need_type} onChange={e => setNeedForm(f => ({ ...f, need_type: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }}>
                      {NEED_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Title *</label>
                    <input value={needForm.title} onChange={e => setNeedForm(f => ({ ...f, title: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', boxSizing: 'border-box' }} placeholder="e.g. Ride to Kaiser on Thursday" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Description *</label>
                    <textarea value={needForm.description} onChange={e => setNeedForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', resize: 'vertical', boxSizing: 'border-box' }} placeholder="Details about the need" />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Urgency</label>
                    <select value={needForm.urgency} onChange={e => setNeedForm(f => ({ ...f, urgency: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }}>
                      <option value="urgent">🔴 Urgent</option>
                      <option value="normal">🟡 Normal</option>
                      <option value="low">🟢 Low</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Preferred Date</label>
                    <input type="date" value={needForm.preferred_date} onChange={e => setNeedForm(f => ({ ...f, preferred_date: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button onClick={handlePostNeed} disabled={needSaving} style={{ padding: '10px 24px', backgroundColor: needSaving ? '#9CA3AF' : 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: needSaving ? 'default' : 'pointer' }}>
                    {needSaving ? 'Posting…' : 'Post Need'}
                  </button>
                  <button onClick={() => setShowNeedForm(false)} style={{ padding: '10px 24px', backgroundColor: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}

            {needError && <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#FFF5F5', borderRadius: '8px', border: '1px solid #D6282820', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#D62828' }}>{needError}</div>}

            {/* Open Needs */}
            <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 700, color: '#D62828', marginBottom: '12px' }}>🔴 Open Needs ({openNeeds.length})</h3>
            {openNeeds.length === 0 ? (
              <div style={{ backgroundColor: '#F0FFF4', borderRadius: '8px', padding: '16px', marginBottom: '24px', border: '1px solid #22C55E30' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#15803D', margin: 0 }}>✅ No open needs right now — all caught up!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {openNeeds.map(need => (
                  <NeedCard key={need.id} need={need} onUpdateStatus={handleNeedStatusUpdate} isUpdating={updatingNeedId === need.id} />
                ))}
              </div>
            )}

            {/* Claimed */}
            {claimedNeeds.length > 0 && (
              <>
                <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 700, color: '#F59E0B', marginBottom: '12px' }}>🟡 Claimed ({claimedNeeds.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                  {claimedNeeds.map(need => (
                    <NeedCard key={need.id} need={need} onUpdateStatus={handleNeedStatusUpdate} isUpdating={updatingNeedId === need.id} />
                  ))}
                </div>
              </>
            )}

            {/* Fulfilled */}
            {fulfilledNeeds.length > 0 && (
              <>
                <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 700, color: '#15803D', marginBottom: '12px' }}>✅ Fulfilled ({fulfilledNeeds.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {fulfilledNeeds.slice(0, 10).map(need => (
                    <NeedCard key={need.id} need={need} onUpdateStatus={handleNeedStatusUpdate} isUpdating={updatingNeedId === need.id} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── MEMBERS TAB ── */}
        {activeTab === 'members' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '24px' }}>Members</h2>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E8E4DC', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9F6F0' }}>
                    {['Name', 'Tier', 'Dues Paid', 'Payment Date', 'Notes', ''].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {memberships.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)' }}>No membership records for {new Date().getFullYear()} yet.</td></tr>
                  ) : memberships.map((m, i) => (
                    <tr key={m.id} style={{ borderTop: i > 0 ? '1px solid #E8E4DC' : undefined }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-navy)', fontWeight: 600 }}>{m.member?.full_name ?? 'Unknown'}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{MEMBERSHIP_TIERS.find(t => t.value === m.membership_tier)?.label ?? m.membership_tier}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-navy)', fontWeight: 600 }}>{formatCents(m.annual_dues_paid_cents)}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{m.dues_paid_date ?? '—'}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{m.notes ?? ''}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => {
                            setMemberEmailTarget({ name: m.member?.full_name ?? 'Member', memberId: m.member_id })
                            setMemberEmailSubject('')
                            setMemberEmailBody('')
                            setActiveTab('email')
                          }}
                          style={{ padding: '4px 12px', backgroundColor: 'transparent', color: 'var(--color-teal)', border: '1px solid var(--color-teal)', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '12px', cursor: 'pointer' }}
                        >
                          ✉️ Email
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DUES TAB ── */}
        {activeTab === 'dues' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)' }}>Membership Dues</h2>
              <button onClick={() => setShowDuesForm(v => !v)} style={{ padding: '10px 20px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                + Record Payment
              </button>
            </div>

            {duesSuccess && <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#F0FFF4', borderRadius: '8px', border: '1px solid #22C55E40', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#15803D' }}>{duesSuccess}</div>}

            {/* Dues structure — reads from orgFees (live-updated) */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E8E4DC', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>Dues Structure</h3>
                <button onClick={() => setActiveTab('settings')} style={{ padding: '6px 14px', backgroundColor: 'transparent', color: 'var(--color-teal)', border: '1px solid var(--color-teal)', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}>
                  ⚙️ Edit fee structure
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {[
                  { label: 'Sliding Scale — Low', amount: orgFees.annual_dues_sliding_low_cents, note: 'For members who cannot afford standard dues' },
                  { label: 'Sliding Scale — Mid', amount: orgFees.annual_dues_sliding_mid_cents, note: 'Reduced rate for those with limited income' },
                  { label: 'Standard', amount: orgFees.annual_dues_standard_cents, note: 'Regular annual membership' },
                ].map(tier => (
                  <div key={tier.label} style={{ padding: '16px', backgroundColor: '#F9F6F0', borderRadius: '8px', border: '1px solid #E8E4DC' }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '22px', fontWeight: 700, color: 'var(--color-teal)' }}>{formatCents(tier.amount)}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '4px' }}>{tier.label}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>{tier.note}</div>
                  </div>
                ))}
                {tiers.filter(t => t.is_active).map(t => (
                  <div key={t.id} style={{ padding: '16px', backgroundColor: '#F0F9F7', borderRadius: '8px', border: '1px solid #2A9D8F30' }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '22px', fontWeight: 700, color: 'var(--color-teal)' }}>{formatCents(t.amount_cents)}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '4px' }}>{t.tier_name}</div>
                    {t.description && <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>{t.description}</div>}
                  </div>
                ))}
              </div>
              {orgFees.dues_description && <p style={{ marginTop: '16px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-teal)', fontStyle: 'italic' }}>{orgFees.dues_description}</p>}
            </div>

            {showDuesForm && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E8E4DC', marginBottom: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '20px' }}>Record Membership Payment</h3>
                {/* tier dropdown shows live orgFees amounts */}
                {duesError && <p style={{ color: '#D62828', fontFamily: 'var(--font-body)', fontSize: '14px', marginBottom: '12px' }}>{duesError}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Member *</label>
                    {orgMembers.length > 0 ? (
                      <select value={duesForm.member_id} onChange={e => setDuesForm(f => ({ ...f, member_id: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }}>
                        <option value="">— Select a member —</option>
                        {orgMembers.map(m => (
                          <option key={m.id} value={m.id}>{m.preferred_name ? `${m.preferred_name} (${m.full_name})` : m.full_name}</option>
                        ))}
                      </select>
                    ) : (
                      <input value={duesForm.member_id} onChange={e => setDuesForm(f => ({ ...f, member_id: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} placeholder="Member UUID" />
                    )}
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Membership Tier</label>
                    <select value={duesForm.membership_tier} onChange={e => setDuesForm(f => ({ ...f, membership_tier: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }}>
                      {MEMBERSHIP_TIERS.map(t => <option key={t.value} value={t.value}>{t.label} — {formatCents(tierDues(orgFees, t.value))}/yr</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Payment Date</label>
                    <input type="date" value={duesForm.dues_paid_date} onChange={e => setDuesForm(f => ({ ...f, dues_paid_date: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Notes (optional)</label>
                    <input value={duesForm.notes} onChange={e => setDuesForm(f => ({ ...f, notes: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} placeholder="e.g. Cash payment, check #1234" />
                  </div>
                </div>
                <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: '#F0F9F7', borderRadius: '8px' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-teal)', margin: 0 }}>
                    Amount to record: <strong>{formatCents(tierDues(orgFees, duesForm.membership_tier))}</strong> ({MEMBERSHIP_TIERS.find(t => t.value === duesForm.membership_tier)?.label})
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button onClick={handleRecordDues} disabled={duesSaving} style={{ padding: '10px 24px', backgroundColor: duesSaving ? '#9CA3AF' : 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: duesSaving ? 'default' : 'pointer' }}>
                    {duesSaving ? 'Saving…' : 'Record Payment'}
                  </button>
                  <button onClick={() => setShowDuesForm(false)} style={{ padding: '10px 24px', backgroundColor: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
        {/* ── SETTINGS TAB ── */}
        {activeTab === 'settings' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>Membership Settings</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
              Configure your membership fee structure. Changes take effect immediately and appear in the Dues tab.
            </p>

            {feeSuccess && <div style={{ marginBottom: '20px', padding: '12px 16px', backgroundColor: '#F0FFF4', borderRadius: '8px', border: '1px solid #22C55E40', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#15803D' }}>{feeSuccess}</div>}

            {/* Preset fee tiers */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E8E4DC', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '6px' }}>Preset Fee Tiers</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>Enter amounts in dollars per year. Sliding Scale — Low can be $0 (free).</p>

              {feeError && <p style={{ color: '#D62828', fontFamily: 'var(--font-body)', fontSize: '14px', marginBottom: '12px' }}>{feeError}</p>}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                {[
                  { key: 'sliding_low' as const, label: 'Sliding Scale — Low', note: 'For members who cannot afford standard dues', bg: '#F0F9F7' },
                  { key: 'sliding_mid' as const, label: 'Sliding Scale — Mid', note: 'Reduced rate for those with limited income', bg: '#F9F6F0' },
                  { key: 'standard' as const, label: 'Standard', note: 'Regular annual membership rate', bg: '#F9F6F0' },
                ].map(tier => (
                  <div key={tier.key} style={{ padding: '20px', backgroundColor: tier.bg, borderRadius: '10px', border: '1px solid #E8E4DC' }}>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--color-navy)', display: 'block', marginBottom: '4px' }}>{tier.label}</label>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>{tier.note}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-navy)', fontWeight: 600 }}>$</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={feeForm[tier.key]}
                        onChange={e => setFeeForm(f => ({ ...f, [tier.key]: e.target.value }))}
                        style={{ width: '100px', padding: '8px 12px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 700, color: 'var(--color-teal)' }}
                      />
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>/year</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dues description */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Membership Message (shown to members)</label>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>A short message explaining your fee philosophy. Leave blank to hide.</p>
                <textarea
                  value={feeForm.dues_description}
                  onChange={e => setFeeForm(f => ({ ...f, dues_description: e.target.value }))}
                  rows={2}
                  maxLength={300}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', resize: 'vertical', boxSizing: 'border-box' }}
                  placeholder='e.g. "We use a sliding scale so cost is never a barrier. Pay what you can afford — from free to $50/year."'
                />
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{feeForm.dues_description.length}/300 characters</p>
              </div>

              <button
                onClick={handleSaveFeeSettings}
                disabled={feeSaving}
                style={{ padding: '12px 28px', backgroundColor: feeSaving ? '#9CA3AF' : 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, cursor: feeSaving ? 'default' : 'pointer' }}
              >
                {feeSaving ? 'Saving…' : 'Save fee structure'}
              </button>
            </div>

            {/* Custom tiers */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E8E4DC', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>Custom Tiers</h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Add tiers beyond the three preset ones — for supporting members, organizational memberships, or special rates.</p>
                </div>
                <button onClick={() => setShowTierForm(v => !v)} style={{ padding: '10px 20px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                  + Add Tier
                </button>
              </div>

              {tierSuccess && <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#F0FFF4', borderRadius: '8px', border: '1px solid #22C55E40', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#15803D' }}>{tierSuccess}</div>}

              {showTierForm && (
                <div style={{ backgroundColor: '#F9F6F0', borderRadius: '10px', padding: '20px', border: '1px solid #E8E4DC', marginBottom: '20px' }}>
                  <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '16px' }}>New Custom Tier</h4>
                  {tierError && <p style={{ color: '#D62828', fontFamily: 'var(--font-body)', fontSize: '14px', marginBottom: '12px' }}>{tierError}</p>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Tier Name *</label>
                      <input value={tierForm.tier_name} onChange={e => setTierForm(f => ({ ...f, tier_name: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', boxSizing: 'border-box' }} placeholder='e.g. "Supporting Member"' />
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Annual Amount ($) *</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-navy)' }}>$</span>
                        <input type="number" min="0" step="1" value={tierForm.amount} onChange={e => setTierForm(f => ({ ...f, amount: e.target.value }))} style={{ width: '100px', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px' }} placeholder="100" />
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>/year</span>
                      </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Description (optional)</label>
                      <input value={tierForm.description} onChange={e => setTierForm(f => ({ ...f, description: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', boxSizing: 'border-box' }} placeholder='e.g. "For those who can give a bit extra to support the network."' />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button onClick={handleAddCustomTier} disabled={tierSaving} style={{ padding: '10px 24px', backgroundColor: tierSaving ? '#9CA3AF' : 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: tierSaving ? 'default' : 'pointer' }}>
                      {tierSaving ? 'Saving…' : 'Add Tier'}
                    </button>
                    <button onClick={() => setShowTierForm(false)} style={{ padding: '10px 24px', backgroundColor: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}

              {tiers.length === 0 ? (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '24px' }}>No custom tiers yet. Click "+ Add Tier" to create one.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                  {tiers.map(t => (
                    <div key={t.id} style={{ padding: '16px', backgroundColor: '#F0F9F7', borderRadius: '10px', border: '1px solid #2A9D8F30', opacity: t.is_active ? 1 : 0.5 }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '22px', fontWeight: 700, color: 'var(--color-teal)' }}>{formatCents(t.amount_cents)}/yr</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '4px' }}>{t.tier_name}</div>
                      {t.description && <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>{t.description}</div>}
                      {!t.is_active && <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Inactive</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview section */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E8E4DC' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '6px' }}>Member Preview</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>How the fee structure appears to members when they enroll.</p>
              <div style={{ border: '2px dashed #D1C9BC', borderRadius: '12px', padding: '24px', backgroundColor: '#FDFCF8' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '6px' }}>Join {org.org_name}</h4>
                {(feeForm.dues_description || orgFees.dues_description) && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-teal)', fontStyle: 'italic', marginBottom: '20px', lineHeight: 1.6 }}>
                    {feeForm.dues_description || orgFees.dues_description}
                  </p>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  {[
                    { label: 'Sliding Scale — Low', amount: Math.round(parseFloat(feeForm.sliding_low || '0') * 100) },
                    { label: 'Sliding Scale — Mid', amount: Math.round(parseFloat(feeForm.sliding_mid || '0') * 100) },
                    { label: 'Standard', amount: Math.round(parseFloat(feeForm.standard || '0') * 100) },
                    ...tiers.filter(t => t.is_active).map(t => ({ label: t.tier_name, amount: t.amount_cents })),
                  ].map(tier => (
                    <div key={tier.label} style={{ padding: '16px', border: '1px solid #E8E4DC', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', backgroundColor: 'white' }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '24px', fontWeight: 700, color: 'var(--color-navy)' }}>{tier.amount === 0 ? 'Free' : formatCents(tier.amount)}</div>
                      {tier.amount > 0 && <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>/year</div>}
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginTop: '6px' }}>{tier.label}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '16px', textAlign: 'center' }}>
                  Powered by ThriveAtHome
                </p>
              </div>
            </div>

            {/* Plan & Billing */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E8E4DC', marginTop: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '6px' }}>Plan &amp; Billing</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>ThriveAtHome partnership tiers for your organization. Contact us to upgrade.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {[
                  { tier: 'in_development', label: 'In-Development', price: '$49/mo', desc: 'Up to 50 members. All core features.', highlight: false },
                  { tier: 'growth', label: 'Growth', price: '$149/mo', desc: 'Up to 200 members. + Wellness data & Aria.', highlight: true },
                  { tier: 'scale', label: 'Scale', price: '$349/mo', desc: 'Unlimited members. Full AI outcomes data.', highlight: false },
                ].map(plan => (
                  <div key={plan.tier} style={{ padding: '20px', borderRadius: '10px', border: plan.highlight ? '2px solid var(--color-teal)' : '1px solid #E8E4DC', backgroundColor: plan.highlight ? '#F0F9F7' : 'white', position: 'relative' }}>
                    {plan.highlight && <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--color-teal)', color: 'white', padding: '2px 12px', borderRadius: '12px', fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>Most popular</div>}
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '22px', fontWeight: 700, color: 'var(--color-navy)' }}>{plan.price}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, color: 'var(--color-teal)', marginBottom: '8px' }}>{plan.label}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{plan.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: '#F9F6F0', borderRadius: '8px', border: '1px solid #E8E4DC' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                  🆓 30-day free trial available for all plans. Data migration from Helpful Village or other platforms: <strong>$1,500 one-time</strong>.
                  Contact <a href="mailto:partners@thriveathome.com" style={{ color: 'var(--color-teal)' }}>partners@thriveathome.com</a> to get started.
                </p>
              </div>
            </div>

            {/* Connect to Helpful Village */}
            <HvIntegrationSection orgId={org.id} />
          </div>
        )}

        {/* ── DONATIONS TAB ── */}
        {activeTab === 'donations' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '4px' }}>Donations</h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>Record and track donations to your organization.</p>
              </div>
              <button
                onClick={() => { loadDonations(); setShowDonationForm(v => !v) }}
                style={{ padding: '10px 20px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                + Record Donation
              </button>
            </div>

            {donationSuccess && <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#F0FFF4', borderRadius: '8px', border: '1px solid #22C55E40', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#15803D' }}>{donationSuccess}</div>}

            {showDonationForm && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E8E4DC', marginBottom: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '20px' }}>Record a Donation</h3>
                {donationError && <p style={{ color: '#D62828', fontFamily: 'var(--font-body)', fontSize: '14px', marginBottom: '12px' }}>{donationError}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Donor Name *</label>
                    <input value={donationForm.donor_name} onChange={e => setDonationForm(f => ({ ...f, donor_name: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} placeholder="Full name" />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Donor Email</label>
                    <input type="email" value={donationForm.donor_email} onChange={e => setDonationForm(f => ({ ...f, donor_email: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} placeholder="donor@example.com" />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Amount *</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 600, color: 'var(--color-navy)' }}>$</span>
                      <input type="number" min="0" step="0.01" value={donationForm.amount} onChange={e => setDonationForm(f => ({ ...f, amount: e.target.value }))} style={{ flex: 1, padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Donation Date *</label>
                    <input type="date" value={donationForm.donation_date} onChange={e => setDonationForm(f => ({ ...f, donation_date: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Payment Method</label>
                    <select value={donationForm.payment_method} onChange={e => setDonationForm(f => ({ ...f, payment_method: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }}>
                      {[['cash','Cash'],['check','Check'],['card','Credit/Debit Card'],['online','Online Transfer'],['in_kind','In-Kind']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Notes</label>
                    <input value={donationForm.notes} onChange={e => setDonationForm(f => ({ ...f, notes: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} placeholder="e.g. In honor of Margaret W." />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <input type="checkbox" id="anon" checked={donationForm.is_anonymous} onChange={e => setDonationForm(f => ({ ...f, is_anonymous: e.target.checked }))} />
                  <label htmlFor="anon" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-navy)' }}>Anonymous donation</label>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleAddDonation} disabled={donationSaving} style={{ padding: '10px 24px', backgroundColor: donationSaving ? '#9CA3AF' : 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: donationSaving ? 'default' : 'pointer' }}>
                    {donationSaving ? 'Saving…' : 'Record Donation'}
                  </button>
                  <button onClick={() => setShowDonationForm(false)} style={{ padding: '10px 24px', backgroundColor: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Load donations button if not yet loaded */}
            {!donationsLoaded && !showDonationForm && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <button onClick={loadDonations} style={{ padding: '12px 28px', backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  Load Donation History
                </button>
              </div>
            )}

            {donationsLoaded && (
              <div>
                <div style={{ marginBottom: '16px', padding: '16px 20px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #E8E4DC', display: 'flex', alignItems: 'center', gap: '32px' }}>
                  <div><div style={{ fontFamily: 'var(--font-body)', fontSize: '24px', fontWeight: 700, color: 'var(--color-navy)' }}>{donations.length}</div><div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>Total Donations</div></div>
                  <div><div style={{ fontFamily: 'var(--font-body)', fontSize: '24px', fontWeight: 700, color: 'var(--color-teal)' }}>{formatCents(donations.reduce((s, d) => s + d.amount_cents, 0))}</div><div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>Total Raised</div></div>
                  <div style={{ marginLeft: 'auto' }}>
                    <a href="/api/org-admin/donations/export" download style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: '#F5F3EE', borderRadius: '8px', border: '1px solid #E8E4DC', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', textDecoration: 'none' }}>
                      Export donor list (CSV)
                    </a>
                  </div>
                </div>
                {donations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', fontSize: '16px' }}>
                    No donations recorded yet. Click &ldquo;+ Record Donation&rdquo; to add one.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {donations.map(d => (
                      <div key={d.id} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E8E4DC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                        <div>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, color: 'var(--color-navy)' }}>{d.is_anonymous ? 'Anonymous' : d.donor_name}</span>
                          {d.donor_email && !d.is_anonymous && <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>· {d.donor_email}</span>}
                          {d.notes && <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>{d.notes}</p>}
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                            {new Date(d.donation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} · {d.payment_method.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '20px', fontWeight: 700, color: 'var(--color-teal)', whiteSpace: 'nowrap' }}>{formatCents(d.amount_cents)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── EMAIL MEMBERS TAB ── */}
        {activeTab === 'email' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>Email Members</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              Compose and send a message to your members, volunteers, or donors. Templates help you get started quickly.
            </p>

            {/* Templates panel */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px 24px', border: '1px solid #E8E4DC', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>📋 Email Templates</h3>
                {!templatesLoaded && (
                  <button onClick={loadTemplates} style={{ padding: '6px 14px', backgroundColor: 'transparent', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-navy)', cursor: 'pointer' }}>
                    Load templates
                  </button>
                )}
              </div>
              {templatesLoaded && (
                <>
                  {templates.length === 0 ? (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>No templates yet. Compose an email and save it as a template.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {templates.map(t => (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: t.org_id ? '#F0F9F7' : '#F9F6F0', borderRadius: '8px', border: `1px solid ${t.org_id ? '#2A9D8F30' : '#E8E4DC'}` }}>
                          <button
                            onClick={() => applyTemplate(t)}
                            style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-navy)', fontWeight: t.org_id ? 600 : 400, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            {t.is_factory ? '📄' : '⭐'} {t.name}
                          </button>
                          {!t.is_factory && (
                            <button onClick={() => handleDeleteTemplate(t.id)} style={{ color: '#D62828', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '0 2px' }} title="Delete template">✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {emailResult && <div style={{ marginBottom: '20px', padding: '12px 16px', backgroundColor: '#F0FFF4', borderRadius: '8px', border: '1px solid #22C55E40', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#15803D' }}>{emailResult}</div>}
            {emailError && <div style={{ marginBottom: '20px', padding: '12px 16px', backgroundColor: '#FFF5F5', borderRadius: '8px', border: '1px solid #D6282840', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#D62828' }}>{emailError}</div>}

            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E8E4DC', marginBottom: '32px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '20px' }}>Compose Email</h3>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Send To *</label>
                <select
                  value={emailForm.recipient_group}
                  onChange={e => setEmailForm(f => ({ ...f, recipient_group: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box', backgroundColor: 'white' }}
                >
                  <option value="all">All active members</option>
                  <option value="dues_due">Members with dues due (unpaid this year)</option>
                  <option value="volunteers">All active volunteers</option>
                  <option value="donors">All donors (non-anonymous)</option>
                  {programs.map(p => (
                    <option key={p.id} value={`program_${p.id}`}>Program: {p.program_name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Subject *</label>
                <input
                  value={emailForm.subject}
                  onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }}
                  placeholder="e.g. Village Newsletter — June 2026"
                  maxLength={200}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Message *</label>
                <textarea
                  value={emailForm.message}
                  onChange={e => setEmailForm(f => ({ ...f, message: e.target.value }))}
                  rows={10}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                  placeholder="Write your message to members here…"
                  maxLength={5000}
                />
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  {emailForm.message.length}/5000 characters
                </p>
              </div>
              <div style={{ padding: '12px 16px', backgroundColor: '#FFF9F0', borderRadius: '8px', border: '1px solid #F59E0B30', marginBottom: '20px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#92400E', margin: 0 }}>
                  Review your recipient selection and message before sending. This action cannot be undone.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleSendEmail}
                  disabled={emailSending}
                  style={{ padding: '12px 28px', backgroundColor: emailSending ? '#9CA3AF' : 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, cursor: emailSending ? 'default' : 'pointer' }}
                >
                  {emailSending ? 'Sending…' : 'Send Email'}
                </button>
                <button
                  onClick={() => { setShowSaveTemplate(!showSaveTemplate); loadTemplates() }}
                  style={{ padding: '12px 20px', backgroundColor: 'white', color: 'var(--color-navy)', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer' }}
                >
                  💾 Save as template
                </button>
              </div>
              {showSaveTemplate && (
                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#F9F6F0', borderRadius: '8px', border: '1px solid #E8E4DC', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    placeholder="Template name (e.g. Monthly Newsletter)"
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #D1C9BC', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '14px' }}
                  />
                  <button onClick={handleSaveTemplate} disabled={savingTemplate || !templateName.trim()} style={{ padding: '8px 18px', backgroundColor: savingTemplate ? '#9CA3AF' : 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer' }}>
                    {savingTemplate ? 'Saving…' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {/* Individual member email modal */}
            {memberEmailTarget && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', maxWidth: '520px', width: '100%' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '20px' }}>
                    ✉️ Email to {memberEmailTarget.name}
                  </h3>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Subject</label>
                    <input value={memberEmailSubject} onChange={e => setMemberEmailSubject(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Message</label>
                    <textarea value={memberEmailBody} onChange={e => setMemberEmailBody(e.target.value)} rows={6} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={handleSendMemberEmail} disabled={memberEmailSending} style={{ padding: '10px 24px', backgroundColor: memberEmailSending ? '#9CA3AF' : 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
                      {memberEmailSending ? 'Sending…' : 'Send'}
                    </button>
                    <button onClick={() => setMemberEmailTarget(null)} style={{ padding: '10px 24px', backgroundColor: 'white', color: 'var(--color-navy)', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {/* Sent email history */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E8E4DC' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>Sent History</h3>
                {!sentEmailsLoaded && (
                  <button
                    onClick={loadSentEmails}
                    style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #D1C9BC', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-navy)', cursor: 'pointer' }}
                  >
                    Load history
                  </button>
                )}
              </div>
              {!sentEmailsLoaded ? (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>Click &quot;Load history&quot; to view previously sent emails.</p>
              ) : sentEmails.length === 0 ? (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>No emails sent yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {sentEmails.map(e => (
                    <div key={e.id} style={{ padding: '16px', backgroundColor: '#FAFAF5', borderRadius: '8px', border: '1px solid #E8E4DC' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>{e.subject}</div>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            Sent to {e.recipient_count} member{e.recipient_count !== 1 ? 's' : ''}
                            {e.recipient_group !== 'all' && ` · ${e.recipient_group.startsWith('program_') ? `Program group` : e.recipient_group === 'dues_due' ? 'Dues due' : e.recipient_group}`}
                            {e.sent_by_name && ` · by ${e.sent_by_name}`}
                          </div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                          {new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── DOCUMENTS TAB ── */}
        {activeTab === 'documents' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '4px' }}>Document Library</h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>Store and share policies, forms, newsletters, and more with your members.</p>
              </div>
              {!docsLoaded && (
                <button onClick={() => { setActiveTab('documents'); loadDocs() }}
                  style={{ padding: '10px 18px', backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer' }}>
                  Load documents
                </button>
              )}
            </div>

            {/* Upload form */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E8E4DC', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>Upload a document</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <input
                  value={docForm.title} onChange={e => setDocForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Document title (required)"
                  style={{ padding: '10px 14px', border: '1px solid #DDD', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', gridColumn: '1 / -1' }}
                />
                <input
                  value={docForm.description} onChange={e => setDocForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description (optional)"
                  style={{ padding: '10px 14px', border: '1px solid #DDD', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', gridColumn: '1 / -1' }}
                />
                <select value={docForm.category} onChange={e => setDocForm(f => ({ ...f, category: e.target.value }))}
                  style={{ padding: '10px 14px', border: '1px solid #DDD', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', backgroundColor: 'white' }}>
                  <option value="general">📄 General</option>
                  <option value="policy">📋 Policy</option>
                  <option value="form">📝 Form</option>
                  <option value="newsletter">📰 Newsletter</option>
                  <option value="care_plan">🩺 Care Plan</option>
                </select>
                <select value={docForm.visibility} onChange={e => setDocForm(f => ({ ...f, visibility: e.target.value }))}
                  style={{ padding: '10px 14px', border: '1px solid #DDD', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', backgroundColor: 'white' }}>
                  <option value="admins_only">🔒 Admins only</option>
                  <option value="members">👥 All members</option>
                  <option value="care_team">🩺 Care team only</option>
                </select>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <input type="file" accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg"
                  onChange={e => setDocFile(e.target.files?.[0] ?? null)}
                  style={{ fontFamily: 'var(--font-body)', fontSize: '14px' }}
                />
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>PDF, Word, Excel, or image — max 20 MB</p>
              </div>
              {docError && <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#D62828', marginBottom: '10px' }}>{docError}</p>}
              {docSuccess && <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-teal)', marginBottom: '10px' }}>{docSuccess}</p>}
              <button onClick={handleDocUpload} disabled={docUploading}
                style={{ padding: '10px 20px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: docUploading ? 'not-allowed' : 'pointer', opacity: docUploading ? 0.7 : 1 }}>
                {docUploading ? 'Uploading…' : '⬆️ Upload Document'}
              </button>
            </div>

            {/* Document list */}
            {!docsLoaded ? (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>Click &quot;Load documents&quot; to view your library.</p>
            ) : docs.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>No documents uploaded yet. Use the form above to add your first document.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {docs.map(doc => (
                  <div key={doc.id} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E8E4DC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</span>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: doc.visibility === 'members' ? '#E8F5E9' : '#F0F0F0', color: doc.visibility === 'members' ? '#2E7D32' : '#666', flexShrink: 0 }}>
                          {doc.visibility === 'members' ? '👥 Members' : doc.visibility === 'care_team' ? '🩺 Care team' : '🔒 Admins'}
                        </span>
                      </div>
                      {doc.description && <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{doc.description}</p>}
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#999' }}>
                        {doc.file_name} {doc.file_size_bytes ? `· ${formatBytes(doc.file_size_bytes)}` : ''} · Uploaded by {doc.uploaded_by_name ?? 'Admin'} · {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button onClick={() => handleDocDownload(doc.id, doc.file_name)}
                        style={{ padding: '8px 14px', backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}>
                        ⬇️ Download
                      </button>
                      <button onClick={() => handleDocDelete(doc.id)}
                        style={{ padding: '8px 14px', backgroundColor: 'white', color: '#D62828', border: '1px solid #D62828', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}

// Need card sub-component
function NeedCard({ need, onUpdateStatus, isUpdating }: {
  need: MemberNeedRow
  onUpdateStatus: (id: string, status: string, notes?: string) => void
  isUpdating: boolean
}) {
  const [showFulfillForm, setShowFulfillForm] = useState(false)
  const [fulfillNotes, setFulfillNotes] = useState('')

  const needTypeLabel = NEED_TYPES.find(t => t.value === need.need_type)?.label ?? need.need_type
  const urgencyColor = URGENCY_COLORS[need.urgency] ?? '#4A4A4A'
  const isOpen = need.status === 'open'
  const isClaimed = need.status === 'claimed'

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '16px 20px', border: `1px solid ${isOpen ? '#D6282830' : '#E8E4DC'}`, borderLeft: `4px solid ${urgencyColor}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, color: 'var(--color-navy)' }}>{need.title}</span>
            <span style={{ padding: '2px 8px', backgroundColor: '#F9F6F0', borderRadius: '12px', fontSize: '11px', fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>{needTypeLabel}</span>
            {need.urgency === 'urgent' && <span style={{ padding: '2px 8px', backgroundColor: '#FFF5F5', borderRadius: '12px', fontSize: '11px', fontFamily: 'var(--font-body)', color: '#D62828', fontWeight: 700 }}>URGENT</span>}
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '8px', lineHeight: 1.5 }}>{need.description}</p>
          {need.member && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              👤 {need.member.preferred_name} ({need.member.full_name}) · {need.member.phone_number}
            </p>
          )}
          {need.preferred_date && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              📅 Preferred: {need.preferred_date}{need.preferred_time ? ` at ${need.preferred_time}` : ''}
            </p>
          )}
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
            {NEED_STATUS_LABELS[need.status] ?? need.status} · Posted {new Date(need.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {need.claimed_at ? ` · Claimed ${new Date(need.claimed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
            {need.fulfilled_at ? ` · Fulfilled ${new Date(need.fulfilled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
          </p>
          {need.fulfillment_notes && <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#15803D', marginTop: '6px', fontStyle: 'italic' }}>✅ {need.fulfillment_notes}</p>}
        </div>

        {/* Action buttons */}
        {!isUpdating && (isOpen || isClaimed) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
            {isOpen && (
              <button onClick={() => onUpdateStatus(need.id, 'claimed')} style={{ padding: '8px 16px', backgroundColor: '#F59E0B', color: 'white', border: 'none', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Claim
              </button>
            )}
            {isClaimed && !showFulfillForm && (
              <button onClick={() => setShowFulfillForm(true)} style={{ padding: '8px 16px', backgroundColor: '#22C55E', color: 'white', border: 'none', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Mark Fulfilled
              </button>
            )}
            {(isOpen || isClaimed) && (
              <button onClick={() => onUpdateStatus(need.id, 'cancelled')} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#D62828', border: '1px solid #D6282840', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '12px', cursor: 'pointer' }}>
                Cancel
              </button>
            )}
          </div>
        )}
        {isUpdating && <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>Updating…</div>}
      </div>

      {showFulfillForm && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E8E4DC' }}>
          <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>How was this need fulfilled? (optional)</label>
          <textarea value={fulfillNotes} onChange={e => setFulfillNotes(e.target.value)} rows={2} style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1C9BC', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }} placeholder="e.g. James R. gave a ride to the medical appointment." />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button onClick={() => { onUpdateStatus(need.id, 'fulfilled', fulfillNotes); setShowFulfillForm(false) }} style={{ padding: '8px 16px', backgroundColor: '#22C55E', color: 'white', border: 'none', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Confirm Fulfilled
            </button>
            <button onClick={() => setShowFulfillForm(false)} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid #D1C9BC', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
