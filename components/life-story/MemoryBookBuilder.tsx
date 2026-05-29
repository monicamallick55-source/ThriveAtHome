'use client'

import { useState, useEffect } from 'react'
import type { LifeStoryEntry, MemoryBook } from '@/lib/data/life-story'

type SignedUrlInfo = { path: string; url: string; original_name: string; mime: string }

type FormatType = 'memory_book' | 'collage' | 'both'

interface RegenInfo {
  regenBookId: string
  regenRemaining: number
  regenTotal: number
  purchaseDate: string
  expiresAt: string
}

interface Props {
  entries: LifeStoryEntry[]
  memberName: string
  planTier: string
  memberStatus: string
  memberDob: string | null
  initialMemoryBooks: MemoryBook[]
  parentSignedUrls: Record<string, SignedUrlInfo[]>
}

const LAYOUT_OPTIONS = [
  { id: 'classic',   label: 'Classic',   desc: 'Navy accents, cream pages, serif headings.' },
  { id: 'modern',    label: 'Modern',    desc: 'Teal accents, clean whitespace, contemporary.' },
  { id: 'scrapbook', label: 'Scrapbook', desc: 'Warm amber headers, cozy personal feel.' },
]

const ERAS = ['Childhood', 'Teen years', 'Young adult', 'Early career', 'Career', 'Marriage & family', 'Later years', 'Recent memories']

// Pricing table: [connect_cents, basics_cents, memorial_cents]
const FORMAT_PRICING: Record<FormatType, [number, number, number]> = {
  memory_book: [1499, 1999, 2499],
  collage:     [999,  1299, 2499],
  both:        [1999, 2499, 2499],
}

function getPriceCents(formatType: FormatType, planTier: string, isMemorial: boolean): number | null {
  if (planTier === 'complete' || planTier === 'premier') return null
  const tiers = FORMAT_PRICING[formatType]
  if (isMemorial) return tiers[2]
  return planTier === 'connect' ? tiers[0] : tiers[1]
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

// ── Image helpers ───────────────────────────────────────────────────────────

async function fetchImageAsBase64(url: string): Promise<{ data: string; format: string } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    const format = blob.type.includes('png') ? 'PNG' : 'JPEG'
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve({ data: base64, format })
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
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
    const urls = (signedUrls[entry.id] ?? []).filter(u => u.mime !== 'application/pdf')
    if (urls.length === 0) continue
    entryImages[entry.id] = []
    for (const u of urls) {
      const img = await fetchImageAsBase64(u.url)
      if (img) {
        entryImages[entry.id].push({ ...img, path: u.path })
        if (u.path === coverPhotoPath && !coverImage) coverImage = img
      }
    }
  }
  return { entryImages, coverImage }
}

// ── Memory Book PDF (multi-page 8.5×11) ─────────────────────────────────────

