'use client'

import { useState } from 'react'
import type { UniversityStudent, StudentVisitRow } from '@/lib/data/university'

const VISIT_TYPE_LABELS: Record<string, string> = {
  phone_call: 'Phone call',
  in_person_visit: 'In-person visit',
  virtual_event: 'Virtual event',
  reading_aloud: 'Reading aloud',
  tech_help: 'Tech help',
  other: 'Other',
}

interface Props {
  universityName: string
  adminName: string
  students: UniversityStudent[]
}

function getSemesterDefaults() {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  if (month >= 8) {
    return { start: `${year}-08-01`, end: `${year}-12-31`, label: `Fall ${year}` }
  }
  return { start: `${year}-01-01`, end: `${year}-05-31`, label: `Spring ${year}` }
}

export default function UniversityAdminPortal({ universityName, adminName, students }: Props) {
  const semester = getSemesterDefaults()
  const [semesterStart, setSemesterStart] = useState(semester.start)
  const [semesterEnd, setSemesterEnd] = useState(semester.end)
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null)
  const [studentVisits, setStudentVisits] = useState<Record<string, StudentVisitRow[]>>({})
  const [loadingVisits, setLoadingVisits] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState('')

  const totalStudents = students.length
  const totalHours = students.reduce((sum, s) => sum + (s.total_hours_logged ?? 0), 0)
  const activeStudents = students.filter((s) => s.status === 'active' || s.total_hours_logged > 0).length

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  async function loadVisitsForStudent(studentId: string) {
    if (studentVisits[studentId]) return
    setLoadingVisits(studentId)
    try {
      const res = await fetch(`/api/student/visits?studentId=${studentId}`)
      if (res.ok) {
        const data = await res.json()
        setStudentVisits((prev) => ({ ...prev, [studentId]: data.visits ?? [] }))
      }
    } finally {
      setLoadingVisits(null)
    }
  }

  async function toggleStudent(studentId: string) {
    if (expandedStudentId === studentId) {
      setExpandedStudentId(null)
      return
    }
    setExpandedStudentId(studentId)
    await loadVisitsForStudent(studentId)
  }

  async function downloadStudentPDF(student: UniversityStudent) {
    const visits = studentVisits[student.id]
    if (!visits) {
      await loadVisitsForStudent(student.id)
    }
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20

    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('Community Service Record', pageWidth / 2, 28, { align: 'center' })
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('ThriveAtHome — Intergenerational Volunteer Program', pageWidth / 2, 37, { align: 'center' })
    doc.setDrawColor(30, 58, 95)
    doc.setLineWidth(0.8)
    doc.line(margin, 42, pageWidth - margin, 42)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Student Information', margin, 52)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    const info = [
      ['Name', student.full_name],
      ['Email', student.email],
      ['University', student.university_name ?? universityName],
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

    const hours = Math.round((student.total_hours_logged ?? 0) * 10) / 10
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(26, 122, 106)
    doc.text(`Total: ${hours} hour${hours !== 1 ? 's' : ''} of verified community service`, margin, y)
    doc.setTextColor(0, 0, 0)
    y += 10

    doc.setLineWidth(0.4)
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    const allVisits = studentVisits[student.id] ?? []
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Service Visit Log', margin, y)
    y += 8

    doc.setFontSize(10)
    for (const visit of allVisits) {
      if (y > 260) { doc.addPage(); y = 20 }
      const durationHrs = (visit.duration_minutes / 60).toFixed(1)
      const typeLabel = VISIT_TYPE_LABELS[visit.visit_type] ?? visit.visit_type
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
    doc.text(`Generated by ThriveAtHome on ${new Date().toLocaleDateString()} — Issued to ${universityName}`, margin, y)

    const firstName = student.full_name.split(' ')[0].toLowerCase()
    doc.save(`service-record-${firstName}-${student.full_name.split(' ').slice(1).join('-').toLowerCase()}.pdf`)
  }

  async function handleExportCSV() {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (semesterStart) params.set('start', semesterStart)
      if (semesterEnd) params.set('end', semesterEnd)
      const res = await fetch(`/api/university-admin/export-csv?${params}`)
      if (!res.ok) {
        const data = await res.json()
        showToast(data.error ?? 'Export failed')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `semester-hours-${semesterStart}-to-${semesterEnd}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('CSV exported successfully')
    } finally {
      setExporting(false)
    }
  }

  async function signOut() {
    const { createClient } = await import('@/lib/supabase/client')
    const sb = createClient()
    await sb.auth.signOut()
    window.location.href = '/login'
  }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(250,250,245,0.65)' }}>
            {adminName}
          </span>
          <button
            onClick={signOut}
            style={{
              fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-cream)',
              background: 'none', border: '1.5px solid rgba(250,250,245,0.4)',
              borderRadius: 'var(--radius-md)', padding: '6px 16px', cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Header */}
      <div style={{ backgroundColor: 'var(--color-navy)', padding: '32px 32px 40px', color: 'var(--color-cream)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', opacity: 0.65, margin: '0 0 6px' }}>
            University Partner Portal
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, margin: '0 0 20px', color: 'var(--color-cream)' }}>
            {universityName}
          </h1>

          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', maxWidth: '640px' }}>
            {[
              { label: 'Total students', value: totalStudents },
              { label: 'Active volunteers', value: activeStudents },
              { label: 'Total hours logged', value: `${Math.round(totalHours * 10) / 10}h` },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
              }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', opacity: 0.7, margin: '0 0 4px' }}>{stat.label}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, margin: 0, color: 'var(--color-teal-light, #4DD9C0)' }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 32px 64px' }}>

        {/* Toast */}
        {toast && (
          <div style={{
            background: toast.includes('success') ? '#1a7a6a' : '#c62828',
            color: 'white', padding: '12px 20px', borderRadius: 'var(--radius-md)',
            marginBottom: '20px', fontFamily: 'var(--font-body)', fontSize: '15px',
          }}>
            {toast}
          </div>
        )}

        {/* Semester export section */}
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          marginBottom: '32px',
          border: '1px solid rgba(30,58,95,0.08)',
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: '0 0 16px', fontWeight: 500 }}>
            Export semester hours
          </h2>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
                From
              </label>
              <input
                type="date"
                value={semesterStart}
                onChange={(e) => setSemesterStart(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid rgba(30,58,95,0.25)', fontFamily: 'var(--font-body)', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
                To
              </label>
              <input
                type="date"
                value={semesterEnd}
                onChange={(e) => setSemesterEnd(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid rgba(30,58,95,0.25)', fontFamily: 'var(--font-body)', fontSize: '14px' }}
              />
            </div>
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              style={{
                fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600,
                backgroundColor: 'var(--color-teal)', color: 'white', border: 'none',
                borderRadius: 'var(--radius-md)', padding: '10px 24px', cursor: exporting ? 'not-allowed' : 'pointer',
                opacity: exporting ? 0.7 : 1, minHeight: '42px',
              }}
            >
              {exporting ? 'Exporting...' : 'Export semester hours (CSV)'}
            </button>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '10px 0 0' }}>
            Defaults to {semester.label}. Compatible with x2VOL, Track It Forward, and your university's service-hour tracking system.
          </p>
        </div>

        {/* Student roster */}
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(30,58,95,0.08)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(30,58,95,0.08)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: 0, fontWeight: 500 }}>
              Student roster — {totalStudents} student{totalStudents !== 1 ? 's' : ''}
            </h2>
          </div>

          {students.length === 0 ? (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)' }}>
                No students registered yet for {universityName}.
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                Students register at <strong>thriveatHome.com/student</strong> and enter their university name during signup.
              </p>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 1fr 1fr 80px 120px',
                padding: '10px 24px',
                background: 'rgba(30,58,95,0.04)',
                borderBottom: '1px solid rgba(30,58,95,0.08)',
              }}>
                {['Student', 'Major', 'Grad Year', 'Total Hours', 'Status', 'Actions'].map((h) => (
                  <span key={h} style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--color-navy)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </span>
                ))}
              </div>

              {students.map((student) => {
                const isExpanded = expandedStudentId === student.id
                const visits = studentVisits[student.id]
                const hours = Math.round((student.total_hours_logged ?? 0) * 10) / 10

                return (
                  <div key={student.id}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1.5fr 1fr 1fr 80px 120px',
                        padding: '14px 24px',
                        borderBottom: isExpanded ? 'none' : '1px solid rgba(30,58,95,0.05)',
                        alignItems: 'center',
                        backgroundColor: isExpanded ? 'rgba(30,58,95,0.03)' : 'white',
                        transition: 'background 0.15s',
                        cursor: 'pointer',
                      }}
                      onClick={() => toggleStudent(student.id)}
                    >
                      <div>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 2px' }}>
                          {student.full_name}
                        </p>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                          {student.email}
                        </p>
                      </div>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                        {student.major ?? '—'}
                      </span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                        {student.graduation_year ?? '—'}
                      </span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 500, color: hours > 0 ? 'var(--color-teal)' : 'var(--color-text-secondary)' }}>
                        {hours}h
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600,
                        color: student.status === 'active' ? '#1a7a6a' : '#888',
                        background: student.status === 'active' ? 'rgba(26,122,106,0.1)' : 'rgba(0,0,0,0.05)',
                        padding: '3px 8px', borderRadius: '99px', width: 'fit-content',
                      }}>
                        {student.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadStudentPDF(student)
                        }}
                        style={{
                          fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500,
                          color: 'var(--color-navy)', background: 'none',
                          border: '1.5px solid rgba(30,58,95,0.25)',
                          borderRadius: 'var(--radius-md)', padding: '5px 10px',
                          cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                      >
                        Download PDF
                      </button>
                    </div>

                    {/* Expanded visit history */}
                    {isExpanded && (
                      <div style={{
                        padding: '0 24px 20px 24px',
                        borderBottom: '1px solid rgba(30,58,95,0.05)',
                        background: 'rgba(30,58,95,0.03)',
                      }}>
                        {loadingVisits === student.id ? (
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', padding: '12px 0' }}>
                            Loading visits...
                          </p>
                        ) : !visits || visits.length === 0 ? (
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', padding: '12px 0' }}>
                            No visits logged yet.
                          </p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '12px' }}>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 4px' }}>
                              Visit history ({visits.length} visit{visits.length !== 1 ? 's' : ''})
                            </p>
                            {visits.map((v) => (
                              <div key={v.id} style={{
                                background: 'white', borderRadius: 'var(--radius-md)',
                                padding: '12px 16px', border: '1px solid rgba(30,58,95,0.08)',
                                display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap',
                              }}>
                                <div style={{ minWidth: '90px' }}>
                                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)' }}>
                                    {v.visit_date}
                                  </span>
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                                      {VISIT_TYPE_LABELS[v.visit_type] ?? v.visit_type}
                                    </span>
                                    <span style={{
                                      fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600,
                                      color: 'var(--color-teal)', background: 'rgba(26,122,106,0.08)',
                                      padding: '2px 8px', borderRadius: '99px',
                                    }}>
                                      {(v.duration_minutes / 60).toFixed(1)}h
                                    </span>
                                    {v.verified && (
                                      <span style={{
                                        fontFamily: 'var(--font-body)', fontSize: '11px',
                                        color: '#1a7a6a', background: 'rgba(26,122,106,0.12)',
                                        padding: '2px 8px', borderRadius: '99px',
                                      }}>
                                        Verified
                                      </span>
                                    )}
                                  </div>
                                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                    {v.reflection}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* University account info */}
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          marginTop: '24px',
          border: '1px solid rgba(30,58,95,0.08)',
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: '0 0 12px', fontWeight: 500 }}>
            University account
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 2px' }}>Institution</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0 }}>{universityName}</p>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 2px' }}>Administrator</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0 }}>{adminName}</p>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 2px' }}>Students register at</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-teal)', margin: 0 }}>thriveatHome.com/student</p>
            </div>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '16px 0 0', lineHeight: 1.5 }}>
            Students self-register at /student and enter your institution name exactly as shown above to appear in this roster. Contact support to update your university name or add additional admin accounts.
          </p>
        </div>
      </main>
    </div>
  )
}
