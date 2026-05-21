'use client'
// DocumentVault — upload, list, and download documents from the member-documents Storage bucket.
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SectionError } from './SectionError'
import type { DocumentVaultItem } from '@/lib/data/documents'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB — enforced client-side before API call

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    // Client-side size check — provides instant feedback before sending to API
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('This file is too large. Maximum size is 10 MB.')
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
      // Open signed URL in a new tab — triggers the browser's native download
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
    <div className="space-y-6">
      {/* Upload section */}
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 space-y-3">
        <h3 className="text-lg font-semibold text-brand-navy">Upload a document</h3>

        <div className="space-y-3">
          {/* Optional description */}
          <div>
            <label htmlFor="doc-description" className="block text-base font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <input
              id="doc-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Living will, insurance card…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </div>

          {/* Advance directive checkbox */}
          <label className="flex items-center gap-2 cursor-pointer text-base text-gray-700">
            <input
              type="checkbox"
              checked={isAdvanceDirective}
              onChange={(e) => setIsAdvanceDirective(e.target.checked)}
              className="w-4 h-4 accent-brand-teal"
            />
            This is an advance directive or healthcare proxy document
          </label>

          {/* File picker */}
          <div>
            <label htmlFor="doc-file" className="block text-base font-medium text-gray-700 mb-1">
              Select file (PDF, images, or documents — max 10 MB)
            </label>
            <input
              id="doc-file"
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
              onChange={handleUpload}
              disabled={uploading}
              className="block w-full text-base text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-base file:font-medium file:bg-brand-navy file:text-white hover:file:bg-opacity-90 cursor-pointer"
              aria-describedby={uploadError ? 'upload-error' : undefined}
            />
          </div>

          {uploading && (
            <p className="text-base text-gray-500" role="status">
              Uploading…
            </p>
          )}
          {uploadError && (
            <p id="upload-error" role="alert" className="text-base text-red-600">
              {uploadError}
            </p>
          )}
        </div>
      </div>

      {/* Document list */}
      <div>
        <h3 className="text-lg font-semibold text-brand-navy mb-3">
          {documents.length === 0 ? 'No documents uploaded yet' : `${documents.length} document${documents.length === 1 ? '' : 's'}`}
        </h3>

        {documents.length > 0 && (
          <ul className="space-y-2" aria-label="Document list">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-medium text-brand-navy truncate">
                      {doc.file_name}
                    </span>
                    {doc.is_advance_directive && (
                      <Badge variant="info">Advance directive</Badge>
                    )}
                  </div>
                  {doc.description && (
                    <p className="text-base text-gray-500">{doc.description}</p>
                  )}
                  <p className="text-sm text-gray-400">
                    Uploaded {formatDate(doc.created_at)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownload(doc.id, doc.file_name)}
                    loading={downloading === doc.id}
                    className="min-h-[52px]"
                    aria-label={`Download ${doc.file_name}`}
                  >
                    Download
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(doc.id, doc.file_name)}
                    loading={deleting === doc.id}
                    className="min-h-[52px]"
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
