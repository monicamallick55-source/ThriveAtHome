'use client'

import { useState, useRef, useEffect } from 'react'
import type { LifeStoryEntry, MemoryBook } from '@/lib/data/life-story'
import MemoryBookBuilder from './MemoryBookBuilder'

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

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_FILES = 5

function formatDate(ts: string) {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

type SignedUrlInfo = { path: string; url: string; original_name: string; mime: string }

interface FormState {
  title: string
  content: string
  era: string
  entry_type: string
}

const EMPTY_FORM: FormState = { title: '', content: '', era: '', entry_type: 'memory' }

interface Props {
  initialEntries: LifeStoryEntry[]
  memberName: string
  planTier: string
  memberId: string
  initialMemoryBooks: MemoryBook[]
  memberDob?: string | null
  memberStatus?: string
}

export default function LifeStoryClient({ initialEntries, memberName, planTier, memberId, initialMemoryBooks, memberDob, memberStatus }: Props) {
  const [entries, setEntries] = useState<LifeStoryEntry[]>(initialEntries)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // File upload state — add form
  const [addFiles, setAddFiles] = useState<File[]>([])
  const [addFileError, setAddFileError] = useState<string | null>(null)
  const addFileRef = useRef<HTMLInputElement>(null)

  // File upload state — edit form
  const [editFiles, setEditFiles] = useState<File[]>([])
  const [editExistingPaths, setEditExistingPaths] = useState<string[]>([])
  const [editFileError, setEditFileError] = useState<string | null>(null)
  const editFileRef = useRef<HTMLInputElement>(null)

  // Signed URL cache: entry_id → SignedUrlInfo[]
  const [signedUrls, setSignedUrls] = useState<Record<string, SignedUrlInfo[]>>({})

  // Fetch signed URLs for entries that have attachments
  useEffect(() => {
    const toFetch = entries.filter(e => e.attachments?.length && !signedUrls[e.id])
    if (toFetch.length === 0) return
    toFetch.forEach(entry => {
      fetch('/api/life-story/signed-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: entry.attachments }),
      })
        .then(r => r.json())
        .then(json => {
          if (json.urls) {
            setSignedUrls(prev => ({ ...prev, [entry.id]: json.urls }))
          }
        })
        .catch(() => undefined)
    })
  }, [entries, signedUrls])

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
  const orderedEras = ERAS.filter(era => byEra[era]?.length)
  const otherEras = Object.keys(byEra).filter(era => !ERAS.includes(era))

  function validateFiles(files: File[]): string | null {
    if (files.length > MAX_FILES) return `You can attach up to ${MAX_FILES} files per memory.`
    for (const f of files) {
      if (!ALLOWED_TYPES.includes(f.type)) return `${f.name}: only JPEG, PNG, WebP, and PDF files are allowed.`
      if (f.size > MAX_FILE_SIZE) return `${f.name}: file must be 10 MB or less.`
    }
    return null
  }

  function handleAddFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const validationError = validateFiles(files)
    if (validationError) { setAddFileError(validationError); return }
    setAddFileError(null)
    setAddFiles(files)
  }

  function handleEditFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const combined = [...editExistingPaths, ...files]
    if (combined.length > MAX_FILES) { setEditFileError(`You can attach up to ${MAX_FILES} files per memory.`); return }
    const validationError = validateFiles(files)
    if (validationError) { setEditFileError(validationError); return }
    setEditFileError(null)
    setEditFiles(files)
  }

  async function uploadFiles(files: File[], entryId: string): Promise<string[]> {
    const paths: string[] = []
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('entry_id', entryId)
      const res = await fetch('/api/life-story/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      paths.push(json.path)
    }
    return paths
  }

  async function handleAdd() {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and memory are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      // Create entry first (without attachments — we need the ID for upload paths)
      const res = await fetch('/api/life-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          era: form.era || null,
          entry_type: form.entry_type,
          attachments: [],
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error || 'Failed to save.'); return }

      let entry = json.entry as LifeStoryEntry

      // Upload any attached files
      if (addFiles.length > 0) {
        const paths = await uploadFiles(addFiles, entry.id)
        const updateRes = await fetch(`/api/life-story/${entry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: entry.title,
            content: entry.content,
            era: entry.era,
            entry_type: entry.entry_type,
            attachments: paths,
          }),
        })
        const updateJson = await updateRes.json().catch(() => ({}))
        if (updateRes.ok) entry = updateJson.entry
      }

      setEntries(prev => [entry, ...prev])
      setForm(EMPTY_FORM)
      setAddFiles([])
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(entry: LifeStoryEntry) {
    setEditingId(entry.id)
    setEditForm({ title: entry.title, content: entry.content, era: entry.era || '', entry_type: entry.entry_type })
    setEditExistingPaths(entry.attachments ?? [])
    setEditFiles([])
    setEditFileError(null)
  }

  async function handleUpdate(id: string) {
    if (!editForm.title.trim() || !editForm.content.trim()) {
      setError('Title and memory are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      let newPaths: string[] = []
      if (editFiles.length > 0) {
        newPaths = await uploadFiles(editFiles, id)
      }
      const allPaths = [...editExistingPaths, ...newPaths]

      const res = await fetch(`/api/life-story/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          content: editForm.content,
          era: editForm.era || null,
          entry_type: editForm.entry_type,
          attachments: allPaths,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error || 'Failed to update.'); return }
      const updated = json.entry as LifeStoryEntry
      setEntries(prev => prev.map((e: any) => (e.id === id ? updated : e)))
      // Refresh signed URLs for this entry
      setSignedUrls(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.')
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

  function removeExistingAttachment(path: string) {
    setEditExistingPaths(prev => prev.filter(p => p !== path))
  }

  function renderAttachments(entry: LifeStoryEntry) {
    const urls = signedUrls[entry.id] ?? []
    const paths = entry.attachments ?? []
    if (paths.length === 0) return null

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
        {paths.map((path: any, idx: number) => {
          const info = urls[idx]
          const isPdf = path.toLowerCase().endsWith('.pdf') || info?.mime === 'application/pdf'
          const isLoading = urls.length === 0

          if (isPdf) {
            return (
              <a
                key={path}
                href={info?.url ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  backgroundColor: 'white', border: '1.5px solid #D1D5DB',
                  borderRadius: '8px', padding: '6px 12px', fontSize: '13px',
                  color: '#374151', textDecoration: 'none',
                  opacity: isLoading ? 0.5 : 1,
                  pointerEvents: isLoading ? 'none' : 'auto',
                }}
              >
                <span style={{ fontSize: '16px' }}>📎</span>
                <span>{info?.original_name ?? path.split('/').pop()}</span>
              </a>
            )
          }

          return (
            <a
              key={path}
              href={info?.url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', width: '80px', height: '80px',
                borderRadius: '8px', overflow: 'hidden',
                border: '1.5px solid #D1D5DB',
                backgroundColor: '#F3F4F6',
                opacity: isLoading ? 0.5 : 1,
                pointerEvents: isLoading ? 'none' : 'auto',
                flexShrink: 0,
              }}
            >
              {info?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={info.url}
                  alt={info.original_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🖼️</div>
              )}
            </a>
          )
        })}
      </div>
    )
  }

  function renderFileUploadZone(
    files: File[],
    fileError: string | null,
    inputRef: React.RefObject<HTMLInputElement | null>,
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    existingPaths?: string[],
    onRemoveExisting?: (path: string) => void
  ) {
    const totalCount = (existingPaths?.length ?? 0) + files.length
    return (
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
          Attachments <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>(optional — photos, scanned letters, PDFs)</span>
        </label>

        {/* Existing attachments (edit mode) */}
        {existingPaths && existingPaths.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {existingPaths.map((path: any) => (
              <div key={path} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: '#374151' }}>
                <span>📎 {path.split('/').pop()}</span>
                <button
                  type="button"
                  onClick={() => onRemoveExisting?.(path)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: '14px', lineHeight: 1, padding: '0 2px' }}
                  aria-label="Remove attachment"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New files selected */}
        {files.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {files.map((f: any, i: number) => (
              <span key={i} style={{ backgroundColor: '#DBEAFE', border: '1px solid #93C5FD', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: '#1E40AF' }}>
                {f.name}
              </span>
            ))}
          </div>
        )}

        {totalCount < MAX_FILES && (
          <>
            <div
              onClick={() => inputRef.current?.click()}
              style={{
                border: '2px dashed #D1D5DB', borderRadius: '8px', padding: '20px',
                textAlign: 'center', cursor: 'pointer', backgroundColor: '#FAFAFA',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-teal)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#D1D5DB')}
            >
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>📎</div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Click to attach photos or PDFs (max 10 MB each, up to {MAX_FILES} files)
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={onFileChange}
              style={{ display: 'none' }}
            />
          </>
        )}
        {fileError && (
          <p style={{ color: '#DC2626', fontSize: '13px', margin: '6px 0 0' }}>{fileError}</p>
        )}
      </div>
    )
  }

  function renderEntryCard(entry: LifeStoryEntry) {
    const isEditing = editingId === entry.id
    const bg = entry.era ? (ERA_COLORS[entry.era] || '#F9FAFB') : '#F9FAFB'
    const border = entry.era ? (ERA_BORDER[entry.era] || '#D1D5DB') : '#D1D5DB'
    const isFirstMemory = entry.entry_type === 'first_memory'

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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>Memory type</label>
            <select
              value={editForm.entry_type}
              onChange={e => setEditForm(f => ({ ...f, entry_type: e.target.value }))}
              style={{ width: '100%', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '8px 12px', fontSize: '15px', backgroundColor: 'white' }}
            >
              <option value="memory">Memory</option>
              <option value="first_memory">⭐ First Memory / Milestone</option>
            </select>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>Era</label>
            <select
              value={editForm.era}
              onChange={e => setEditForm(f => ({ ...f, era: e.target.value }))}
              style={{ width: '100%', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '8px 12px', fontSize: '15px', backgroundColor: 'white' }}
            >
              <option value="">No era selected</option>
              {ERAS.map((era: any) => <option key={era} value={era}>{era}</option>)}
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
          {renderFileUploadZone(editFiles, editFileError, editFileRef, handleEditFileChange, editExistingPaths, removeExistingAttachment)}
          {editFileError && (
            <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '12px' }}>{editFileError}</p>
          )}
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
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
              {entry.title}
            </h3>
            {isFirstMemory && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                backgroundColor: '#FEF9C3', color: '#92400E',
                border: '1px solid #FCD34D', borderRadius: '20px',
                padding: '2px 10px', fontSize: '12px', fontWeight: 600,
                whiteSpace: 'nowrap', flexShrink: 0, marginTop: '3px',
              }}>
                ⭐ First Memory
              </span>
            )}
          </div>
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
        {renderAttachments(entry)}
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginTop: '12px' }}>
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
              Memory type
            </label>
            <select
              value={form.entry_type}
              onChange={e => setForm(f => ({ ...f, entry_type: e.target.value }))}
              style={{ width: '100%', height: '48px', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '0 14px', fontSize: '16px', backgroundColor: 'white' }}
            >
              <option value="memory">Memory</option>
              <option value="first_memory">⭐ First Memory / Milestone (first car, first job, first home…)</option>
            </select>
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
              {ERAS.map((era: any) => <option key={era} value={era}>{era}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '16px' }}>
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
          {renderFileUploadZone(addFiles, addFileError, addFileRef, handleAddFileChange)}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleAdd}
              disabled={saving}
              style={{ backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '15px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving…' : 'Save memory'}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setAddFiles([]); setAddFileError(null); setError(null) }}
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
          {orderedEras.map((era: any) => renderEraSection(era, byEra[era]))}
          {otherEras.map((era: any) => renderEraSection(era, byEra[era]))}
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

      {/* Memory Book Builder + Your Memory Books */}
      <MemoryBookBuilder
        entries={entries}
        memberName={memberName}
        planTier={planTier}
        memberStatus={memberStatus ?? 'active'}
        memberDob={memberDob ?? null}
        initialMemoryBooks={initialMemoryBooks}
        parentSignedUrls={signedUrls}
      />
    </div>
  )
}
