'use client'

import { useState } from 'react'
import { GIFT_CATALOG, type CatalogItem } from '@/lib/gifts/catalog'

type Step = 'choose' | 'personalize' | 'confirm' | 'done'

export default function GiftSendingTab({
  memberId,
  memberName,
}: {
  memberId: string
  memberName: string
}) {
  const [step, setStep] = useState<Step>('choose')
  const [selected, setSelected] = useState<CatalogItem | null>(null)
  const [form, setForm] = useState({
    recipient_name: '',
    recipient_email: '',
    recipient_address: '',
    message: '',
    sign_as: memberName,
  })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ needs_payment: boolean; order_id: string } | null>(null)

  const grouped = GIFT_CATALOG.reduce<Record<string, CatalogItem[]>>((acc, item) => {
    if (!acc[item.kind]) acc[item.kind] = []
    acc[item.kind].push(item)
    return acc
  }, {})

  const KIND_LABELS: Record<string, string> = {
    note: '💌 Notes (Free)',
    card: '💛 Cards ($4.99)',
    flowers: '🌷 Flowers',
    food: '🍪 Food & Treats',
    book: '📖 Books',
    gift_card: '🎁 Gift Cards',
    basket: '🧺 Gift Baskets',
  }

  async function handleSubmit() {
    if (!selected) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/family/gift-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          catalog_item_id: selected.id,
          ...form,
        }),
      })
      const { data, needs_payment } = await res.json()
      setResult({ needs_payment, order_id: data?.id })
      setStep('done')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">{selected?.image_emoji ?? '🎁'}</div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {result?.needs_payment ? 'Almost there!' : 'Gift sent!'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {result?.needs_payment
            ? 'Your order is ready — complete payment to send it.'
            : `Your ${selected?.kind} to ${form.recipient_name} is on its way.`}
        </p>
        <button
          onClick={() => { setStep('choose'); setSelected(null); setForm({ recipient_name: '', recipient_email: '', recipient_address: '', message: '', sign_as: memberName }) }}
          className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Send another gift
        </button>
      </div>
    )
  }

  if (step === 'choose') {
    return (
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Choose something to send from {memberName}
        </p>
        {Object.entries(grouped).map(([kind, items]) => (
          <div key={kind} className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {KIND_LABELS[kind] ?? kind}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setSelected(item); setStep('personalize') }}
                  className="text-left p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                >
                  <div className="text-2xl mb-2">{item.image_emoji}</div>
                  <div className="font-medium text-sm text-gray-900 dark:text-white">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                  <div className="text-sm font-semibold text-purple-600 mt-2">
                    {item.price_cents === 0 ? 'Free' : `$${(item.price_cents / 100).toFixed(2)}`}
                    {item.platform_fee_pct > 0 && <span className="text-xs text-gray-400 font-normal"> + {item.platform_fee_pct}%</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (step === 'personalize' && selected) {
    return (
      <div>
        <button onClick={() => setStep('choose')} className="text-sm text-gray-500 hover:text-gray-700 mb-4">← Back</button>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">{selected.image_emoji}</span>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{selected.title}</div>
            <div className="text-sm text-gray-500">
              {selected.price_cents === 0 ? 'Free' : `$${(selected.price_cents / 100).toFixed(2)}`}
              {selected.platform_fee_pct > 0 ? ` + ${selected.platform_fee_pct}% platform fee` : ''}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Recipient name *</label>
            <input
              required
              value={form.recipient_name}
              onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))}
              placeholder="Sophie"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            />
          </div>

          {selected.requires_email && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Recipient email *</label>
              <input
                required
                type="email"
                value={form.recipient_email}
                onChange={e => setForm(f => ({ ...f, recipient_email: e.target.value }))}
                placeholder="sophie@example.com"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              />
            </div>
          )}

          {selected.requires_address && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Delivery address *</label>
              <textarea
                required
                value={form.recipient_address}
                onChange={e => setForm(f => ({ ...f, recipient_address: e.target.value }))}
                placeholder="123 Main St, Springfield, IL 62701"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm resize-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">Personal message</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Thinking of you on your special day…"
              rows={3}
              maxLength={1000}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm resize-none"
            />
            <div className="text-xs text-gray-400 text-right mt-0.5">{form.message.length}/1000</div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Sign as</label>
            <input
              value={form.sign_as}
              onChange={e => setForm(f => ({ ...f, sign_as: e.target.value }))}
              placeholder={`Love, ${memberName}`}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            />
          </div>

          {selected.kind === 'gift_card' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-400">
              ⚠️ Gift cards to recipients not in your family contacts will be held for a family member to approve — this helps protect against scams.
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !form.recipient_name || (selected.requires_email && !form.recipient_email) || (selected.requires_address && !form.recipient_address)}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Placing order…' : selected.price_cents === 0 ? 'Send now' : `Send for $${(selected.price_cents / 100).toFixed(2)}`}
          </button>
        </div>
      </div>
    )
  }

  return null
}