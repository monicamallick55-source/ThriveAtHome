'use client'

import { useState } from 'react'

type Tier = 'digital' | 'enhanced' | 'premier'

const TIERS = [
  {
    id: 'digital' as Tier,
    label: 'Digital',
    price: 0,
    emoji: '💌',
    features: [
      'Personalised call from Aria on the day',
      'Digital family card compiled from your messages',
      'Shareable & printable PDF card',
    ],
  },
  {
    id: 'enhanced' as Tier,
    label: 'Enhanced',
    price: 2500,
    emoji: '🌟',
    features: [
      'Everything in Digital',
      'Volunteer friendly visit scheduled',
      'Gift coordination support',
    ],
  },
  {
    id: 'premier' as Tier,
    label: 'Premier',
    price: 7500,
    emoji: '✨',
    features: [
      'Everything in Enhanced',
      'Navigator-scheduled family video gathering',
      'Printed memory book included',
    ],
  },
]

const OCCASIONS = [
  { value: 'birthday', label: '🎂 Birthday' },
  { value: 'anniversary', label: '💍 Anniversary' },
  { value: 'homecoming', label: '🏠 Homecoming' },
  { value: 'recovery_milestone', label: '💪 Recovery Milestone' },
  { value: 'holiday', label: '🎄 Holiday' },
  { value: 'other', label: '🎉 Other' },
]

export default function CelebrationPlannerClient({
  familyMemberId,
  memberId,
  memberName,
}: {
  familyMemberId: string
  memberId: string
  memberName: string
}) {
  const [step, setStep] = useState<'details' | 'tier' | 'confirm' | 'done'>('details')
  const [occasion, setOccasion] = useState('birthday')
  const [occasionDate, setOccasionDate] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedTier, setSelectedTier] = useState<Tier>('digital')
  const [submitting, setSubmitting] = useState(false)
  const [requestId, setRequestId] = useState<string | null>(null)

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const tier = TIERS.find(t => t.id === selectedTier)!
      const res = await fetch('/api/family/celebrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          requested_by: familyMemberId,
          occasion,
          occasion_date: occasionDate,
          tier: selectedTier,
          price_cents: tier.price,
          notes_for_team: notes || null,
        }),
      })
      const { data } = await res.json()
      if (data?.id) {
        setRequestId(data.id)
        setStep('done')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Celebration planned!
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          We'll coordinate everything. Family members can add card messages in the coordination room.
        </p>
        {requestId && (
          <a
            href={`/dashboard/celebrations/${requestId}`}
            className="inline-block px-5 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            Open coordination room →
          </a>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Step indicators */}
      <div className="flex gap-2 mb-6">
        {(['details', 'tier', 'confirm'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-medium ${
              step === s ? 'bg-purple-600 text-white' :
              ['details','tier','confirm'].indexOf(step) > i ? 'bg-purple-100 text-purple-600' :
              'bg-gray-100 text-gray-400'
            }`}>{i + 1}</div>
            <span className="text-xs text-gray-500 capitalize">{s}</span>
            {i < 2 && <div className="w-8 h-px bg-gray-200 dark:bg-gray-700" />}
          </div>
        ))}
      </div>

      {step === 'details' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              What are we celebrating?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {OCCASIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setOccasion(o.value)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                    occasion === o.value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={occasionDate}
              onChange={e => setOccasionDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes for the care team (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any special requests or details…"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm resize-none"
            />
          </div>

          <button
            disabled={!occasionDate}
            onClick={() => setStep('tier')}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            Choose celebration tier →
          </button>
        </div>
      )}

      {step === 'tier' && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white">Choose a tier</h3>
          {TIERS.map(tier => (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                selectedTier === tier.id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{tier.emoji}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{tier.label}</span>
                </div>
                <span className="font-semibold text-purple-600">
                  {tier.price === 0 ? 'Free' : `$${(tier.price / 100).toFixed(2)}`}
                </span>
              </div>
              <ul className="space-y-1">
                {tier.features.map(f => (
                  <li key={f} className="text-xs text-gray-500 flex items-start gap-1.5">
                    <span className="text-green-500 mt-0.5">✓</span> {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}

          <div className="flex gap-2">
            <button onClick={() => setStep('details')} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Back
            </button>
            <button
              onClick={() => setStep('confirm')}
              className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
            >
              Review →
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Celebrating</span>
              <span className="font-medium text-gray-900 dark:text-white">{memberName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Occasion</span>
              <span className="font-medium text-gray-900 dark:text-white capitalize">{occasion.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {new Date(occasionDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tier</span>
              <span className="font-medium text-gray-900 dark:text-white capitalize">{selectedTier}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-purple-600">
                {TIERS.find(t => t.id === selectedTier)!.price === 0
                  ? 'Free'
                  : `$${(TIERS.find(t => t.id === selectedTier)!.price / 100).toFixed(2)}`}
              </span>
            </div>
          </div>

          {notes && (
            <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <span className="font-medium">Notes:</span> {notes}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setStep('tier')} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Planning…' : 'Confirm celebration'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}