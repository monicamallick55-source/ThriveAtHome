'use client'

// Clinical Notes tab for the Agency Admin portal — SOAP notes and care plan versioning.
import { useState, useCallback } from 'react'
type SoapNoteRow = any
type CarePlanVersionRow = any
import { HOME_HEALTH_BILLING_CODES } from '@/lib/data/clinicalDocs'

interface MemberSummary {
  id: string
  preferred_name: string
  full_name: string
}

interface ClinicalNotesTabProps {
  agencyId: string
  members: MemberSummary[]
  signerName?: string
}

type SubTab = 'soap' | 'care-plans'

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  draft:    { bg: '#FEF3C7', color: '#92400E', label: 'Draft' },
  signed:   { bg: '#D1FAE5', color: '#065F46', label: 'Signed' },
  locked:   { bg: '#F3F4F6', color: '#4B5563', label: 'Locked' },
}

const PLAN_STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  draft:      { bg: '#FEF3C7', color: '#92400E', label: 'Draft' },
  active:     { bg: '#D1FAE5', color: '#065F46', label: 'Active' },
  superseded: { bg: '#F3F4F6', color: '#4B5563', label: 'Superseded' },
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  const [y, mo, da] = d.split('T')[0].split('-').map(Number)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[mo - 1]} ${da}, ${y}`
}

export default function ClinicalNotesTab({ agencyId, members, signerName }: ClinicalNotesTabProps) {
  const [selectedMember, setSelectedMember] = useState<MemberSummary | null>(null)
  const [subTab, setSubTab] = useState<SubTab>('soap')

  const [notes, setNotes] = useState<SoapNoteRow[]>([])
  const [plans, setPlans] = useState<CarePlanVersionRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showNoteForm, setShowNoteForm] = useState(false)
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)

  const loadClinicalData = useCallback(async (member: MemberSummary) => {
    setLoading(true)
    setError(null)
    try {
      const [notesRes, plansRes] = await Promise.all([
        fetch(`/api/agency/clinical?memberId=${member.id}&agencyId=${agencyId}`),
        fetch(`/api/agency/clinical/care-plans?memberId=${member.id}&agencyId=${agencyId}`),
      ])
      const notesJson = await notesRes.json()
      const plansJson = await plansRes.json()
      setNotes(notesJson.data ?? [])
      setPlans(plansJson.data ?? [])
    } catch (e) {
      setError('Failed to load clinical data')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [agencyId])

  function selectMember(m: MemberSummary) {
    setSelectedMember(m)
    setExpandedNoteId(null)
    setShowNoteForm(false)
    setShowPlanForm(false)
    loadClinicalData(m)
  }

  async function handleNoteAction(noteId: string, action: 'sign' | 'lock' | 'delete') {
    if (!selectedMember) return
    if (action === 'delete' && !confirm('Delete this draft note? This cannot be undone.')) return

    if (action === 'delete') {
      const res = await fetch(`/api/agency/clinical/${noteId}`, { method: 'DELETE' })
      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== noteId))
        setExpandedNoteId(null)
      }
      return
    }

    const res = await fetch(`/api/agency/clinical/${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, signer_name: signerName || 'Agency Admin' }),
    })
    if (res.ok) {
      const json = await res.json()
      setNotes(prev => prev.map((n: any) => n.id === noteId ? json.data : n))
    }
  }

  async function handleApprovePlan(planId: string) {
    if (!selectedMember) return
    const res = await fetch('/api/agency/clinical/care-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: selectedMember.id,
        agency_id: agencyId,
        action: 'approve',
        plan_id: planId,
        approver_name: signerName || 'Agency Admin',
      }),
    })
    if (res.ok) {
      const json = await res.json()
      setPlans(prev => prev.map((p: any) => {
        if (p.id === planId) return json.data
        if (p.status === 'active') return { ...p, status: 'superseded' }
        return p
      }))
    }
  }

  async function exportClinical(type: 'soap' | 'care-plans') {
    if (!selectedMember) return
    try {
      const res = await fetch(
        `/api/agency/clinical/export?memberId=${selectedMember.id}&agencyId=${agencyId}&type=${type}`
      )
      if (!res.ok) {
        const errText = await res.text()
        let msg = 'Export failed'
        try { msg = JSON.parse(errText).error ?? msg } catch { /* non-JSON error */ }
        setError(msg)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = type === 'care-plans'
        ? `care-plans-${selectedMember.preferred_name}.csv`
        : `soap-notes-${selectedMember.preferred_name}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      setError('Failed to export CSV')
      console.error('[ClinicalNotesTab/exportClinical]', e)
    }
  }

  return (
    <div>
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>
          Clinical Documentation
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
          SOAP notes, care plan versioning, and Medicare billing code documentation.
        </p>

        {/* Member selector */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
            Select Client
          </label>
          <select
            value={selectedMember?.id ?? ''}
            onChange={e => {
              const m = members.find(x => x.id === e.target.value)
              if (m) selectMember(m)
              else { setSelectedMember(null); setNotes([]); setPlans([]) }
            }}
            style={{ width: '100%', maxWidth: '360px', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-navy)', backgroundColor: '#fff', cursor: 'pointer' }}
          >
            <option value="">— Select a client —</option>
            {members.map((m: any) => (
              <option key={m.id} value={m.id}>{m.preferred_name} ({m.full_name})</option>
            ))}
          </select>
        </div>

        {!selectedMember && (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', fontSize: '15px' }}>
            Select a client above to view or create clinical documentation.
          </div>
        )}

        {selectedMember && loading && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>Loading…</div>
        )}

        {selectedMember && !loading && (
          <div>
            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #E5E7EB', marginBottom: '24px' }}>
              {(['soap', 'care-plans'] as SubTab[]).map((t: any) => (
                <button
                  key={t}
                  onClick={() => setSubTab(t)}
                  style={{
                    padding: '10px 20px',
                    background: 'none',
                    border: 'none',
                    borderBottom: subTab === t ? '2px solid var(--color-navy)' : '2px solid transparent',
                    marginBottom: '-2px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    fontWeight: subTab === t ? 600 : 400,
                    color: subTab === t ? 'var(--color-navy)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {t === 'soap' ? 'SOAP Notes' : 'Care Plans'}
                </button>
              ))}
            </div>

            {/* SOAP Notes */}
            {subTab === 'soap' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)' }}>
                    {selectedMember.preferred_name}&apos;s SOAP Notes ({notes.length})
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => exportClinical('soap')} style={secondaryBtnStyle}>
                      Export CSV
                    </button>
                    <button onClick={() => setShowNoteForm(true)} style={primaryBtnStyle}>
                      + New Note
                    </button>
                  </div>
                </div>

                {showNoteForm && (
                  <SoapNoteForm
                    memberId={selectedMember.id}
                    agencyId={agencyId}
                    onSave={(note) => { setNotes(prev => [note, ...prev]); setShowNoteForm(false) }}
                    onCancel={() => setShowNoteForm(false)}
                  />
                )}

                {error && (
                  <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#991B1B', fontFamily: 'var(--font-body)', fontSize: '14px', marginBottom: '16px' }}>
                    {error}
                  </div>
                )}

                {notes.length === 0 && !showNoteForm && (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', fontSize: '15px', border: '1.5px dashed #D1D5DB', borderRadius: '10px' }}>
                    No SOAP notes yet. Create the first note for {selectedMember.preferred_name}.
                  </div>
                )}

                {notes.map((note: any) => {
                  const badge = STATUS_BADGE[note.status] ?? STATUS_BADGE.draft
                  const expanded = expandedNoteId === note.id
                  return (
                    <div key={note.id} style={{ border: '1px solid #E5E7EB', borderRadius: '10px', marginBottom: '12px', overflow: 'hidden' }}>
                      {/* Note header */}
                      <button
                        onClick={() => setExpandedNoteId(expanded ? null : note.id)}
                        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#fff', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)' }}>
                            {formatDate(note.note_date)}
                          </span>
                          {note.visit_type && (
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                              {note.visit_type.replace(/_/g, ' ')}
                              {note.duration_minutes ? ` · ${note.duration_minutes} min` : ''}
                            </span>
                          )}
                          <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontFamily: 'var(--font-body)', fontWeight: 600, backgroundColor: badge.bg, color: badge.color }}>
                            {badge.label}
                          </span>
                          {note.billing_codes.length > 0 && (
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                              {note.billing_codes.join(', ')}
                            </span>
                          )}
                        </div>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{expanded ? '▲' : '▼'}</span>
                      </button>

                      {/* Expanded content */}
                      {expanded && (
                        <div style={{ padding: '0 20px 20px', borderTop: '1px solid #F3F4F6' }}>
                          {[
                            { label: 'S — Subjective', value: note.subjective },
                            { label: 'O — Objective', value: note.objective },
                            { label: 'A — Assessment', value: note.assessment },
                            { label: 'P — Plan', value: note.plan },
                          ].map(({ label, value }) => (
                            <div key={label} style={{ marginTop: '16px' }}>
                              <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, color: 'var(--color-navy)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
                              <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#374151', whiteSpace: 'pre-wrap', minHeight: '20px' }}>{value || <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Not recorded</span>}</div>
                            </div>
                          ))}

                          {note.signed_by_name && (
                            <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#F0FDF4', fontFamily: 'var(--font-body)', fontSize: '13px', color: '#065F46' }}>
                              ✓ Signed by {note.signed_by_name} on {formatDate(note.signed_at)}
                              {note.locked_at && ` · Locked ${formatDate(note.locked_at)}`}
                            </div>
                          )}

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                            {note.status === 'draft' && (
                              <>
                                <button onClick={() => handleNoteAction(note.id, 'sign')} style={primaryBtnStyle}>Sign Note</button>
                                <button onClick={() => handleNoteAction(note.id, 'delete')} style={{ ...secondaryBtnStyle, borderColor: '#DC2626', color: '#DC2626' }}>Delete Draft</button>
                              </>
                            )}
                            {note.status === 'signed' && (
                              <button onClick={() => handleNoteAction(note.id, 'lock')} style={secondaryBtnStyle}>Lock Note</button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Care Plans */}
            {subTab === 'care-plans' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)' }}>
                    Care Plan Versions ({plans.length})
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => exportClinical('care-plans')} style={secondaryBtnStyle}>Export CSV</button>
                    <button onClick={() => setShowPlanForm(true)} style={primaryBtnStyle}>+ New Version</button>
                  </div>
                </div>

                {showPlanForm && (
                  <CarePlanForm
                    memberId={selectedMember.id}
                    agencyId={agencyId}
                    nextVersion={(plans[0]?.version_number ?? 0) + 1}
                    onSave={(plan) => { setPlans(prev => [plan, ...prev]); setShowPlanForm(false) }}
                    onCancel={() => setShowPlanForm(false)}
                  />
                )}

                {plans.length === 0 && !showPlanForm && (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', fontSize: '15px', border: '1.5px dashed #D1D5DB', borderRadius: '10px' }}>
                    No care plans yet for {selectedMember.preferred_name}.
                  </div>
                )}

                {plans.map((plan: any) => {
                  const badge = PLAN_STATUS_BADGE[plan.status] ?? PLAN_STATUS_BADGE.draft
                  return (
                    <div key={plan.id} style={{ border: '1px solid #E5E7EB', borderRadius: '10px', padding: '20px', marginBottom: '12px', backgroundColor: plan.status === 'active' ? '#F0FDF4' : '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)' }}>
                            Version {plan.version_number}
                          </span>
                          {plan.effective_date && (
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginLeft: '12px' }}>
                              Effective {formatDate(plan.effective_date)}
                              {plan.review_date ? ` · Review ${formatDate(plan.review_date)}` : ''}
                            </span>
                          )}
                        </div>
                        <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: '999px', fontSize: '12px', fontFamily: 'var(--font-body)', fontWeight: 600, backgroundColor: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      </div>

                      {[
                        { label: 'Goals', value: plan.goals },
                        { label: 'Interventions', value: plan.interventions },
                        { label: 'Visit Frequency', value: plan.visit_frequency },
                      ].map(({ label, value }) => value ? (
                        <div key={label} style={{ marginBottom: '10px' }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, color: 'var(--color-navy)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}: </span>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#374151' }}>{value}</span>
                        </div>
                      ) : null)}

                      {plan.diagnoses.length > 0 && (
                        <div style={{ marginBottom: '10px' }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, color: 'var(--color-navy)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Diagnoses: </span>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#374151' }}>{plan.diagnoses.join(', ')}</span>
                        </div>
                      )}

                      {plan.approved_by_name && (
                        <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#F0FDF4', fontFamily: 'var(--font-body)', fontSize: '13px', color: '#065F46' }}>
                          ✓ Approved by {plan.approved_by_name} on {formatDate(plan.approved_at)}
                        </div>
                      )}

                      {plan.status === 'draft' && (
                        <div style={{ marginTop: '14px' }}>
                          <button onClick={() => handleApprovePlan(plan.id)} style={primaryBtnStyle}>
                            Approve & Activate
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── SOAP Note Form ────────────────────────────────────────────────────

interface SoapNoteFormProps {
  memberId: string
  agencyId: string
  onSave: (note: SoapNoteRow) => void
  onCancel: () => void
}

function SoapNoteForm({ memberId, agencyId, onSave, onCancel }: SoapNoteFormProps) {
  const [form, setForm] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    billing_codes: [] as string[],
    note_date: new Date().toISOString().split('T')[0],
    visit_type: '',
    duration_minutes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCodePicker, setShowCodePicker] = useState(false)
  const [codeSearch, setCodeSearch] = useState('')

  const filteredCodes = HOME_HEALTH_BILLING_CODES.filter(c =>
    c.code.toLowerCase().includes(codeSearch.toLowerCase()) ||
    c.description.toLowerCase().includes(codeSearch.toLowerCase())
  )

  function toggleCode(code: string) {
    setForm(prev => ({
      ...prev,
      billing_codes: prev.billing_codes.includes(code)
        ? prev.billing_codes.filter(c => c !== code)
        : [...prev.billing_codes, code],
    }))
  }

  async function handleSubmit() {
    if (!form.subjective && !form.objective && !form.assessment && !form.plan) {
      setError('Please fill in at least one SOAP field before saving.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/agency/clinical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          agency_id: agencyId,
          ...form,
          duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
          visit_type: form.visit_type || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to save note'); return }
      onSave(json.data)
    } catch (e) {
      setError('Network error saving note')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ border: '1.5px solid var(--color-teal)', borderRadius: '12px', padding: '24px', marginBottom: '20px', backgroundColor: '#F0FDFA' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '20px' }}>
        New SOAP Note
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>Note Date</label>
          <input type="date" value={form.note_date} onChange={e => setForm(p => ({ ...p, note_date: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Visit Type</label>
          <select value={form.visit_type} onChange={e => setForm(p => ({ ...p, visit_type: e.target.value }))} style={inputStyle}>
            <option value="">— Select —</option>
            <option value="personal_care">Personal Care</option>
            <option value="skilled_nursing">Skilled Nursing</option>
            <option value="therapy">Therapy</option>
            <option value="companionship">Companionship</option>
            <option value="medication_management">Medication Management</option>
            <option value="homemaking">Homemaking</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Duration (minutes)</label>
          <input type="number" min="1" max="480" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))} placeholder="e.g. 60" style={inputStyle} />
        </div>
      </div>

      {(['subjective', 'objective', 'assessment', 'plan'] as const).map((field: any) => (
        <div key={field} style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>
            {field === 'subjective' ? 'S — Subjective (patient&apos;s words, complaints, concerns)' :
             field === 'objective' ? 'O — Objective (observable facts, measurements)' :
             field === 'assessment' ? 'A — Assessment (clinical interpretation)' :
             'P — Plan (treatment plan, next steps)'}
          </label>
          <textarea
            value={(form as any)[field]}
            onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '72px' }}
            placeholder={
              field === 'subjective' ? 'Patient reports...' :
              field === 'objective' ? 'Vital signs, observed behaviors...' :
              field === 'assessment' ? 'Clinical impression...' :
              'Continue current plan, follow up on...'
            }
          />
        </div>
      ))}

      {/* Billing codes */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Billing / Diagnosis Codes</label>
        {form.billing_codes.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {form.billing_codes.map((code: any) => {
              const ref = HOME_HEALTH_BILLING_CODES.find(c => c.code === code)
              return (
                <span key={code} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '999px', backgroundColor: '#DBEAFE', color: '#1E40AF', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600 }}>
                  {code}
                  {ref && <span style={{ fontWeight: 400 }}>· {ref.description.substring(0, 30)}{ref.description.length > 30 ? '…' : ''}</span>}
                  <button onClick={() => toggleCode(code)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1E40AF', padding: '0 2px', lineHeight: 1 }}>×</button>
                </span>
              )
            })}
          </div>
        )}
        <button onClick={() => setShowCodePicker(!showCodePicker)} style={secondaryBtnStyle}>
          {showCodePicker ? 'Close code picker' : '+ Add billing / diagnosis code'}
        </button>

        {showCodePicker && (
          <div style={{ marginTop: '10px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#fff', maxHeight: '280px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #E5E7EB' }}>
              <input
                value={codeSearch}
                onChange={e => setCodeSearch(e.target.value)}
                placeholder="Search by code or description..."
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '14px' }}
              />
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filteredCodes.map((ref: any) => (
                <button
                  key={ref.code}
                  onClick={() => toggleCode(ref.code)}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', background: form.billing_codes.includes(ref.code) ? '#EFF6FF' : '#fff',
                    border: 'none', borderBottom: '1px solid #F3F4F6', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--color-navy)' }}>{ref.code}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>{ref.description}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '999px', backgroundColor: '#F3F4F6', color: '#6B7280', fontFamily: 'var(--font-body)' }}>{ref.type}</span>
                    {form.billing_codes.includes(ref.code) && <span style={{ color: 'var(--color-teal)' }}>✓</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#991B1B', fontFamily: 'var(--font-body)', fontSize: '14px', marginBottom: '14px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleSubmit} disabled={saving} style={primaryBtnStyle}>{saving ? 'Saving…' : 'Save Draft'}</button>
        <button onClick={onCancel} style={secondaryBtnStyle}>Cancel</button>
      </div>
    </div>
  )
}

// ─── Care Plan Form ─────────────────────────────────────────────────────

interface CarePlanFormProps {
  memberId: string
  agencyId: string
  nextVersion: number
  onSave: (plan: CarePlanVersionRow) => void
  onCancel: () => void
}

function CarePlanForm({ memberId, agencyId, nextVersion, onSave, onCancel }: CarePlanFormProps) {
  const [form, setForm] = useState({
    goals: '',
    interventions: '',
    visit_frequency: '',
    functional_status: '',
    safety_concerns: '',
    effective_date: new Date().toISOString().split('T')[0],
    review_date: '',
    diagnoses: [] as string[],
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDxPicker, setShowDxPicker] = useState(false)
  const [dxSearch, setDxSearch] = useState('')

  const icd10Codes = HOME_HEALTH_BILLING_CODES.filter(c => c.type === 'ICD10')
  const filteredDx = icd10Codes.filter(c =>
    c.code.toLowerCase().includes(dxSearch.toLowerCase()) ||
    c.description.toLowerCase().includes(dxSearch.toLowerCase())
  )

  function toggleDx(code: string) {
    setForm(prev => ({
      ...prev,
      diagnoses: prev.diagnoses.includes(code)
        ? prev.diagnoses.filter(c => c !== code)
        : [...prev.diagnoses, code],
    }))
  }

  async function handleSubmit() {
    if (!form.goals && !form.interventions) {
      setError('Please fill in at least Goals or Interventions.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/agency/clinical/care-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          agency_id: agencyId,
          ...form,
          functional_status: form.functional_status || null,
          safety_concerns: form.safety_concerns || null,
          review_date: form.review_date || null,
          notes: form.notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to save care plan'); return }
      onSave(json.data)
    } catch (e) {
      setError('Network error saving care plan')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ border: '1.5px solid var(--color-teal)', borderRadius: '12px', padding: '24px', marginBottom: '20px', backgroundColor: '#F0FDFA' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '20px' }}>
        New Care Plan — Version {nextVersion}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>Effective Date</label>
          <input type="date" value={form.effective_date} onChange={e => setForm(p => ({ ...p, effective_date: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Review Date</label>
          <input type="date" value={form.review_date} onChange={e => setForm(p => ({ ...p, review_date: e.target.value }))} style={inputStyle} />
        </div>
      </div>

      {[
        { field: 'goals', label: 'Goals', placeholder: 'Improve mobility, maintain independence in ADLs...' },
        { field: 'interventions', label: 'Interventions', placeholder: 'Twice-weekly PT, daily medication review...' },
        { field: 'visit_frequency', label: 'Visit Frequency', placeholder: 'e.g. 3 visits/week for 4 weeks, then reassess' },
        { field: 'functional_status', label: 'Functional Status (optional)', placeholder: 'Ambulates with walker, needs moderate assist for bathing...' },
        { field: 'safety_concerns', label: 'Safety Concerns (optional)', placeholder: 'Fall risk — cluttered home, poor lighting...' },
      ].map(({ field, label, placeholder }) => (
        <div key={field} style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>{label}</label>
          <textarea
            value={form[field as keyof typeof form] as string}
            onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
            rows={2}
            placeholder={placeholder}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '56px' }}
          />
        </div>
      ))}

      {/* ICD-10 diagnoses */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Diagnoses (ICD-10)</label>
        {form.diagnoses.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {form.diagnoses.map((code: any) => {
              const ref = icd10Codes.find(c => c.code === code)
              return (
                <span key={code} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '999px', backgroundColor: '#EDE9FE', color: '#5B21B6', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600 }}>
                  {code}
                  {ref && <span style={{ fontWeight: 400 }}>· {ref.description.substring(0, 30)}{ref.description.length > 30 ? '…' : ''}</span>}
                  <button onClick={() => toggleDx(code)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5B21B6', padding: '0 2px', lineHeight: 1 }}>×</button>
                </span>
              )
            })}
          </div>
        )}
        <button onClick={() => setShowDxPicker(!showDxPicker)} style={secondaryBtnStyle}>
          {showDxPicker ? 'Close' : '+ Add ICD-10 code'}
        </button>

        {showDxPicker && (
          <div style={{ marginTop: '10px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#fff', maxHeight: '220px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #E5E7EB' }}>
              <input value={dxSearch} onChange={e => setDxSearch(e.target.value)} placeholder="Search ICD-10..." style={{ width: '100%', padding: '7px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '14px' }} />
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filteredDx.map((ref: any) => (
                <button key={ref.code} onClick={() => toggleDx(ref.code)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: form.diagnoses.includes(ref.code) ? '#F5F3FF' : '#fff', border: 'none', borderBottom: '1px solid #F3F4F6', cursor: 'pointer', textAlign: 'left' }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--color-navy)' }}>{ref.code}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>{ref.description}</span>
                  </div>
                  {form.diagnoses.includes(ref.code) && <span style={{ color: 'var(--color-teal)' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Notes (optional)</label>
        <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#991B1B', fontFamily: 'var(--font-body)', fontSize: '14px', marginBottom: '14px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleSubmit} disabled={saving} style={primaryBtnStyle}>{saving ? 'Saving…' : 'Save Draft'}</button>
        <button onClick={onCancel} style={secondaryBtnStyle}>Cancel</button>
      </div>
    </div>
  )
}

// ─── Shared styles ─────────────────────────────────────────────────────

const primaryBtnStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: 'var(--color-navy)',
  color: '#fff',
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
}

const secondaryBtnStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: '8px',
  border: '1px solid var(--color-navy)',
  backgroundColor: '#fff',
  color: 'var(--color-navy)',
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--color-navy)',
  marginBottom: '5px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1.5px solid #D1D5DB',
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--color-navy)',
  backgroundColor: '#fff',
  boxSizing: 'border-box',
}
