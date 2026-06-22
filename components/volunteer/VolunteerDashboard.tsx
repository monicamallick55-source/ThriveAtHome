'use client'
import { useState, useEffect } from 'react'
import type { Volunteer, PrivateMemberView, VolunteerVisit } from '@/lib/data/volunteers'
import type { VisitType } from '@/types/database'

interface CorporateProgramData {
  program_name: string
  employer_name: string
  matching_rate_per_hour: number
  annual_hour_cap_per_employee: number | null
  tier: string
}

function CorporateProgramCard({ volunteerId, programId, totalHours, annualCapHours }: {
  volunteerId: string
  programId: string
  totalHours: number
  annualCapHours: number
}) {
  const [program, setProgram] = useState<CorporateProgramData | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetch(`/api/corporate-volunteer-programs/${programId}`)
      .then((r) => r.json())
      .then((d) => { if (d.program) setProgram(d.program) })
      .catch(() => null)
  }, [programId])

  const cap = program?.annual_hour_cap_per_employee ?? annualCapHours
  const remaining = Math.max(0, cap - totalHours)
  const matchValue = totalHours * (program?.matching_rate_per_hour ?? 15)
  const pct = cap > 0 ? Math.min(100, Math.round((totalHours / cap) * 100)) : 0

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/employer-admin/volunteer-export?format=benevity&volunteerId=${volunteerId}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'my-volunteer-hours.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silently fail — user can try again
    } finally {
      setDownloading(false)
    }
  }

  if (!program) return null

  return (
    <div style={{ backgroundColor: '#EEF7F9', border: '1.5px solid var(--color-teal)', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-teal)', margin: '0 0 4px' }}>
            Corporate Volunteer Program
          </p>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
            {program.program_name}
          </h3>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'white', backgroundColor: 'var(--color-teal)', border: 'none', borderRadius: '8px', padding: '10px 16px', cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading ? 0.7 : 1, whiteSpace: 'nowrap' }}
        >
          {downloading ? 'Preparing…' : '⬇ Download my hours statement'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginTop: '20px' }}>
        {[
          { label: 'Hours logged this year', value: `${totalHours.toFixed(1)} hrs` },
          { label: `Remaining (${cap}hr cap)`, value: `${remaining.toFixed(1)} hrs` },
          { label: 'Estimated match value', value: `$${matchValue.toFixed(0)}` },
        ].map(({ label, value }) => (
          <div key={label} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '16px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#7A7268', margin: '0 0 6px', letterSpacing: '0.04em' }}>{label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-navy)', margin: 0, fontWeight: 500 }}>{value}</p>
          </div>
        ))}
      </div>
      {cap > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#7A7268' }}>Progress toward annual cap</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-teal)' }}>{pct}%</span>
          </div>
          <div style={{ height: '8px', backgroundColor: '#D4F0F5', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--color-teal)', borderRadius: '4px', transition: 'width 0.6s ease' }} />
          </div>
        </div>
      )}
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#7A7268', margin: '14px 0 0' }}>
        Your employer matches ${program.matching_rate_per_hour.toFixed(0)}/hr as a cash donation to ThriveAtHome.
      </p>
    </div>
  )
}


const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  phone_call: 'Phone call',
  in_person_visit: 'In-person visit',
  virtual_event: 'Virtual event',
  grocery_help: 'Grocery help',
  walking_companion: 'Walking companion',
  reading_aloud: 'Reading aloud',
  tech_help: 'Tech help',
}

const VISIT_TYPES: VisitType[] = [
  'phone_call', 'in_person_visit', 'virtual_event',
  'grocery_help', 'walking_companion', 'reading_aloud', 'tech_help',
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })
}

function formatHours(h: number) {
  if (h < 1) return `${Math.round(h * 60)} min`
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
}

interface Props {
  volunteer: Volunteer
  matchedMembers: PrivateMemberView[]
  recentVisits: VolunteerVisit[]
  membersHelpedCount: number
}

