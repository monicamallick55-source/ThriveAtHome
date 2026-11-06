'use client'

/**
 * app/dashboard/gift-send/page.tsx — G7.3
 * Senior sends a gift or card to a family member.
 */

import { useState, useEffect } from 'react'
import { GIFT_CATALOG, requiresFamilyApproval as needsFamilyApproval } from "@/lib/gifts/catalog"

type FamilyMember = {
  id: string
  name: string
  relationship: string
  email?: string
}

export default function GiftSendPage() {
  const [family, setFamily] = useState<FamilyMember[]>([])
  const [selectedRecipient, setSelectedRecipient] = useState<string>('')
  const [selectedItem, setSelectedItem] = useState<string>('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [needsApproval, setNeedsApproval] = useState(false)

  useEffect(() => {
    fetch('/api/family-members')
      .then(r => r.json())
      .then(d => setFamily(d.family_members ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedItem) { setNeedsApproval(false); return }
    const item = GIFT_CATALOG.find(i => i.id === selectedItem)
    setNeedsApproval(item ? needsFamilyApproval(item) : false)
  }, [selectedItem])

  const selectedGift = GIFT_CATALOG.find(i => i.id === selectedItem)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRecipient || !selectedItem) return
    setStatus('submitting')
    setErrorMsg('')
    try {
      const res = await fetch('/api/gift-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catalog_item_id: selectedItem,
          family_member_id: selectedRecipient,
          personalization: message,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to place order')
      setStatus('success')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold mb-2">Gift Sent!</h1>
        {needsApproval ? (
          <p className="text-gray-600 mb-6">Your gift request has been sent for family approval. Once approved, it will be on its way!</p>
        ) : (
          <p className="text-gray-600 mb-6">Your gift is on its way to your family member.</p>
        )}
        <button
          onClick={() => { setStatus('idle'); setSelectedItem(''); setMessage('') }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Send Another Gift
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Send a Gift or Card</h1>
      <p className="text-gray-500 mb-8">Show your family you&apos;re thinking of them.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient */}
        <div>
          <label className="block text-sm font-medium mb-2">Who would you like to send to?</label>
          <select
            value={selectedRecipient}
            onChange={e => setSelectedRecipient(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            required
          >
            <option value="">Select a family member…</option>
            {family.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.relationship})</option>
            ))}
          </select>
          {family.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">No family members connected yet. Ask your navigator for help adding them.</p>
          )}
        </div>

        {/* Gift selection */}
        <div>
          <label className="block text-sm font-medium mb-3">Choose a gift</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GIFT_CATALOG.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItem(item.id)}
                className={`text-left border rounded-xl p-4 transition-all ${
                  selectedItem === item.id
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{item.image_emoji ?? '🎁'}</span>
                  <div>
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                    <div className="text-sm font-semibold text-blue-600 mt-1">
                      {item.price_cents === 0 ? 'Free' : `$${(item.price_cents / 100).toFixed(2)}`}
                    </div>
                    {needsFamilyApproval(item) && (
                      <div className="text-xs text-amber-600 mt-1">⚠ Needs family approval</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Personal message */}
        {selectedItem && (
          <div>
            <label className="block text-sm font-medium mb-2">Add a personal message (optional)</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Write something from the heart…"
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>
        )}

        {/* Approval notice */}
        {needsApproval && selectedGift && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <strong>Family approval needed:</strong> This gift ({selectedGift.title} — ${(selectedGift.price_cents / 100).toFixed(2)}) will be sent to your family for review before being placed.
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{errorMsg}</div>
        )}

        <button
          type="submit"
          disabled={!selectedRecipient || !selectedItem || status === 'submitting'}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'submitting' ? 'Sending…' : needsApproval ? 'Request Gift (needs approval)' : 'Send Gift'}
        </button>
      </form>
    </div>
  )
}
