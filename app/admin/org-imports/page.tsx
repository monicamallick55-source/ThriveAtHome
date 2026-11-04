'use client'

/**
 * app/admin/org-imports/page.tsx — G4.1 HV Migration Importer
 *
 * 4-step wizard: Upload → Map columns → Dry run → Commit
 * Staff-only. Supports Helpful Village CSV export format.
 */

import { useState, useEffect } from 'react'

type ImportJob = {
  id: string
  org_id: string
  filename: string
  status: string
  source: string
  column_mapping: Record<string, string>
  dry_run_result?: { valid_count: number; error_count: number; errors: string[]; message?: string }
  import_result?: { imported: number; skipped: number; errors: string[] }
  hv_sync_enabled: boolean
  created_at: string
  completed_at?: string
  row_count?: number
  error_message?: string
}

type Step = 'upload' | 'map' | 'dry_run' | 'commit' | 'done'

const STATUS_COLOR: Record<string, string> = {
  pending:   '#f59e0b',
  mapping:   '#6366f1',
  dry_run:   '#8b5cf6',
  running:   '#3b82f6',
  complete:  '#10b981',
  failed:    '#ef4444',
  cancelled: '#9ca3af',
}

// Common HV CSV columns → Thrive fields
const THRIVE_FIELDS = [
  'first_name', 'last_name', 'email', 'phone',
  'address_line1', 'city', 'state', 'zip_code',
  'date_of_birth', 'gender', 'emergency_contact_name',
  'notes', 'member_since', 'status', '(skip)',
]

// Demo CSV columns for the mapper (in production, parsed from uploaded file)
const DEMO_HV_COLUMNS = [
  'First Name', 'Last Name', 'Email', 'Phone',
  'Address', 'City', 'State', 'Zip Code',
  'Birthday', 'Gender', 'Emergency Contact', 'Notes', 'Member Since', 'Status',
]

