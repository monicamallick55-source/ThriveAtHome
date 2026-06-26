'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Member } from '@/lib/data/members'
import type { ServiceBooking } from '@/lib/data/services'
import type { TrackedItem } from '@/lib/data/tracked-items-types'

// ── Constants ──────────────────────────────────────────────────────────────

const SERVICE_ICONS: Record<string, string> = {
  transport: '🚗', meals: '🍽️', telehealth: '💊', companion: '🤝',
  companionship: '🤝', tech_help: '💻', legal_financial: '⚖️',
  home_service: '🔧', travel_assistance: '✈️', roadside: '🚗🔧',
}

const TOPIC_OPTIONS = [
  'Music', 'Gardening', 'Family', 'Travel', 'Cooking', 'Reading',
  'Sports', 'Movies', 'Faith', 'Art & Crafts', 'History', 'Nature',
]

const LANGUAGE_OPTIONS = [
  { value: 'english', label: 'English' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'mandarin', label: 'Mandarin' },
  { value: 'cantonese', label: 'Cantonese' },
  { value: 'tagalog', label: 'Tagalog' },
  { value: 'vietnamese', label: 'Vietnamese' },
  { value: 'korean', label: 'Korean' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'polish', label: 'Polish' },
]

const CALL_TIME_OPTIONS = [
  { value: 'morning', label: 'Morning (8–11 am)' },
  { value: 'midday', label: 'Midday (11 am–1 pm)' },
  { value: 'afternoon', label: 'Afternoon (1–4 pm)' },
  { value: 'early_evening', label: 'Early evening (4–6 pm)' },
  { value: 'flexible', label: 'Flexible / any time' },
]

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', desc: 'Aria calls every day (recommended for most members)' },
  { value: 'every_other_day', label: 'Every other day', desc: 'Aria calls every two days' },
  { value: 'weekly', label: 'Once a week', desc: 'One call per week' },
]

const ITEM_TYPE_ICONS: Record<string, string> = {
  prescription: '💊', home_insurance: '🏠', car_insurance: '🚗',
  health_insurance: '🏥', drivers_license: '🪪', car_registration: '📋',
  aaa_membership: '🛣️', passport: '✈️', gym_membership: '🏋️',
  appointment: '📅', other: '➕',
}

const NEED_TYPES = [
  { value: 'transport', label: '🚗 Transport' },
  { value: 'meals', label: '🍽️ Meals' },
  { value: 'companionship', label: '🤝 Companionship' },
  { value: 'tech_help', label: '💻 Tech Help' },
  { value: 'home_maintenance', label: '🔧 Home Maintenance' },
  { value: 'medical', label: '🩺 Medical' },
  { value: 'other', label: '❓ Other' },
]

type Tab = 'profile' | 'services' | 'community' | 'dates' | 'buddy' | 'life-story' | 'billing' | 'org' | 'notifications' | 'documents'

// ── Interfaces ──────────────────────────────────────────────────────────────

interface CircleData {
  id: string; circle_name: string; primary_language: string
  description: string; member_count: number
}
interface CircleEventData {
  id: string; circle_id: string; title: string; event_date: string
  event_time: string | null; format: string
  dial_in_number: string | null; dial_in_code: string | null
}
interface LifeStoryEntry {
  id: string; created_at: string; title: string; content: string
  era: string | null; entry_type: string; is_private: boolean
}
interface OrgMembershipData {
  membership: { id: string; tier: string; amount_cents: number | null; payment_date: string | null }
  org: { id: string; name: string; description: string | null; dues_description: string | null }
  programs: Array<{ id: string; name: string; program_type: string; description: string | null; schedule_description: string | null; contact_person: string | null }>
}
type PortalDoc = {
  id: string; created_at: string; title: string; description: string | null
  file_name: string; file_type: string; file_size_bytes: number | null
  category: string; scope: string; uploaded_by_name: string | null
}

interface Props {
  member: Member
  upcomingServices: ServiceBooking[]
  trackedItems: TrackedItem[]
}

// ── Component ───────────────────────────────────────────────────────────────