async function generateMemoryBookPDF(config: {
  memberName: string
  title: string
  dedication: string
  layoutStyle: string
  selectedEntries: LifeStoryEntry[]
  coverImage: { data: string; format: string } | null
  entryImages: Record<string, Array<{ data: string; format: string; path: string }>>
  onProgress: (s: string) => void
}): Promise<{ blob: Blob; pageCount: number }> {
  const { jsPDF } = await import('jspdf')
  const { memberName, title, dedication, layoutStyle, selectedEntries, coverImage, entryImages } = config

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 20

  const palette = {
    classic:   { primary: [30, 58, 95],   accent: [13, 148, 136], bg: [255, 251, 247], text: [30, 30, 40],  gold: [180, 83, 9]  },
    modern:    { primary: [13, 148, 136], accent: [30, 58, 95],   bg: [250, 250, 250], text: [17, 24, 39],  gold: [234, 179, 8] },
    scrapbook: { primary: [180, 83, 9],   accent: [13, 148, 136], bg: [255, 253, 240], text: [29, 42, 61],  gold: [180, 83, 9]  },
  }
  const C = palette[layoutStyle as keyof typeof palette] ?? palette.classic

  const fill = (c: number[]) => doc.setFillColor(c[0], c[1], c[2])
  const draw = (c: number[]) => doc.setDrawColor(c[0], c[1], c[2])
  const txt  = (c: number[]) => doc.setTextColor(c[0], c[1], c[2])

  // ── COVER ─────────────────────────────────────────────────────────────────
  config.onProgress('Designing cover page…')
  fill(C.bg); doc.rect(0, 0, W, H, 'F')
  fill(C.primary); doc.rect(0, 0, W, 72, 'F')

  doc.setFont('times', 'italic'); doc.setFontSize(11); txt([255, 255, 255])
  doc.text('ThriveAtHome', W / 2, 14, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(200, 220, 240)
  doc.text('Preserving every precious memory', W / 2, 21, { align: 'center' })

  if (coverImage) {
    try {
      doc.addImage(coverImage.data, coverImage.format, (W - 120) / 2, 28, 120, 38)
      draw(C.primary); doc.setLineWidth(0.3)
      doc.rect((W - 120) / 2, 28, 120, 38)
    } catch { /* skip */ }
  }

  fill(C.accent); doc.rect(0, 72, W, 2.5, 'F')

  const nameY = coverImage ? 88 : 84
  doc.setFont('times', 'bold'); doc.setFontSize(34); txt(C.primary)
  doc.text(title, W / 2, nameY, { align: 'center', maxWidth: W - 40 })
  doc.setFont('times', 'italic'); doc.setFontSize(15); txt(C.accent)
  doc.text('A Life Remembered', W / 2, nameY + 14, { align: 'center' })
  draw(C.accent); doc.setLineWidth(0.8)
  doc.line(M + 20, nameY + 22, W - M - 20, nameY + 22)

  if (dedication) {
    doc.setFont('times', 'italic'); doc.setFontSize(12); txt([90, 90, 100])
    const dedLines = doc.splitTextToSize(`"${dedication}"`, W - 60)
    doc.text(dedLines, W / 2, nameY + 34, { align: 'center' })
  }

  const eras = ERAS.filter(era => selectedEntries.some(e => e.era === era))
  if (eras.length > 0) {
    const tocY = H - 72
    fill([240, 240, 250]); doc.rect(M, tocY - 6, W - M * 2, eras.length * 8 + 18, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); txt(C.primary)
    doc.text('CHAPTERS', M + 8, tocY + 2)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); txt([60, 60, 80])
    eras.forEach((era, i) => doc.text(`· ${era}`, M + 8, tocY + 12 + i * 8))
  }

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); txt([160, 160, 170])
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  doc.text(`Generated ${today} · ThriveAtHome Memory Book`, W / 2, H - 10, { align: 'center' })

  // ── ERA CHAPTERS ─────────────────────────────────────────────────────────
  const eraGroups: Array<{ era: string | null; entries: LifeStoryEntry[] }> = []
  ERAS.forEach(era => {
    const e = selectedEntries.filter(en => en.era === era)
    if (e.length > 0) eraGroups.push({ era, entries: e })
  })
  const otherEras = [...new Set(selectedEntries.filter(e => e.era && !ERAS.includes(e.era)).map(e => e.era!))]
  otherEras.forEach(era => {
    const e = selectedEntries.filter(en => en.era === era)
    if (e.length > 0) eraGroups.push({ era, entries: e })
  })
  const noEra = selectedEntries.filter(e => !e.era)
  if (noEra.length > 0) eraGroups.push({ era: null, entries: noEra })

  for (const group of eraGroups) {
    if (!group.era) continue
    config.onProgress(`Writing chapter: ${group.era}…`)
    doc.addPage()
    fill(C.bg); doc.rect(0, 0, W, H, 'F')
    fill(C.accent); doc.rect(0, 0, W, 56, 'F')
    doc.setFont('times', 'bold'); doc.setFontSize(28); txt([255, 255, 255])
    doc.text(group.era, W / 2, 34, { align: 'center' })
    const first = group.entries[0]
    const pull = first.content.substring(0, 140) + (first.content.length > 140 ? '…' : '')
    doc.setFont('times', 'italic'); doc.setFontSize(13); txt(C.primary)
    const pullLines = doc.splitTextToSize(`"${pull}"`, W - 60)
    doc.text(pullLines, W / 2, 80, { align: 'center' })
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); txt(C.accent)
    doc.text(`— ${first.title}`, W / 2, 80 + pullLines.length * 7 + 6, { align: 'center' })
    fill(C.accent); [W / 2 - 8, W / 2, W / 2 + 8].forEach(x => doc.circle(x, H - 30, 1.5, 'F'))
    doc.setFontSize(9); txt([140, 140, 160])
    doc.text(`${group.entries.length} ${group.entries.length === 1 ? 'memory' : 'memories'}`, W / 2, H - 20, { align: 'center' })
  }

  // ── ENTRY PAGES ──────────────────────────────────────────────────────────
  let idx = 0
  for (const group of eraGroups) {
    for (const entry of group.entries) {
      idx++
      config.onProgress(`Writing memory ${idx} of ${selectedEntries.length}: ${entry.title.substring(0, 30)}…`)
      doc.addPage()
      fill(C.bg); doc.rect(0, 0, W, H, 'F')
      fill(C.accent); doc.rect(0, 0, 3, H, 'F')

      if (entry.era) {
        fill(C.accent); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); txt([255, 255, 255])
        const eraW = doc.getTextWidth(entry.era) + 10
        doc.roundedRect(W - M - eraW, M - 5, eraW, 9, 2, 2, 'F')
        doc.text(entry.era.toUpperCase(), W - M - eraW / 2, M, { align: 'center' })
      }

      let titleY = M + 6
      if (entry.entry_type === 'first_memory') {
        fill([254, 249, 195]); const bW = 88
        doc.roundedRect(M + 3, M - 2, bW, 9, 2, 2, 'F')
        draw([253, 211, 77]); doc.setLineWidth(0.3); doc.roundedRect(M + 3, M - 2, bW, 9, 2, 2, 'D')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); txt(C.gold)
        doc.text('★ FIRST MEMORY / MILESTONE', M + 7, M + 4)
        titleY = M + 16
      }

      doc.setFont('times', 'bold'); doc.setFontSize(22); txt(C.primary)
      const titleLines = doc.splitTextToSize(entry.title, W - M * 2 - 10)
      doc.text(titleLines, M + 3, titleY)
      let y = titleY + titleLines.length * 10

      doc.setFont('times', 'italic'); doc.setFontSize(9.5); txt([120, 120, 140])
      const dateStr = new Date(entry.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
      doc.text(dateStr, M + 3, y + 3); y += 9
      draw(C.accent); doc.setLineWidth(0.5); doc.line(M + 3, y + 3, W - M, y + 3); y += 10

      doc.setFont('helvetica', 'normal'); doc.setFontSize(11); txt(C.text)
      const cLines = doc.splitTextToSize(entry.content, W - M * 2 - 10)
      const maxLines = Math.min(cLines.length, 22)
      doc.text(cLines.slice(0, maxLines), M + 3, y); y += maxLines * 6.5 + 4
      if (cLines.length > maxLines) { doc.setFontSize(9); txt([140, 140, 160]); doc.text('[Memory continues…]', M + 3, y); y += 8 }

      const imgs = entryImages[entry.id] ?? []
      if (imgs.length > 0 && y < H - 55) {
        y += 4
        const availH = H - y - 20
        const imgH = Math.min(45, availH)
        const imgW = Math.min(70, (W - M * 2 - 10) / imgs.length - 4)
        let imgX = M + 3
        for (const img of imgs.slice(0, 3)) {
          try {
            doc.addImage(img.data, img.format, imgX, y, imgW, imgH)
            draw([210, 210, 220]); doc.setLineWidth(0.3); doc.rect(imgX, y, imgW, imgH)
            imgX += imgW + 4
          } catch { /* skip */ }
        }
      }

      fill(C.accent); doc.rect(0, H - 6, W, 6, 'F')
      txt([255, 255, 255]); doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
      doc.text(`${doc.getNumberOfPages()}`, W / 2, H - 2, { align: 'center' })
    }
  }

  // ── BACK COVER ────────────────────────────────────────────────────────────
  config.onProgress('Creating back cover…')
  doc.addPage()
  fill(C.primary); doc.rect(0, 0, W, H, 'F')
  fill(C.accent); doc.rect(0, 0, W, 8, 'F'); doc.rect(0, H - 8, W, 8, 'F')
  doc.setFont('times', 'bold'); doc.setFontSize(32); txt([255, 255, 255])
  doc.text('ThriveAtHome', W / 2, H / 2 - 24, { align: 'center' })
  doc.setFont('times', 'italic'); doc.setFontSize(14); txt([180, 210, 240])
  doc.text('Every life has a story worth telling.', W / 2, H / 2 - 8, { align: 'center' })
  draw(C.accent); doc.setLineWidth(0.8); doc.line(M + 30, H / 2 + 2, W - M - 30, H / 2 + 2)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); txt([180, 200, 230])
  const yr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  doc.text(`Memory book for ${memberName}`, W / 2, H / 2 + 16, { align: 'center' })
  doc.text(yr, W / 2, H / 2 + 26, { align: 'center' })
  doc.setFontSize(9); txt([120, 160, 200])
  doc.text(`${selectedEntries.length} ${selectedEntries.length === 1 ? 'memory' : 'memories'} preserved with love`, W / 2, H / 2 + 42, { align: 'center' })

  return { blob: doc.output('blob'), pageCount: doc.getNumberOfPages() }
}

// ── Memory Collage PDF (single page 12×12 square) ────────────────────────────

