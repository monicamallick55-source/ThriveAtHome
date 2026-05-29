'use client'

import { useState, useEffect } from 'react'
import type { LifeStoryEntry, MemoryBook } from '@/lib/data/life-story'

type SignedUrlInfo = { path: string; url: string; original_name: string; mime: string }

interface Props {
  entries: LifeStoryEntry[]
  memberName: string
  planTier: string
  initialMemoryBooks: MemoryBook[]
  parentSignedUrls: Record<string, SignedUrlInfo[]>
}

const LAYOUT_OPTIONS = [
  { id: 'classic', label: 'Classic', desc: 'Elegant and timeless — navy accents, cream pages, serif headings.' },
  { id: 'modern', label: 'Modern', desc: 'Clean and contemporary — teal accents, generous whitespace.' },
  { id: 'scrapbook', label: 'Scrapbook', desc: 'Warm and personal — colorful era headers, cozy feel.' },
]

const ERAS = ['Childhood', 'Teen years', 'Young adult', 'Early career', 'Career', 'Marriage & family', 'Later years', 'Recent memories']

// Helpers for image fetching
async function fetchImageAsBase64(url: string): Promise<{ data: string; format: string } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    const format = blob.type.includes('png') ? 'PNG' : 'JPEG'
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        // Strip the data:image/...;base64, prefix
        const base64 = result.split(',')[1]
        resolve({ data: base64, format })
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

async function fetchAllImages(
  entries: LifeStoryEntry[],
  signedUrls: Record<string, SignedUrlInfo[]>,
  coverPhotoPath: string | null
): Promise<{
  entryImages: Record<string, Array<{ data: string; format: string; path: string }>>
  coverImage: { data: string; format: string } | null
}> {
  const entryImages: Record<string, Array<{ data: string; format: string; path: string }>> = {}
  let coverImage: { data: string; format: string } | null = null

  for (const entry of entries) {
    const urls = signedUrls[entry.id] ?? []
    const imageUrls = urls.filter(u => u.mime !== 'application/pdf')
    if (imageUrls.length === 0) continue

    entryImages[entry.id] = []
    for (const urlInfo of imageUrls) {
      const img = await fetchImageAsBase64(urlInfo.url)
      if (img) {
        entryImages[entry.id].push({ ...img, path: urlInfo.path })
        if (urlInfo.path === coverPhotoPath && !coverImage) {
          coverImage = img
        }
      }
    }
  }

  return { entryImages, coverImage }
}

// ── PDF Generation ──────────────────────────────────────────────────────────

