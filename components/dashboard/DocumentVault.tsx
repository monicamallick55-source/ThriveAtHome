'use client'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { SectionError } from './SectionError'
import type { DocumentVaultItem } from '@/lib/data/documents'

const MAX_FILE_SIZE = 10 * 1024 * 1024

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  })
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
  const [isAdvanceDirective, setIsAdvanceDirective] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

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

    const res = await fetch('/api/documents', { method: 'POST', body: formData })
    const json = await res.json()

    if (!res.ok) {
      setUploadError(json.error ?? 'Upload failed. Please try again.')
    } else {
      setDocuments((prev) => [json.document as DocumentVaultItem, ...prev])
      setDescription('')
      setIsAdvanceDirective(false)
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
    const json = await res.json()
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
    const json = await res.json()
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Upload zone */}
      <div>
        {/* Optional description field */}
        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="doc-description"
            style={{ display: 'block', fontSize: '18px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '8px', fontFamily: 'var(--font-body)' }}
          >
            Description (optional)
          </label>
          <input
            id="doc-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Living will, insurance card…"
            style={{
              width: '100%',
              height: '56px',
              backgroundColor: 'white',
              border: '1.5px solid var(--color-warm-grey)',
              borderRadius: 'var(--radius-md)',
              padding: '0 16px',
              fontSize: '18px',
              fontFamily: 'var(--font-body)',
              color: 'var(--color-text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
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
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '12px',
            cursor: 'pointer',
            fontSize: '18px',
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-body)',
          }}
        >
          <input
            type="checkbox"
            checked={isAdvanceDirective}
            onChange={(e) => setIsAdvanceDirective(e.target.checked)}
            style={{ width: '20px', height: '20px', accentColor: 'var(--color-teal)', cursor: 'pointer' }}
          />
          This is an advance directive or healthcare proxy
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
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--color-concern)',
              color: 'var(--color-concern-text)',
              border: '1px solid var(--color-concern-border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              fontSize: '18px',
              fontFamily: 'var(--font-body)',
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
            fontFamily: 'var(--font-display)',
            fontSize: '22px',
            fontWeight: 500,
            color: 'var(--color-navy)',
            marginBottom: '16px',
          }}
        >
          {documents.length === 0
            ? 'No documents uploaded yet'
            : `${documents.length} document${documents.length === 1 ? '' : 's'}`}
        </h3>

        {documents.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }} aria-label="Document list">
            {documents.map((doc) => (
              <li
                key={doc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  backgroundColor: 'var(--color-warm-white)',
                  border: '1px solid var(--color-warm-grey)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px 20px',
                  flexWrap: 'wrap',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <span style={{ fontSize: '28px', flexShrink: 0 }}>{fileIcon(doc.file_name)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.file_name}
                    {doc.is_advance_directive && (
                      <span style={{ marginLeft: '8px', fontSize: '13px', backgroundColor: 'var(--color-info)', color: 'var(--color-info-text)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                        Advance directive
                      </span>
                    )}
                  </p>
                  {doc.description && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>{doc.description}</p>
                  )}
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                    {formatDate(doc.created_at)}
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
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
