'use client'

import React, { useState, useEffect } from 'react'
import type { CareAgencyRow, CareWorkerRow, CareVisitRow, AgencyReferralRow, AgencyLocationRow } from '@/types/database'
import ClinicalNotesTab from './ClinicalNotesTab'

// LocationMetrics is imported from agencies data layer; re-declare interface here for client use
interface LocationMetrics {
  location_id: string
  location_name: string
  active_workers: number
  total_visits_this_month: number
  completed_visits_this_month: number
  billable_hours_this_month: number
  clients_served: number
}

interface CareVisitWithDetails extends CareVisitRow {
  care_worker?: { full_name: string; worker_role: string } | null
  member?: { preferred_name: string; full_name: string; address: string | null } | null
}

interface MemberSummary {
  id: string
  preferred_name: string
  full_name: string
  last_visit_date: string | null
  assigned_worker: string | null
}

interface AgencyDashboardClientProps {
  agency: CareAgencyRow
  workers: CareWorkerRow[]
  upcomingVisits: CareVisitWithDetails[]
  recentVisits: CareVisitWithDetails[]
  members: MemberSummary[]
  pendingReferrals: AgencyReferralRow[]
  initialLocations?: AgencyLocationRow[]
}

const WORKER_ROLES = [
  { value: 'caregiver', label: 'Caregiver' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'therapist', label: 'Therapist' },
  { value: 'care_coordinator', label: 'Care Coordinator' },
  { value: 'social_worker', label: 'Social Worker' },
  { value: 'other', label: 'Other' },
]

type Tab = 'overview' | 'clients' | 'workers' | 'visits' | 'reports' | 'clinical' | 'locations' | 'integrations' | 'email' | 'documents' | 'wellness' | 'partner_program'

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#2563EB',
  in_progress: '#059669',
  completed: '#6B7280',
  cancelled: '#DC2626',
  missed: '#D97706',
}

