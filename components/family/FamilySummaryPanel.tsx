'use client'
// components/family/FamilySummaryPanel.tsx
// G5.8 — Navigator panel: preview daily summary + manual send

import { useState } from 'react'

interface Member {
  id: string
  full_name: string
  preferred_name: string | null
}

export default function FamilySummaryPanel({ members }: { members: Member[] }) {
  const [selectedId, setSelectedId] = useState(members[0]?.id ?? '')
  const [preview, setPreview] = useState('')
  const [previewing, setPreviewing] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendingAll, setSendingAll] = useState(false)
  const [resultMsg, setResultMsg] = useState('')
  const [resultError, setResultError] = useState(false)

  const displayName = (m: Member) => m.preferred_name ?? m.full_name

  async function handlePreview() {
    if (!selectedId) return
    setPreviewing(true)
    setPreview('')
    try {
      const res = await fetch(`/api/family-summary?member_id=${selectedId}`)
      if (res.ok) {
        const data = await res.json()
        setPreview(data.preview ?? '')
      }
    } finally {
      setPreviewing(false)
    }
  }

  async function handleSendOne() {
    if (!selectedId) return
    setSending(true)
    setResultMsg('')
    try {
      const res = await fetch('/api/family-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: selectedId }),
      })
      const data = await res.json()
      const result = data.results?.[0]
      if (result?.status === 'sent') {
        setResultMsg('✅ Summary sent!')
        setResultError(false)
      } else if (result?.status === 'skipped') {
        setResultMsg(`⚠️ Skipped: ${result.error ?? 'already sent today'}`)
        setResultError(false)
      } else {
        setResultMsg(`❌ Failed: ${result?.error ?? 'Unknown error'}`)
        setResultError(true)
      }
    } finally {
      setSending(false)
    }
  }

  async function handleSendAll() {
    if (!confirm(`Send daily summary to all ${members.length} active members' families?`)) return
    setSendingAll(true)
    setResultMsg('')
    try {
      const res = await fetch('/api/family-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      setResultMsg(`✅ Sent: ${data.sent ?? 0} · Skipped/Failed: ${(data.results?.length ?? 0) - (data.sent ?? 0)}`)
      setResultError(false)
    } finally {
      setSendingAll(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Cron info banner */}
      <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">⏰ Automatic schedule</p>
        <p>The daily summary runs automatically at <strong>7:00 AM PT</strong> via Vercel Cron (<code>/api/cron/family-summary</code>). Use this panel to preview or manually trigger sends.</p>
      </div>

      {/* Member selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Select member</label>
        <select
          value={selectedId}
          onChange={e => { setSelectedId(e.target.value); setPreview('') }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {members.map(m => (
            <option key={m.id} value={m.id}>{displayName(m)}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handlePreview}
          disabled={previewing || !selectedId}
          className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
        >
          {previewing ? 'Loading…' : '👁 Preview message'}
        </button>
        <button
          onClick={handleSendOne}
          disabled={sending || !selectedId}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {sending ? 'Sending…' : '📤 Send now'}
        </button>
        <button
          onClick={handleSendAll}
          disabled={sendingAll}
          className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {sendingAll ? 'Sending all…' : '📢 Send to all members'}
        </button>
      </div>

      {/* Result */}
      {resultMsg && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${
          resultError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          {resultMsg}
        </div>
      )}

      {/* Preview text */}
      {preview && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Message preview</p>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">{preview}</pre>
          </div>
          <p className="text-xs text-gray-400">
            This is the SMS that will be sent to opted-in family contacts.
          </p>
        </div>
      )}

      {/* Cron config hint */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-xs text-gray-500 space-y-1">
        <p className="font-medium text-gray-600">vercel.json cron config</p>
        <pre className="text-gray-500 overflow-x-auto">{`{
  "crons": [{
    "path": "/api/cron/family-summary",
    "schedule": "0 14 * * *"
  }]
}`}</pre>
        <p>Add <code>TWILIO_ACCOUNT_SID</code>, <code>TWILIO_AUTH_TOKEN</code>, and <code>TWILIO_FROM_NUMBER</code> to Vercel env vars to enable SMS delivery. Without them, summaries are logged but not sent via SMS.</p>
      </div>
    </div>
  )
}
