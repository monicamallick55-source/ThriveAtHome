// app/family/campaigns/page.tsx
// G6.4 Community Care Fund — Family portal: see active campaigns, pledge support via Zelle/Venmo
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Campaign {
  id: string
  title: string
  story: string
  need_category: string
  goal_amount_cents: number | null
  deadline: string | null
  payment_zelle: string | null
  payment_venmo: string | null
  payment_other: string | null
  status: string
  total_pledged_cents: number
  total_confirmed_cents: number
  created_at: string
  members: { first_name: string; last_name: string }
}

interface Pledge {
  id: string
  contribution_type: string
  amount_cents: number | null
  in_kind_description: string | null
  message: string | null
  status: string
  payment_method: string | null
  created_at: string
}

const CATEGORY_LABELS: Record<string, string> = {
  rent: 'Rent / Housing',
  medical: 'Medical / Prescriptions',
  utilities: 'Utilities',
  food: 'Food / Groceries',
  supplies: 'Supplies / Equipment',
  other: 'Other',
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text
    }
  }
  return (
    <button onClick={copy} className="ml-2 text-teal-600 hover:text-teal-800 text-xs underline">
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function PledgeModal({
  campaign,
  onClose,
  onDone,
}: {
  campaign: Campaign
  onClose: () => void
  onDone: () => void
}) {
  const [type, setType] = useState<'financial' | 'in_kind' | 'volunteer'>('financial')
  const [amount, setAmount] = useState('')
  const [inKind, setInKind] = useState('')
  const [volunteerDate, setVolunteerDate] = useState('')
  const [message, setMessage] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>('zelle')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'form' | 'payment'>('form')

  async function submitPledge(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contribution_type:    type,
          amount_cents:         type === 'financial' && amount ? Math.round(parseFloat(amount) * 100) : null,
          in_kind_description:  type === 'in_kind' ? inKind : null,
          volunteer_date:       type === 'volunteer' ? volunteerDate : null,
          message,
          anonymous,
          payment_method:       type === 'financial' ? paymentMethod : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to pledge')
      if (type === 'financial') {
        setStep('payment')
      } else {
        onDone()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const paymentInfo = {
    zelle:  campaign.payment_zelle,
    venmo:  campaign.payment_venmo,
    other:  campaign.payment_other,
  }

  if (step === 'payment') {
    const handle = paymentInfo[paymentMethod as keyof typeof paymentInfo]
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Send your gift now</h3>
          <p className="text-sm text-gray-500 mb-5">
            Your pledge is saved. Now send the payment directly to{' '}
            <span className="font-semibold">{campaign.members.first_name}</span> using {paymentMethod}:
          </p>

          <div className="bg-teal-50 rounded-xl p-4 mb-5">
            {paymentMethod === 'zelle' && handle && (
              <div>
                <div className="text-xs font-medium text-teal-700 mb-1">📱 Zelle to:</div>
                <div className="font-mono text-lg font-bold text-teal-900">{handle}</div>
                <CopyButton text={handle} />
              </div>
            )}
            {paymentMethod === 'venmo' && handle && (
              <div>
                <div className="text-xs font-medium text-teal-700 mb-1">💸 Venmo to:</div>
                <div className="font-mono text-lg font-bold text-teal-900">@{handle.replace(/^@/, '')}</div>
                <CopyButton text={`@${handle.replace(/^@/, '')}`} />
              </div>
            )}
            {paymentMethod === 'other' && handle && (
              <div>
                <div className="text-xs font-medium text-teal-700 mb-1">📬 Send to:</div>
                <div className="text-teal-900 text-sm">{handle}</div>
              </div>
            )}
            {amount && (
              <div className="mt-3 text-xs text-teal-600">
                Amount: <span className="font-semibold">${parseFloat(amount).toFixed(2)}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 mb-4">
            After you send the payment, your Navigator will confirm receipt and update the campaign total.
          </p>

          <button
            onClick={onDone}
            className="w-full bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition"
          >
            Done — I sent it
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Pledge support</h3>
        <p className="text-sm text-gray-500 mb-5">
          for <span className="font-semibold">{campaign.title}</span>
        </p>

        <form onSubmit={submitPledge} className="space-y-4">
          {/* Contribution type */}
          <div className="grid grid-cols-3 gap-2">
            {(['financial', 'in_kind', 'volunteer'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2 px-2 rounded-lg text-xs font-medium border transition ${
                  type === t
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t === 'financial' ? '💵 Money' : t === 'in_kind' ? '🛍 In-kind' : '🤝 Volunteer'}
              </button>
            ))}
          </div>

          {type === 'financial' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="1"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Send via</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: 'zelle',  label: 'Zelle',  available: !!campaign.payment_zelle },
                    { v: 'venmo',  label: 'Venmo',  available: !!campaign.payment_venmo },
                    { v: 'other',  label: 'Other',  available: !!campaign.payment_other },
                  ].filter(o => o.available).map(o => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setPaymentMethod(o.v)}
                      className={`py-2 px-2 rounded-lg text-xs font-medium border transition ${
                        paymentMethod === o.v
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {type === 'in_kind' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What will you provide?</label>
              <input
                type="text"
                value={inKind}
                onChange={e => setInKind(e.target.value)}
                placeholder="e.g. A week of groceries"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          {type === 'volunteer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">When can you help?</label>
              <input
                type="date"
                value={volunteerDate}
                onChange={e => setVolunteerDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personal message (optional)
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="A note of encouragement…"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={e => setAnonymous(e.target.checked)}
              className="rounded"
            />
            Pledge anonymously
          </label>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition"
            >
              {saving ? 'Saving…' : type === 'financial' ? 'Pledge & see payment info' : 'Pledge support'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function FamilyCampaignsPage() {
  const supabase = createClient()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [myPledges, setMyPledges] = useState<Record<string, Pledge[]>>({})
  const [loading, setLoading] = useState(true)
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase
      .from('member_campaigns')
      .select('*, members(first_name, last_name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (data) setCampaigns(data as any)

    // Load my pledges per campaign
    const pledgeMap: Record<string, Pledge[]> = {}
    if (data) {
      for (const c of data) {
        const { data: p } = await supabase
          .from('campaign_contributions')
          .select('*')
          .eq('campaign_id', c.id)
          .order('created_at', { ascending: false })
        if (p) pledgeMap[c.id] = p as any
      }
    }
    setMyPledges(pledgeMap)
    setLoading(false)
  }

  const fmt = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Community Care Fund</h1>
      <p className="text-sm text-gray-500 mb-8">
        Support your loved one's community. Contributions go directly to members in need — no fees, no middleman.
      </p>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-sm text-green-800">
          {success} Your Navigator will confirm receipt and update the campaign.
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🤝</div>
          <div className="text-sm">No active campaigns right now.</div>
        </div>
      ) : (
        <div className="space-y-5">
          {campaigns.map(c => {
            const pledges = myPledges[c.id] ?? []
            const hasPledged = pledges.length > 0
            const pct = c.goal_amount_cents
              ? Math.min(100, Math.round((c.total_confirmed_cents / c.goal_amount_cents) * 100))
              : null

            return (
              <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="font-semibold text-gray-900">{c.title}</h3>
                  <span className="text-xs bg-teal-50 text-teal-700 font-medium px-2 py-1 rounded-full whitespace-nowrap">
                    {CATEGORY_LABELS[c.need_category] ?? c.need_category}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-3">
                  for {c.members.first_name} {c.members.last_name}
                  {c.deadline && <> · Deadline {new Date(c.deadline).toLocaleDateString()}</>}
                </div>
                <p className="text-sm text-gray-700 mb-4">{c.story}</p>

                {c.goal_amount_cents && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{fmt(c.total_confirmed_cents)} confirmed</span>
                      <span>Goal: {fmt(c.goal_amount_cents)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-teal-500 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {c.total_pledged_cents > c.total_confirmed_cents && (
                      <div className="text-xs text-gray-400 mt-1">
                        + {fmt(c.total_pledged_cents - c.total_confirmed_cents)} pledged (pending confirmation)
                      </div>
                    )}
                  </div>
                )}

                {/* My pledges */}
                {hasPledged && (
                  <div className="bg-teal-50 rounded-xl p-3 mb-4 text-xs text-teal-800 space-y-1">
                    <div className="font-medium mb-1">Your pledges:</div>
                    {pledges.map(p => (
                      <div key={p.id} className="flex justify-between">
                        <span>
                          {p.contribution_type === 'financial' && p.amount_cents ? fmt(p.amount_cents) : ''}
                          {p.contribution_type === 'in_kind' ? p.in_kind_description : ''}
                          {p.contribution_type === 'volunteer' ? 'Volunteer help' : ''}
                        </span>
                        <span className={p.status === 'confirmed' ? 'text-green-700' : 'text-amber-600'}>
                          {p.status === 'confirmed' ? '✓ Confirmed' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setActiveCampaign(c)}
                  className="w-full bg-teal-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-teal-700 transition"
                >
                  {hasPledged ? 'Pledge more support' : 'Support this campaign'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {activeCampaign && (
        <PledgeModal
          campaign={activeCampaign}
          onClose={() => setActiveCampaign(null)}
          onDone={() => {
            setActiveCampaign(null)
            setSuccess('Thank you! Your pledge has been recorded.')
            loadData()
          }}
        />
      )}
    </div>
  )
}