async function generateCollagePDF(config: {
  memberName: string
  birthYear: number | null
  layoutStyle: string
  selectedEntries: LifeStoryEntry[]
  entryImages: Record<string, Array<{ data: string; format: string; path: string }>>
  quoteEntryIds: string[]
  highlights: string
  onProgress: (s: string) => void
}): Promise<{ blob: Blob }> {
  const { jsPDF } = await import('jspdf')
  const { memberName, birthYear, layoutStyle, selectedEntries, entryImages, quoteEntryIds, highlights } = config

  // 12×12 inches = 304.8mm × 304.8mm
  const SIZE = 304.8
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [SIZE, SIZE] })
  const BRD = 10  // border inset
  const M = 18    // content margin

  const palette = {
    classic:   { primary: [30, 58, 95],   accent: [13, 148, 136], bg: [255, 251, 240], text: [30, 30, 40]  },
    modern:    { primary: [13, 148, 136], accent: [30, 58, 95],   bg: [248, 250, 252], text: [17, 24, 39]  },
    scrapbook: { primary: [120, 53, 15],  accent: [13, 148, 136], bg: [255, 253, 235], text: [29, 42, 61]  },
  }
  const C = palette[layoutStyle as keyof typeof palette] ?? palette.classic

  const fill = (c: number[]) => doc.setFillColor(c[0], c[1], c[2])
  const draw = (c: number[]) => doc.setDrawColor(c[0], c[1], c[2])
  const txt  = (c: number[]) => doc.setTextColor(c[0], c[1], c[2])

  config.onProgress('Designing Memory Collage…')

  // Background
  fill(C.bg); doc.rect(0, 0, SIZE, SIZE, 'F')

  // Decorative border: outer navy frame + inner accent line
  draw(C.primary); doc.setLineWidth(1.5)
  doc.rect(BRD, BRD, SIZE - BRD * 2, SIZE - BRD * 2)
  draw(C.accent); doc.setLineWidth(0.5)
  doc.rect(BRD + 3, BRD + 3, SIZE - (BRD + 3) * 2, SIZE - (BRD + 3) * 2)

  // Corner flourishes (small circles at inner-border corners)
  fill(C.accent)
  const ci = BRD + 3
  ;[[ci, ci], [SIZE - ci, ci], [ci, SIZE - ci], [SIZE - ci, SIZE - ci]].forEach(([cx, cy]) => {
    doc.circle(cx, cy, 2, 'F')
  })

  // Senior name — large display serif
  doc.setFont('times', 'bold'); doc.setFontSize(44); txt(C.primary)
  doc.text(memberName, SIZE / 2, M + 22, { align: 'center', maxWidth: SIZE - M * 2 })

  // Birth year
  if (birthYear) {
    doc.setFont('times', 'italic'); doc.setFontSize(18); txt(C.accent)
    doc.text(`born ${birthYear}`, SIZE / 2, M + 36, { align: 'center' })
  }

  // Decorative divider line
  draw(C.accent); doc.setLineWidth(1.2)
  doc.line(M + 20, M + 44, SIZE - M - 20, M + 44)
  fill(C.accent)
  ;[SIZE / 2 - 6, SIZE / 2, SIZE / 2 + 6].forEach(x => doc.circle(x, M + 44, 1.2, 'F'))

  // ── Photo grid ───────────────────────────────────────────────────────────
  // Collect all available images across selected entries
  const allImgs: Array<{ data: string; format: string }> = []
  for (const entry of selectedEntries) {
    for (const img of (entryImages[entry.id] ?? [])) {
      allImgs.push(img)
      if (allImgs.length >= 9) break
    }
    if (allImgs.length >= 9) break
  }

  config.onProgress('Placing photos in collage…')

  const gridTop = M + 52
  const gridBottom = SIZE - M - 44  // leave room for highlights + footer
  const gridHeight = gridBottom - gridTop

  // Quote entries
  const quoteEntries = selectedEntries.filter(e => quoteEntryIds.includes(e.id))
  const hasQuotes = quoteEntries.length > 0

  if (allImgs.length > 0) {
    const cols = Math.min(allImgs.length, 3)
    const gap = 4
    const photoW = (SIZE - M * 2 - gap * (cols - 1)) / cols
    const rowH = hasQuotes ? Math.min(photoW * 0.72, (gridHeight - 32) / 2) : Math.min(photoW * 0.72, gridHeight / 3)

    const rows = Math.ceil(Math.min(allImgs.length, 6) / cols)
    let imgIdx = 0

    for (let row = 0; row < rows; row++) {
      const rowY = gridTop + row * (rowH + gap + (hasQuotes && row === 1 ? 28 : 0))

      for (let col = 0; col < cols; col++) {
        if (imgIdx >= allImgs.length) break
        const imgX = M + col * (photoW + gap)
        const imgY = rowY

        // Soft shadow
        fill([200, 200, 210]); doc.rect(imgX + 1.5, imgY + 1.5, photoW, rowH, 'F')

        // White border frame
        fill([255, 255, 255]); doc.rect(imgX, imgY, photoW, rowH, 'F')

        try {
          doc.addImage(allImgs[imgIdx].data, allImgs[imgIdx].format, imgX + 2, imgY + 2, photoW - 4, rowH - 4)
        } catch { /* skip */ }

        draw([230, 230, 235]); doc.setLineWidth(0.3)
        doc.rect(imgX, imgY, photoW, rowH)
        imgIdx++
      }

      // Quote between rows
      if (hasQuotes && row === 0 && quoteEntries.length > 0) {
        const qEntry = quoteEntries[0]
        const qText = qEntry.content.substring(0, 120) + (qEntry.content.length > 120 ? '…' : '')
        const qY = rowY + rowH + 4

        // Quote background
        fill([240, 248, 255]); doc.rect(M, qY, SIZE - M * 2, 24, 'F')
        fill(C.accent); doc.rect(M, qY, 2.5, 24, 'F')

        doc.setFont('times', 'italic'); doc.setFontSize(10); txt(C.primary)
        const qLines = doc.splitTextToSize(`"${qText}"`, SIZE - M * 2 - 12)
        doc.text(qLines.slice(0, 2), M + 6, qY + 8)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); txt(C.accent)
        doc.text(`— ${qEntry.title}`, M + 6, qY + 20)
      }
    }
  } else {
    // No photos: show quote in center if available
    if (quoteEntries.length > 0) {
      const qEntry = quoteEntries[0]
      const qText = qEntry.content.substring(0, 200) + (qEntry.content.length > 200 ? '…' : '')
      doc.setFont('times', 'italic'); doc.setFontSize(14); txt(C.primary)
      const qLines = doc.splitTextToSize(`"${qText}"`, SIZE - M * 2 - 20)
      doc.text(qLines, SIZE / 2, SIZE / 2 - 10, { align: 'center' })
    }
  }

  // Second quote (if two quote entries selected)
  if (quoteEntries.length > 1 && allImgs.length > 0) {
    const qEntry = quoteEntries[1]
    const qText = qEntry.content.substring(0, 100) + (qEntry.content.length > 100 ? '…' : '')
    const qY = SIZE - M - 56

    fill([255, 248, 235]); doc.rect(M, qY, SIZE - M * 2, 20, 'F')
    fill(C.primary); doc.rect(M, qY, 2.5, 20, 'F')
    doc.setFont('times', 'italic'); doc.setFontSize(9); txt(C.primary)
    const qLines = doc.splitTextToSize(`"${qText}"`, SIZE - M * 2 - 12)
    doc.text(qLines.slice(0, 2), M + 6, qY + 7)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); txt(C.accent)
    doc.text(`— ${qEntry.title}`, M + 6, qY + 16)
  }

  // ── Key highlights ───────────────────────────────────────────────────────
  if (highlights.trim()) {
    config.onProgress('Adding highlights…')
    const hlY = SIZE - M - 30
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); txt(C.accent)
    doc.text('KEY MOMENTS', M, hlY)
    draw(C.accent); doc.setLineWidth(0.4); doc.line(M, hlY + 2, M + doc.getTextWidth('KEY MOMENTS'), hlY + 2)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); txt(C.text)
    const hlLines = doc.splitTextToSize(highlights, SIZE - M * 2)
    doc.text(hlLines.slice(0, 2), M, hlY + 10)
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  draw(C.accent); doc.setLineWidth(0.4); doc.line(M, SIZE - M - 6, SIZE - M, SIZE - M - 6)
  doc.setFont('times', 'italic'); doc.setFontSize(8.5); txt(C.accent)
  doc.text('ThriveAtHome', SIZE / 2, SIZE - M, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); txt([180, 180, 190])
  doc.text('Memory Collage — printed with love', SIZE / 2, SIZE - M + 6, { align: 'center' })

  return { blob: doc.output('blob') }
}

