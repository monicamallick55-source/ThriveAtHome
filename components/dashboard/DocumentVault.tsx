'use client'
import { useMemo, useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { SectionError } from './SectionError'
import type { DocumentVaultItem } from '@/lib/data/documents'
import {
  DOC_CATEGORIES,
  ESSENTIAL_DOC_CATEGORIES,
  docCategory,
  expiryStatus,
} from '@/lib/documents/categories'

const MAX_FILE_SIZE = 10 * 1024 * 1024

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  })
}

function fileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (['pdf'].includes(ext)) return '📄'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️'
  if (['doc', 'docx'].includes(ext)) return '📝'
  return '📎'
}

export interface DocumentVaultProps {
  memberId: string
  initialDocuments: DocumentVaultItem[]
  error: string | null
}

export function DocumentVault({ memberId, initialDocuments, error }: DocumentVaultProps) {
  const [documents, setDocuments] = useState<DocumentVaultItem[]>(initialDocuments)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('other')
  const [issuer, setIssuer] = useState('')
  const [expiresOn, setExpiresOn] = useState('')
  const [sharedWithNavigator, setSharedWithNavigator] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const isAdvanceDirective = category === 'advance_directive' || category === 'healthcare_proxy'
  const activeCat = docCategory(category)

  const presentEssential = useMemo(() => {
    const set = new Set(documents.map((d) => d.doc_category))
    return new Set(ESSENTIAL_DOC_CATEGORIES.filter((c) => set.has(c.value)).map((c) => c.value))
  }, [documents])

  async function uploadFile(file: File) {
    setUploadError(null)
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('That file is a bit too large. Please upload files under 10MB.')
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('memberId', memberId)
    formData.append('description', description)
    formData.append('isAdvanceDirective', String(isAdvanceDirective))
    formData.append('docCategory', category)
    formData.append('issuer', issuer)
    formData.append('expiresOn', expiresOn)
    formData.append('sharedWithNavigator', String(sharedWithNavigator))

    const res = await fetch('/api/documents', { method: 'POST', body: formData })
    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      setUploadError(json.error ?? 'Upload failed. Please try again.')
    } else {
      setDocuments((prev) => [json.document as DocumentVaultItem, ...prev])
      setDescription('')
      setCategory('other')
      setIssuer('')
      setExpiresOn('')
      setSharedWithNavigator(false)
      if (fileRef.current) fileRef.current.value = ''
    }
    setUploading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  async function handleDelete(docId: string, fileName: string) {
    if (!confirm(`Delete "${fileName}"? This cannot be undone.`)) return
    setDeleting(docId)
    const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(json.error ?? 'Delete failed. Please try again.')
    } else {
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
    }
    setDeleting(null)
  }

  async function handleDownload(docId: string, fileName: string) {
    setDownloading(docId)
    const res = await fetch(`/api/documents/${docId}/download`)
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json.url) {
      alert(json.error ?? 'Unable to download file.')
    } else {
      const a = document.createElement('a')
      a.href = json.url
      a.download = fileName
      a.target = '_blank'
      a.rel = 'noreferrer'
      a.click()
    }
    setDownloading(null)
  }

  if (error) return <SectionError message={error} />

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '52px',
    backgroundColor: 'white',
    border: '1.5px solid var(--color-warm-grey)',
    borderRadius: 'var(--radius-md)',
    padding: '0 14px',
    fontSize: '16px',
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Essential documents checklist */}
      <div
        style={{
          backgroundColor: 'var(--color-cream)',
          border: '1px solid var(--color-warm-grey)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
        }}
      >
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 10px' }}>
          Essential documents ({presentEssential.size}/{ESSENTIAL_DOC_CATEGORIES.length} stored)
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {ESSENTIAL_DOC_CATEGORIES.map((c) => {
            const have = presentEssential.has(c.value)
            return (
              <span
                key={c.value}
                title={c.hint}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  fontFamily: 'var(--font-body)', fontSize: '13px',
                  padding: '5px 10px', borderRadius: 'var(--radius-full)',
                  backgroundColor: have ? 'var(--color-teal-muted)' : 'white',
                  border: `1px solid ${have ? 'var(--color-teal)' : 'var(--color-warm-grey)'}`,
                  color: 'var(--color-navy)',
                }}
              >
                <span aria-hidden="true">{have ? '✓' : c.emoji}</span> {c.label}
              </span>
            )
          })}
        </div>
      </div>

      {/* Upload zone */}
      <div>
        <div style={{ display: 'grid', gap: '14px', marginBottom: '16px' }}>
          <div>
            <label htmlFor="doc-category" style={{ display: 'block', fontSize: '16px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
              Document type
            </label>
            <select id="doc-category" value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
              {DOC_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
              ))}
            </select>
            {activeCat.hint && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: '6px 0 0' }}>{activeCat.hint}</p>
            )}
          </div>

          <div>
            <label htmlFor="doc-description" style={{ display: 'block', fontSize: '16px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
              Description (optional)
            </label>
            <input id="doc-description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Living will signed 2024" style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label htmlFor="doc-issuer" style={{ display: 'block', fontSize: '16px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
                Issued by (optional)
              </label>
              <input id="doc-issuer" type="text" value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="e.g. Medicare, DMV" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="doc-expires" style={{ display: 'block', fontSize: '16px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
                Expires on (optional)
              </label>
              <input id="doc-expires" type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            height: '160px',
            border: `2px dashed ${isDragOver ? 'var(--color-teal)' : 'var(--color-warm-grey)'}`,
            borderRadius: 'var(--radius-xl)',
            backgroundColor: isDragOver ? 'var(--color-teal-muted)' : 'var(--color-cream)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '8px', cursor: 'pointer', transition: 'all 0.2s',
          }}
          role="button"
          aria-label="Upload document"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
        >
          <span style={{ fontSize: '32px' }}>📁</span>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', margin: 0, fontWeight: 500 }}>
            Drop a file here, or click to upload
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-muted)', margin: 0 }}>
            PDF, JPG, PNG — max 10MB
          </p>
          <input
            ref={fileRef}
            id="doc-file"
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: 'none' }}
            aria-describedby={uploadError ? 'upload-error' : undefined}
          />
        </div>

        <label
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px',
            cursor: 'pointer', fontSize: '16px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)',
          }}
        >
          <input
            type="checkbox"
            checked={sharedWithNavigator}
            onChange={(e) => setSharedWithNavigator(e.target.checked)}
            style={{ width: '20px', height: '20px', accentColor: 'var(--color-teal)', cursor: 'pointer' }}
          />
          Share this document with our ThriveAtHome care team
        </label>

        {uploading && (
          <p style={{ marginTop: '12px', fontSize: '18px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }} role="status">
            Uploading…
          </p>
        )}

        {uploadError && (
          <p
            id="upload-error"
            role="alert"
            style={{
              marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: 'var(--color-concern)', color: 'var(--color-concern-text)',
              border: '1px solid var(--color-concern-border)', borderRadius: 'var(--radius-md)',
              padding: '14px 16px', fontSize: '18px', fontFamily: 'var(--font-body)',
            }}
          >
            <span aria-hidden="true">⚠</span> {uploadError}
          </p>
        )}
      </div>

      {/* Document list */}
      <div>
        <h3
          style={{
            fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500,
            color: 'var(--color-navy)', marginBottom: '16px',
          }}
        >
          {documents.length === 0
            ? 'No documents uploaded yet'
            : `${documents.length} document${documents.length === 1 ? '' : 's'}`}
        </h3>

        {documents.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }} aria-label="Document list">
            {documents.map((doc) => {
              const cat = docCategory(doc.doc_category)
              const exp = expiryStatus(doc.expires_on)
              return (
                <li
                  key={doc.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    backgroundColor: 'var(--color-warm-white)', border: '1px solid var(--color-warm-grey)',
                    borderRadius: 'var(--radius-lg)', padding: '16px 20px', flexWrap: 'wrap',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  <span style={{ fontSize: '28px', flexShrink: 0 }}>{fileIcon(doc.file_name)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.file_name}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '4px 0 0' }}>
                      <span style={{ fontSize: '12px', backgroundColor: 'var(--color-cream)', color: 'var(--color-navy)', padding: '2px 8px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-warm-grey)', fontWeight: 600 }}>
                        {cat.emoji} {cat.label}
                      </span>
                      {doc.is_advance_directive && (
                        <span style={{ fontSize: '12px', backgroundColor: 'var(--color-info)', color: 'var(--color-info-text)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                          Advance directive
                        </span>
                      )}
                      {doc.shared_with_navigator && (
                        <span style={{ fontSize: '12px', backgroundColor: 'var(--color-teal-muted)', color: 'var(--color-navy)', padding: '2px 8px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-teal)', fontWeight: 600 }}>
                          Shared with care team
                        </span>
                      )}
                      {exp === 'expired' && (
                        <span style={{ fontSize: '12px', backgroundColor: 'var(--color-concern)', color: 'var(--color-concern-text)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                          Expired {doc.expires_on && formatDate(doc.expires_on)}
                        </span>
                      )}
                      {exp === 'soon' && (
                        <span style={{ fontSize: '12px', backgroundColor: '#FBEFD6', color: '#7A5B12', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                          Expires {doc.expires_on && formatDate(doc.expires_on)}
                        </span>
                      )}
                    </div>
                    {doc.description && (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>{doc.description}</p>
                    )}
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                      {doc.issuer ? `${doc.issuer} · ` : ''}Added {formatDate(doc.created_at)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(doc.id, doc.file_name)}
                      loading={downloading === doc.id}
                      aria-label={`Download ${doc.file_name}`}
                    >
                      Download
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(doc.id, doc.file_name)}
                      loading={deleting === doc.id}
                      aria-label={`Delete ${doc.file_name}`}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