async function generateMemoryBookPDF(config: {
  memberName: string
  title: string
  dedication: string
  layoutStyle: string
  selectedEntries: LifeStoryEntry[]
  coverImage: { data: string; format: string } | null
  entryImages: Record<string, Array<{ data: string; format: string; path: string }>>
  onProgress: (status: string) => void
}): Promise<{ blob: Blob; pageCount: number }> {
  const { jsPDF } = await import('jspdf')

  const { memberName, title, dedication, layoutStyle, selectedEntries, coverImage, entryImages } = config

  // A4 portrait: 210 × 297 mm (also usable as letter: 215.9 × 279.4)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const W = doc.internal.pageSize.getWidth()   // 215.9
  const H = doc.internal.pageSize.getHeight()  // 279.4
  const MARGIN = 20

  // Color palette per layout
  const palette = {
    classic:   { primary: [30, 58, 95],    accent: [13, 148, 136],  bg: [255, 251, 247], text: [30, 30, 40],    gold: [180, 83, 9]   },
    modern:    { primary: [13, 148, 136],  accent: [30, 58, 95],    bg: [250, 250, 250], text: [17, 24, 39],    gold: [234, 179, 8]  },
    scrapbook: { primary: [180, 83, 9],    accent: [13, 148, 136],  bg: [255, 253, 240], text: [29, 42, 61],    gold: [180, 83, 9]   },
  }
  const C = palette[layoutStyle as keyof typeof palette] ?? palette.classic

  function setFill(color: number[]) { doc.setFillColor(color[0], color[1], color[2]) }
  function setDraw(color: number[]) { doc.setDrawColor(color[0], color[1], color[2]) }
  function setTextColor(color: number[]) { doc.setTextColor(color[0], color[1], color[2]) }

  // ── COVER PAGE ──────────────────────────────────────────────────────────
  config.onProgress('Designing cover page…')
  setFill(C.bg)
  doc.rect(0, 0, W, H, 'F')

  // Top navy band
  setFill(C.primary)
  doc.rect(0, 0, W, 72, 'F')

  // Brand wordmark in band
  doc.setFont('times', 'italic')
  doc.setFontSize(11)
  setTextColor([255, 255, 255])
  doc.text('ThriveAtHome', W / 2, 14, { align: 'center' })

  // Tagline
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(200, 220, 240)
  doc.text('Preserving every precious memory', W / 2, 21, { align: 'center' })

  // Cover photo area
  if (coverImage) {
    try {
      const imgX = (W - 120) / 2
      const imgY = 28
      const imgW = 120
      const imgH = 38
      doc.addImage(coverImage.data, coverImage.format, imgX, imgY, imgW, imgH)
      // Subtle border
      setDraw(C.primary)
      doc.setLineWidth(0.3)
      doc.rect(imgX, imgY, imgW, imgH)
    } catch {
      // Image failed — skip gracefully
    }
  }

  // Decorative teal line below band
  setFill(C.accent)
  doc.rect(0, 72, W, 2.5, 'F')

  // Senior name — large display
  const nameY = coverImage ? 88 : 84
  doc.setFont('times', 'bold')
  doc.setFontSize(34)
  setTextColor(C.primary)
  doc.text(title, W / 2, nameY, { align: 'center', maxWidth: W - 40 })

  // Subtitle
  doc.setFont('times', 'italic')
  doc.setFontSize(15)
  setTextColor(C.accent)
  doc.text('A Life Remembered', W / 2, nameY + 14, { align: 'center' })

  // Teal divider line
  setDraw(C.accent)
  doc.setLineWidth(0.8)
  doc.line(MARGIN + 20, nameY + 22, W - MARGIN - 20, nameY + 22)

  // Dedication
  if (dedication) {
    doc.setFont('times', 'italic')
    doc.setFontSize(12)
    setTextColor([90, 90, 100])
    const dedLines = doc.splitTextToSize(`"${dedication}"`, W - 60)
    doc.text(dedLines, W / 2, nameY + 34, { align: 'center' })
  }

  // Era list (table of contents)
  const eras = ERAS.filter(era => selectedEntries.some(e => e.era === era))
  if (eras.length > 0) {
    const tocY = H - 72
    setFill([240, 240, 250])
    doc.rect(MARGIN, tocY - 6, W - MARGIN * 2, eras.length * 8 + 18, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    setTextColor(C.primary)
    doc.text('CHAPTERS', MARGIN + 8, tocY + 2)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    setTextColor([60, 60, 80])
    eras.forEach((era, i) => {
      doc.text(`· ${era}`, MARGIN + 8, tocY + 12 + i * 8)
    })
  }

  // Footer
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setTextColor([160, 160, 170])
  const todayFull = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  doc.text(`Generated ${todayFull} · ThriveAtHome Memory Book`, W / 2, H - 10, { align: 'center' })

  // ── ERA CHAPTER DIVIDERS + ENTRY PAGES ────────────────────────────────
  const noEraEntries = selectedEntries.filter(e => !e.era)
  const eraGroups: Array<{ era: string | null; entries: LifeStoryEntry[] }> = []

  ERAS.forEach(era => {
    const erEnts = selectedEntries.filter(e => e.era === era)
    if (erEnts.length > 0) eraGroups.push({ era, entries: erEnts })
  })
  const otherEras = [...new Set(selectedEntries.filter(e => e.era && !ERAS.includes(e.era)).map(e => e.era!))]
  otherEras.forEach(era => {
    const erEnts = selectedEntries.filter(e => e.era === era)
    if (erEnts.length > 0) eraGroups.push({ era, entries: erEnts })
  })
  if (noEraEntries.length > 0) eraGroups.push({ era: null, entries: noEraEntries })

  for (const group of eraGroups) {
    if (!group.era) continue

    config.onProgress(`Writing chapter: ${group.era}…`)
    doc.addPage()

    // Chapter divider page
    setFill(C.bg)
    doc.rect(0, 0, W, H, 'F')

    // Teal top strip
    setFill(C.accent)
    doc.rect(0, 0, W, 56, 'F')

    // Era name in strip
    doc.setFont('times', 'bold')
    doc.setFontSize(28)
    setTextColor([255, 255, 255])
    doc.text(group.era, W / 2, 34, { align: 'center' })

    // Pull quote from first entry
    const firstEntry = group.entries[0]
    const pullText = firstEntry.content.substring(0, 140) + (firstEntry.content.length > 140 ? '…' : '')
    doc.setFont('times', 'italic')
    doc.setFontSize(13)
    setTextColor(C.primary)
    const pullLines = doc.splitTextToSize(`"${pullText}"`, W - 60)
    doc.text(pullLines, W / 2, 80, { align: 'center' })

    // Attribution
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    setTextColor(C.accent)
    doc.text(`— ${firstEntry.title}`, W / 2, 80 + pullLines.length * 7 + 6, { align: 'center' })

    // Decorative element: three dots
    setFill(C.accent)
    ;[W / 2 - 8, W / 2, W / 2 + 8].forEach(x => doc.circle(x, H - 30, 1.5, 'F'))

    // Entry count for this era
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    setTextColor([140, 140, 160])
    doc.text(`${group.entries.length} ${group.entries.length === 1 ? 'memory' : 'memories'}`, W / 2, H - 20, { align: 'center' })
  }

  // ── ENTRY PAGES ─────────────────────────────────────────────────────────
  let entryIdx = 0
  for (const group of eraGroups) {
    for (const entry of group.entries) {
      entryIdx++
      config.onProgress(`Writing memory ${entryIdx} of ${selectedEntries.length}: ${entry.title.substring(0, 30)}…`)

      doc.addPage()
      setFill(C.bg)
      doc.rect(0, 0, W, H, 'F')

      // Left accent bar
      setFill(C.accent)
      doc.rect(0, 0, 3, H, 'F')

      // Era label (top right)
      if (entry.era) {
        setFill(C.accent)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.5)
        setTextColor([255, 255, 255])
        const eraLabelW = doc.getTextWidth(entry.era) + 10
        doc.roundedRect(W - MARGIN - eraLabelW, MARGIN - 5, eraLabelW, 9, 2, 2, 'F')
        doc.text(entry.era.toUpperCase(), W - MARGIN - eraLabelW / 2, MARGIN, { align: 'center' })
      }

      // First Memory badge
      const isFirstMemory = entry.entry_type === 'first_memory'
      let titleY = MARGIN + 6
      if (isFirstMemory) {
        setFill([254, 249, 195])
        const badgeW = 88
        doc.roundedRect(MARGIN + 3, MARGIN - 2, badgeW, 9, 2, 2, 'F')
        setDraw([253, 211, 77])
        doc.setLineWidth(0.3)
        doc.roundedRect(MARGIN + 3, MARGIN - 2, badgeW, 9, 2, 2, 'D')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.5)
        setTextColor(C.gold)
        doc.text('★ FIRST MEMORY / MILESTONE', MARGIN + 7, MARGIN + 4)
        titleY = MARGIN + 16
      }

      // Entry title
      doc.setFont('times', 'bold')
      doc.setFontSize(22)
      setTextColor(C.primary)
      const titleLines = doc.splitTextToSize(entry.title, W - MARGIN * 2 - 10)
      doc.text(titleLines, MARGIN + 3, titleY)
      let currentY = titleY + titleLines.length * 10

      // Date
      doc.setFont('times', 'italic')
      doc.setFontSize(9.5)
      setTextColor([120, 120, 140])
      const entryDate = new Date(entry.created_at)
      const dateStr = entryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
      doc.text(dateStr, MARGIN + 3, currentY + 3)
      currentY += 9

      // Divider
      setDraw(C.accent)
      doc.setLineWidth(0.5)
      doc.line(MARGIN + 3, currentY + 3, W - MARGIN, currentY + 3)
      currentY += 10

      // Content body
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      setTextColor(C.text)
      const contentLines = doc.splitTextToSize(entry.content, W - MARGIN * 2 - 10)
      const maxContentLines = Math.min(contentLines.length, 22) // Clamp to avoid overflow
      doc.text(contentLines.slice(0, maxContentLines), MARGIN + 3, currentY)
      currentY += maxContentLines * 6.5 + 4

      if (contentLines.length > maxContentLines) {
        doc.setFontSize(9)
        setTextColor([140, 140, 160])
        doc.text('[Memory continues…]', MARGIN + 3, currentY)
        currentY += 8
      }

      // Images
      const imgs = entryImages[entry.id] ?? []
      if (imgs.length > 0 && currentY < H - 55) {
        currentY += 4
        const availableH = H - currentY - 20
        const maxImgH = Math.min(45, availableH)
        const maxImgW = Math.min(70, (W - MARGIN * 2 - 10) / imgs.length - 4)

        let imgX = MARGIN + 3
        for (const img of imgs.slice(0, 3)) {
          try {
            doc.addImage(img.data, img.format, imgX, currentY, maxImgW, maxImgH)
            setDraw([210, 210, 220])
            doc.setLineWidth(0.3)
            doc.rect(imgX, currentY, maxImgW, maxImgH)
            imgX += maxImgW + 4
          } catch {
            // Image failed — skip
          }
        }
        if (imgs.length > 3) {
          doc.setFontSize(8.5)
          setTextColor([140, 140, 160])
          doc.text(`+${imgs.length - 3} more photo${imgs.length - 3 > 1 ? 's' : ''}`, imgX, currentY + maxImgH / 2)
        }
      }

      // Bottom teal border
      setFill(C.accent)
      doc.rect(0, H - 6, W, 6, 'F')

      // Page number in footer
      const pageNum = doc.getNumberOfPages()
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      setTextColor([255, 255, 255])
      doc.text(`${pageNum}`, W / 2, H - 2, { align: 'center' })
    }
  }

  // ── BACK COVER ───────────────────────────────────────────────────────────
  config.onProgress('Creating back cover…')
  doc.addPage()

  setFill(C.primary)
  doc.rect(0, 0, W, H, 'F')

  // Teal accent strip at top
  setFill(C.accent)
  doc.rect(0, 0, W, 8, 'F')
  doc.rect(0, H - 8, W, 8, 'F')

  // ThriveAtHome wordmark
  doc.setFont('times', 'bold')
  doc.setFontSize(32)
  setTextColor([255, 255, 255])
  doc.text('ThriveAtHome', W / 2, H / 2 - 24, { align: 'center' })

  doc.setFont('times', 'italic')
  doc.setFontSize(14)
  setTextColor([180, 210, 240])
  doc.text('Every life has a story worth telling.', W / 2, H / 2 - 8, { align: 'center' })

  // Divider
  setDraw(C.accent)
  doc.setLineWidth(0.8)
  doc.line(MARGIN + 30, H / 2 + 2, W - MARGIN - 30, H / 2 + 2)

  // Member name + date
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  setTextColor([180, 200, 230])
  const todayMonthYear = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  doc.text(`Memory book for ${memberName}`, W / 2, H / 2 + 16, { align: 'center' })
  doc.text(todayMonthYear, W / 2, H / 2 + 26, { align: 'center' })

  // Entry count
  doc.setFontSize(9)
  setTextColor([120, 160, 200])
  doc.text(`${selectedEntries.length} ${selectedEntries.length === 1 ? 'memory' : 'memories'} preserved with love`, W / 2, H / 2 + 42, { align: 'center' })

  const pageCount = doc.getNumberOfPages()
  const blob = doc.output('blob')
  return { blob, pageCount }
}

