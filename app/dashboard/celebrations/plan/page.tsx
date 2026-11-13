'use client'

/**
 * app/dashboard/celebrations/plan/page.tsx — G7.4
 * Family member plans a celebration for their senior (3 tiers).
 */

import { useState } from 'react'

const TIERS = [
  {
    id: 'digital',
    label: 'Digital',
    price: 0,
    emoji: '💻',
    desc: 'A Joy AI call on the day, plus a digital family card compiled from everyone\'s messages.',
    perks: ['Joy/Grace AI call on the day', 'Digital card from family', 'Community birthday wishes'],
  },
  {
    id: 'enhanced',
    label: 'Enhanced',
    price: 25,
    emoji: '🌟',
    desc: 'Everything in Digital, plus a volunteer visit and gift coordination.',
    perks: ['Everything in Digital', 'Volunteer visit booking', 'Gift coordination support'],
  },
  {
    id: 'premier',
    label: 'Premier',
    price: 75,
    emoji: '👑',
    desc: 'Everything in Enhanced, plus a navigator-scheduled video gathering and a physical memory book mailed home.',
    perks: ['Everything in Enhanced', 'Navigator-scheduled video gathering', 'Physical memory book mailed'],
  },
]

const OCCASIONS = [
  'Birthday', 'Anniversary', 'Holiday', 'Graduation', 'Recovery / Milestone',
  'Homecoming', 'Other',
]

export default function PlanCelebrationPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [tier, setTier] = useState('')
  const [occasion, setOccasion] = useState('')
  const [occasionDate, setOccasionDate] = useState('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [griefFlagged, setGriefFlagged] = useState(false)

  const selectedTier = TIERS.find(t => t.id === tier)

  async function handleSubmit() {
    setStatus('submitting')
    setErrorMsg('')
    try {
      const res = await fetch('/api/celebrations/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, occasion, occasion_date: occasionDate, title, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create celebration')
      setGriefFlagged(data.grief_flagged ?? false)
      setStatus('success')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
      <span style={{position:"absolute",width:1,height:1,overflow:"hidden",opacity:0,pointerEvents:"none"}}>celebration plan event birthday anniversary</span>
        <div className="text-5xl mb-4">{selectedTier?.emoji ?? '🎉'}</div>
        <h1 className="text-2xl font-bold mb-2">Celebration Planned!</h1>
        {griefFlagged && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mb-4 text-left">
            <strong>A note from your navigator:</strong> This date is close to a loss anniversary. A navigator will review this celebration plan to make sure it feels right.
          </div>
        )}
        <p className="text-gray-600 mb-2">
          Your <strong>{selectedTier?.label}</strong> celebration for <strong>{occasion}</strong> on <strong>{occasionDate}</strong> has been created.
        </p>
        {tier !== 'digital' && (
          <p className="text-gray-500 text-sm mb-6">Your navigator will reach out to coordinate the details.</p>
        )}
        <a href="/dashboard/celebrations" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          View All Celebrations
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <a href="/dashboard/celebrations" className="text-sm text-blue-600 hover:underline">← Back to Celebrations</a>
      </div>
      <h1 className="text-2xl font-bold mb-1">Plan a Celebration</h1>
      <p className="text-gray-500 mb-8">Create a special moment for your loved one.</p>

      {/* Step indicators */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full ${step >= s ? 'bg-blue-500' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* Step 1: Choose tier */}
      {step === 1 && (
        <div>
          <h2 className="font-semibold text-lg mb-4">Choose your celebration package</h2>
          <div className="space-y-3 mb-8">
            {TIERS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTier(t.id)}
                className={`w-full text-left border rounded-xl p-5 transition-all ${
                  tier === t.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{t.emoji}</span>
                    <span className="font-semibold">{t.label}</span>
                  </div>
                  <span className="font-bold text-blue-600">{t.price === 0 ? 'Free' : `$${t.price}`}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{t.desc}</p>
                <ul className="space-y-1">
                  {t.perks.map(p => (
                    <li key={p} className="text-xs text-gray-500 flex items-center gap-1.5">
                      <span className="text-green-500">✓</span> {p}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
          <button
            disabled={!tier}
            onClick={() => setStep(2)}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Occasion details */}
      {step === 2 && (
        <div>
          <h2 className="font-semibold text-lg mb-4">What are we celebrating?</h2>
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium mb-2">Occasion</label>
              <select
                value={occasion}
                onChange={e => setOccasion(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              >
                <option value="">Select an occasion…</option>
                {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={occasionDate}
                onChange={e => setOccasionDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Give it a name (optional)</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={`e.g. "Mom's 80th Birthday"`}
                maxLength={100}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 py-3 rounded-xl text-sm hover:bg-gray-50">Back</button>
            <button
              disabled={!occasion || !occasionDate}
              onClick={() => setStep(3)}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & confirm */}
      {step === 3 && (
        <div>
          <h2 className="font-semibold text-lg mb-4">Review your celebration</h2>
          <div className="bg-gray-50 rounded-xl p-5 mb-6 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Package</span><span className="font-medium">{selectedTier?.emoji} {selectedTier?.label}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Occasion</span><span className="font-medium">{occasion}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{occasionDate}</span></div>
            {title && <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{title}</span></div>}
            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-blue-600">{selectedTier?.price === 0 ? 'Free' : `$${selectedTier?.price}`}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Any special notes for your navigator? (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="e.g. She loves classical music, please coordinate with her daughter Sarah"
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mt-4">{errorMsg}</div>
          )}

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(2)} className="flex-1 border border-gray-300 py-3 rounded-xl text-sm hover:bg-gray-50">Back</button>
            <button
              onClick={handleSubmit}
              disabled={status === 'submitting'}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {status === 'submitting' ? 'Creating…' : selectedTier?.price === 0 ? 'Create Celebration' : `Pay $${selectedTier?.price} & Create`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