function formatTime(t: string | null): string {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  const [y, mo, da] = d.split('-').map(Number)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[mo - 1]} ${da}, ${y}`
}

export default function AgencyDashboardClient({
  agency,
  workers,
  upcomingVisits,
  recentVisits,
  members,
  pendingReferrals,
  initialLocations = [],
}: AgencyDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailResult, setEmailResult] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  // Documents
  type AgencyDoc = { id: string; created_at: string; title: string; description: string | null; file_name: string; file_type: string; file_size_bytes: number | null; category: string; visibility: string; uploaded_by_name: string | null }
  const [agencyDocs, setAgencyDocs] = useState<AgencyDoc[]>([])
  const [agencyDocsLoaded, setAgencyDocsLoaded] = useState(false)
  const [agencyDocUploading, setAgencyDocUploading] = useState(false)
  const [agencyDocError, setAgencyDocError] = useState('')
  const [agencyDocSuccess, setAgencyDocSuccess] = useState('')
  const [agencyDocForm, setAgencyDocForm] = useState({ title: '', description: '', category: 'policy', visibility: 'care_team' })
  const [agencyDocFile, setAgencyDocFile] = useState<File | null>(null)

  async function loadAgencyDocs() {
    if (agencyDocsLoaded) return
    const res = await fetch('/api/agency/documents')
    const json = await res.json().catch(() => ({ data: [] }))
    setAgencyDocs(json.data ?? [])
    setAgencyDocsLoaded(true)
  }

  async function handleAgencyDocUpload() {
    if (!agencyDocFile || !agencyDocForm.title.trim()) { setAgencyDocError('Title and file are required'); return }
    setAgencyDocUploading(true); setAgencyDocError(''); setAgencyDocSuccess('')
    const fd = new FormData()
    fd.append('file', agencyDocFile)
    fd.append('title', agencyDocForm.title.trim())
    fd.append('description', agencyDocForm.description.trim())
    fd.append('category', agencyDocForm.category)
    fd.append('visibility', agencyDocForm.visibility)
    const res = await fetch('/api/agency/documents', { method: 'POST', body: fd })
    const json = await res.json().catch(() => ({ error: 'Server error' }))
    setAgencyDocUploading(false)
    if (!res.ok) { setAgencyDocError(json.error ?? 'Upload failed'); return }
    setAgencyDocs(prev => [json.data, ...prev])
    setAgencyDocForm({ title: '', description: '', category: 'policy', visibility: 'care_team' })
    setAgencyDocFile(null)
    setAgencyDocSuccess('Document uploaded.')
    setTimeout(() => setAgencyDocSuccess(''), 4000)
  }

  async function handleAgencyDocDownload(docId: string, fileName: string) {
    const res = await fetch(`/api/agency/documents/${docId}`)
    const json = await res.json().catch(() => ({}))
    if (!json.url) { alert('Download failed. Ensure the platform-documents Storage bucket is created in Supabase.'); return }
    const a = document.createElement('a'); a.href = json.url; a.download = fileName; a.target = '_blank'; a.click()
  }

  async function handleAgencyDocDelete(docId: string) {
    if (!confirm('Delete this document?')) return
    const res = await fetch(`/api/agency/documents/${docId}`, { method: 'DELETE' })
    if (res.ok) setAgencyDocs(prev => prev.filter(d => d.id !== docId))
    else alert('Delete failed.')
  }

  function fmtBytes(bytes: number | null): string {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Workers list — seeded from props; updated after adding a new worker
  const [workersList, setWorkersList] = useState<CareWorkerRow[]>(workers)
  // Location state
  const [locations, setLocations] = useState<AgencyLocationRow[]>(initialLocations)
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [locationMetrics, setLocationMetrics] = useState<LocationMetrics | null>(null)
  const [showAddLocation, setShowAddLocation] = useState(false)
  const [locationFormData, setLocationFormData] = useState({
    location_name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    manager_name: '',
    manager_email: '',
    is_headquarters: false,
    notes: '',
  })
  const [locationFormSaving, setLocationFormSaving] = useState(false)
  const [locationFormError, setLocationFormError] = useState<string | null>(null)
  const [locationSuccessMessage, setLocationSuccessMessage] = useState<string | null>(null)
  // Worker add form state
  const [showAddWorker, setShowAddWorker] = useState(false)
  const [workerFormData, setWorkerFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    worker_role: 'caregiver',
    certifications: '',
    notes: '',
  })
  const [workerFormSaving, setWorkerFormSaving] = useState(false)
  const [workerFormError, setWorkerFormError] = useState<string | null>(null)
  const [workerSuccessMessage, setWorkerSuccessMessage] = useState<string | null>(null)
  // Per-worker location assignment UI state (workerId → locationId)
  const [workerLocationMap, setWorkerLocationMap] = useState<Record<string, string | null>>(
    () => Object.fromEntries(workersList.map(w => [w.id, w.location_id ?? null]))
  )

  const activeWorkers = workersList.filter((w) => w.is_active)
  const inProgressVisits = upcomingVisits.filter((v) => v.status === 'in_progress')

  // Fetch location-specific metrics when location selector changes
  useEffect(() => {
    async function fetchMetrics() {
      const params = new URLSearchParams({ agencyId: agency.id })
      if (selectedLocationId) params.set('locationId', selectedLocationId)
      try {
        const res = await fetch(`/api/agency/locations/metrics?${params}`)
        if (res.ok) {
          const json = await res.json()
          setLocationMetrics(json.data)
        }
      } catch (e) {
        console.error('[AgencyDashboardClient/fetchMetrics]', e)
      }
    }
    fetchMetrics()
  }, [agency.id, selectedLocationId])

  async function handleAddLocation() {
    if (!locationFormData.location_name.trim()) {
      setLocationFormError('Location name is required')
      return
    }
    setLocationFormSaving(true)
    setLocationFormError(null)
    try {
      const res = await fetch('/api/agency/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agency_id: agency.id, ...locationFormData }),
      })
      let json: { data?: AgencyLocationRow | null; error?: string } = {}
      try { json = await res.json() } catch { json = { error: 'Server returned an unexpected response' } }
      if (!res.ok) { setLocationFormError(json.error ?? 'Failed to create location'); return }
      if (json.data) setLocations(prev => [...prev, json.data!])
      setLocationFormData({ location_name: '', address: '', city: '', state: '', zip_code: '', phone: '', manager_name: '', manager_email: '', is_headquarters: false, notes: '' })
      setShowAddLocation(false)
      setLocationSuccessMessage(`Location "${locationFormData.location_name.trim()}" added successfully.`)
      setTimeout(() => setLocationSuccessMessage(null), 4000)
    } catch (e) {
      setLocationFormError('Network error — please try again')
      console.error('[handleAddLocation]', e)
    } finally {
      setLocationFormSaving(false)
    }
  }

  async function handleAddWorker() {
    if (!workerFormData.full_name.trim() || !workerFormData.email.trim()) {
      setWorkerFormError('Full name and email are required')
      return
    }
    setWorkerFormSaving(true)
    setWorkerFormError(null)
    try {
      const res = await fetch('/api/agency/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_id: agency.id,
          full_name: workerFormData.full_name.trim(),
          email: workerFormData.email.trim(),
          phone: workerFormData.phone.trim() || null,
          worker_role: workerFormData.worker_role,
          certifications: workerFormData.certifications ? workerFormData.certifications.split(',').map(c => c.trim()).filter(Boolean) : [],
          notes: workerFormData.notes.trim() || null,
        }),
      })
      let json: { data?: CareWorkerRow | null; error?: string } = {}
      try { json = await res.json() } catch { json = { error: 'Server returned an unexpected response' } }
      if (!res.ok) { setWorkerFormError(json.error ?? 'Failed to add worker'); return }
      if (json.data) {
        setWorkersList(prev => [...prev, json.data!])
        setWorkerLocationMap(prev => ({ ...prev, [json.data!.id]: json.data!.location_id ?? null }))
      }
      setWorkerFormData({ full_name: '', email: '', phone: '', worker_role: 'caregiver', certifications: '', notes: '' })
      setShowAddWorker(false)
      setWorkerSuccessMessage(`${workerFormData.full_name.trim()} has been added to your team.`)
      setTimeout(() => setWorkerSuccessMessage(null), 4000)
    } catch (e) {
      setWorkerFormError('Network error — please try again')
      console.error('[handleAddWorker]', e)
    } finally {
      setWorkerFormSaving(false)
    }
  }

  async function handleAssignWorkerLocation(workerId: string, locationId: string | null) {
    setWorkerLocationMap(prev => ({ ...prev, [workerId]: locationId }))
    await fetch('/api/agency/locations/assign-worker', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ worker_id: workerId, agency_id: agency.id, location_id: locationId }),
    })
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'wellness', label: '❤️ Member Wellness' },
    { id: 'partner_program', label: '🤝 Partner Program' },
    { id: 'clients', label: `Clients (${members.length})` },
    { id: 'workers', label: `Care Workers (${workersList.length})` },
    { id: 'visits', label: 'Visits' },
    { id: 'reports', label: 'Reports' },
    { id: 'clinical', label: 'Clinical Notes' },
    { id: 'locations', label: `Locations (${locations.length})` },
    { id: 'integrations', label: 'Integrations' },
    { id: 'email', label: 'Email Clients' },
    { id: 'documents', label: '📎 Documents' },
  ]

  // Member Wellness tab state (Phase 77)
  type WellnessClient = {
    id: string; preferred_name: string; full_name: string;
    last_aria_call_at: string | null; last_mood_score: number | null; mood_trend: string;
    alert_count: number; last_visit_date: string | null; last_visit_type: string | null;
  }
  const [wellnessClients, setWellnessClients] = useState<WellnessClient[]>([])
  const [wellnessLoaded, setWellnessLoaded] = useState(false)
  const [wellnessLoading, setWellnessLoading] = useState(false)
  const [wellnessFilter, setWellnessFilter] = useState<'all' | 'alerts'>('all')
  const [logVisitClientId, setLogVisitClientId] = useState<string | null>(null)
  const [logVisitForm, setLogVisitForm] = useState({ visit_date: new Date().toISOString().split('T')[0], duration_minutes: 30, visit_type: 'companionship', notes: '' })
  const [logVisitSaving, setLogVisitSaving] = useState(false)
  const [logVisitErr, setLogVisitErr] = useState<string | null>(null)
  const [logVisitSuccess, setLogVisitSuccess] = useState<string | null>(null)

  async function loadWellness() {
    if (wellnessLoaded) return
    setWellnessLoading(true)
    const res = await fetch('/api/agency/wellness')
    const json = await res.json()
    setWellnessLoading(false)
    if (res.ok) { setWellnessClients(json.clients ?? []); setWellnessLoaded(true) }
  }

  async function handleLogVisit(e: React.FormEvent) {
    e.preventDefault()
    if (!logVisitClientId) return
    setLogVisitSaving(true); setLogVisitErr(null); setLogVisitSuccess(null)
    const res = await fetch('/api/agency/companion-visits', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: logVisitClientId, ...logVisitForm }),
    })
    const json = await res.json()
    setLogVisitSaving(false)
    if (!res.ok) { setLogVisitErr(json.error ?? 'Failed to log visit'); return }
    setLogVisitSuccess('Visit logged successfully.')
    setLogVisitClientId(null)
    setTimeout(() => setLogVisitSuccess(null), 3000)
    // Re-fetch wellness data so the updated last_visit_date appears immediately
    const wRes = await fetch('/api/agency/wellness')
    const wJson = await wRes.json()
    if (wRes.ok) setWellnessClients(wJson.clients ?? [])
  }

  // Partner Program tab state (Phase 78)
  type ReferralLink = { id: string; referral_code: string; referral_fee_cents: number; total_referrals: number; total_fees_earned_cents: number; is_active: boolean; created_at: string }
  type ReferredMember = { id: string; full_name: string; joined_at: string; has_member_profile: boolean; plan_tier: string | null; referral_fee_status: string }
  const [referralLinks, setReferralLinks] = useState<ReferralLink[]>([])
  const [referredMembers, setReferredMembers] = useState<ReferredMember[]>([])
  const [partnerLoaded, setPartnerLoaded] = useState(false)
  const [partnerLoading, setPartnerLoading] = useState(false)
  const [generatingLink, setGeneratingLink] = useState(false)
  const [partnerErr, setPartnerErr] = useState<string | null>(null)

  async function loadPartnerProgram() {
    if (partnerLoaded) return
    setPartnerLoading(true)
    const res = await fetch('/api/agency/referral-program')
    const json = await res.json()
    setPartnerLoading(false)
    if (res.ok) { setReferralLinks(json.links ?? []); setReferredMembers(json.referred ?? []); setPartnerLoaded(true) }
  }

  async function handleGenerateLink() {
    setGeneratingLink(true); setPartnerErr(null)
    const res = await fetch('/api/agency/referral-program', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    const json = await res.json()
    setGeneratingLink(false)
    if (!res.ok) { setPartnerErr(json.error ?? 'Failed to generate link'); return }
    setReferralLinks(prev => [json.link, ...prev])
  }

  function downloadWellnessCsv() {
    const rows = [
      ['Client Name', 'Last Aria Call', 'Mood Score', 'Mood Trend', 'Alert Count', 'Last Visit Date', 'Last Visit Type'],
      ...wellnessClients.map(c => [
        c.preferred_name || c.full_name,
        c.last_aria_call_at ? new Date(c.last_aria_call_at).toLocaleDateString() : '',
        c.last_mood_score ?? '',
        c.mood_trend,
        c.alert_count,
        c.last_visit_date ?? '',
        c.last_visit_type ?? '',
      ])
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `agency-wellness-${new Date().toISOString().split('T')[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      {/* Nav */}
      <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>ThriveAtHome</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>{agency.name} — Agency Portal</span>
          <a href="/agency-admin/branding" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(255,255,255,0.85)', textDecoration: 'none', backgroundColor: 'rgba(255,255,255,0.12)', padding: '6px 14px', borderRadius: '6px' }}>
            Branding
          </a>
          <a href="/api/auth/signout" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)' }}>
            Sign out
          </a>
        </div>
      </nav>

      {/* Header */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
            {agency.name}
          </h1>
          <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {agency.agency_type?.replace('_', ' ')} &nbsp;·&nbsp;
            {agency.city && agency.state ? `${agency.city}, ${agency.state}` : agency.city ?? agency.state ?? 'Location not set'}
            {agency.contact_name && ` · Contact: ${agency.contact_name}`}
          </p>
        </div>
        {/* Location selector */}
        {locations.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
              📍 Viewing:
            </label>
            <select
              value={selectedLocationId ?? ''}
              onChange={e => setSelectedLocationId(e.target.value || null)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-navy)', backgroundColor: '#fff', cursor: 'pointer', minWidth: '200px' }}
            >
              <option value="">All Locations</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.location_name}{loc.is_headquarters ? ' (HQ)' : ''}{!loc.is_active ? ' [Inactive]' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 32px', display: 'flex', gap: '4px' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); if (t.id === 'documents') loadAgencyDocs(); if (t.id === 'wellness') loadWellness(); if (t.id === 'partner_program') loadPartnerProgram() }}
            style={{
              padding: '14px 20px',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: activeTab === t.id ? 600 : 400,
              color: activeTab === t.id ? 'var(--color-navy)' : 'var(--color-text-secondary)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === t.id ? '2px solid var(--color-navy)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            {/* Location-filtered metrics banner */}
            {selectedLocationId && locationMetrics && (
              <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '12px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>📍</span>
                <div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: '#1E40AF' }}>
                    Viewing: {locations.find(l => l.id === selectedLocationId)?.location_name ?? 'Selected location'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#3B82F6', marginLeft: '12px' }}>
                    {locationMetrics.active_workers} workers · {locationMetrics.clients_served} clients · {locationMetrics.billable_hours_this_month}h billed this month
                  </span>
                </div>
                <button onClick={() => setSelectedLocationId(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '13px' }}>
                  View all locations ×
                </button>
              </div>
            )}

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
              {(locationMetrics && selectedLocationId ? [
                { label: 'Active Workers', value: locationMetrics.active_workers },
                { label: 'Clients Served', value: locationMetrics.clients_served },
                { label: 'Visits This Month', value: locationMetrics.total_visits_this_month },
                { label: 'Billable Hours (mo)', value: locationMetrics.billable_hours_this_month },
              ] : [
                { label: 'Active Workers', value: activeWorkers.length },
                { label: 'Clients Served', value: members.length },
                { label: 'Upcoming Visits (7d)', value: upcomingVisits.length },
                { label: 'Pending Referrals', value: pendingReferrals.length },
              ]).map((s) => (
                <div key={s.label} style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 500, color: 'var(--color-navy)' }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* In-progress visits alert */}
            {inProgressVisits.length > 0 && (
              <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: '10px', padding: '16px 20px', marginBottom: '24px' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: '#065F46', marginBottom: '8px' }}>
                  {inProgressVisits.length} visit{inProgressVisits.length > 1 ? 's' : ''} currently in progress
                </div>
                {inProgressVisits.map((v) => (
                  <div key={v.id} style={{ fontSize: '13px', color: '#047857', marginTop: '4px' }}>
                    {v.care_worker?.full_name ?? 'Worker'} with {v.member?.preferred_name ?? v.member?.full_name ?? 'Client'} — started {formatTime(v.scheduled_start_time)}
                  </div>
                ))}
              </div>
            )}

            {/* Upcoming visits */}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>
                Upcoming Visits — Next 7 Days
              </h2>
              {upcomingVisits.length === 0 ? (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>No upcoming visits scheduled.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      {['Date', 'Time', 'Client', 'Worker', 'Type', 'Status'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingVisits.map((v) => (
                      <tr key={v.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-body)', fontSize: '14px' }}>{formatDate(v.scheduled_date)}</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-body)', fontSize: '14px' }}>{formatTime(v.scheduled_start_time)} – {formatTime(v.scheduled_end_time)}</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-body)', fontSize: '14px' }}>{v.member?.preferred_name ?? v.member?.full_name ?? '—'}</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-body)', fontSize: '14px' }}>{v.care_worker?.full_name ?? '—'}</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{v.visit_type?.replace(/_/g, ' ')}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontFamily: 'var(--font-body)', fontWeight: 600, backgroundColor: STATUS_COLORS[v.status] + '20', color: STATUS_COLORS[v.status] }}>
                            {v.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pending referrals */}
            {pendingReferrals.length > 0 && (
              <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '12px', padding: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: '#92400E', marginBottom: '16px' }}>
                  Pending Referrals ({pendingReferrals.length})
                </h2>
                {pendingReferrals.map((r) => (
                  <div key={r.id} style={{ padding: '12px 0', borderBottom: '1px solid #FDE68A', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
                    <div style={{ fontWeight: 600, color: '#92400E', marginBottom: '4px' }}>
                      Services: {r.services_requested?.join(', ') ?? '—'}
                    </div>
                    <div style={{ color: '#78350F', fontSize: '13px' }}>
                      Reason: {r.referral_reason ?? '—'} &nbsp;·&nbsp; Received: {formatDate(r.created_at?.split('T')[0] ?? null)}
                    </div>
                    {r.notes && <div style={{ color: '#78350F', fontSize: '13px', marginTop: '4px' }}>Note: {r.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CLIENTS TAB */}
        {activeTab === 'clients' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '20px' }}>Client Roster</h2>
            {members.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>No clients yet. Clients appear once a visit is scheduled.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                    {['Client', 'Last Visit', 'Assigned Worker'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500 }}>{m.preferred_name || m.full_name}</td>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{formatDate(m.last_visit_date)}</td>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{m.assigned_worker ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* WORKERS TAB */}
        {activeTab === 'workers' && (
          <div>
            {workerSuccessMessage && (
              <div style={{ backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#065F46' }}>
                ✅ {workerSuccessMessage}
              </div>
            )}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>Care Worker Roster</h2>
                <button
                  onClick={() => setShowAddWorker(!showAddWorker)}
                  style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: 'var(--color-navy)', color: '#fff', border: 'none', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  + Add worker
                </button>
              </div>

              {/* Add worker form */}
              {showAddWorker && (
                <div style={{ border: '1.5px solid var(--color-teal)', borderRadius: '12px', padding: '20px', marginBottom: '24px', backgroundColor: '#F0FDFA' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>New Care Worker</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>Full Name *</label>
                      <input value={workerFormData.full_name} onChange={e => setWorkerFormData(p => ({ ...p, full_name: e.target.value }))} placeholder="Jane Smith" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>Email *</label>
                      <input type="email" value={workerFormData.email} onChange={e => setWorkerFormData(p => ({ ...p, email: e.target.value }))} placeholder="jane@example.com" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>Phone</label>
                      <input value={workerFormData.phone} onChange={e => setWorkerFormData(p => ({ ...p, phone: e.target.value }))} placeholder="(555) 000-0000" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>Role</label>
                      <select value={workerFormData.worker_role} onChange={e => setWorkerFormData(p => ({ ...p, worker_role: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontFamily: 'var(--font-body)', fontSize: '14px', backgroundColor: '#fff', boxSizing: 'border-box' }}>
                        {WORKER_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>Certifications (comma-separated)</label>
                      <input value={workerFormData.certifications} onChange={e => setWorkerFormData(p => ({ ...p, certifications: e.target.value }))} placeholder="e.g. CNA, CPR, First Aid" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  {workerFormError && (
                    <div style={{ color: '#DC2626', fontFamily: 'var(--font-body)', fontSize: '14px', marginBottom: '12px' }}>{workerFormError}</div>
                  )}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleAddWorker} disabled={workerFormSaving} style={{ padding: '10px 22px', borderRadius: '8px', backgroundColor: 'var(--color-teal)', color: '#fff', border: 'none', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: workerFormSaving ? 'wait' : 'pointer' }}>
                      {workerFormSaving ? 'Saving…' : 'Add Worker'}
                    </button>
                    <button onClick={() => { setShowAddWorker(false); setWorkerFormError(null) }} style={{ padding: '10px 22px', borderRadius: '8px', backgroundColor: '#fff', color: 'var(--color-navy)', border: '1.5px solid #D1D5DB', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {workersList.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', border: '1.5px dashed #D1D5DB', borderRadius: '10px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--color-navy)', marginBottom: '8px' }}>No care workers yet</div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 16px' }}>Click &ldquo;+ Add worker&rdquo; above to add your first team member.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                        {['Name', 'Role', 'Email', 'Phone', 'Certifications', 'Location', 'Status'].map((h) => (
                          <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {workersList.map((w) => (
                        <tr key={w.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '12px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap' }}>{w.full_name}</td>
                          <td style={{ padding: '12px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{w.worker_role?.replace(/_/g, ' ')}</td>
                          <td style={{ padding: '12px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{w.email}</td>
                          <td style={{ padding: '12px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{w.phone ?? '—'}</td>
                          <td style={{ padding: '12px', fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {w.certifications?.length ? w.certifications.join(', ') : '—'}
                          </td>
                          <td style={{ padding: '12px', minWidth: '160px' }}>
                            {locations.length > 0 ? (
                              <select
                                value={workerLocationMap[w.id] ?? ''}
                                onChange={e => handleAssignWorkerLocation(w.id, e.target.value || null)}
                                style={{ padding: '5px 8px', borderRadius: '6px', border: '1.5px solid #D1D5DB', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-navy)', backgroundColor: '#fff', cursor: 'pointer', maxWidth: '160px' }}
                              >
                                <option value="">No location</option>
                                {locations.map(loc => (
                                  <option key={loc.id} value={loc.id}>{loc.location_name}</option>
                                ))}
                              </select>
                            ) : (
                              <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>Add a location first</span>
                            )}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontFamily: 'var(--font-body)', fontWeight: 600, backgroundColor: w.is_active ? '#D1FAE5' : '#F3F4F6', color: w.is_active ? '#065F46' : '#6B7280', whiteSpace: 'nowrap' }}>
                              {w.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VISITS TAB */}
        {activeTab === 'visits' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '20px' }}>Recent Visits (Last 30 Days)</h2>
            {recentVisits.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>No visits in the last 30 days.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                    {['Date', 'Client', 'Worker', 'Type', 'Check-in', 'Check-out', 'Hours', 'Status'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentVisits.map((v) => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-body)', fontSize: '13px' }}>{formatDate(v.scheduled_date)}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-body)', fontSize: '13px' }}>{v.member?.preferred_name ?? '—'}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-body)', fontSize: '13px' }}>{v.care_worker?.full_name ?? '—'}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>{v.visit_type?.replace(/_/g, ' ')}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        {v.actual_check_in_at ? new Date(v.actual_check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        {v.actual_check_out_at ? new Date(v.actual_check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500 }}>
                        {v.billable_hours != null ? `${v.billable_hours}h` : '—'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontFamily: 'var(--font-body)', fontWeight: 600, backgroundColor: STATUS_COLORS[v.status] + '20', color: STATUS_COLORS[v.status] }}>
                          {v.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px' }}>Billable Hours Report</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
                Summary of billable hours by care worker. Hours rounded to nearest 0.25.
              </p>
              {recentVisits.filter((v) => v.status === 'completed').length === 0 ? (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>No completed visits yet to report on.</p>
              ) : (
                <div>
                  {/* Group by worker */}
                  {(() => {
                    const map = new Map<string, { name: string; hours: number; visits: number; uninvoiced: number }>()
                    for (const v of recentVisits.filter((r) => r.status === 'completed')) {
                      const name = v.care_worker?.full_name ?? 'Unknown'
                      const entry = map.get(name) ?? { name, hours: 0, visits: 0, uninvoiced: 0 }
                      entry.hours += v.billable_hours ?? 0
                      entry.visits += 1
                      if (!v.invoiced) entry.uninvoiced += v.billable_hours ?? 0
                      map.set(name, entry)
                    }
                    return Array.from(map.values()).sort((a, b) => b.hours - a.hours).map((entry) => (
                      <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)' }}>{entry.name}</div>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{entry.visits} visit{entry.visits !== 1 ? 's' : ''}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)' }}>{entry.hours.toFixed(2)}h</div>
                          {entry.uninvoiced > 0 && <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#D97706' }}>{entry.uninvoiced.toFixed(2)}h uninvoiced</div>}
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MEMBER WELLNESS TAB — Phase 77 */}
        {activeTab === 'wellness' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>Member Wellness</h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                  Aria call signals and companion visit history for your agency clients
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button type="button" onClick={() => setWellnessFilter(wellnessFilter === 'alerts' ? 'all' : 'alerts')}
                  style={{ padding: '7px 16px', border: `1.5px solid ${wellnessFilter === 'alerts' ? '#DC2626' : '#D4CFC8'}`, borderRadius: '8px', backgroundColor: wellnessFilter === 'alerts' ? '#FEF2F2' : 'white', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: wellnessFilter === 'alerts' ? '#DC2626' : '#6B7280', cursor: 'pointer' }}>
                  🔔 Alerts only ({wellnessClients.filter(c => c.alert_count > 0).length})
                </button>
                <button type="button" onClick={downloadWellnessCsv}
                  style={{ padding: '7px 16px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Export wellness data
                </button>
              </div>
            </div>

            {logVisitSuccess && (
              <div style={{ padding: '12px 16px', backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: '8px', marginBottom: '16px', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#065F46' }}>✅ {logVisitSuccess}</div>
            )}

            {wellnessLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>Loading wellness data…</div>
            ) : wellnessClients.length === 0 ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px 24px', textAlign: 'center', border: '1px solid #E8E4DC', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>
                No clients found. Clients appear here once they have a completed care visit logged.
              </div>
            ) : (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E8E4DC', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-navy)', color: 'white', textAlign: 'left' }}>
                      {['Client', 'Last Aria Call', 'Mood', 'Alerts', 'Last Visit', ''].map(col => (
                        <th key={col} style={{ padding: '12px 16px', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {wellnessClients
                      .filter(c => wellnessFilter === 'alerts' ? c.alert_count > 0 : true)
                      .map((c, i) => {
                        const trendIcon = c.mood_trend === 'up' ? '↑' : c.mood_trend === 'down' ? '↓' : c.mood_trend === 'stable' ? '→' : '—'
                        const trendColor = c.mood_trend === 'up' ? '#059669' : c.mood_trend === 'down' ? '#DC2626' : '#6B7280'
                        const isLogging = logVisitClientId === c.id
                        return (
                          <React.Fragment key={c.id}>
                            <tr style={{ backgroundColor: i % 2 === 0 ? 'white' : '#F9F7F4', borderBottom: '1px solid #E8E4DC' }}>
                              <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--color-navy)' }}>{c.preferred_name || c.full_name}</td>
                              <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '13px' }}>
                                {c.last_aria_call_at ? new Date(c.last_aria_call_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{ color: trendColor, fontWeight: 700 }}>{trendIcon}</span>
                                {' '}<span style={{ color: '#374151' }}>{c.last_mood_score !== null ? `${c.last_mood_score}/10` : '—'}</span>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                {c.alert_count > 0 ? (
                                  <span style={{ backgroundColor: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: '12px', padding: '2px 8px', borderRadius: '12px' }}>
                                    {c.alert_count} alert{c.alert_count !== 1 ? 's' : ''}
                                  </span>
                                ) : <span style={{ color: '#6B7280' }}>—</span>}
                              </td>
                              <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '13px' }}>
                                {c.last_visit_date ? new Date(c.last_visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <button type="button"
                                  onClick={() => { setLogVisitClientId(isLogging ? null : c.id); setLogVisitErr(null) }}
                                  style={{ padding: '5px 12px', backgroundColor: isLogging ? '#F3F4F6' : 'white', border: '1.5px solid var(--color-teal)', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-teal)', cursor: 'pointer' }}>
                                  {isLogging ? 'Cancel' : 'Log Visit'}
                                </button>
                              </td>
                            </tr>
                            {isLogging && (
                              <tr key={`${c.id}-log`} style={{ backgroundColor: '#F0F9F7' }}>
                                <td colSpan={6} style={{ padding: '18px 20px' }}>
                                  <form onSubmit={handleLogVisit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Date</label>
                                      <input type="date" value={logVisitForm.visit_date} onChange={e => setLogVisitForm(f => ({ ...f, visit_date: e.target.value }))}
                                        style={{ padding: '7px 12px', border: '1.5px solid #D4CFC8', borderRadius: '6px', fontFamily: 'inherit', fontSize: '14px' }} />
                                    </div>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Duration (min)</label>
                                      <input type="number" min={5} max={480} value={logVisitForm.duration_minutes} onChange={e => setLogVisitForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                                        style={{ padding: '7px 12px', border: '1.5px solid #D4CFC8', borderRadius: '6px', fontFamily: 'inherit', fontSize: '14px', width: '80px' }} />
                                    </div>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Visit type</label>
                                      <select value={logVisitForm.visit_type} onChange={e => setLogVisitForm(f => ({ ...f, visit_type: e.target.value }))}
                                        style={{ padding: '7px 12px', border: '1.5px solid #D4CFC8', borderRadius: '6px', fontFamily: 'inherit', fontSize: '14px', backgroundColor: 'white' }}>
                                        <option value="companionship">Companionship</option>
                                        <option value="personal_care">Personal Care</option>
                                        <option value="homemaking">Homemaking</option>
                                        <option value="transportation">Transportation</option>
                                        <option value="other">Other</option>
                                      </select>
                                    </div>
                                    <div style={{ flex: 1, minWidth: '160px' }}>
                                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Notes</label>
                                      <input type="text" placeholder="Visit notes (optional)" value={logVisitForm.notes} onChange={e => setLogVisitForm(f => ({ ...f, notes: e.target.value }))}
                                        style={{ padding: '7px 12px', border: '1.5px solid #D4CFC8', borderRadius: '6px', fontFamily: 'inherit', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} />
                                    </div>
                                    <button type="submit" disabled={logVisitSaving}
                                      style={{ padding: '8px 18px', backgroundColor: logVisitSaving ? '#9CA3AF' : 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: logVisitSaving ? 'not-allowed' : 'pointer' }}>
                                      {logVisitSaving ? 'Saving…' : 'Save Visit'}
                                    </button>
                                    {logVisitErr && <div style={{ color: '#DC2626', fontSize: '13px', fontFamily: 'var(--font-body)', alignSelf: 'center' }}>{logVisitErr}</div>}
                                  </form>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Agency-branded welcome stub note */}
            <div style={{ marginTop: '20px', padding: '16px 20px', backgroundColor: '#F9F7F4', borderRadius: '10px', border: '1px solid #E8E4DC', fontFamily: 'var(--font-body)', fontSize: '13px', color: '#6B7280' }}>
              💌 New members referred by your agency receive a co-branded welcome email: "Welcome from {agency.name}, Powered by ThriveAtHome." Configure your branding in the <a href="/agency-admin/branding" style={{ color: 'var(--color-teal)' }}>Branding settings</a>.
            </div>
          </div>
        )}

        {/* PARTNER PROGRAM TAB — Phase 78 */}
        {activeTab === 'partner_program' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>Referral Partner Program</h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                  Earn $35 for every family you refer who activates a paid plan.
                </p>
              </div>
              <button type="button" onClick={handleGenerateLink} disabled={generatingLink}
                style={{ padding: '9px 20px', backgroundColor: generatingLink ? '#9CA3AF' : 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: generatingLink ? 'not-allowed' : 'pointer' }}>
                {generatingLink ? 'Generating…' : '+ Generate referral link'}
              </button>
            </div>

            {partnerErr && <div style={{ padding: '12px 16px', backgroundColor: '#FEE2E2', borderRadius: '8px', marginBottom: '16px', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#DC2626' }}>{partnerErr}</div>}

            {partnerLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>Loading…</div>
            ) : (
              <>
                {/* Referral links */}
                {referralLinks.length > 0 && (
                  <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px 24px', border: '1px solid #E8E4DC', marginBottom: '20px' }}>
                    <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px' }}>Your referral links</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {referralLinks.map(link => (
                        <div key={link.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#F9F7F4', borderRadius: '8px', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: 'var(--color-navy)' }}>
                              https://thriveathome.com/join?ref={link.referral_code}
                            </div>
                            <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                              {link.total_referrals} referrals · ${((link.total_fees_earned_cents ?? 0) / 100).toFixed(2)} earned · ${(link.referral_fee_cents / 100).toFixed(2)}/referral
                            </div>
                          </div>
                          <button type="button"
                            onClick={() => navigator.clipboard.writeText(`https://thriveathome.com/join?ref=${link.referral_code}`)}
                            style={{ padding: '6px 14px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                            Copy link
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Referred members */}
                <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E8E4DC', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 24px', borderBottom: '1px solid #E8E4DC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                      Referred members ({referredMembers.length})
                    </h3>
                  </div>
                  {referredMembers.length === 0 ? (
                    <div style={{ padding: '40px 24px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>
                      No referred members yet. Share your referral link with families you serve.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F9F7F4', textAlign: 'left' }}>
                          {['Member Name', 'Joined', 'Current Plan', 'Referral Fee'].map(col => (
                            <th key={col} style={{ padding: '10px 16px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9CA3AF' }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {referredMembers.map((m, i) => (
                          <tr key={m.id} style={{ borderTop: '1px solid #E8E4DC', backgroundColor: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-navy)' }}>{m.full_name}</td>
                            <td style={{ padding: '12px 16px', color: '#6B7280' }}>{new Date(m.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                            <td style={{ padding: '12px 16px' }}>
                              {m.plan_tier ? (
                                <span style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', textTransform: 'capitalize' }}>{m.plan_tier}</span>
                              ) : <span style={{ color: '#9CA3AF' }}>Onboarding</span>}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ backgroundColor: m.referral_fee_status === 'pending' ? '#FEF3C7' : '#F3F4F6', color: m.referral_fee_status === 'pending' ? '#92400E' : '#9CA3AF', fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', textTransform: 'capitalize' }}>
                                {m.referral_fee_status === 'pending' ? 'Pending ($35)' : m.referral_fee_status === 'not_yet' ? 'Profile not complete' : m.referral_fee_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* CLINICAL NOTES TAB */}
        {activeTab === 'clinical' && (
          <ClinicalNotesTab
            agencyId={agency.id}
            members={members.map(m => ({ id: m.id, preferred_name: m.preferred_name, full_name: m.full_name }))}
          />
        )}

        {/* LOCATIONS TAB */}
        {activeTab === 'locations' && (
          <div>
            {locationSuccessMessage && (
              <div style={{ backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#065F46' }}>
                ✅ {locationSuccessMessage}
              </div>
            )}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
                    Office Locations
                  </h2>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                    Manage branches, assign workers to locations, and view per-location metrics.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddLocation(!showAddLocation)}
                  style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: 'var(--color-navy)', color: '#fff', border: 'none', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  + Add Location
                </button>
              </div>

              {/* Add location form */}
              {showAddLocation && (
                <div style={{ border: '1.5px solid var(--color-teal)', borderRadius: '12px', padding: '20px', marginBottom: '24px', backgroundColor: '#F0FDFA' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>New Location</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>Location Name *</label>
                      <input value={locationFormData.location_name} onChange={e => setLocationFormData(p => ({ ...p, location_name: e.target.value }))} placeholder="e.g. East Bay Office" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>Phone</label>
                      <input value={locationFormData.phone} onChange={e => setLocationFormData(p => ({ ...p, phone: e.target.value }))} placeholder="(555) 000-0000" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>Address</label>
                      <input value={locationFormData.address} onChange={e => setLocationFormData(p => ({ ...p, address: e.target.value }))} placeholder="Street address" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>City</label>
                        <input value={locationFormData.city} onChange={e => setLocationFormData(p => ({ ...p, city: e.target.value }))} placeholder="City" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>State</label>
                        <input value={locationFormData.state} onChange={e => setLocationFormData(p => ({ ...p, state: e.target.value }))} placeholder="CA" maxLength={2} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>ZIP</label>
                        <input value={locationFormData.zip_code} onChange={e => setLocationFormData(p => ({ ...p, zip_code: e.target.value }))} placeholder="94xxx" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>Manager Name</label>
                      <input value={locationFormData.manager_name} onChange={e => setLocationFormData(p => ({ ...p, manager_name: e.target.value }))} placeholder="Office manager" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>Manager Email</label>
                      <input type="email" value={locationFormData.manager_email} onChange={e => setLocationFormData(p => ({ ...p, manager_email: e.target.value }))} placeholder="manager@agency.com" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-navy)', cursor: 'pointer', marginBottom: '16px' }}>
                    <input type="checkbox" checked={locationFormData.is_headquarters} onChange={e => setLocationFormData(p => ({ ...p, is_headquarters: e.target.checked }))} />
                    Mark as headquarters
                  </label>
                  {locationFormError && (
                    <div style={{ color: '#DC2626', fontFamily: 'var(--font-body)', fontSize: '14px', marginBottom: '12px' }}>{locationFormError}</div>
                  )}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleAddLocation} disabled={locationFormSaving} style={{ padding: '10px 22px', borderRadius: '8px', backgroundColor: 'var(--color-teal)', color: '#fff', border: 'none', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: locationFormSaving ? 'wait' : 'pointer' }}>
                      {locationFormSaving ? 'Saving…' : 'Create Location'}
                    </button>
                    <button onClick={() => setShowAddLocation(false)} style={{ padding: '10px 22px', borderRadius: '8px', backgroundColor: '#fff', color: 'var(--color-navy)', border: '1.5px solid #D1D5DB', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Locations list */}
              {locations.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', border: '1.5px dashed #D1D5DB', borderRadius: '10px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--color-navy)', marginBottom: '8px' }}>No locations configured yet</div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Add your first office location to start assigning workers and tracking per-location metrics.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {locations.map(loc => (
                    <div key={loc.id} style={{ border: '1px solid #E5E7EB', borderRadius: '10px', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: loc.is_headquarters ? '#FAFAF8' : '#fff' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--color-navy)' }}>{loc.location_name}</span>
                          {loc.is_headquarters && (
                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontFamily: 'var(--font-body)', fontWeight: 600, backgroundColor: '#DBEAFE', color: '#1E40AF' }}>HQ</span>
                          )}
                          {!loc.is_active && (
                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontFamily: 'var(--font-body)', fontWeight: 600, backgroundColor: '#F3F4F6', color: '#6B7280' }}>Inactive</span>
                          )}
                        </div>
                        {(loc.address || loc.city) && (
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>
                            📍 {[loc.address, loc.city, loc.state, loc.zip_code].filter(Boolean).join(', ')}
                          </div>
                        )}
                        {loc.phone && (
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>
                            📞 {loc.phone}
                          </div>
                        )}
                        {loc.manager_name && (
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            👤 Manager: {loc.manager_name}{loc.manager_email ? ` · ${loc.manager_email}` : ''}
                          </div>
                        )}
                        {/* Workers at this location */}
                        {(() => {
                          const locWorkers = workersList.filter(w => (workerLocationMap[w.id] ?? w.location_id) === loc.id)
                          if (locWorkers.length === 0) return null
                          return (
                            <div style={{ marginTop: '8px', fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                              Workers assigned: {locWorkers.map(w => w.full_name).join(', ')}
                            </div>
                          )
                        })()}
                      </div>
                      <button
                        onClick={() => { setSelectedLocationId(loc.id); setActiveTab('overview') }}
                        style={{ marginLeft: '20px', padding: '8px 16px', borderRadius: '8px', border: '1.5px solid var(--color-navy)', backgroundColor: '#fff', color: 'var(--color-navy)', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        View metrics
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Worker location assignment */}
              {workersList.length > 0 && locations.length > 0 && (
                <div style={{ marginTop: '32px', borderTop: '1px solid #E5E7EB', paddingTop: '24px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px' }}>Assign Workers to Locations</h3>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {workersList.map(worker => (
                      <div key={worker.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#fff' }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-navy)', fontWeight: worker.is_active ? 500 : 400, opacity: worker.is_active ? 1 : 0.5 }}>
                          {worker.full_name} <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>· {worker.worker_role.replace('_', ' ')}</span>
                        </span>
                        <select
                          value={workerLocationMap[worker.id] ?? ''}
                          onChange={e => handleAssignWorkerLocation(worker.id, e.target.value || null)}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1.5px solid #D1D5DB', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-navy)', backgroundColor: '#fff', cursor: 'pointer' }}
                        >
                          <option value="">No location assigned</option>
                          {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.location_name}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>EHR / Scheduling Integrations</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Connect your existing scheduling system to sync visits automatically.
              </p>
              {[
                {
                  name: 'ClearCare',
                  logo: '🏥',
                  description: 'Sync client schedules, care plans, and billing from ClearCare (now WellSky Home Care).',
                  fieldLabel: 'ClearCare Agency ID',
                  value: agency.clearcare_id,
                },
                {
                  name: 'AlayaCare',
                  logo: '🩺',
                  description: 'Import visit schedules and care worker assignments from AlayaCare.',
                  fieldLabel: 'AlayaCare Agency ID',
                  value: agency.alayacare_id,
                },
                {
                  name: 'WellSky',
                  logo: '💊',
                  description: 'Sync home health records and care coordination data from WellSky.',
                  fieldLabel: 'WellSky Agency ID',
                  value: agency.wellsky_id,
                },
              ].map((integration) => (
                <div key={integration.name} style={{ border: '1px solid #E5E7EB', borderRadius: '10px', padding: '20px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '24px' }}>{integration.logo}</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--color-navy)' }}>{integration.name}</span>
                      {integration.value && (
                        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontFamily: 'var(--font-body)', fontWeight: 600, backgroundColor: '#D1FAE5', color: '#065F46' }}>Connected</span>
                      )}
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 12px' }}>{integration.description}</p>
                    {integration.value ? (
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        {integration.fieldLabel}: <strong>{integration.value}</strong>
                      </div>
                    ) : (
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>Not connected. Contact ThriveAtHome to configure this integration.</div>
                    )}
                  </div>
                  <button
                    onClick={() => alert(`${integration.name} integration coming soon. Contact ThriveAtHome to set up your API connection.`)}
                    style={{
                      marginLeft: '24px',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-navy)',
                      backgroundColor: '#fff',
                      color: 'var(--color-navy)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {integration.value ? 'Reconfigure' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>Email care clients</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
                Send a message to the family contacts of all care clients. Emails are delivered to the contact addresses on file.
              </p>
              {emailResult && <div style={{ marginBottom: '16px', padding: '10px 14px', backgroundColor: '#D1FAE5', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#065F46' }}>{emailResult}</div>}
              {emailError && <div style={{ marginBottom: '16px', padding: '10px 14px', backgroundColor: '#FEF3C7', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#78350F' }}>{emailError}</div>}
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  setEmailSending(true)
                  setEmailResult(null)
                  setEmailError(null)
                  try {
                    const res = await fetch('/api/agency/send-email', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ subject: emailSubject, message: emailMessage }),
                    })
                    const data = await res.json()
                    if (!res.ok) { setEmailError(data.error ?? 'Failed to send'); return }
                    setEmailResult(data.message ?? `Email sent to ${data.sent} contact${data.sent === 1 ? '' : 's'}.`)
                    setEmailSubject('')
                    setEmailMessage('')
                  } catch {
                    setEmailError('Network error — please try again')
                  } finally {
                    setEmailSending(false)
                  }
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div>
                  <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Subject *</label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    placeholder="e.g. Upcoming schedule change — please read"
                    style={{ width: '100%', padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: '15px', border: '1.5px solid #D4CFC8', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>Message *</label>
                  <textarea
                    required
                    rows={6}
                    value={emailMessage}
                    onChange={e => setEmailMessage(e.target.value)}
                    placeholder="Write your message here…"
                    style={{ width: '100%', padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: '15px', border: '1.5px solid #D4CFC8', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={emailSending}
                    style={{ padding: '11px 22px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'white', backgroundColor: emailSending ? '#8A9BB5' : 'var(--color-navy)', border: 'none', borderRadius: '8px', cursor: emailSending ? 'not-allowed' : 'pointer' }}
                  >
                    {emailSending ? 'Sending…' : 'Send to all care clients'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── DOCUMENTS TAB ── */}
        {activeTab === 'documents' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '4px' }}>Agency Documents</h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>Upload and share policies, care plans, and clinical documents with your care team.</p>
              </div>
              {!agencyDocsLoaded && (
                <button onClick={loadAgencyDocs}
                  style={{ padding: '10px 18px', backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer' }}>
                  Load documents
                </button>
              )}
            </div>

            <div style={{ backgroundColor: '#FFF9F0', border: '1px solid #F4C06A', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontFamily: 'var(--font-body)', fontSize: '13px', color: '#7A5C00' }}>
              ⚠️ Requires <strong>platform-documents</strong> Storage bucket in Supabase (private) and migration 053_platform_documents.sql.
            </div>

            {/* Upload form */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E8E4DC', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '14px' }}>Upload a document</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <input value={agencyDocForm.title} onChange={e => setAgencyDocForm(f => ({ ...f, title: e.target.value }))} placeholder="Document title (required)"
                  style={{ padding: '10px 14px', border: '1px solid #DDD', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', gridColumn: '1 / -1' }} />
                <input value={agencyDocForm.description} onChange={e => setAgencyDocForm(f => ({ ...f, description: e.target.value }))} placeholder="Description (optional)"
                  style={{ padding: '10px 14px', border: '1px solid #DDD', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', gridColumn: '1 / -1' }} />
                <select value={agencyDocForm.category} onChange={e => setAgencyDocForm(f => ({ ...f, category: e.target.value }))}
                  style={{ padding: '10px 14px', border: '1px solid #DDD', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', backgroundColor: 'white' }}>
                  <option value="policy">📋 Policy</option>
                  <option value="clinical">🩺 Clinical</option>
                  <option value="care_plan">📝 Care Plan</option>
                  <option value="form">📄 Form</option>
                  <option value="general">⭐ General</option>
                </select>
                <select value={agencyDocForm.visibility} onChange={e => setAgencyDocForm(f => ({ ...f, visibility: e.target.value }))}
                  style={{ padding: '10px 14px', border: '1px solid #DDD', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', backgroundColor: 'white' }}>
                  <option value="care_team">🩺 Care team only</option>
                  <option value="admins_only">🔒 Admins only</option>
                  <option value="members">👥 Clients &amp; families</option>
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <input type="file" accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg"
                  onChange={e => setAgencyDocFile(e.target.files?.[0] ?? null)}
                  style={{ fontFamily: 'var(--font-body)', fontSize: '14px' }} />
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>PDF, Word, Excel, or image — max 20 MB</p>
              </div>
              {agencyDocError && <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#D62828', marginBottom: '10px' }}>{agencyDocError}</p>}
              {agencyDocSuccess && <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#059669', marginBottom: '10px' }}>{agencyDocSuccess}</p>}
              <button onClick={handleAgencyDocUpload} disabled={agencyDocUploading}
                style={{ padding: '10px 20px', backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: agencyDocUploading ? 'not-allowed' : 'pointer', opacity: agencyDocUploading ? 0.7 : 1 }}>
                {agencyDocUploading ? 'Uploading…' : '⬆️ Upload Document'}
              </button>
            </div>

            {/* Document list */}
            {!agencyDocsLoaded ? (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>Click &quot;Load documents&quot; above to view uploaded files.</p>
            ) : agencyDocs.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>No documents uploaded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {agencyDocs.map(doc => (
                  <div key={doc.id} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '14px 18px', border: '1px solid #E8E4DC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</span>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: '#F0F0F0', color: '#666', flexShrink: 0 }}>
                          {doc.visibility === 'members' ? '👥 Families' : doc.visibility === 'care_team' ? '🩺 Care team' : '🔒 Admins'}
                        </span>
                      </div>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#999' }}>
                        {doc.file_name}{doc.file_size_bytes ? ` · ${fmtBytes(doc.file_size_bytes)}` : ''} · {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button onClick={() => handleAgencyDocDownload(doc.id, doc.file_name)}
                        style={{ padding: '7px 12px', backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}>
                        ⬇️
                      </button>
                      <button onClick={() => handleAgencyDocDelete(doc.id)}
                        style={{ padding: '7px 12px', backgroundColor: 'white', color: '#D62828', border: '1px solid #D62828', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}>
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
