'use client'

import { useState } from 'react'
import type { StudentVolunteer, StudentVisit } from '@/lib/data/students'

const VISIT_TYPES = [
  { value: 'phone_call', label: 'Phone call' },
  { value: 'in_person_visit', label: 'In-person visit' },
  { value: 'virtual_event', label: 'Virtual event' },
  { value: 'reading_aloud', label: 'Reading aloud' },
  { value: 'tech_help', label: 'Tech help' },
  { value: 'other', label: 'Other' },
]

interface Props {
  student: StudentVolunteer
  initialVisits: StudentVisit[]
}

export default function StudentPortal({ student, initialVisits }: Props) {
  const [visits, setVisits] = useState<StudentVisit[]>(initialVisits)
  const [totalHours, setTotalHours] = useState(student.total_hours_logged)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    durationMinutes: 60,
    visitType: 'phone_call',
    reflection: '',
    notes: '',
  })

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.reflection.trim()) {
      showToast('Reflection is required for service credit.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/student/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        showToast(data.error ?? 'Failed to log visit')
        return
      }
      const addedHours = form.durationMinutes / 60
      setTotalHours((h) => h + addedHours)
      const newVisit: StudentVisit = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        visit_date: form.visitDate,
        duration_minutes: form.durationMinutes,
        visit_type: form.visitType,
        reflection: form.reflection,
        notes: form.notes || null,
        verified: false,
      }
      setVisits((v) => [newVisit, ...v])
      setForm({ visitDate: new Date().toISOString().split('T')[0], durationMinutes: 60, visitType: 'phone_call', reflection: '', notes: '' })
      setShowForm(false)
      showToast('Visit logged successfully')
    } finally {
      setSaving(false)
    }
  }

  async function handleDownloadPDF() {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()

    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20

    // Header
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('Community Service Record', pageWidth / 2, 28, { align: 'center' })

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('ThriveAtHome — Intergenerational Volunteer Program', pageWidth / 2, 37, { align: 'center' })

    // Divider
    doc.setDrawColor(30, 58, 95)
    doc.setLineWidth(0.8)
    doc.line(margin, 42, pageWidth - margin, 42)

    // Student info
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Student Information', margin, 52)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    const info = [
      ['Name', student.full_name],
      ['Email', student.email],
      ['University', student.university_name ?? 'Not specified'],
      ['Major', student.major ?? 'Not specified'],
      ['Graduation Year', student.graduation_year ? String(student.graduation_year) : 'Not specified'],
    ]
    let y = 60
    for (const [label, value] of info) {
      doc.setFont('helvetica', 'bold')
      doc.text(`${label}:`, margin, y)
      doc.setFont('helvetica', 'normal')
      doc.text(value, margin + 38, y)
      y += 8
    }

    y += 4
    doc.setLineWidth(0.4)
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    // Total hours
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(26, 122, 106)
    const hours = Math.round(totalHours * 10) / 10
    doc.text(`Total: ${hours} hour${hours !== 1 ? 's' : ''} of verified community service`, margin, y)
    doc.setTextColor(0, 0, 0)
    y += 10

    doc.setLineWidth(0.4)
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    // Visit log
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Service Visit Log', margin, y)
    y += 8

    doc.setFontSize(10)
    for (const visit of visits) {
      if (y > 260) {
        doc.addPage()
        y = 20
      }
      const durationHrs = (visit.duration_minutes / 60).toFixed(1)
      const typeLabel = VISIT_TYPES.find((t) => t.value === visit.visit_type)?.label ?? visit.visit_type
      doc.setFont('helvetica', 'bold')
      doc.text(`${visit.visit_date}  —  ${typeLabel}  (${durationHrs}h)`, margin, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      const reflectionLines = doc.splitTextToSize(visit.reflection, pageWidth - margin * 2)
      doc.text(reflectionLines, margin, y)
      y += reflectionLines.length * 5 + 6
    }

    y += 4
    doc.setDrawColor(30, 58, 95)
    doc.setLineWidth(0.6)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.text(`Generated by ThriveAtHome on ${new Date().toLocaleDateString()}`, margin, y)

    const firstName = student.full_name.split(' ')[0].toLowerCase()
    doc.save(`service-record-${firstName}.pdf`)
  }

  const hoursDisplay = Math.round(totalHours * 10) / 10

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      {/* Nav */}
      <nav style={{
        backgroundColor: 'var(--color-navy)',
        padding: '0 32px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500 }}>
          ThriveAtHome
        </span>
        <button
          onClick={async () => {
            const { createClient } = await import('@/lib/supabase/client')
            const sb = createClient()
            await sb.auth.signOut()
            window.location.href = '/login'
          }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '15px',
            color: 'var(--color-cream)',
            background: 'none',
            border: '1.5px solid rgba(250,250,245,0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 16px',
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </nav>

      {/* Hero header */}
      <div style={{ backgroundColor: 'var(--color-navy)', padding: '32px 32px 40px', color: 'var(--color-cream)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', opacity: 0.7, marginBottom: '6px' }}>
            Student Volunteer Portal
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, margin: '0 0 16px', color: 'var(--color-cream)' }}>
            Welcome, {student.full_name.split(' ')[0]}
          </h1>
          {student.university_name && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', opacity: 0.75 }}>
              {student.university_name}{student.major ? ` · ${student.major}` : ''}
            </p>
          )}

          {/* Hours stat */}
          <div style={{
            marginTop: '24px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            display: 'inline-block',
            minWidth: '280px',
          }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', opacity: 0.7, margin: 0 }}>
              Verified community service
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '42px', fontWeight: 500, margin: '4px 0 0', color: 'var(--color-teal-light, #4DD9C0)' }}>
              {hoursDisplay}h
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', opacity: 0.7, margin: '2px 0 0' }}>
              across {visits.length} visit{visits.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 32px 64px' }}>

        {/* Actions bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              fontWeight: 500,
              backgroundColor: 'var(--color-teal)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '12px 24px',
              cursor: 'pointer',
              minHeight: '48px',
            }}
          >
            {showForm ? 'Cancel' : '+ Log a visit'}
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{
            background: toast.includes('success') || toast.includes('logged') ? '#1a7a6a' : '#c62828',
            color: 'white',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            fontFamily: 'var(--font-body)',
            fontSize: '15px',
          }}>
            {toast}
          </div>
        )}

        {/* Log visit form */}
        {showForm && (
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            marginBottom: '28px',
            border: '1px solid rgba(30,58,95,0.1)',
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', marginBottom: '24px', fontWeight: 500 }}>
              Log a service visit
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                {/* Date */}
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
                    Date of visit
                  </label>
                  <input
                    type="date"
                    value={form.visitDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setForm((f) => ({ ...f, visitDate: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid rgba(30,58,95,0.25)', fontFamily: 'var(--font-body)', fontSize: '15px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Duration */}
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
                    Duration
                  </label>
                  <select
                    value={form.durationMinutes}
                    onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid rgba(30,58,95,0.25)', fontFamily: 'var(--font-body)', fontSize: '15px', boxSizing: 'border-box' }}
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                    <option value={240}>4 hours</option>
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
                    Type of service
                  </label>
                  <select
                    value={form.visitType}
                    onChange={(e) => setForm((f) => ({ ...f, visitType: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid rgba(30,58,95,0.25)', fontFamily: 'var(--font-body)', fontSize: '15px', boxSizing: 'border-box' }}
                  >
                    {VISIT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reflection — required for credit */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
                  Reflection <span style={{ color: '#c62828' }}>*</span>
                  <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', marginLeft: '4px' }}>(required for service credit)</span>
                </label>
                <textarea
                  value={form.reflection}
                  onChange={(e) => setForm((f) => ({ ...f, reflection: e.target.value }))}
                  placeholder="What did you do during this visit? What did you learn? How did it impact the person you helped?"
                  required
                  rows={4}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid rgba(30,58,95,0.25)', fontFamily: 'var(--font-body)', fontSize: '15px', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              {/* Optional notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
                  Additional notes <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any other notes for your advisor..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid rgba(30,58,95,0.25)', fontFamily: 'var(--font-body)', fontSize: '15px', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '16px',
                  fontWeight: 500,
                  backgroundColor: 'var(--color-teal)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 28px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  minHeight: '48px',
                }}
              >
                {saving ? 'Saving...' : 'Submit visit'}
              </button>
            </form>
          </div>
        )}

        {/* Service visit history */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-navy)', marginBottom: '20px', fontWeight: 500 }}>
            Service visit history
          </h2>

          {visits.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              padding: '48px 32px',
              textAlign: 'center',
              border: '1px dashed rgba(30,58,95,0.2)',
            }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)' }}>
                No visits logged yet. Log your first service visit above.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {visits.map((visit) => {
                const durationHrs = (visit.duration_minutes / 60).toFixed(1)
                const typeLabel = VISIT_TYPES.find((t) => t.value === visit.visit_type)?.label ?? visit.visit_type
                return (
                  <div
                    key={visit.id}
                    style={{
                      background: 'white',
                      borderRadius: 'var(--radius-lg)',
                      padding: '20px 24px',
                      border: '1px solid rgba(30,58,95,0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)' }}>
                          {new Date(visit.visit_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginLeft: '12px' }}>
                          {typeLabel}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--color-teal)',
                          background: 'rgba(26,122,106,0.08)',
                          padding: '3px 10px',
                          borderRadius: '99px',
                        }}>
                          {durationHrs}h
                        </span>
                        {visit.verified && (
                          <span style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '12px',
                            color: '#1a7a6a',
                            background: 'rgba(26,122,106,0.12)',
                            padding: '2px 8px',
                            borderRadius: '99px',
                          }}>
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
                      {visit.reflection}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Service hours summary banner when 0 */}
        {visits.length > 0 && (
          <div style={{
            marginTop: '32px',
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
              {hoursDisplay} hours of verified community service
            </p>
            <button
              onClick={handleDownloadPDF}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                fontWeight: 500,
                backgroundColor: '#1a7a6a',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '10px 20px',
                cursor: 'pointer',
                minHeight: '44px',
              }}
            >
              Download service record
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