// ── MemoryBookBuilder Component ──────────────────────────────────────────────

export default function MemoryBookBuilder({ entries, memberName, planTier, initialMemoryBooks, parentSignedUrls }: Props) {
  const [showBuilder, setShowBuilder] = useState(false)
  const [books, setBooks] = useState<MemoryBook[]>(initialMemoryBooks)

  // Builder form state
  const [title, setTitle] = useState(`${memberName}'s Memory Book`)
  const [dedication, setDedication] = useState('')
  const [layoutStyle, setLayoutStyle] = useState('classic')
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set(entries.map(e => e.id)))
  const [coverPhotoPath, setCoverPhotoPath] = useState<string | null>(null)

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState('')
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  // Stripe payment state
  const [paymentRequired, setPaymentRequired] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  const isFree = planTier === 'complete' || planTier === 'premier'
  const selectedEntries = entries.filter(e => selectedEntryIds.has(e.id))

  // All image attachments across all entries
  const allImageAttachments: Array<{ path: string; entryTitle: string; entryId: string }> = []
  for (const entry of entries) {
    const urls = parentSignedUrls[entry.id] ?? []
    for (const u of urls) {
      if (u.mime !== 'application/pdf') {
        allImageAttachments.push({ path: u.path, entryTitle: entry.title, entryId: entry.id })
      }
    }
  }

  function toggleEntry(id: string) {
    setSelectedEntryIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleCheckPayment() {
    if (isFree) return true
    setProcessingPayment(true)
    try {
      const res = await fetch('/api/life-story/memory-book/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          successUrl: `${window.location.origin}/dashboard/life-story?book_paid=true`,
          cancelUrl: `${window.location.origin}/dashboard/life-story`,
        }),
      })
      const json = await res.json()
      if (json.alreadyFree || json.stub) {
        return true
      }
      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl
        return false
      }
      return false
    } catch {
      return false
    } finally {
      setProcessingPayment(false)
    }
  }

  async function handleGenerate() {
    if (selectedEntries.length === 0) {
      setGenerationError('Select at least one memory to include.')
      return
    }

    setGenerationError(null)
    setDownloadUrl(null)

    // Check payment first
    const canProceed = await handleCheckPayment()
    if (!canProceed) return

    setIsGenerating(true)

    try {
      // 1. Create book record in DB
      setGenerationStatus('Setting up your Memory Book…')
      const createRes = await fetch('/api/life-story/memory-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          dedication,
          layoutStyle,
          entryIds: selectedEntries.map(e => e.id),
          coverPhotoPath,
        }),
      })
      const createJson = await createRes.json()
      if (!createRes.ok) {
        setGenerationError(createJson.error ?? 'Failed to create book record.')
        return
      }
      const bookId = createJson.book?.id
      if (!bookId) {
        setGenerationError('Unexpected error creating book record.')
        return
      }

      // 2. Fetch images
      setGenerationStatus('Fetching photos…')
      const { entryImages, coverImage } = await fetchAllImages(selectedEntries, parentSignedUrls, coverPhotoPath)

      // 3. Generate PDF
      const { blob, pageCount } = await generateMemoryBookPDF({
        memberName,
        title,
        dedication,
        layoutStyle,
        selectedEntries,
        coverImage,
        entryImages,
        onProgress: setGenerationStatus,
      })

      // 4. Upload PDF to Storage
      setGenerationStatus('Saving Memory Book…')
      const formData = new FormData()
      formData.append('pdf', blob, 'memory-book.pdf')
      formData.append('book_id', bookId)
      formData.append('page_count', String(pageCount))

      const uploadRes = await fetch('/api/life-story/memory-book/upload', {
        method: 'POST',
        body: formData,
      })
      const uploadJson = await uploadRes.json()

      if (!uploadRes.ok) {
        setGenerationError(uploadJson.error ?? 'Failed to save Memory Book.')
        return
      }

      // 5. Trigger browser download
      const url = uploadJson.downloadUrl ?? URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`
      a.click()

      setDownloadUrl(uploadJson.downloadUrl ?? null)

      // 6. Refresh books list
      const booksRes = await fetch('/api/life-story/memory-book')
      const booksJson = await booksRes.json()
      if (booksJson.books) setBooks(booksJson.books)

      setGenerationStatus('Memory Book ready!')
    } catch (err) {
      console.error('[MemoryBookBuilder] Generation error:', err)
      setGenerationError(err instanceof Error ? err.message : 'Unexpected error generating Memory Book.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleRedownload(storagePath: string, bookTitle: string) {
    const res = await fetch('/api/life-story/memory-book/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storagePath }),
    })
    const json = await res.json()
    if (json.downloadUrl) {
      const a = document.createElement('a')
      a.href = json.downloadUrl
      a.download = `${bookTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`
      a.click()
    }
  }

  // Auto-open builder if returning from successful payment
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('book_paid') === 'true') {
        setShowBuilder(true)
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [])

  return (
    <div>
      {/* "Create Memory Book" trigger button */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 32px' }}>
        <button
          onClick={() => setShowBuilder(s => !s)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            backgroundColor: showBuilder ? 'var(--color-navy)' : 'white',
            color: showBuilder ? 'white' : 'var(--color-navy)',
            border: '2px solid var(--color-navy)',
            borderRadius: '10px', padding: '12px 24px',
            fontSize: '15px', fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: '18px' }}>📖</span>
          {showBuilder ? 'Close Memory Book Builder' : 'Create a Memory Book'}
          {!isFree && <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 700 }}>$9.99</span>}
          {isFree && <span style={{ backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 700 }}>FREE</span>}
        </button>
      </div>

      {/* Builder panel */}
      {showBuilder && (
        <div style={{
          backgroundColor: 'white',
          border: '2px solid var(--color-navy)',
          borderRadius: '16px',
          padding: '28px',
          marginBottom: '40px',
          boxShadow: '0 8px 32px rgba(30,58,95,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <span style={{ fontSize: '28px' }}>📖</span>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
                Memory Book Builder
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                Create a beautifully designed PDF keepsake to download and cherish forever.
              </p>
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
              Book title
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ width: '100%', height: '46px', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '0 14px', fontSize: '16px', boxSizing: 'border-box' }}
            />
          </div>

          {/* Dedication */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
              Dedication message <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>(optional)</span>
            </label>
            <textarea
              value={dedication}
              onChange={e => setDedication(e.target.value)}
              placeholder="A heartfelt dedication for the cover page…"
              rows={3}
              style={{ width: '100%', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '10px 14px', fontSize: '15px', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          {/* Layout style */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '10px' }}>
              Layout style
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {LAYOUT_OPTIONS.map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setLayoutStyle(opt.id)}
                  style={{
                    border: layoutStyle === opt.id ? '2px solid var(--color-navy)' : '1.5px solid var(--color-warm-grey)',
                    borderRadius: '10px', padding: '14px 12px', cursor: 'pointer',
                    backgroundColor: layoutStyle === opt.id ? '#EFF6FF' : 'white',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-navy)', marginBottom: '4px' }}>
                    {layoutStyle === opt.id ? '✓ ' : ''}{opt.label}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                    {opt.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cover photo selection */}
          {allImageAttachments.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '8px' }}>
                Cover photo <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>(optional)</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <div
                  onClick={() => setCoverPhotoPath(null)}
                  style={{
                    width: '64px', height: '64px', borderRadius: '8px', cursor: 'pointer',
                    border: !coverPhotoPath ? '2.5px solid var(--color-navy)' : '1.5px solid var(--color-warm-grey)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: !coverPhotoPath ? '#EFF6FF' : '#F9FAFB',
                    fontSize: '22px',
                  }}
                  title="No cover photo"
                >
                  🚫
                </div>
                {allImageAttachments.slice(0, 8).map(att => {
                  const urlInfo = (parentSignedUrls[att.entryId] ?? []).find(u => u.path === att.path)
                  const isSelected = coverPhotoPath === att.path
                  return (
                    <div
                      key={att.path}
                      onClick={() => setCoverPhotoPath(att.path)}
                      title={`From: ${att.entryTitle}`}
                      style={{
                        width: '64px', height: '64px', borderRadius: '8px', cursor: 'pointer', overflow: 'hidden',
                        border: isSelected ? '2.5px solid var(--color-navy)' : '1.5px solid var(--color-warm-grey)',
                        backgroundColor: '#F3F4F6', position: 'relative',
                      }}
                    >
                      {urlInfo?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={urlInfo.url} alt={att.entryTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🖼️</div>
                      )}
                      {isSelected && (
                        <div style={{ position: 'absolute', top: 2, right: 2, background: 'var(--color-navy)', color: 'white', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>✓</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Entry selection */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)' }}>
                Memories to include ({selectedEntryIds.size} of {entries.length} selected)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedEntryIds(new Set(entries.map(e => e.id)))}
                  style={{ fontSize: '12px', color: 'var(--color-teal)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEntryIds(new Set())}
                  style={{ fontSize: '12px', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Clear
                </button>
              </div>
            </div>
            <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--color-warm-grey)', borderRadius: '10px', padding: '4px' }}>
              {entries.map(entry => {
                const isChecked = selectedEntryIds.has(entry.id)
                return (
                  <label
                    key={entry.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px',
                      cursor: 'pointer', borderRadius: '8px', backgroundColor: isChecked ? '#F0F9FF' : 'transparent',
                      transition: 'background-color 0.1s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleEntry(entry.id)}
                      style={{ width: '16px', height: '16px', marginTop: '1px', accentColor: 'var(--color-navy)', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', display: 'block' }}>
                        {entry.entry_type === 'first_memory' && <span style={{ color: '#B45309' }}>⭐ </span>}
                        {entry.title}
                      </span>
                      {entry.era && (
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{entry.era}</span>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Pricing note for paid plans */}
          {!isFree && (
            <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#92400E', marginBottom: '4px' }}>$9.99 one-time download</div>
              <div style={{ fontSize: '13px', color: '#78350F' }}>
                Memory Books are included free with Complete and Premier plans.
                Your current plan ({planTier}) charges $9.99 per book. You&apos;ll be redirected to complete payment, then your book will generate automatically.
              </div>
            </div>
          )}

          {/* Error */}
          {generationError && (
            <div role="alert" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#DC2626', fontSize: '14px' }}>
              {generationError}
            </div>
          )}

          {/* Generation progress */}
          {isGenerating && (
            <div style={{ backgroundColor: '#F0F9FF', border: '1px solid #93C5FD', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>Generating your Memory Book…</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{generationStatus}</div>
              <div style={{ marginTop: '10px', height: '4px', backgroundColor: '#DBEAFE', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', backgroundColor: 'var(--color-teal)', animation: 'pulse 1.5s ease-in-out infinite', width: '60%' }} />
              </div>
            </div>
          )}

          {/* Success */}
          {!isGenerating && generationStatus === 'Memory Book ready!' && (
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#065F46' }}>Your Memory Book is ready!</div>
              <div style={{ fontSize: '13px', color: '#047857', marginTop: '4px' }}>
                The PDF downloaded automatically. You can find it again in &quot;Your Memory Books&quot; below.
              </div>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || processingPayment || selectedEntryIds.size === 0}
            style={{
              width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
              backgroundColor: selectedEntryIds.size === 0 ? '#9CA3AF' : 'var(--color-navy)',
              color: 'white', fontSize: '16px', fontWeight: 700, cursor: (isGenerating || processingPayment || selectedEntryIds.size === 0) ? 'not-allowed' : 'pointer',
              opacity: (isGenerating || processingPayment) ? 0.8 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {processingPayment ? 'Redirecting to payment…' : isGenerating ? 'Generating…' : !isFree ? 'Pay $9.99 & Generate Memory Book →' : 'Generate & Download Memory Book →'}
          </button>
        </div>
      )}

      {/* Your Memory Books section */}
      {books.length > 0 && (
        <section style={{ marginTop: '48px', paddingTop: '32px', borderTop: '2px solid var(--color-warm-grey)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 20px' }}>
            Your Memory Books
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {books.map(book => {
              const date = new Date(book.created_at).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
              })
              return (
                <div
                  key={book.id}
                  style={{
                    backgroundColor: 'white', border: '1.5px solid var(--color-warm-grey)',
                    borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden',
                  }}
                >
                  {/* Color band at top */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--color-navy)' }} />
                  <div style={{ fontSize: '28px', marginBottom: '10px' }}>📖</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '4px' }}>
                    {book.title}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Created {date}
                  </div>
                  {book.page_count && (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                      {book.page_count} pages · {book.entry_ids.length} {book.entry_ids.length === 1 ? 'memory' : 'memories'}
                    </div>
                  )}
                  {book.storage_path ? (
                    <button
                      onClick={() => handleRedownload(book.storage_path!, book.title)}
                      style={{
                        width: '100%', padding: '9px', borderRadius: '8px',
                        backgroundColor: 'var(--color-navy)', color: 'white',
                        border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      Download PDF
                    </button>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>PDF not yet saved</div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