export default function MemberPortalClient({ member, upcomingServices, trackedItems }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [toast, setToast] = useState<string | null>(null)

  // Profile edit
  const [editingPrefs, setEditingPrefs] = useState(false)
  const [callTime, setCallTime] = useState(member.preferred_call_time ?? '')
  const [topics, setTopics] = useState<string[]>(member.topics_enjoy ?? [])
  const [language, setLanguage] = useState(member.preferred_language ?? 'english')
  const [phone, setPhone] = useState(member.phone_number ?? '')
  const [savingPrefs, setSavingPrefs] = useState(false)

  // Community
  const [circles, setCircles] = useState<CircleData[]>([])
  const [circleEvents, setCircleEvents] = useState<CircleEventData[]>([])
  const [circlesLoaded, setCirclesLoaded] = useState(false)
  const [showNeedForm, setShowNeedForm] = useState(false)
  const [needForm, setNeedForm] = useState({ need_type: 'other', title: '', description: '', preferred_date: '' })
  const [submittingNeed, setSubmittingNeed] = useState(false)
  const [needSuccess, setNeedSuccess] = useState(false)

  // Services
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [serviceType, setServiceType] = useState('transport')
  const [serviceDesc, setServiceDesc] = useState('')
  const [serviceDate, setServiceDate] = useState('')
  const [serviceAddress, setServiceAddress] = useState('')
  const [submittingService, setSubmittingService] = useState(false)

  // Important Dates
  const [localItems, setLocalItems] = useState<TrackedItem[]>(trackedItems)
  const [showDateForm, setShowDateForm] = useState(false)
  const [dateForm, setDateForm] = useState({ item_type: 'appointment', item_name: '', expiration_or_appointment_date: '', category: 'appointment', reminder_lead_days: 1, notes: '' })
  const [submittingDate, setSubmittingDate] = useState(false)
  const [actioningItem, setActioningItem] = useState<string | null>(null)

  // Life Story
  const [lifeEntries, setLifeEntries] = useState<LifeStoryEntry[]>([])
  const [lifeLoaded, setLifeLoaded] = useState(false)
  const [showLifeForm, setShowLifeForm] = useState(false)
  const [lifeForm, setLifeForm] = useState({ title: '', content: '', era: '', entry_type: 'memory' })
  const [submittingLife, setSubmittingLife] = useState(false)

  // Org membership
  const [orgData, setOrgData] = useState<OrgMembershipData | null>(null)
  const [orgLoaded, setOrgLoaded] = useState(false)

  // Notifications
  const [callFreq, setCallFreq] = useState<'daily' | 'every_other_day' | 'weekly'>(member.check_in_frequency ?? 'daily')
  const [savingFreq, setSavingFreq] = useState(false)

  // Documents
  const [portalDocs, setPortalDocs] = useState<PortalDoc[]>([])
  const [portalDocsLoaded, setPortalDocsLoaded] = useState(false)
  const [docUploading, setDocUploading] = useState(false)
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docTitle, setDocTitle] = useState('')
  const [docError, setDocError] = useState('')
  const [docSuccess, setDocSuccess] = useState('')

  const today = new Date()
  const age = member.date_of_birth
    ? Math.floor((today.getTime() - new Date(member.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4500)
  }

  function switchTab(t: Tab) {
    setActiveTab(t)
  }

  // Load circles when community tab opens
  const loadCircles = useCallback(async () => {
    if (circlesLoaded) return
    const res = await fetch('/api/member/circles')
    const json = await res.json().catch(() => ({ circles: [], events: [] }))
    setCircles(json.circles ?? [])
    setCircleEvents(json.events ?? [])
    setCirclesLoaded(true)
  }, [circlesLoaded])

  useEffect(() => {
    if (activeTab === 'community') loadCircles()
  }, [activeTab, loadCircles])

  // Load life story when tab opens
  const loadLifeStory = useCallback(async () => {
    if (lifeLoaded) return
    const res = await fetch('/api/life-story')
    const json = await res.json().catch(() => ({ data: [] }))
    setLifeEntries(json.data ?? [])
    setLifeLoaded(true)
  }, [lifeLoaded])

  useEffect(() => {
    if (activeTab === 'life-story') loadLifeStory()
  }, [activeTab, loadLifeStory])

  // Load org membership when tab opens
  const loadOrg = useCallback(async () => {
    if (orgLoaded) return
    const res = await fetch('/api/member/org-membership')
    const json = await res.json().catch(() => ({ data: null }))
    setOrgData(json.data ?? null)
    setOrgLoaded(true)
  }, [orgLoaded])

  useEffect(() => {
    if (activeTab === 'org') loadOrg()
  }, [activeTab, loadOrg])

  // Load documents when tab opens
  const loadDocs = useCallback(async () => {
    if (portalDocsLoaded) return
    const res = await fetch('/api/member/documents')
    const json = await res.json().catch(() => ({ data: [] }))
    setPortalDocs(json.data ?? [])
    setPortalDocsLoaded(true)
  }, [portalDocsLoaded])

  useEffect(() => {
    if (activeTab === 'documents') loadDocs()
  }, [activeTab, loadDocs])

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleSavePrefs() {
    setSavingPrefs(true)
    const res = await fetch('/api/member/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferred_call_time: callTime, topics_enjoy: topics, preferred_language: language, phone_number: phone }),
    })
    setSavingPrefs(false)
    if (res.ok) { setEditingPrefs(false); showToast('Preferences saved.') }
    else showToast('Could not save — please try again.')
  }

  function toggleTopic(t: string) {
    setTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  async function handlePostNeed(e: React.FormEvent) {
    e.preventDefault()
    if (!needForm.title || !needForm.description) return
    setSubmittingNeed(true)
    const res = await fetch('/api/member/post-need', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(needForm),
    })
    setSubmittingNeed(false)
    if (res.ok) { setNeedSuccess(true); setShowNeedForm(false); setNeedForm({ need_type: 'other', title: '', description: '', preferred_date: '' }); showToast('Need posted to your community org.') }
    else { const j = await res.json().catch(() => ({ error: 'Error' })); showToast(j.error ?? 'Failed to post need.') }
  }

  async function handleRequestService(e: React.FormEvent) {
    e.preventDefault()
    if (!serviceDate) { showToast('Please select a date and time.'); return }
    setSubmittingService(true)
    const bookingDetails: Record<string, string> = { description: serviceDesc }
    if (serviceAddress) bookingDetails.pickup_address = serviceAddress
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_type: serviceType, requested_for: serviceDate, booking_details: bookingDetails, notes: serviceDesc }),
    })
    setSubmittingService(false)
    if (res.ok) {
      showToast('Service request submitted. Your navigator will follow up shortly.')
      setShowServiceForm(false); setServiceDesc(''); setServiceDate(''); setServiceAddress('')
    } else {
      const j = await res.json().catch(() => ({ error: 'Error' }))
      showToast(j.error ?? 'Could not submit request. Please try again.')
    }
  }

  async function handleAddDate(e: React.FormEvent) {
    e.preventDefault()
    if (!dateForm.item_name || !dateForm.expiration_or_appointment_date) return
    setSubmittingDate(true)
    const res = await fetch('/api/tracked-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dateForm),
    })
    setSubmittingDate(false)
    if (res.ok) {
      const j = await res.json().catch(() => ({ data: null }))
      if (j.data) setLocalItems(prev => [...prev, j.data])
      setShowDateForm(false)
      setDateForm({ item_type: 'appointment', item_name: '', expiration_or_appointment_date: '', category: 'appointment', reminder_lead_days: 1, notes: '' })
      showToast('Date added.')
    } else showToast('Could not add date. Please try again.')
  }

  async function handleItemAction(itemId: string, action: string) {
    setActioningItem(itemId)
    await fetch(`/api/tracked-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setActioningItem(null)
    setLocalItems(prev => {
      if (action === 'snooze') return prev.map(i => i.id === itemId ? { ...i, status: 'snoozed' } : i)
      if (action === 'complete') return prev.map(i => i.id === itemId ? { ...i, status: i.is_recurring ? 'active' : 'completed' } : i)
      if (action === 'cancel') return prev.map(i => i.id === itemId ? { ...i, status: 'cancelled' } : i)
      return prev
    })
    showToast('Updated.')
  }

  async function handleAddLifeEntry(e: React.FormEvent) {
    e.preventDefault()
    if (!lifeForm.title || !lifeForm.content) return
    setSubmittingLife(true)
    const res = await fetch('/api/life-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lifeForm),
    })
    setSubmittingLife(false)
    if (res.ok) {
      const j = await res.json().catch(() => ({ data: null }))
      if (j.data) setLifeEntries(prev => [j.data, ...prev])
      setShowLifeForm(false); setLifeForm({ title: '', content: '', era: '', entry_type: 'memory' })
      showToast('Memory added to your life story.')
    } else showToast('Could not save memory. Please try again.')
  }

  async function handleSaveFreq() {
    setSavingFreq(true)
    const res = await fetch('/api/member/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ check_in_frequency: callFreq }),
    })
    setSavingFreq(false)
    if (res.ok) showToast('Call frequency updated.')
    else showToast('Could not update. Please try again.')
  }

  async function handleDocUpload() {
    if (!docFile || !docTitle.trim()) { setDocError('Title and file are required'); return }
    setDocUploading(true); setDocError(''); setDocSuccess('')
    try {
      const fd = new FormData()
      fd.append('file', docFile)
      fd.append('title', docTitle.trim())
      fd.append('scope', 'member')
      const res = await fetch('/api/navigator/documents', { method: 'POST', body: fd })
      const json = await res.json().catch(() => ({ error: 'Server error' }))
      if (!res.ok) { setDocError(json.error ?? 'Upload failed'); return }
      setPortalDocs(prev => [json.data, ...prev])
      setDocTitle(''); setDocFile(null)
      setDocSuccess('Document uploaded.')
      setTimeout(() => setDocSuccess(''), 4000)
    } catch {
      setDocError('Upload failed — network error. Please try again.')
    } finally {
      setDocUploading(false)
    }
  }

  async function handlePortalDocDownload(docId: string, fileName: string) {
    const res = await fetch(`/api/member/documents/${docId}`)
    const json = await res.json().catch(() => ({}))
    if (!json.url) { alert('Download failed.'); return }
    const a = document.createElement('a'); a.href = json.url; a.download = fileName; a.target = '_blank'; a.click()
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  const upcoming = upcomingServices.filter(s => s.status === 'confirmed' || s.status === 'requested').slice(0, 6)
  const upcomingDates = localItems
    .filter(t => t.status === 'active')
    .sort((a, b) => new Date(a.expiration_or_appointment_date).getTime() - new Date(b.expiration_or_appointment_date).getTime())
    .slice(0, 12)

  const planTierLabel = member.plan_tier.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const hasBuddy = (member.plan_tier === 'connect' || member.plan_tier === 'complete' || member.plan_tier === 'premier')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'My Profile' },
    { id: 'services', label: 'Services' },
    { id: 'community', label: 'Community' },
    { id: 'dates', label: 'Important Dates' },
    { id: 'buddy', label: 'My Buddy' },
    { id: 'life-story', label: 'Life Story' },
    { id: 'billing', label: 'My Plan' },
    { id: 'org', label: 'My Org' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'documents', label: '📎 Documents' },
  ]

  // ── Styles ────────────────────────────────────────────────────────────────

  const card: React.CSSProperties = {
    backgroundColor: 'white', borderRadius: '16px', padding: '28px',
    border: '1px solid #E8E4DC', marginBottom: '24px',
  }
  const labelSty: React.CSSProperties = {
    display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px',
    color: 'var(--color-text-secondary)', marginBottom: '4px',
  }
  const inputSty: React.CSSProperties = {
    width: '100%', height: '48px', padding: '0 14px',
    border: '1.5px solid #DDD8CE', borderRadius: '10px',
    fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-navy)',
    backgroundColor: 'white', boxSizing: 'border-box',
  }
  const btnPrimary: React.CSSProperties = {
    height: '48px', padding: '0 28px', backgroundColor: 'var(--color-teal)',
    color: 'white', border: 'none', borderRadius: '10px',
    fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, cursor: 'pointer',
  }
  const btnSecondary: React.CSSProperties = {
    height: '48px', padding: '0 24px', backgroundColor: 'white',
    color: 'var(--color-text-secondary)', border: '1.5px solid #DDD8CE',
    borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '16px', cursor: 'pointer',
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      {toast && (
        <div role="alert" style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 200, padding: '14px 20px', backgroundColor: 'var(--color-navy)', color: 'white', borderRadius: '12px', fontFamily: 'var(--font-body)', fontSize: '15px', boxShadow: '0 4px 24px rgba(0,0,0,0.18)', maxWidth: '360px' }}>
          {toast}
        </div>
      )}

      {/* Nav */}
      <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>ThriveAtHome</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{member.preferred_name}</span>
          <a href="/api/auth/signout" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontFamily: 'var(--font-body)', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)', padding: '6px 14px', borderRadius: '8px' }}>Sign out</a>
        </div>
      </nav>

      {/* Header + tabs */}
      <header style={{ backgroundColor: 'var(--color-navy)', paddingBottom: '0' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 24px 0' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '34px', color: 'var(--color-cream)', fontWeight: 500, marginBottom: '4px' }}>
            Hello, {member.preferred_name} 👋
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(250,250,245,0.65)', marginBottom: '20px' }}>
            Your ThriveAtHome portal · {planTierLabel} plan
          </p>
          <div style={{ display: 'flex', gap: '0', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                style={{
                  height: '42px', padding: '0 16px', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: activeTab === tab.id ? 700 : 400,
                  backgroundColor: activeTab === tab.id ? 'var(--color-cream)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--color-navy)' : 'rgba(250,250,245,0.7)',
                  borderRadius: '8px 8px 0 0', whiteSpace: 'nowrap',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '960px', margin: '0 auto', padding: '32px 24px', width: '100%' }}>

        {/* ─── MY PROFILE ──────────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div>
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>My Profile</h2>
                {!editingPrefs && (
                  <button onClick={() => setEditingPrefs(true)} style={{ padding: '8px 20px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                    Edit preferences
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: editingPrefs ? '24px' : '0' }}>
                {[
                  { label: 'Full name', value: member.full_name },
                  { label: 'Preferred name', value: member.preferred_name },
                  { label: 'Phone', value: member.phone_number },
                  { label: 'Age', value: age ? `${age} years old` : '—' },
                  { label: 'Language', value: member.preferred_language },
                  { label: 'Plan', value: planTierLabel },
                ].map(row => (
                  <div key={row.label}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{row.label}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-navy)', fontWeight: 500 }}>{row.value ?? '—'}</div>
                  </div>
                ))}
              </div>
              {!editingPrefs && member.topics_enjoy?.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Topics I enjoy</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {member.topics_enjoy.map(t => <span key={t} style={{ padding: '6px 14px', backgroundColor: '#F0F9F7', borderRadius: '20px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-teal)', border: '1px solid #2A9D8F20' }}>{t}</span>)}
                  </div>
                </div>
              )}
              {!editingPrefs && member.preferred_call_time && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Best time for calls</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-navy)' }}>📞 {CALL_TIME_OPTIONS.find(o => o.value === member.preferred_call_time)?.label ?? member.preferred_call_time}</div>
                </div>
              )}
            </div>

            {editingPrefs && (
              <div style={card}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '20px' }}>Edit My Preferences</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={labelSty}>Phone number</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)} style={inputSty} type="tel" placeholder="(555) 000-0000" />
                  </div>
                  <div>
                    <label style={labelSty}>Preferred language</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)} style={inputSty}>
                      {LANGUAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelSty}>Best time for Aria&apos;s morning catch-up calls</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {CALL_TIME_OPTIONS.map(o => (
                      <button key={o.value} type="button" onClick={() => setCallTime(o.value)} aria-pressed={callTime === o.value}
                        style={{ padding: '8px 16px', borderRadius: '20px', border: `1.5px solid ${callTime === o.value ? 'var(--color-teal)' : '#DDD8CE'}`, backgroundColor: callTime === o.value ? '#F0F9F7' : 'white', fontFamily: 'var(--font-body)', fontSize: '14px', color: callTime === o.value ? 'var(--color-teal)' : 'var(--color-navy)', cursor: 'pointer', fontWeight: callTime === o.value ? 600 : 400 }}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ ...labelSty, marginBottom: '10px' }}>Topics I enjoy</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {TOPIC_OPTIONS.map(t => (
                      <button key={t} type="button" onClick={() => toggleTopic(t)} aria-pressed={topics.includes(t)}
                        style={{ padding: '8px 16px', borderRadius: '20px', border: `1.5px solid ${topics.includes(t) ? 'var(--color-teal)' : '#DDD8CE'}`, backgroundColor: topics.includes(t) ? '#F0F9F7' : 'white', fontFamily: 'var(--font-body)', fontSize: '14px', color: topics.includes(t) ? 'var(--color-teal)' : 'var(--color-navy)', cursor: 'pointer', fontWeight: topics.includes(t) ? 600 : 400 }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleSavePrefs} disabled={savingPrefs} style={{ ...btnPrimary, opacity: savingPrefs ? 0.7 : 1 }}>{savingPrefs ? 'Saving…' : 'Save preferences'}</button>
                  <button onClick={() => setEditingPrefs(false)} style={btnSecondary}>Cancel</button>
                </div>
              </div>
            )}

            {member.emergency_contact_1_name && (
              <div style={card}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>Emergency Contacts</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>To update emergency contacts, please contact your navigator.</p>
                {[
                  { name: member.emergency_contact_1_name, rel: member.emergency_contact_1_rel, phone: member.emergency_contact_1_phone },
                  ...(member.emergency_contact_2_name ? [{ name: member.emergency_contact_2_name, rel: member.emergency_contact_2_rel, phone: member.emergency_contact_2_phone }] : []),
                ].map((c, i) => (
                  <div key={i} style={{ padding: '14px 18px', backgroundColor: '#F9F6F0', borderRadius: '10px', marginBottom: '10px' }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--color-navy)' }}>{c.name}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{c.rel} · {c.phone}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── SERVICES ────────────────────────────────────────────────────── */}
        {activeTab === 'services' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>My Services</h2>
              <button onClick={() => setShowServiceForm(f => !f)} style={{ padding: '10px 22px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
                {showServiceForm ? 'Cancel' : '+ Request a service'}
              </button>
            </div>

            {showServiceForm && (
              <div style={card}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>Request a Service</h3>
                <form onSubmit={handleRequestService} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={labelSty}>Type of service <span style={{ color: '#D62828' }}>*</span></label>
                    <select value={serviceType} onChange={e => setServiceType(e.target.value)} style={inputSty}>
                      <option value="transport">🚗 Transport — rides to appointments, errands</option>
                      <option value="meals">🍽️ Meals — meal delivery or grocery help</option>
                      <option value="home_service">🔧 Home Services — cleaning, maintenance</option>
                      <option value="telehealth">💊 Health — telehealth or medication help</option>
                      <option value="tech_help">💻 Tech Help — phone, computer support</option>
                      <option value="companionship">🤝 Companionship — phone or in-person visit</option>
                      <option value="legal_financial">⚖️ Legal / Financial guidance</option>
                      <option value="roadside">🚗🔧 Car Care &amp; Roadside</option>
                    </select>
                  </div>
                  {serviceType === 'transport' && (
                    <div>
                      <label style={labelSty}>Pickup address</label>
                      <input value={serviceAddress} onChange={e => setServiceAddress(e.target.value)} style={inputSty} placeholder="Your address or starting point" />
                    </div>
                  )}
                  <div>
                    <label style={labelSty}>Preferred date &amp; time <span style={{ color: '#D62828' }}>*</span></label>
                    <input type="datetime-local" value={serviceDate} onChange={e => setServiceDate(e.target.value)} style={inputSty} required />
                  </div>
                  <div>
                    <label style={labelSty}>Details (optional)</label>
                    <textarea value={serviceDesc} onChange={e => setServiceDesc(e.target.value)} rows={3} placeholder="Any additional details about what you need..." style={{ ...inputSty, height: 'auto', padding: '12px 14px', resize: 'vertical' }} />
                  </div>
                  <div style={{ backgroundColor: '#F0F9F7', borderRadius: '10px', padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-teal)' }}>
                    💚 Your navigator will review this request and follow up with you shortly.
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" disabled={submittingService} style={{ ...btnPrimary, opacity: submittingService ? 0.7 : 1 }}>{submittingService ? 'Submitting…' : 'Submit request'}</button>
                    <button type="button" onClick={() => setShowServiceForm(false)} style={btnSecondary}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {upcoming.length === 0 && !showServiceForm ? (
              <div style={{ ...card, textAlign: 'center', padding: '48px 24px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>No upcoming services scheduled.</p>
                <button onClick={() => setShowServiceForm(true)} style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-teal)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Request your first service →</button>
              </div>
            ) : (
              <>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>Upcoming Services</h3>
                {upcoming.map(s => (
                  <div key={s.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 24px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '28px' }}>{SERVICE_ICONS[s.service_type] ?? '📋'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--color-navy)' }}>
                        {s.service_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </div>
                      {s.requested_for && (
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          📅 {new Date(s.requested_for).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '4px 14px', backgroundColor: s.status === 'confirmed' ? '#F0FFF4' : '#FFF9F0', borderRadius: '20px', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: s.status === 'confirmed' ? '#15803D' : '#92400E' }}>
                      {s.status === 'confirmed' ? 'Confirmed' : 'Requested'}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ─── COMMUNITY ───────────────────────────────────────────────────── */}
        {activeTab === 'community' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '24px' }}>My Community</h2>

            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>My Communities</h3>
              </div>
              {!circlesLoaded ? (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>Loading…</p>
              ) : circles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>You haven&apos;t joined any communities yet.</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>Ask your navigator to help you find a cultural circle or interest group that&apos;s right for you.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
                  {circles.map(c => (
                    <div key={c.id} style={{ padding: '16px 20px', backgroundColor: '#F0F9F7', borderRadius: '12px', border: '1px solid #2A9D8F20' }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>{c.circle_name}</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{c.member_count} members</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {circleEvents.length > 0 && (
              <div style={card}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>Upcoming Events</h3>
                {circleEvents.slice(0, 5).map(ev => (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '14px 18px', backgroundColor: '#F9F6F0', borderRadius: '10px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '22px', flexShrink: 0 }}>📅</span>
                    <div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)' }}>{ev.title}</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        {ev.event_date}{ev.event_time ? ` at ${ev.event_time}` : ''} · {ev.format === 'phone_only' ? '📞 Phone' : ev.format === 'in_person' ? '📍 In person' : '📱 Video/Phone'}
                      </div>
                      {ev.dial_in_number && (
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-teal)', marginTop: '4px', fontWeight: 600 }}>
                          Call {ev.dial_in_number}{ev.dial_in_code ? ` · Code: ${ev.dial_in_code}` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={card}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>Post a Need</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>Let your community org know if you need help with something.</p>
              {needSuccess && <div style={{ padding: '12px 16px', backgroundColor: '#F0FFF4', border: '1px solid #86EFAC', borderRadius: '10px', marginBottom: '16px', fontFamily: 'var(--font-body)', fontSize: '15px', color: '#15803D' }}>✓ Your need has been posted.</div>}
              {!showNeedForm ? (
                <button onClick={() => { setShowNeedForm(true); setNeedSuccess(false) }} style={{ padding: '10px 24px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>+ Post a need</button>
              ) : (
                <form onSubmit={handlePostNeed} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={labelSty}>Type of help needed</label>
                    <select value={needForm.need_type} onChange={e => setNeedForm(f => ({ ...f, need_type: e.target.value }))} style={inputSty}>
                      {NEED_TYPES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelSty}>Title <span style={{ color: '#D62828' }}>*</span></label>
                    <input required value={needForm.title} onChange={e => setNeedForm(f => ({ ...f, title: e.target.value }))} style={inputSty} placeholder="e.g. Need a ride to doctor on Tuesday" />
                  </div>
                  <div>
                    <label style={labelSty}>Description <span style={{ color: '#D62828' }}>*</span></label>
                    <textarea required value={needForm.description} onChange={e => setNeedForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inputSty, height: 'auto', padding: '12px 14px', resize: 'vertical' }} />
                  </div>
                  <div>
                    <label style={labelSty}>Preferred date (optional)</label>
                    <input type="date" value={needForm.preferred_date} onChange={e => setNeedForm(f => ({ ...f, preferred_date: e.target.value }))} style={inputSty} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" disabled={submittingNeed} style={{ ...btnPrimary, opacity: submittingNeed ? 0.7 : 1 }}>{submittingNeed ? 'Posting…' : 'Post need'}</button>
                    <button type="button" onClick={() => setShowNeedForm(false)} style={btnSecondary}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ─── IMPORTANT DATES ─────────────────────────────────────────────── */}
        {activeTab === 'dates' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>Important Dates</h2>
              <button onClick={() => setShowDateForm(f => !f)} style={{ padding: '10px 22px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
                {showDateForm ? 'Cancel' : '+ Add important date'}
              </button>
            </div>

            {showDateForm && (
              <div style={card}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>Add an Important Date</h3>
                <form onSubmit={handleAddDate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={labelSty}>Category</label>
                      <select value={dateForm.category} onChange={e => setDateForm(f => ({ ...f, category: e.target.value, item_type: e.target.value === 'appointment' ? 'appointment' : 'other' }))} style={inputSty}>
                        <option value="appointment">📅 Appointment</option>
                        <option value="renewal">🔄 Renewal / Subscription</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelSty}>Type</label>
                      <select value={dateForm.item_type} onChange={e => setDateForm(f => ({ ...f, item_type: e.target.value }))} style={inputSty}>
                        {Object.entries(ITEM_TYPE_ICONS).map(([v, icon]) => (
                          <option key={v} value={v}>{icon} {v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={labelSty}>Name / Description <span style={{ color: '#D62828' }}>*</span></label>
                    <input required value={dateForm.item_name} onChange={e => setDateForm(f => ({ ...f, item_name: e.target.value }))} style={inputSty} placeholder="e.g. Dr. Smith annual checkup, Honda Civic registration" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={labelSty}>{dateForm.category === 'appointment' ? 'Appointment date' : 'Expiration / renewal date'} <span style={{ color: '#D62828' }}>*</span></label>
                      <input type="date" required value={dateForm.expiration_or_appointment_date} onChange={e => setDateForm(f => ({ ...f, expiration_or_appointment_date: e.target.value }))} style={inputSty} />
                    </div>
                    <div>
                      <label style={labelSty}>Remind me (days before)</label>
                      <input type="number" min={1} max={365} value={dateForm.reminder_lead_days} onChange={e => setDateForm(f => ({ ...f, reminder_lead_days: parseInt(e.target.value) || 1 }))} style={inputSty} />
                    </div>
                  </div>
                  <div>
                    <label style={labelSty}>Notes (optional)</label>
                    <input value={dateForm.notes} onChange={e => setDateForm(f => ({ ...f, notes: e.target.value }))} style={inputSty} placeholder="Phone number to call, website, or other notes" />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" disabled={submittingDate} style={{ ...btnPrimary, opacity: submittingDate ? 0.7 : 1 }}>{submittingDate ? 'Saving…' : 'Add date'}</button>
                    <button type="button" onClick={() => setShowDateForm(false)} style={btnSecondary}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {upcomingDates.length === 0 && !showDateForm ? (
              <div style={{ ...card, textAlign: 'center', padding: '48px 24px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>No upcoming dates tracked.</p>
                <button onClick={() => setShowDateForm(true)} style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-teal)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Add prescriptions, insurance renewals, appointments →</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {upcomingDates.map(item => {
                    const daysUntil = Math.ceil((new Date(item.expiration_or_appointment_date).getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
                    const urgencyColor = daysUntil <= 7 ? '#D62828' : daysUntil <= 30 ? '#D97706' : 'var(--color-teal)'
                    const icon = ITEM_TYPE_ICONS[item.item_type] ?? '📅'
                    return (
                      <div key={item.id} style={{ ...card, marginBottom: 0, padding: '18px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <span style={{ fontSize: '24px', flexShrink: 0 }}>{icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--color-navy)' }}>{item.item_name}</div>
                            <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                              {item.category === 'appointment' ? 'Appointment' : 'Renewal'} · {new Date(item.expiration_or_appointment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, color: urgencyColor, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {daysUntil <= 0 ? 'Today/Past' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                          <button onClick={() => handleItemAction(item.id, 'snooze')} disabled={actioningItem === item.id}
                            style={{ padding: '6px 14px', fontSize: '13px', border: '1px solid #DDD8CE', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                            Snooze 1 week
                          </button>
                          <button onClick={() => handleItemAction(item.id, 'complete')} disabled={actioningItem === item.id}
                            style={{ padding: '6px 14px', fontSize: '13px', border: '1px solid var(--color-teal)', borderRadius: '8px', backgroundColor: '#F0F9F7', color: 'var(--color-teal)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                            ✓ Done
                          </button>
                          {item.category === 'appointment' && (
                            <button onClick={() => handleItemAction(item.id, 'cancel')} disabled={actioningItem === item.id}
                              style={{ padding: '6px 14px', fontSize: '13px', border: '1px solid #DDD8CE', borderRadius: '8px', backgroundColor: 'white', color: '#D62828', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── MY BUDDY ────────────────────────────────────────────────────── */}
        {activeTab === 'buddy' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '24px' }}>My Buddy</h2>

            {!hasBuddy ? (
              <div style={card}>
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <span style={{ fontSize: '48px' }}>🤝</span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', marginTop: '16px', marginBottom: '12px' }}>Human Buddy is available on Connect plans and above</h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto 24px' }}>
                    A Human Buddy is a dedicated person who calls regularly, remembers what matters to you, and builds a real relationship — not just a check-in. Available on Connect ($39/mo), Complete ($69/mo), and Premier ($129/mo) plans.
                  </p>
                  <a href="/pricing" style={{ display: 'inline-block', padding: '12px 28px', backgroundColor: 'var(--color-teal)', color: 'white', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>
                    View plans &amp; upgrade →
                  </a>
                </div>
              </div>
            ) : (
              <>
                <div style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#F0F9F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>
                      🤝
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 4px' }}>
                        Your buddy is being matched
                      </h3>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0 }}>
                        We&apos;re finding the right match based on your interests, language, and availability. You&apos;ll hear from us soon.
                      </p>
                    </div>
                  </div>
                </div>

                <div style={card}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>What your Human Buddy will do</h3>
                  {[
                    { icon: '📞', title: 'Regular calls', desc: 'Your buddy calls you weekly (Connect/Complete) or every two weeks (Premier) — scheduled around your preference.' },
                    { icon: '💬', title: 'Remembers what matters', desc: 'Your buddy keeps notes on what you share so every call feels like catching up with someone who really knows you.' },
                    { icon: '🎂', title: 'Celebrates with you', desc: 'Birthdays, anniversaries, milestones — your buddy is the first to recognize them.' },
                    { icon: '🚨', title: 'Knows when to get help', desc: 'If your buddy hears something concerning, they notify your navigator promptly — so the right person can respond.' },
                  ].map(item => (
                    <div key={item.title} style={{ display: 'flex', gap: '16px', padding: '14px 0', borderBottom: '1px solid #F0EDE6' }}>
                      <span style={{ fontSize: '24px', flexShrink: 0 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>{item.title}</div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── LIFE STORY ──────────────────────────────────────────────────── */}
        {activeTab === 'life-story' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>Life Story</h2>
              <button onClick={() => setShowLifeForm(f => !f)} style={{ padding: '10px 22px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
                {showLifeForm ? 'Cancel' : '+ Add a memory'}
              </button>
            </div>

            {showLifeForm && (
              <div style={card}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>Add a Memory</h3>
                <form onSubmit={handleAddLifeEntry} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelSty}>Title <span style={{ color: '#D62828' }}>*</span></label>
                      <input required value={lifeForm.title} onChange={e => setLifeForm(f => ({ ...f, title: e.target.value }))} style={inputSty} placeholder="e.g. The summer we moved to California" />
                    </div>
                    <div>
                      <label style={labelSty}>Era / time period</label>
                      <select value={lifeForm.era} onChange={e => setLifeForm(f => ({ ...f, era: e.target.value }))} style={inputSty}>
                        <option value="">— Select an era —</option>
                        <option value="Childhood">Childhood</option>
                        <option value="Young adult">Young adult</option>
                        <option value="Career">Career</option>
                        <option value="Family">Family</option>
                        <option value="Later years">Later years</option>
                        <option value="Recent memories">Recent memories</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelSty}>Memory type</label>
                      <select value={lifeForm.entry_type} onChange={e => setLifeForm(f => ({ ...f, entry_type: e.target.value }))} style={inputSty}>
                        <option value="memory">Memory</option>
                        <option value="first_memory">Earliest memory ⭐</option>
                        <option value="family_story">Family story</option>
                        <option value="career">Career achievement</option>
                        <option value="travel">Travel adventure</option>
                        <option value="recipe_tradition">Recipe / tradition</option>
                        <option value="wisdom">Wisdom / advice</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={labelSty}>Your memory <span style={{ color: '#D62828' }}>*</span></label>
                    <textarea required value={lifeForm.content} onChange={e => setLifeForm(f => ({ ...f, content: e.target.value }))} rows={5} placeholder="Write your memory here — as much or as little as you&apos;d like…" style={{ ...inputSty, height: 'auto', padding: '12px 14px', resize: 'vertical', lineHeight: 1.7 }} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" disabled={submittingLife} style={{ ...btnPrimary, opacity: submittingLife ? 0.7 : 1 }}>{submittingLife ? 'Saving…' : 'Save memory'}</button>
                    <button type="button" onClick={() => setShowLifeForm(false)} style={btnSecondary}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {!lifeLoaded ? (
              <div style={{ ...card, textAlign: 'center', padding: '32px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)' }}>Loading your memories…</p>
              </div>
            ) : lifeEntries.length === 0 && !showLifeForm ? (
              <div style={{ ...card, textAlign: 'center', padding: '48px 24px' }}>
                <span style={{ fontSize: '48px' }}>📖</span>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', marginTop: '16px', marginBottom: '16px' }}>Your life story is waiting to be written.</p>
                <button onClick={() => setShowLifeForm(true)} style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-teal)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Add your first memory →</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {lifeEntries.map(entry => (
                  <div key={entry.id} style={card}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)' }}>{entry.title}</span>
                          {entry.entry_type === 'first_memory' && <span style={{ fontSize: '16px' }}>⭐</span>}
                        </div>
                        {entry.era && <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{entry.era}</div>}
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#999', flexShrink: 0 }}>{new Date(entry.created_at).toLocaleDateString()}</div>
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#333', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>{entry.content.length > 300 ? `${entry.content.slice(0, 300)}…` : entry.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── MY PLAN / BILLING ───────────────────────────────────────────── */}
        {activeTab === 'billing' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '24px' }}>My Plan</h2>
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Current plan</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--color-navy)', fontWeight: 500 }}>{planTierLabel}</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <a href="/pricing" style={{ padding: '10px 20px', backgroundColor: 'var(--color-teal)', color: 'white', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
                    View all plans
                  </a>
                  <ManageSubscriptionButton />
                </div>
              </div>
              {[
                { plan: 'basics', price: '$19/month', features: ['Daily Aria morning catch-up calls', 'Wellness dashboard for family', 'Alert notifications', 'Community access'] },
                { plan: 'connect', price: '$39/month', features: ['Everything in Basics', 'Assigned Human Buddy', 'Weekly buddy calls', 'Cultural circles', 'Virtual events'] },
                { plan: 'complete', price: '$69/month', features: ['Everything in Connect', 'Navigator case management', 'Service coordination', 'Services marketplace'] },
                { plan: 'premier', price: '$129/month', features: ['Everything in Complete', 'Priority buddy matching (48h)', 'Unlimited navigator access', 'Premium services'] },
              ].filter(p => p.plan === member.plan_tier).map(p => (
                <div key={p.plan} style={{ backgroundColor: '#F0F9F7', borderRadius: '12px', padding: '20px 24px' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--color-teal)', marginBottom: '12px' }}>{p.price}</div>
                  <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
                    {p.features.map(f => <li key={f} style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-navy)', lineHeight: 1.8 }}>{f}</li>)}
                  </ul>
                </div>
              ))}
            </div>

            <div style={{ ...card, backgroundColor: '#1B3A6B', border: 'none' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-cream)', marginBottom: '8px' }}>Support ThriveAtHome</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(250,250,245,0.75)', lineHeight: 1.6, marginBottom: '20px' }}>Your contribution helps us provide subsidized care to seniors who need it most.</p>
              <a href="/donate" style={{ display: 'inline-block', padding: '12px 28px', backgroundColor: 'var(--color-cream)', color: 'var(--color-navy)', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}>Make a donation →</a>
            </div>
          </div>
        )}

        {/* ─── MY COMMUNITY ORG ────────────────────────────────────────────── */}
        {activeTab === 'org' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '24px' }}>My Community Organization</h2>
            {!orgLoaded ? (
              <div style={{ ...card, textAlign: 'center', padding: '32px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)' }}>Loading…</p>
              </div>
            ) : !orgData ? (
              <div style={{ ...card, textAlign: 'center', padding: '48px 24px' }}>
                <span style={{ fontSize: '48px' }}>🏘️</span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', marginTop: '16px', marginBottom: '12px' }}>Not linked to a community organization</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.7, maxWidth: '460px', margin: '0 auto' }}>
                  Community organizations like Village Networks, senior centers, and area agencies can connect you to local programs, volunteers, and resources. Ask your navigator to connect you to one in your area.
                </p>
              </div>
            ) : (
              <>
                <div style={card}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>{orgData.org.name}</h3>
                  {orgData.org.description && <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>{orgData.org.description}</p>}
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Membership tier</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--color-navy)', textTransform: 'capitalize' }}>{orgData.membership.tier ?? '—'}</div>
                    </div>
                    {orgData.membership.amount_cents && (
                      <div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Dues paid</div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--color-navy)' }}>${(orgData.membership.amount_cents / 100).toFixed(0)}</div>
                      </div>
                    )}
                    {orgData.membership.payment_date && (
                      <div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Last payment</div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--color-navy)' }}>{new Date(orgData.membership.payment_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                      </div>
                    )}
                  </div>
                  {orgData.org.dues_description && (
                    <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: '#F9F6F0', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      {orgData.org.dues_description}
                    </div>
                  )}
                </div>

                {orgData.programs.length > 0 && (
                  <div style={card}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>Programs &amp; Services</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                      {orgData.programs.map(prog => (
                        <div key={prog.id} style={{ padding: '16px 20px', backgroundColor: '#F9F6F0', borderRadius: '12px', border: '1px solid #E8E4DC' }}>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>{prog.name}</div>
                          {prog.description && <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '6px' }}>{prog.description}</div>}
                          {prog.schedule_description && <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-teal)', fontWeight: 500 }}>📅 {prog.schedule_description}</div>}
                          {prog.contact_person && <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Contact: {prog.contact_person}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── NOTIFICATIONS & PRIVACY ─────────────────────────────────────── */}
        {activeTab === 'notifications' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '24px' }}>Notifications &amp; Privacy</h2>

            <div style={card}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>Aria&apos;s Morning Catch-Up Calls</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '20px' }}>
                Aria is your friendly morning companion. How often would you like her to call?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {FREQUENCY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCallFreq(opt.value as 'daily' | 'every_other_day' | 'weekly')}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 20px',
                      border: `2px solid ${callFreq === opt.value ? 'var(--color-teal)' : '#DDD8CE'}`,
                      borderRadius: '12px', backgroundColor: callFreq === opt.value ? '#F0F9F7' : 'white',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${callFreq === opt.value ? 'var(--color-teal)' : '#CCC'}`, backgroundColor: callFreq === opt.value ? 'var(--color-teal)' : 'white', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--color-navy)' }}>{opt.label}</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={handleSaveFreq} disabled={savingFreq}
                style={{ ...btnPrimary, opacity: savingFreq ? 0.7 : 1 }}>
                {savingFreq ? 'Saving…' : 'Save preference'}
              </button>
            </div>

            <div style={card}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>What Your Family Can See</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
                Your conversations with Aria are always private. Your family only sees a friendly summary — never a recording or transcript. Here&apos;s what they can see on their dashboard:
              </p>
              {[
                { label: 'Wellness mood summary', desc: 'A general sense of how you\'re doing today — happy, neutral, or needing extra care.' },
                { label: 'Upcoming appointments & services', desc: 'Scheduled transport, meal delivery, and other services you\'ve requested.' },
                { label: 'Important Dates reminders', desc: 'Renewals and appointments you\'ve added — so they can offer help.' },
                { label: 'Alert notifications', desc: 'If Aria detects a safety concern, your family is notified so they can check in.' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 0', borderBottom: '1px solid #F0EDE6', gap: '16px' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                  <div style={{ padding: '4px 12px', backgroundColor: '#F0FFF4', borderRadius: '20px', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#15803D', flexShrink: 0 }}>Shared</div>
                </div>
              ))}
              <div style={{ marginTop: '16px', padding: '14px 18px', backgroundColor: '#F9F6F0', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                📞 <strong>Always private:</strong> Your call transcripts, what you said word-for-word, and any medical details you share with Aria are never shown to your family. Only a warm, friendly summary is shared.
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '16px' }}>
                To change which items are shared with your family, contact your navigator.
              </p>
            </div>
          </div>
        )}

        {/* ─── DOCUMENTS ───────────────────────────────────────────────────── */}
        {activeTab === 'documents' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>Documents</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>Documents shared with you by your care team, plus personal documents you upload.</p>

            {/* Upload section */}
            <div style={card}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px' }}>Upload a personal document</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>Store advance directives, insurance cards, medication lists, and other important documents. Only you, your family, and your navigator can see these.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input value={docTitle} onChange={e => setDocTitle(e.target.value)} style={inputSty} placeholder="Document title (required)" />
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e => setDocFile(e.target.files?.[0] ?? null)} style={{ fontFamily: 'var(--font-body)', fontSize: '14px' }} />
                {docError && <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#D62828', margin: 0 }}>{docError}</p>}
                {docSuccess && <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-teal)', margin: 0 }}>{docSuccess}</p>}
                <button onClick={handleDocUpload} disabled={docUploading}
                  style={{ alignSelf: 'flex-start', padding: '10px 20px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: docUploading ? 'not-allowed' : 'pointer', opacity: docUploading ? 0.7 : 1 }}>
                  {docUploading ? 'Uploading…' : '⬆️ Upload Document'}
                </button>
              </div>
            </div>

            {/* Shared documents */}
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>Documents shared with you</h3>
            {!portalDocsLoaded ? (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>Loading documents…</p>
            ) : portalDocs.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: '32px' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📎</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>No documents shared yet. Your navigator or community organization can share documents here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {portalDocs.map(doc => (
                  <div key={doc.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: 0, padding: '16px 20px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 4px' }}>{doc.title}</p>
                      {doc.description && <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 2px' }}>{doc.description}</p>}
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#999', margin: 0 }}>{doc.file_name} · {new Date(doc.created_at).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => handlePortalDocDownload(doc.id, doc.file_name)}
                      style={{ padding: '8px 16px', backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer', flexShrink: 0 }}>
                      ⬇️ Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      <footer style={{ textAlign: 'center', padding: '24px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', borderTop: '1px solid #E8E4DC' }}>
        ThriveAtHome · Your care, your way · <a href="/privacy" style={{ color: 'var(--color-text-secondary)' }}>Privacy</a>
      </footer>
    </div>
  )
}

// Separate component to avoid async in event handler
function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const json = await res.json().catch(() => ({}))
    if (json.url) window.location.href = json.url
    else { alert('Could not open billing portal. Please contact support.'); setLoading(false) }
  }

  return (
    <button onClick={handleClick} disabled={loading}
      style={{ padding: '10px 20px', backgroundColor: 'white', color: 'var(--color-navy)', border: '1.5px solid #DDD8CE', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
      {loading ? 'Opening…' : 'Manage subscription'}
    </button>
  )
}