export function VolunteerDashboard({ volunteer, matchedMembers, recentVisits: initialVisits, membersHelpedCount }: Props) {
  const [visits, setVisits] = useState<VolunteerVisit[]>(initialVisits)
  const [totalHours, setTotalHours] = useState(Number(volunteer.total_hours_logged ?? 0))
  const [membersHelped, setMembersHelped] = useState(membersHelpedCount)
  const [showLogForm, setShowLogForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [connectionsHighlight, setConnectionsHighlight] = useState(false)
  const [form, setForm] = useState({
    member_id: matchedMembers[0]?.id ?? '',
    visit_date: new Date().toISOString().slice(0, 10),
    duration_minutes: 60,
    visit_type: 'phone_call' as VisitType,
    volunteer_notes: '',
    volunteer_rating: 5,
  })

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  async function handleLogVisit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.member_id) { showToast('Please select a member.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/volunteer/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) {
        showToast(json.error ?? 'Failed to log visit.')
      } else {
        const addedHours = form.duration_minutes / 60
        setTotalHours(prev => prev + addedHours)
        // Update members helped if this member wasn't in previous visits
        const existingMemberIds = new Set(visits.map(v => v.member_id))
        if (!existingMemberIds.has(form.member_id)) {
          setMembersHelped(prev => prev + 1)
        }
        setShowLogForm(false)
        showToast('Visit logged successfully.')
        // Add to top of visit list optimistically
        const fakeVisit: VolunteerVisit = {
          id: `temp-${Date.now()}`,
          created_at: new Date().toISOString(),
          volunteer_id: volunteer.id,
          member_id: form.member_id,
          visit_date: form.visit_date,
          duration_minutes: form.duration_minutes,
          visit_type: form.visit_type,
          volunteer_notes: form.volunteer_notes || null,
          volunteer_rating: form.volunteer_rating || null,
          member_rating: null,
          verified: false,
        }
        setVisits(prev => [fakeVisit, ...prev])
        setForm(f => ({ ...f, volunteer_notes: '', duration_minutes: 60, visit_type: 'phone_call' }))
      }
    } catch {
      showToast('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSignOut() {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  async function handleDownloadPDF() {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20

    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('Volunteer Service Record', pageWidth / 2, 28, { align: 'center' })
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('ThriveAtHome — Volunteer Program', pageWidth / 2, 37, { align: 'center' })

    doc.setDrawColor(30, 58, 95)
    doc.setLineWidth(0.8)
    doc.line(margin, 42, pageWidth - margin, 42)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Volunteer Information', margin, 52)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    let y = 60
    for (const [label, value] of [
      ['Name', volunteer.full_name],
      ['Email', volunteer.email],
      ['City', volunteer.city ?? 'Not specified'],
    ]) {
      doc.setFont('helvetica', 'bold')
      doc.text(`${label}:`, margin, y)
      doc.setFont('helvetica', 'normal')
      doc.text(value, margin + 28, y)
      y += 8
    }

    y += 4
    doc.setLineWidth(0.4)
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(26, 122, 106)
    doc.text(`Total: ${formatHours(totalHours)} of volunteer service`, margin, y)
    doc.setTextColor(0, 0, 0)
    y += 10

    doc.setLineWidth(0.4)
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Visit Log', margin, y)
    y += 8
    doc.setFontSize(10)
    for (const v of visits) {
      if (y > 260) { doc.addPage(); y = 20 }
      const durationHrs = (v.duration_minutes / 60).toFixed(1)
      const typeLabel = VISIT_TYPE_LABELS[v.visit_type] ?? v.visit_type
      doc.setFont('helvetica', 'bold')
      doc.text(`${v.visit_date}  —  ${typeLabel}  (${durationHrs}h)`, margin, y)
      y += 6
      if (v.volunteer_notes) {
        doc.setFont('helvetica', 'normal')
        const noteLines = doc.splitTextToSize(v.volunteer_notes, pageWidth - margin * 2)
        doc.text(noteLines, margin, y)
        y += noteLines.length * 5 + 4
      } else {
        y += 2
      }
    }

    y += 4
    doc.setDrawColor(30, 58, 95)
    doc.setLineWidth(0.6)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.text(`Generated by ThriveAtHome on ${new Date().toLocaleDateString()}`, margin, y)

    const firstName = volunteer.full_name.split(' ')[0].toLowerCase()
    doc.save(`volunteer-record-${firstName}.pdf`)
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: 'var(--font-body)', fontSize: '15px',
    fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', height: '48px', padding: '0 14px',
    border: '1.5px solid var(--color-warm-grey)', borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text)',
    backgroundColor: 'white', boxSizing: 'border-box',
  }
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white', border: '1px solid var(--color-warm-grey)',
    borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '16px',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      {toast && (
        <div role="alert" style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 100, padding: '14px 20px', backgroundColor: 'var(--color-navy)', color: 'white', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '15px', boxShadow: 'var(--shadow-lg)', maxWidth: '360px' }}>
          {toast}
        </div>
      )}

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'var(--color-navy)', height: '64px', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 32px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>
            Volunteer Portal
          </span>
          <button
            onClick={handleSignOut}
            style={{ height: '40px', padding: '0 18px', backgroundColor: 'transparent', color: 'rgba(250,250,245,0.75)', border: '1px solid rgba(250,250,245,0.3)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '15px', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </nav>

      {/* Header */}
      <header style={{ backgroundColor: 'var(--color-navy)', padding: '24px 0 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 32px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', color: 'var(--color-cream)', fontWeight: 500, marginBottom: '4px' }}>
            Welcome, {volunteer.full_name.split(' ')[0]}
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(250,250,245,0.7)' }}>
            Thank you for your service to our community.
          </p>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '1100px', margin: '0 auto', padding: '32px', width: '100%' }}>
        {/* Impact stats */}
        {/* Corporate Program card — shown only for volunteers linked to a corporate program */}
        {volunteer.corporate_program_id && (
          <CorporateProgramCard
            volunteerId={volunteer.id}
            programId={volunteer.corporate_program_id}
            totalHours={totalHours}
            annualCapHours={40}
          />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {[
            { label: 'Total hours', value: formatHours(totalHours), anchor: null },
            { label: 'Members helped', value: String(membersHelped), anchor: null },
            { label: 'Your connections', value: String(matchedMembers.length), anchor: 'connections-section' },
            { label: 'Visits logged', value: String(visits.length), anchor: null },
          ].map(stat => (
            <div
              key={stat.label}
              onClick={stat.anchor ? () => {
                const el = document.getElementById(stat.anchor!)
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  setConnectionsHighlight(true)
                  setTimeout(() => setConnectionsHighlight(false), 1400)
                }
              } : undefined}
              role={stat.anchor ? 'link' : undefined}
              tabIndex={stat.anchor ? 0 : undefined}
              onKeyDown={stat.anchor ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  const el = document.getElementById(stat.anchor!)
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    setConnectionsHighlight(true)
                    setTimeout(() => setConnectionsHighlight(false), 1400)
                  }
                }
              } : undefined}
              style={{ ...cardStyle, textAlign: 'center', padding: '28px 16px', marginBottom: 0, cursor: stat.anchor ? 'pointer' : 'default', transition: 'box-shadow 0.15s', ...(stat.anchor ? { outline: 'none' } : {}) }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '36px', color: 'var(--color-teal)', fontWeight: 500, marginBottom: '4px' }}>{stat.value}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>
                {stat.label}{stat.anchor ? ' ↓' : ''}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Left: connections + log visit */}
          <div>
            {/* Your connections */}
            <div
              id="connections-section"
              style={{
                marginBottom: '32px',
                transition: 'outline 0.15s',
                outline: connectionsHighlight ? '3px solid var(--color-teal)' : '3px solid transparent',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-navy)', fontWeight: 500, marginBottom: '16px' }}>
                Your connections
              </h2>
              {matchedMembers.length === 0 ? (
                <div style={{ ...cardStyle, textAlign: 'center', padding: '32px' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)' }}>
                    You haven&apos;t been matched with any members yet. Check back soon.
                  </p>
                </div>
              ) : (
                matchedMembers.map(m => (
                  <div key={m.id} style={cardStyle}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', fontWeight: 500, marginBottom: '4px' }}>
                      {m.displayName}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                      {m.preferred_language !== 'english' ? `Primary language: ${m.preferred_language}` : 'English speaker'}
                      {m.matchedAt ? ` · Matched ${formatDate(m.matchedAt)}` : ''}
                    </p>
                    {m.topics_enjoy.length > 0 && (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                        Enjoys: {m.topics_enjoy.slice(0, 3).join(', ')}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Log a visit */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-navy)', fontWeight: 500, margin: 0 }}>
                  Log a visit
                </h2>
                {!showLogForm && matchedMembers.length > 0 && (
                  <button
                    onClick={() => setShowLogForm(true)}
                    style={{ height: '40px', padding: '0 20px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500, cursor: 'pointer' }}>
                    + Log visit
                  </button>
                )}
              </div>

              {matchedMembers.length === 0 && (
                <div style={{ ...cardStyle, padding: '24px' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)' }}>
                    You&apos;ll be able to log visits once you&apos;ve been matched with a member.
                  </p>
                </div>
              )}

              {showLogForm && (
                <form onSubmit={handleLogVisit} style={cardStyle}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Member</label>
                    <select
                      value={form.member_id}
                      onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))}
                      required
                      style={inputStyle}>
                      {matchedMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.displayName}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Visit date</label>
                    <input
                      type="date"
                      value={form.visit_date}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={e => setForm(f => ({ ...f, visit_date: e.target.value }))}
                      required
                      style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Duration (minutes)</label>
                    <select
                      value={form.duration_minutes}
                      onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                      required
                      style={inputStyle}>
                      {[15, 30, 45, 60, 90, 120, 180, 240].map(m => (
                        <option key={m} value={m}>{m} min</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Type of visit</label>
                    <select
                      value={form.visit_type}
                      onChange={e => setForm(f => ({ ...f, visit_type: e.target.value as VisitType }))}
                      required
                      style={inputStyle}>
                      {VISIT_TYPES.map(vt => (
                        <option key={vt} value={vt}>{VISIT_TYPE_LABELS[vt]}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Notes (optional)</label>
                    <textarea
                      value={form.volunteer_notes}
                      onChange={e => setForm(f => ({ ...f, volunteer_notes: e.target.value }))}
                      rows={3}
                      placeholder="How did the visit go?"
                      style={{ ...inputStyle, height: 'auto', padding: '12px 14px', resize: 'vertical' }} />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={labelStyle}>How did this visit feel? (1–5)</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {[1, 2, 3, 4, 5].map(r => (
                        <label key={r} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="rating"
                            value={r}
                            checked={form.volunteer_rating === r}
                            onChange={() => setForm(f => ({ ...f, volunteer_rating: r }))}
                            style={{ width: '20px', height: '20px' }} />
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{r}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{ height: '48px', padding: '0 28px', backgroundColor: submitting ? 'var(--color-warm-grey)' : 'var(--color-teal)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 500, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                      {submitting ? 'Logging…' : 'Save visit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLogForm(false)}
                      style={{ height: '48px', padding: '0 24px', backgroundColor: 'white', color: 'var(--color-text-secondary)', border: '1.5px solid var(--color-warm-grey)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '16px', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right: visit history */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-navy)', fontWeight: 500, marginBottom: '16px' }}>
              Visit history
            </h2>
            {visits.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 24px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)' }}>
                  No visits logged yet. Log your first visit to track your impact.
                </p>
              </div>
            ) : (
              visits.map(v => {
                const memberName = matchedMembers.find(m => m.id === v.member_id)?.displayName ?? 'Member'
                return (
                  <div key={v.id} style={{ ...cardStyle, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--color-navy)', margin: 0 }}>
                        {memberName}
                      </p>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                        {formatDate(v.visit_date)}
                      </span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>
                      {VISIT_TYPE_LABELS[v.visit_type]} · {formatHours(v.duration_minutes / 60)}
                      {v.volunteer_rating ? ` · ${v.volunteer_rating}/5` : ''}
                    </p>
                    {v.volunteer_notes && (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text)', fontStyle: 'italic', margin: 0, marginTop: '4px' }}>
                        &ldquo;{v.volunteer_notes}&rdquo;
                      </p>
                    )}
                  </div>
                )
              })
            )}

            {/* Service hours summary — download service record */}
            <div style={{
              marginTop: '20px',
              background: 'rgba(26,122,106,0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#1a7a6a', margin: 0, fontWeight: 500 }}>
                {visits.length === 0
                  ? 'Log your first visit to start tracking your hours'
                  : `${formatHours(totalHours)} of volunteer service`}
              </p>
              <button
                onClick={handleDownloadPDF}
                disabled={visits.length === 0}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '15px',
                  fontWeight: 500,
                  backgroundColor: visits.length === 0 ? '#999' : '#1a7a6a',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 20px',
                  cursor: visits.length === 0 ? 'not-allowed' : 'pointer',
                  minHeight: '44px',
                  opacity: visits.length === 0 ? 0.6 : 1,
                }}
              >
                Download service record
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