// ── HTML Preview Component ────────────────────────────────────────────────────

function MemoryBookPreviewPanel({
  formatType, title, dedication, layoutStyle, memberName, selectedEntries,
  coverPhotoUrl, priceCents, isFree, planTier, isMemorial,
  regenInfo, onClose, onGenerate, isGenerating,
}: {
  formatType: FormatType
  title: string
  dedication: string
  layoutStyle: string
  memberName: string
  selectedEntries: LifeStoryEntry[]
  coverPhotoUrl: string | null
  priceCents: number | null
  isFree: boolean
  planTier: string
  isMemorial: boolean
  regenInfo: RegenInfo | null
  onClose: () => void
  onGenerate: () => void
  isGenerating: boolean
}) {
  const paletteBg: Record<string, string> = { classic: '#FFFBF7', modern: '#F8FAFC', scrapbook: '#FFFDF0' }
  const paletteNav: Record<string, string> = { classic: '#1E3A5F', modern: '#0D9488', scrapbook: '#B45309' }
  const paletteAccent: Record<string, string> = { classic: '#0D9488', modern: '#1E3A5F', scrapbook: '#0D9488' }
  const bg = paletteBg[layoutStyle] ?? paletteBg.classic
  const nav = paletteNav[layoutStyle] ?? paletteNav.classic
  const accent = paletteAccent[layoutStyle] ?? paletteAccent.classic

  const eras = ERAS.filter(era => selectedEntries.some(e => e.era === era))

  const priceLabel = isFree ? 'Included in your plan' : regenInfo
    ? `Regeneration ${4 - regenInfo.regenRemaining} of 3 — Free`
    : priceCents ? `$${(priceCents / 100).toFixed(2)} one-time` : 'Included in your plan'

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '24px 16px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', maxWidth: '660px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', margin: 0 }}>
              {formatType === 'collage' ? '🖼️ Memory Collage Preview' : formatType === 'both' ? '📖🖼️ Memory Book + Collage Preview' : '📖 Memory Book Preview'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
              How your keepsake will look — watermark removed after generation.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6B7280', lineHeight: 1 }}>×</button>
        </div>

        {/* Pricing call-out — prominent */}
        <div style={{ backgroundColor: isFree || regenInfo ? '#F0FDF4' : '#FFF7ED', border: `1.5px solid ${isFree || regenInfo ? '#86EFAC' : '#FCD34D'}`, borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '22px' }}>{isFree || regenInfo ? '✓' : '💳'}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: isFree || regenInfo ? '#065F46' : '#92400E' }}>{priceLabel}</div>
            {!isFree && !regenInfo && (
              <div style={{ fontSize: '13px', color: '#78350F', marginTop: '2px' }}>
                Memory Books are free with Complete and Premier plans.
                {isMemorial && ' Memorial Edition pricing applies.'}
              </div>
            )}
            {regenInfo && (
              <div style={{ fontSize: '13px', color: '#047857', marginTop: '2px' }}>
                {regenInfo.regenRemaining} regeneration{regenInfo.regenRemaining !== 1 ? 's' : ''} remaining (until {regenInfo.expiresAt})
              </div>
            )}
            {!isFree && !regenInfo && planTier && (
              <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                Your plan: {planTier.charAt(0).toUpperCase() + planTier.slice(1)}
              </div>
            )}
          </div>
        </div>

        {/* Preview mock — Memory Book cover */}
        {(formatType === 'memory_book' || formatType === 'both') && (
          <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', marginBottom: formatType === 'both' ? '12px' : '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            {/* Watermark */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
              <div style={{ transform: 'rotate(-30deg)', fontSize: '22px', fontWeight: 800, color: 'rgba(0,0,0,0.12)', textAlign: 'center', letterSpacing: '2px', userSelect: 'none', whiteSpace: 'nowrap' }}>
                PREVIEW ONLY · PREVIEW ONLY · PREVIEW ONLY
              </div>
            </div>
            {/* Cover */}
            <div style={{ backgroundColor: bg }}>
              <div style={{ backgroundColor: nav, padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontStyle: 'italic', fontSize: '13px', color: 'white', fontFamily: 'serif' }}>ThriveAtHome</div>
                <div style={{ fontSize: '10px', color: 'rgba(200,220,240,0.9)', marginTop: '2px' }}>Preserving every precious memory</div>
                {coverPhotoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverPhotoUrl} alt="Cover" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', marginTop: '10px', borderRadius: '4px' }} />
                )}
              </div>
              <div style={{ height: '3px', backgroundColor: accent }} />
              <div style={{ padding: '20px 24px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'serif', fontSize: '26px', fontWeight: 700, color: nav, marginBottom: '6px', lineHeight: 1.2 }}>{title || memberName + "'s Memory Book"}</div>
                <div style={{ fontStyle: 'italic', fontSize: '14px', color: accent, marginBottom: '12px' }}>A Life Remembered</div>
                {dedication && <div style={{ fontStyle: 'italic', fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>"{dedication}"</div>}
                {eras.length > 0 && (
                  <div style={{ backgroundColor: '#F0F0FA', borderRadius: '6px', padding: '10px 16px', textAlign: 'left', display: 'inline-block', minWidth: '160px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: nav, marginBottom: '6px', letterSpacing: '1px' }}>CHAPTERS</div>
                    {eras.map(era => <div key={era} style={{ fontSize: '11px', color: '#444' }}>· {era}</div>)}
                  </div>
                )}
                <div style={{ fontSize: '10px', color: '#AAA', marginTop: '12px' }}>{selectedEntries.length} memories · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
              </div>
            </div>
          </div>
        )}

        {/* Preview mock — Memory Collage */}
        {(formatType === 'collage' || formatType === 'both') && (
          <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
              <div style={{ transform: 'rotate(-30deg)', fontSize: '22px', fontWeight: 800, color: 'rgba(0,0,0,0.12)', textAlign: 'center', letterSpacing: '2px', userSelect: 'none', whiteSpace: 'nowrap' }}>
                PREVIEW ONLY · PREVIEW ONLY · PREVIEW ONLY
              </div>
            </div>
            <div style={{ backgroundColor: bg, border: `3px solid ${nav}`, padding: '20px', aspectRatio: '1/1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'serif', fontSize: '28px', fontWeight: 700, color: nav, marginBottom: '4px' }}>{memberName}</div>
                <div style={{ fontSize: '11px', fontStyle: 'italic', color: accent }}>A Life in Memories</div>
                <div style={{ width: '80px', height: '1.5px', backgroundColor: accent, margin: '8px auto' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', width: '100%', flex: 1, marginTop: '8px', marginBottom: '8px' }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{ backgroundColor: i < 3 ? '#E8EFF8' : '#E8F8F5', borderRadius: '4px', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🖼️</div>
                ))}
              </div>
              <div style={{ fontSize: '9px', fontStyle: 'italic', color: accent, textAlign: 'center' }}>ThriveAtHome Memory Collage — 12×12" print-ready</div>
            </div>
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          style={{
            width: '100%', padding: '15px', borderRadius: '10px', border: 'none',
            backgroundColor: isGenerating ? '#9CA3AF' : 'var(--color-navy)',
            color: 'white', fontSize: '16px', fontWeight: 700,
            cursor: isGenerating ? 'not-allowed' : 'pointer', marginBottom: '12px',
          }}
        >
          {isGenerating ? 'Generating…' : (isFree || regenInfo) ? 'Generate & Download →' : `Pay ${priceCents ? `$${(priceCents / 100).toFixed(2)}` : ''} & Generate →`}
        </button>
        <button
          onClick={onClose}
          style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--color-warm-grey)', background: 'white', color: 'var(--color-text-secondary)', fontSize: '14px', cursor: 'pointer' }}
        >
          ← Back to editor
        </button>
      </div>
    </div>
  )
}

// ── MemoryBookBuilder Component ───────────────────────────────────────────────

export default function MemoryBookBuilder({
  entries, memberName, planTier, memberStatus, memberDob, initialMemoryBooks, parentSignedUrls
}: Props) {
  const isMemorial = memberStatus === 'inactive'
  const birthYear = memberDob ? new Date(memberDob).getUTCFullYear() : null

  const [showBuilder, setShowBuilder] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [books, setBooks] = useState<MemoryBook[]>(initialMemoryBooks)

  // Builder form state
  const [formatType, setFormatType] = useState<FormatType>('memory_book')
  const [title, setTitle] = useState(`${memberName}'s Memory Book`)
  const [dedication, setDedication] = useState('')
  const [layoutStyle, setLayoutStyle] = useState('classic')
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set(entries.map(e => e.id)))
  const [coverPhotoPath, setCoverPhotoPath] = useState<string | null>(null)
  const [quoteEntryIds, setQuoteEntryIds] = useState<string[]>([])
  const [highlights, setHighlights] = useState('')

  // Draft state
  const [draftSaved, setDraftSaved] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState('')
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Payment state
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [regenInfo, setRegenInfo] = useState<RegenInfo | null>(null)

  const isFree = planTier === 'complete' || planTier === 'premier'
  const priceCents = getPriceCents(formatType, planTier, isMemorial)

  const selectedEntries = entries.filter(e => selectedEntryIds.has(e.id))
  const existingDraft = books.find(b => b.status === 'draft') ?? null
  const generatedBooks = books.filter(b => b.status === 'generated')

  // All image attachments across all entries
  const allImageAttachments: Array<{ path: string; entryTitle: string; entryId: string }> = []
  for (const entry of entries) {
    for (const u of (parentSignedUrls[entry.id] ?? [])) {
      if (u.mime !== 'application/pdf') allImageAttachments.push({ path: u.path, entryTitle: entry.title, entryId: entry.id })
    }
  }

  const coverPhotoUrl = (() => {
    if (!coverPhotoPath) return null
    for (const entry of entries) {
      const u = (parentSignedUrls[entry.id] ?? []).find(u => u.path === coverPhotoPath)
      if (u) return u.url
    }
    return null
  })()

  function toggleEntry(id: string) {
    setSelectedEntryIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function toggleQuoteEntry(id: string) {
    setQuoteEntryIds(prev => {
      if (prev.includes(id)) return prev.filter(q => q !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  function loadDraft(draft: MemoryBook) {
    setFormatType((draft.format_type as FormatType) ?? 'memory_book')
    setTitle(draft.title)
    setDedication(draft.dedication ?? '')
    setLayoutStyle(draft.layout_style ?? 'classic')
    setSelectedEntryIds(new Set((draft.entry_ids ?? []).filter(id => entries.some(e => e.id === id))))
    setCoverPhotoPath(draft.cover_photo_path ?? null)
    setShowBuilder(true)
  }

  async function handleSaveDraft() {
    if (selectedEntries.length === 0) { setGenerationError('Select at least one memory to save a draft.'); return }
    setSavingDraft(true); setDraftSaved(false)
    try {
      const res = await fetch('/api/life-story/memory-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, dedication, layoutStyle, formatType,
          entryIds: Array.from(selectedEntryIds),
          coverPhotoPath,
          status: 'draft',
        }),
      })
      const json = await res.json()
      if (res.ok && json.book) {
        setBooks(prev => {
          const withoutDraft = prev.filter(b => b.status !== 'draft')
          return [json.book, ...withoutDraft]
        })
        setDraftSaved(true)
        setTimeout(() => setDraftSaved(false), 3000)
      }
    } catch { /* silent */ } finally { setSavingDraft(false) }
  }

  async function handleCheckPayment(): Promise<boolean> {
    if (isFree || paymentCompleted) return true

    setProcessingPayment(true)
    try {
      const res = await fetch('/api/life-story/memory-book/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formatType,
          successUrl: `${window.location.origin}/dashboard/life-story?book_paid=true&format=${formatType}`,
          cancelUrl: `${window.location.origin}/dashboard/life-story`,
        }),
      })
      const json = await res.json()

      if (json.alreadyFree || json.stub) return true

      if (json.regenAllowed) {
        // Store regen info and proceed
        setRegenInfo({
          regenBookId: json.regenBookId,
          regenRemaining: json.regenRemaining,
          regenTotal: json.regenTotal,
          purchaseDate: json.purchaseDate,
          expiresAt: json.expiresAt,
        })
        // Confirm regen with server
        await fetch('/api/life-story/memory-book/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ regenBookId: json.regenBookId }),
        })
        return true
      }

      if (json.blocked) {
        setGenerationError(json.message)
        return false
      }

      if (json.checkoutUrl) {
        try {
          sessionStorage.setItem('memoryBookBuilderState', JSON.stringify({
            title, dedication, layoutStyle, formatType,
            selectedEntryIds: Array.from(selectedEntryIds),
            coverPhotoPath, quoteEntryIds, highlights,
          }))
        } catch { /* sessionStorage unavailable */ }
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
    if (selectedEntries.length === 0) { setGenerationError('Select at least one memory to include.'); return }
    setGenerationError(null)
    setShowPreview(false)

    const canProceed = await handleCheckPayment()
    if (!canProceed) return

    setIsGenerating(true)
    try {
      // Create book record
      setGenerationStatus('Setting up your keepsake…')
      const createRes = await fetch('/api/life-story/memory-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, dedication, layoutStyle, formatType,
          entryIds: selectedEntries.map(e => e.id),
          coverPhotoPath,
          purchaseDate: !isFree ? new Date().toISOString() : null,
        }),
      })
      const createJson = await createRes.json()
      if (!createRes.ok || !createJson.book?.id) {
        setGenerationError(createJson.error ?? 'Failed to create book record.')
        return
      }
      const bookId = createJson.book.id

      // Fetch images
      setGenerationStatus('Fetching photos…')
      const { entryImages, coverImage } = await fetchAllImages(selectedEntries, parentSignedUrls, coverPhotoPath)

      const downloadFile = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
        setTimeout(() => URL.revokeObjectURL(url), 5000)
      }

      // Generate Memory Book
      if (formatType === 'memory_book' || formatType === 'both') {
        const { blob, pageCount } = await generateMemoryBookPDF({
          memberName, title, dedication, layoutStyle, selectedEntries, coverImage, entryImages,
          onProgress: setGenerationStatus,
        })
        setGenerationStatus('Saving Memory Book…')
        const fd = new FormData()
        fd.append('pdf', blob, 'memory-book.pdf')
        fd.append('book_id', bookId)
        fd.append('page_count', String(pageCount))
        fd.append('file_type', 'book')
        if (!isFree) fd.append('purchase_date', new Date().toISOString())
        await fetch('/api/life-story/memory-book/upload', { method: 'POST', body: fd })
        downloadFile(blob, `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`)
      }

      // Generate Memory Collage
      if (formatType === 'collage' || formatType === 'both') {
        if (formatType === 'both') await new Promise(r => setTimeout(r, 800)) // stagger downloads
        setGenerationStatus('Designing Memory Collage…')
        const { blob: collageBlob } = await generateCollagePDF({
          memberName, birthYear, layoutStyle, selectedEntries, entryImages,
          quoteEntryIds, highlights,
          onProgress: setGenerationStatus,
        })
        setGenerationStatus('Saving Memory Collage…')
        const fd2 = new FormData()
        fd2.append('pdf', collageBlob, 'memory-collage.pdf')
        fd2.append('book_id', bookId)
        fd2.append('page_count', '1')
        fd2.append('file_type', 'collage')
        await fetch('/api/life-story/memory-book/upload', { method: 'POST', body: fd2 })
        downloadFile(collageBlob, `${memberName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-collage.pdf`)
      }

      setGenerationStatus('Ready! Check your downloads.')

      // Refresh books list
      const booksRes = await fetch('/api/life-story/memory-book')
      const booksJson = await booksRes.json()
      if (booksJson.books) setBooks(booksJson.books)
    } catch (err) {
      console.error('[MemoryBookBuilder] Generation error:', err)
      setGenerationError(err instanceof Error ? err.message : 'Unexpected error. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleRedownload(storagePath: string, bookTitle: string) {
    const res = await fetch('/api/life-story/memory-book/download', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storagePath }),
    })
    const json = await res.json()
    if (json.downloadUrl) {
      const a = document.createElement('a'); a.href = json.downloadUrl
      a.download = `${bookTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`; a.click()
    }
  }

  // Restore state after Stripe redirect
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('book_paid') === 'true') {
      const savedRaw = sessionStorage.getItem('memoryBookBuilderState')
      if (savedRaw) {
        try {
          const saved = JSON.parse(savedRaw)
          if (saved.title) setTitle(saved.title)
          if (saved.dedication !== undefined) setDedication(saved.dedication)
          if (saved.layoutStyle) setLayoutStyle(saved.layoutStyle)
          if (saved.formatType) setFormatType(saved.formatType as FormatType)
          if (Array.isArray(saved.selectedEntryIds)) setSelectedEntryIds(new Set(saved.selectedEntryIds))
          if (saved.coverPhotoPath !== undefined) setCoverPhotoPath(saved.coverPhotoPath)
          if (Array.isArray(saved.quoteEntryIds)) setQuoteEntryIds(saved.quoteEntryIds)
          if (saved.highlights !== undefined) setHighlights(saved.highlights)
        } catch { /* ignore */ }
        sessionStorage.removeItem('memoryBookBuilderState')
      }
      setPaymentCompleted(true)
      setShowBuilder(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Preview modal */}
      {showPreview && (
        <MemoryBookPreviewPanel
          formatType={formatType}
          title={title}
          dedication={dedication}
          layoutStyle={layoutStyle}
          memberName={memberName}
          selectedEntries={selectedEntries}
          coverPhotoUrl={coverPhotoUrl}
          priceCents={priceCents}
          isFree={isFree || paymentCompleted}
          planTier={planTier}
          isMemorial={isMemorial}
          regenInfo={regenInfo}
          onClose={() => setShowPreview(false)}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      )}

      {/* Saved draft card */}
      {existingDraft && !showBuilder && (
        <div style={{ backgroundColor: '#EFF6FF', border: '1.5px solid #93C5FD', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '2px' }}>
              📄 Saved draft: {existingDraft.title}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {(existingDraft.format_type === 'collage' ? '🖼️ Memory Collage' : existingDraft.format_type === 'both' ? '📖🖼️ Both formats' : '📖 Memory Book')} · {existingDraft.entry_ids?.length ?? 0} memories selected
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => loadDraft(existingDraft)}
              style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Continue editing
            </button>
            <button
              onClick={() => { loadDraft(existingDraft); setTimeout(() => setShowPreview(true), 50) }}
              style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'white', color: 'var(--color-navy)', border: '1.5px solid var(--color-navy)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Preview
            </button>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 32px' }}>
        <button
          onClick={() => setShowBuilder(s => !s)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            backgroundColor: showBuilder ? 'var(--color-navy)' : 'white',
            color: showBuilder ? 'white' : 'var(--color-navy)',
            border: '2px solid var(--color-navy)', borderRadius: '10px',
            padding: '12px 24px', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: '18px' }}>📖</span>
          {showBuilder ? 'Close Builder' : 'Create Memory Keepsake'}
          {isFree
            ? <span style={{ backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 700 }}>FREE</span>
            : <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 700 }}>from {formatPrice(FORMAT_PRICING[formatType][planTier === 'connect' ? 0 : 1])}</span>
          }
        </button>
      </div>

      {/* Builder panel */}
      {showBuilder && (
        <div style={{ backgroundColor: 'white', border: '2px solid var(--color-navy)', borderRadius: '16px', padding: '28px', marginBottom: '40px', boxShadow: '0 8px 32px rgba(30,58,95,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
            <span style={{ fontSize: '28px' }}>📖</span>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>Memory Keepsake Builder</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                Create a beautiful PDF keepsake — download, print, and cherish forever.
              </p>
            </div>
          </div>

          {/* ── Format selector ─────────────────────────────────────────────── */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '12px' }}>
              Choose your format
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {([
                { id: 'memory_book' as FormatType, emoji: '📖', label: 'Memory Book', desc: 'Multi-page story, chapters by era', priceIdx: 0 },
                { id: 'collage' as FormatType, emoji: '🖼️', label: 'Memory Collage', desc: 'Single 12×12" print-ready collage', priceIdx: 1 },
                { id: 'both' as FormatType, emoji: '📖🖼️', label: 'Both Formats', desc: 'Memory Book + Collage together', priceIdx: 2 },
              ] as const).map(opt => {
                const optPriceCents = getPriceCents(opt.id, planTier, isMemorial)
                const isSelected = formatType === opt.id
                return (
                  <div
                    key={opt.id}
                    onClick={() => setFormatType(opt.id)}
                    style={{
                      border: isSelected ? '2px solid var(--color-navy)' : '1.5px solid var(--color-warm-grey)',
                      borderRadius: '12px', padding: '14px 12px', cursor: 'pointer',
                      backgroundColor: isSelected ? '#EFF6FF' : 'white', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: '20px', marginBottom: '6px' }}>{opt.emoji}</div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-navy)', marginBottom: '4px' }}>
                      {isSelected ? '✓ ' : ''}{opt.label}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4, marginBottom: '8px' }}>{opt.desc}</div>
                    <div style={{
                      fontSize: '13px', fontWeight: 700,
                      color: (!optPriceCents) ? '#065F46' : '#92400E',
                      backgroundColor: (!optPriceCents) ? '#D1FAE5' : '#FEF3C7',
                      borderRadius: '20px', padding: '2px 10px', display: 'inline-block',
                    }}>
                      {(!optPriceCents) ? 'Included free' : formatPrice(optPriceCents)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Title ───────────────────────────────────────────────────────── */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ width: '100%', height: '46px', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '0 14px', fontSize: '16px', boxSizing: 'border-box' }}
            />
          </div>

          {/* ── Dedication ──────────────────────────────────────────────────── */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
              Dedication <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>(optional)</span>
            </label>
            <textarea
              value={dedication}
              onChange={e => setDedication(e.target.value)}
              placeholder="A heartfelt message for the cover or first page…"
              rows={3}
              style={{ width: '100%', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '10px 14px', fontSize: '15px', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          {/* ── Layout style (Memory Book or Both) ──────────────────────────── */}
          {(formatType === 'memory_book' || formatType === 'both') && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '10px' }}>Layout style</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {LAYOUT_OPTIONS.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setLayoutStyle(opt.id)}
                    style={{
                      border: layoutStyle === opt.id ? '2px solid var(--color-navy)' : '1.5px solid var(--color-warm-grey)',
                      borderRadius: '10px', padding: '12px', cursor: 'pointer',
                      backgroundColor: layoutStyle === opt.id ? '#EFF6FF' : 'white', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-navy)', marginBottom: '4px' }}>
                      {layoutStyle === opt.id ? '✓ ' : ''}{opt.label}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Cover photo (Memory Book or Both) ──────────────────────────── */}
          {(formatType === 'memory_book' || formatType === 'both') && allImageAttachments.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '8px' }}>
                Cover photo <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>(optional)</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <div
                  onClick={() => setCoverPhotoPath(null)}
                  style={{ width: '60px', height: '60px', borderRadius: '8px', cursor: 'pointer', border: !coverPhotoPath ? '2.5px solid var(--color-navy)' : '1.5px solid var(--color-warm-grey)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: !coverPhotoPath ? '#EFF6FF' : '#F9FAFB', fontSize: '20px' }}
                  title="No cover photo"
                >🚫</div>
                {allImageAttachments.slice(0, 8).map(att => {
                  const urlInfo = (parentSignedUrls[att.entryId] ?? []).find(u => u.path === att.path)
                  const sel = coverPhotoPath === att.path
                  return (
                    <div
                      key={att.path}
                      onClick={() => setCoverPhotoPath(att.path)}
                      title={att.entryTitle}
                      style={{ width: '60px', height: '60px', borderRadius: '8px', cursor: 'pointer', overflow: 'hidden', border: sel ? '2.5px solid var(--color-navy)' : '1.5px solid var(--color-warm-grey)', backgroundColor: '#F3F4F6', position: 'relative' }}
                    >
                      {urlInfo?.url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={urlInfo.url} alt={att.entryTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🖼️</div>
                      }
                      {sel && <div style={{ position: 'absolute', top: 2, right: 2, background: 'var(--color-navy)', color: 'white', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>✓</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Quote selection (Collage or Both) ─────────────────────────── */}
          {(formatType === 'collage' || formatType === 'both') && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
                Quote memories <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>(up to 3 — excerpts shown on collage)</span>
              </label>
              <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--color-warm-grey)', borderRadius: '8px', padding: '4px' }}>
                {selectedEntries.length === 0 ? (
                  <div style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>Select memories below first.</div>
                ) : selectedEntries.map(entry => {
                  const checked = quoteEntryIds.includes(entry.id)
                  return (
                    <label key={entry.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 12px', cursor: 'pointer', borderRadius: '6px', backgroundColor: checked ? '#F0FDF4' : 'transparent' }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleQuoteEntry(entry.id)} style={{ width: '15px', height: '15px', marginTop: '2px', accentColor: 'var(--color-teal)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)' }}>{entry.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '1px' }}>
                          {entry.content.substring(0, 60)}{entry.content.length > 60 ? '…' : ''}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Key highlights (Collage or Both) ─────────────────────────── */}
          {(formatType === 'collage' || formatType === 'both') && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
                Key life highlights <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>(optional — shown at bottom of collage)</span>
              </label>
              <textarea
                value={highlights}
                onChange={e => setHighlights(e.target.value)}
                placeholder="e.g. Born in Chicago · 40 years as a teacher · Grandmother of 7"
                rows={2}
                style={{ width: '100%', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {/* ── Entry selection ─────────────────────────────────────────────── */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)' }}>
                Memories to include ({selectedEntryIds.size} of {entries.length} selected)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setSelectedEntryIds(new Set(entries.map(e => e.id)))}
                  style={{ fontSize: '12px', color: 'var(--color-teal)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Select all</button>
                <button type="button" onClick={() => setSelectedEntryIds(new Set())}
                  style={{ fontSize: '12px', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
              </div>
            </div>
            <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--color-warm-grey)', borderRadius: '10px', padding: '4px' }}>
              {entries.map(entry => {
                const isChecked = selectedEntryIds.has(entry.id)
                return (
                  <label key={entry.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '8px', backgroundColor: isChecked ? '#F0F9FF' : 'transparent', transition: 'background-color 0.1s' }}>
                    <input type="checkbox" checked={isChecked} onChange={() => toggleEntry(entry.id)}
                      style={{ width: '16px', height: '16px', marginTop: '1px', accentColor: 'var(--color-navy)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', display: 'block' }}>
                        {entry.entry_type === 'first_memory' && <span style={{ color: '#B45309' }}>⭐ </span>}
                        {entry.title}
                      </span>
                      {entry.era && <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{entry.era}</span>}
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* ── Payment / pricing info ─────────────────────────────────────── */}
          {!isFree && !paymentCompleted && !regenInfo && (
            <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#92400E', marginBottom: '4px' }}>
                {priceCents ? formatPrice(priceCents) : '$0.00'} one-time {isMemorial ? '(Memorial Edition)' : ''}
              </div>
              <div style={{ fontSize: '13px', color: '#78350F' }}>
                Included free with Complete and Premier plans. Payment processed at generation time.
                {regenInfo === null && ' Or upgrade your plan for unlimited keepsakes.'}
              </div>
            </div>
          )}

          {paymentCompleted && !isFree && (
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#065F46' }}>✓ Payment received — thank you!</div>
              <div style={{ fontSize: '13px', color: '#047857', marginTop: '4px' }}>Click Preview or Generate to create your keepsake.</div>
            </div>
          )}

          {regenInfo && (
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#065F46' }}>
                Regeneration {4 - regenInfo.regenRemaining} of 3 — Free
              </div>
              <div style={{ fontSize: '13px', color: '#047857', marginTop: '4px' }}>
                You have {regenInfo.regenRemaining} free regeneration{regenInfo.regenRemaining !== 1 ? 's' : ''} remaining (valid until {regenInfo.expiresAt}).
              </div>
            </div>
          )}

          {/* ── Error ──────────────────────────────────────────────────────── */}
          {generationError && (
            <div role="alert" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#DC2626', fontSize: '14px' }}>
              {generationError}
            </div>
          )}

          {/* ── Generation progress ────────────────────────────────────────── */}
          {isGenerating && (
            <div style={{ backgroundColor: '#F0F9FF', border: '1px solid #93C5FD', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>Generating your keepsake…</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{generationStatus}</div>
              <div style={{ marginTop: '10px', height: '4px', backgroundColor: '#DBEAFE', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', backgroundColor: 'var(--color-teal)', animation: 'pulse 1.5s ease-in-out infinite', width: '60%' }} />
              </div>
            </div>
          )}

          {/* ── Success ────────────────────────────────────────────────────── */}
          {!isGenerating && generationStatus.includes('Ready!') && (
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#065F46' }}>✓ Your keepsake is ready!</div>
              <div style={{ fontSize: '13px', color: '#047857', marginTop: '4px' }}>
                PDF{formatType === 'both' ? 's' : ''} downloaded automatically. Find {formatType === 'both' ? 'them' : 'it'} again in &quot;Your Memory Books&quot; below.
              </div>
            </div>
          )}

          {/* ── Action buttons ─────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => { if (selectedEntryIds.size > 0) setShowPreview(true) }}
              disabled={isGenerating || selectedEntryIds.size === 0}
              style={{
                flex: 1, padding: '13px', borderRadius: '10px', border: '2px solid var(--color-navy)',
                backgroundColor: 'white', color: 'var(--color-navy)', fontSize: '15px', fontWeight: 600,
                cursor: (isGenerating || selectedEntryIds.size === 0) ? 'not-allowed' : 'pointer',
                opacity: (isGenerating || selectedEntryIds.size === 0) ? 0.5 : 1,
              }}
            >
              Preview
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || processingPayment || selectedEntryIds.size === 0}
              style={{
                flex: 2, padding: '13px', borderRadius: '10px', border: 'none',
                backgroundColor: selectedEntryIds.size === 0 ? '#9CA3AF' : 'var(--color-navy)',
                color: 'white', fontSize: '15px', fontWeight: 700,
                cursor: (isGenerating || processingPayment || selectedEntryIds.size === 0) ? 'not-allowed' : 'pointer',
                opacity: (isGenerating || processingPayment) ? 0.8 : 1,
              }}
            >
              {processingPayment ? 'Redirecting to payment…'
                : isGenerating ? 'Generating…'
                : (!isFree && !paymentCompleted && !regenInfo && priceCents) ? `Pay ${formatPrice(priceCents)} & Generate →`
                : 'Generate & Download →'}
            </button>
          </div>

          {/* Save draft */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
            <button
              onClick={handleSaveDraft}
              disabled={savingDraft || selectedEntryIds.size === 0}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '13px', cursor: savingDraft ? 'default' : 'pointer', textDecoration: 'underline' }}
            >
              {savingDraft ? 'Saving…' : draftSaved ? '✓ Draft saved' : 'Save draft'}
            </button>
          </div>
        </div>
      )}

      {/* Your Memory Books section */}
      {generatedBooks.length > 0 && (
        <section style={{ marginTop: '48px', paddingTop: '32px', borderTop: '2px solid var(--color-warm-grey)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 20px' }}>
            Your Memory Keepsakes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {generatedBooks.map(book => {
              const date = new Date(book.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
              const isCollage = book.format_type === 'collage'
              const isBoth = book.format_type === 'both'
              return (
                <div
                  key={book.id}
                  style={{ backgroundColor: 'white', border: '1.5px solid var(--color-warm-grey)', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: isCollage ? 'var(--color-teal)' : 'var(--color-navy)' }} />
                  <div style={{ fontSize: '26px', marginBottom: '10px' }}>{isCollage ? '🖼️' : isBoth ? '📖🖼️' : '📖'}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '4px' }}>{book.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Created {date}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                    {isCollage ? '12×12" collage' : isBoth ? `${book.page_count ?? '?'} pages + collage` : `${book.page_count ?? '?'} pages`} · {book.entry_ids.length} {book.entry_ids.length === 1 ? 'memory' : 'memories'}
                  </div>
                  {book.storage_path && (
                    <button
                      onClick={() => handleRedownload(book.storage_path!, book.title)}
                      style={{ width: '100%', padding: '9px', borderRadius: '8px', backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: isBoth && book.collage_storage_path ? '8px' : '0' }}
                    >
                      {isCollage ? 'Download Collage' : 'Download Book'}
                    </button>
                  )}
                  {isBoth && book.collage_storage_path && (
                    <button
                      onClick={() => handleRedownload(book.collage_storage_path!, book.title + ' Collage')}
                      style={{ width: '100%', padding: '9px', borderRadius: '8px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Download Collage
                    </button>
                  )}
                  {!book.storage_path && !book.collage_storage_path && (
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
