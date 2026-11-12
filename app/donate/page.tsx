'use client'
import { useState } from 'react'

const AMOUNTS = [10, 25, 50, 100, 250]

export default function DonatePage() {
  const [selected, setSelected] = useState<number | null>(25)
  const [custom, setCustom] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const amount = custom ? parseFloat(custom) : selected

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Support Thrive@Home</h1>
        <p className="text-gray-600 mb-6">Your donation helps seniors live independently and with dignity.</p>

        {submitted ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🙏</div>
            <h2 className="text-xl font-semibold mb-2">Thank you for your support!</h2>
            <p className="text-gray-600">Your {recurring ? 'monthly ' : ''}donation of ${amount} means the world to our community.</p>
          </div>
        ) : (
          <form role="form" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Amount</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {AMOUNTS.map(a => (
                  <button key={a} type="button"
                    onClick={() => { setSelected(a); setCustom('') }}
                    className={`py-2 rounded-lg border text-sm font-medium transition ${selected === a && !custom ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-700 hover:border-blue-400'}`}>
                    ${a}
                  </button>
                ))}
              </div>
              <input type="number" placeholder="Custom amount" value={custom}
                onChange={e => { setCustom(e.target.value); setSelected(null) }}
                aria-label="amount"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                <span className="text-sm text-gray-700">Make this a <strong>monthly</strong> recurring donation</span>
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                placeholder="Your name" />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                placeholder="your@email.com" />
            </div>

            <button type="submit" disabled={!amount || amount <= 0}
              className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold text-sm disabled:opacity-50 hover:bg-blue-700 transition">
              {recurring ? `Donate $${amount || '—'}/month` : `Donate $${amount || '—'}`}
            </button>

            <p className="mt-4 text-xs text-gray-500 text-center">
              Thrive@Home is a for-profit company. Donations are <strong>not tax-deductible</strong>.
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
