'use client'

import { useState } from 'react'
import type { LifeStoryEntry } from '@/lib/data/life-story'

const ERAS = [
  'Childhood',
  'Teen years',
  'Young adult',
  'Early career',
  'Career',
  'Marriage & family',
  'Later years',
  'Recent memories',
]

const ERA_COLORS: Record<string, string> = {
  'Childhood': '#E8F4FD',
  'Teen years': '#FEF3C7',
  'Young adult': '#D1FAE5',
  'Early career': '#EDE9FE',
  'Career': '#FCE7F3',
  'Marriage & family': '#FEE2E2',
  'Later years': '#E0F2FE',
  'Recent memories': '#F0FDF4',
}

const ERA_BORDER: Record<string, string> = {
  'Childhood': '#93C5FD',
  'Teen years': '#FCD34D',
  'Young adult': '#6EE7B7',
  'Early career': '#C4B5FD',
  'Career': '#F9A8D4',
  'Marriage & family': '#FCA5A5',
  'Later years': '#7DD3FC',
  'Recent memories': '#86EFAC',
}

function formatDate(ts: string) {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

interface FormState {
  title: string
  content: string
  era: string
}

const EMPTY_FORM: FormState = { title: '', content: '', era: '' }

interface Props {
  initialEntries: LifeStoryEntry[]
  memberName: string
}

export default function LifeStoryClient({ initialEntries, memberName }: Props) {
  const [entries, setEntries] = useState<LifeStoryEntry[]>(initialEntries)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Group entries by era
  const byEra: Record<string, LifeStoryEntry[]> = {}
  const noEra: LifeStoryEntry[] = []
  for (const e of entries) {
    if (e.era) {
      if (!byEra[e.era]) byEra[e.era] = []
      byEra[e.era].push(e)
    } else {
      noEra.push(e)
    }
  }

  // Order eras according to ERAS constant
  const orderedEras = ERAS.filter(era => byEra[era]?.length)
  const otherEras = Object.keys(byEra).filter(era => !ERAS.includes(era))

  async function handleAdd() {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and memory are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/life-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, content: form.content, era: form.era || null }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error || 'Failed to save.'); return }
      setEntries(prev => [json.entry, ...prev])
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(entry: LifeStoryEntry) {
    setEditingId(entry.id)
    setEditForm({ title: entry.title, content: entry.content, era: entry.era || '' })
  }

  async function handleUpdate(id: string) {
    if (!editForm.title.trim() || !editForm.content.trim()) {
      setError('Title and memory are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/life-story/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editForm.title, content: editForm.content, era: editForm.era || null }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error || 'Failed to update.'); return }
      setEntries(prev => prev.map(e => (e.id === id ? json.entry : e)))
      setEditingId(null)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this memory? This cannot be undone.')) return
    setDeleting(id)
    setError(null)
    try {
      const res = await fetch(`/api/life-story/${id}`, { method: 'DELETE' })
      if (!res.ok) { setError('Failed to delete.'); return }
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  function renderEntryCard(entry: LifeStoryEntry) {
    const isEditing = editingId === entry.id
    const bg = entry.era ? (ERA_COLORS[entry.era] || '#F9FAFB') : '#F9FAFB'
    const border = entry.era ? (ERA_BORDER[entry.era] || '#D1D5DB') : '#D1D5DB'

    if (isEditing) {
      return (
        <div key={entry.id} style={{ backgroundColor: 'white', border: '2px solid var(--color-teal)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>Title</label>
            <input
              value={editForm.title}
              onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
              style={{ width: '100%', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '8px 12px', fontSize: '15px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>Era</label>
            <select
              value={editForm.era}
              onChange={e => setEditForm(f => ({ ...f, era: e.target.value }))}
              style={{ width: '100%', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '8px 12px', fontSize: '15px', backgroundColor: 'white' }}
            >
              <option value="">No era selected</option>
              {ERAS.map(era => <option key={era} value={era}>{era}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>Memory</label>
            <textarea
              value={editForm.content}
              onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
              rows={5}
              style={{ width: '100%', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '8px 12px', fontSize: '15px', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleUpdate(entry.id)}
              disabled={saving}
              style={{ backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              onClick={() => setEditingId(null)}
              style={{ backgroundColor: 'transparent', color: 'var(--color-text-secondary)', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )
    }

    return (
      <div key={entry.id} style={{ backgroundColor: bg, border: `1.5px solid ${border}`, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
            {entry.title}
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => startEdit(entry)}
              style={{ background: 'none', border: '1px solid var(--color-warm-grey)', borderRadius: '6px', padding: '4px 12px', fontSize: '13px', cursor: 'pointer', color: 'var(--color-text-secondary)', backgroundColor: 'rgba(255,255,255,0.8)' }}
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(entry.id)}
              disabled={deleting === entry.id}
              style={{ background: 'none', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '4px 12px', fontSize: '13px', cursor: deleting === entry.id ? 'not-allowed' : 'pointer', color: '#DC2626', backgroundColor: 'rgba(254,226,226,0.8)' }}
            >
              {deleting === entry.id ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-navy)', lineHeight: 1.7, margin: '0 0 12px' }}>
          {entry.content}
        </p>
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Added {formatDate(entry.created_at)}
        </span>
      </div>
    )
  }

  function renderEraSection(era: string, eraEntries: LifeStoryEntry[]) {
    return (
      <section key={era} style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ height: '2px', flex: 1, backgroundColor: 'var(--color-warm-grey)' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', margin: 0, whiteSpace: 'nowrap' }}>
            {era}
          </h2>
          <div style={{ height: '2px', flex: 1, backgroundColor: 'var(--color-warm-grey)' }} />
        </div>
        {eraEntries.map(renderEntryCard)}
      </section>
    )
  }

  const hasEntries = entries.length > 0

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 64px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
            {memberName}&apos;s Life Story
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Preserve precious memories and stories across every era of life.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(null) }}
          style={{ backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          + Add a memory
        </button>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#DC2626', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Add Memory Form */}
      {showForm && (
        <div style={{ backgroundColor: 'white', border: '2px solid var(--color-teal)', borderRadius: '16px', padding: '24px', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 20px' }}>
            Add a memory
          </h2>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
              Title <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. The summer we moved to California"
              style={{ width: '100%', height: '48px', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '0 14px', fontSize: '16px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
              Era <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>(optional)</span>
            </label>
            <select
              value={form.era}
              onChange={e => setForm(f => ({ ...f, era: e.target.value }))}
              style={{ width: '100%', height: '48px', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '0 14px', fontSize: '16px', backgroundColor: 'white' }}
            >
              <option value="">Choose an era…</option>
              {ERAS.map(era => <option key={era} value={era}>{era}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
              Memory <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Tell the story in your own words…"
              rows={6}
              style={{ width: '100%', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '12px 14px', fontSize: '16px', lineHeight: 1.65, resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleAdd}
              disabled={saving}
              style={{ backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '15px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving…' : 'Save memory'}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setError(null) }}
              style={{ backgroundColor: 'transparent', color: 'var(--color-text-secondary)', border: '1.5px solid var(--color-warm-grey)', borderRadius: '10px', padding: '12px 20px', fontSize: '15px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasEntries && !showForm && (
        <div style={{ textAlign: 'center', padding: '80px 32px', backgroundColor: 'white', borderRadius: '16px', border: '2px dashed var(--color-warm-grey)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📖</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 12px' }}>
            Every life has a story
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)', lineHeight: 1.65, maxWidth: '400px', margin: '0 auto 24px' }}>
            Start adding memories, stories, and moments from any era of {memberName}&apos;s life. They&apos;ll be treasured forever.
          </p>
          <button
            onClick={() => setShowForm(true)}
            style={{ backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '10px', padding: '14px 28px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}
          >
            Add the first memory
          </button>
        </div>
      )}

      {/* Timeline by era */}
      {hasEntries && (
        <>
          {orderedEras.map(era => renderEraSection(era, byEra[era]))}
          {otherEras.map(era => renderEraSection(era, byEra[era]))}
          {noEra.length > 0 && (
            <section style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ height: '2px', flex: 1, backgroundColor: 'var(--color-warm-grey)' }} />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', margin: 0, whiteSpace: 'nowrap' }}>
                  Other memories
                </h2>
                <div style={{ height: '2px', flex: 1, backgroundColor: 'var(--color-warm-grey)' }} />
              </div>
              {noEra.map(renderEntryCard)}
            </section>
          )}
        </>
      )}
    </div>
  )
}