export default function OrgImportsPage() {
  const [jobs, setJobs] = useState<ImportJob[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('upload')
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null)
  const [orgId, setOrgId] = useState('')
  const [filename, setFilename] = useState('')
  const [hvSync, setHvSync] = useState(false)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState<Record<string, string>>({})

  useEffect(() => {
    if (orgId) loadJobs()
  }, [orgId])

  async function loadJobs() {
    setLoading(true)
    const res = await fetch(`/api/org-imports?org_id=${orgId}`)
    const data = await res.json()
    setJobs(data.jobs ?? [])
    setLoading(false)
  }

  async function createJob() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/org-imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, filename, hv_sync_enabled: hvSync }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Fetch suggestions
      const detailRes = await fetch(`/api/org-imports/${data.job.id}`)
      const detail = await detailRes.json()
      setSuggestions(detail.hv_field_suggestions ?? {})

      // Auto-apply suggestions to mapping
      const autoMap: Record<string, string> = {}
      for (const col of DEMO_HV_COLUMNS) {
        autoMap[col] = detail.hv_field_suggestions?.[col] ?? '(skip)'
      }
      setMapping(autoMap)
      setCurrentJob(data.job)
      setStep('map')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function saveMapping() {
    if (!currentJob) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/org-imports/${currentJob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column_mapping: mapping, hv_sync_enabled: hvSync }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCurrentJob(data.job)
      setStep('dry_run')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function runDryRun() {
    if (!currentJob) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/org-imports/${currentJob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dry_run' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCurrentJob(data.job)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function runImport() {
    if (!currentJob) return
    if (!confirm('This will create member records. Continue?')) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/org-imports/${currentJob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCurrentJob(data.job)
      setStep('done')
      loadJobs()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  function resetWizard() {
    setStep('upload')
    setCurrentJob(null)
    setFilename('')
    setMapping({})
    setError('')
  }

  const STEPS = ['Upload', 'Map columns', 'Dry run', 'Commit']
  const STEP_INDEX: Record<Step, number> = { upload: 0, map: 1, dry_run: 2, commit: 3, done: 3 }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>Member Import</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        Import members from Helpful Village or a generic CSV. Staff only.
      </p>

      {/* Org selector */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 4, display: 'block' }}>Org ID</label>
        <input
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          placeholder="Paste org UUID"
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', width: 340, boxSizing: 'border-box' }}
        />
      </div>

      {/* Step indicator */}
      {step !== 'upload' && (
        <div style={{ display: 'flex', gap: 0, marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700,
                background: i <= STEP_INDEX[step] ? '#6366f1' : '#e5e7eb',
                color: i <= STEP_INDEX[step] ? '#fff' : '#9ca3af',
              }}>{i + 1}</div>
              <span style={{ marginLeft: 6, marginRight: 16, fontSize: '0.8rem', color: i <= STEP_INDEX[step] ? '#6366f1' : '#9ca3af', fontWeight: i === STEP_INDEX[step] ? 600 : 400 }}>{s}</span>
              {i < STEPS.length - 1 && <div style={{ width: 24, height: 2, background: '#e5e7eb', marginRight: 8 }} />}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: 12, marginBottom: 16, color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {/* ── Step 1: Upload ── */}
      {step === 'upload' && (
        <div style={{ border: '2px dashed #d1d5db', borderRadius: 14, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📂</div>
          <h2 style={{ fontWeight: 600, marginBottom: 8 }}>Upload CSV</h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: 20 }}>
            Export members from Helpful Village (Members → Export CSV) and upload here.
            <br />Generic CSV files are also supported.
          </p>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="Filename (e.g. hv_members_nov2026.csv)"
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', width: '100%', maxWidth: 360, boxSizing: 'border-box', marginBottom: 12 }}
          />
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={hvSync} onChange={(e) => setHvSync(e.target.checked)} />
              Enable ongoing HV sync (re-import monthly)
            </label>
          </div>
          <button
            onClick={createJob}
            disabled={!orgId || !filename || saving}
            style={{
              padding: '10px 28px', background: orgId && filename ? '#6366f1' : '#e5e7eb',
              color: orgId && filename ? '#fff' : '#9ca3af',
              border: 'none', borderRadius: 8, fontWeight: 600, cursor: orgId && filename ? 'pointer' : 'default',
            }}>
            {saving ? 'Creating…' : 'Next: Map columns →'}
          </button>
        </div>
      )}

      {/* ── Step 2: Map columns ── */}
      {step === 'map' && (
        <div>
          <h2 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 4 }}>Map CSV columns to Thrive fields</h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: 16 }}>
            Suggestions pre-filled from Helpful Village column names. Adjust as needed.
          </p>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>CSV column</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Thrive field</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_HV_COLUMNS.map((col) => (
                  <tr key={col} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 16px', color: '#374151' }}>{col}</td>
                    <td style={{ padding: '8px 16px' }}>
                      <select
                        value={mapping[col] ?? '(skip)'}
                        onChange={(e) => setMapping((prev) => ({ ...prev, [col]: e.target.value }))}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.85rem' }}>
                        {THRIVE_FIELDS.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={hvSync} onChange={(e) => setHvSync(e.target.checked)} />
              Enable ongoing HV sync
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={resetWizard} style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>
              ← Back
            </button>
            <button onClick={saveMapping} disabled={saving} style={{ padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              {saving ? 'Saving…' : 'Next: Dry run →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Dry run ── */}
      {step === 'dry_run' && currentJob && (
        <div>
          <h2 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 8 }}>Dry run</h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: 16 }}>
            Validate your CSV without creating any records. Review errors before committing.
          </p>

          {!currentJob.dry_run_result ? (
            <button onClick={runDryRun} disabled={saving} style={{ padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              {saving ? 'Running…' : '▶ Run dry run'}
            </button>
          ) : (
            <div>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <div style={{ fontWeight: 600, color: '#15803d', marginBottom: 4 }}>
                  ✅ {currentJob.dry_run_result.valid_count} valid · {currentJob.dry_run_result.error_count} errors
                </div>
                {currentJob.dry_run_result.message && (
                  <div style={{ fontSize: '0.85rem', color: '#16a34a' }}>{currentJob.dry_run_result.message}</div>
                )}
              </div>
              {currentJob.dry_run_result.errors.length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                  {currentJob.dry_run_result.errors.map((e, i) => (
                    <div key={i} style={{ fontSize: '0.85rem', color: '#b91c1c' }}>• {e}</div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep('map')} style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>
                  ← Edit mapping
                </button>
                <button onClick={() => setStep('commit')} style={{ padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                  Next: Commit →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 4: Commit ── */}
      {step === 'commit' && currentJob && (
        <div>
          <h2 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 8 }}>Commit import</h2>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <strong>⚠️ This will create member records.</strong> This action cannot be undone.
            Existing members matched by email will be skipped (not overwritten).
          </div>
          <div style={{ marginBottom: 16, fontSize: '0.875rem', color: '#374151' }}>
            <strong>File:</strong> {currentJob.filename}<br />
            <strong>Source:</strong> {currentJob.source}<br />
            <strong>HV sync:</strong> {currentJob.hv_sync_enabled ? 'Enabled' : 'Disabled'}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep('dry_run')} style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>
              ← Back
            </button>
            <button onClick={runImport} disabled={saving} style={{ padding: '10px 28px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              {saving ? 'Importing…' : '✓ Commit import'}
            </button>
          </div>
        </div>
      )}

      {/* ── Done ── */}
      {step === 'done' && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
          <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Import queued!</h2>
          <p style={{ color: '#6b7280', marginBottom: 24 }}>The import is running in the background. Check the jobs list below for status.</p>
          <button onClick={resetWizard} style={{ padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
            Start another import
          </button>
        </div>
      )}

      {/* ── Past jobs ── */}
      {orgId && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 12 }}>Past imports</h2>
          {loading ? (
            <p style={{ color: '#9ca3af' }}>Loading…</p>
          ) : jobs.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>No imports yet for this org.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {jobs.map((job) => (
                <div key={job.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{job.filename}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>
                      {job.source} · {new Date(job.created_at).toLocaleDateString()}
                      {job.hv_sync_enabled && ' · HV sync on'}
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                    background: (STATUS_COLOR[job.status] ?? '#9ca3af') + '20',
                    color: STATUS_COLOR[job.status] ?? '#9ca3af',
                  }}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
