'use client'
// components/achievements/NavigatorBirthdayPanel.tsx
// G5.4 — Navigator view of upcoming member birthdays with send-card action

import { useState, useEffect, useCallback } from 'react'

interface BirthdayEntry {
  member_id: string
  full_name: string
  preferred_name: string | null
  birth_month: number
  birth_day: number
  age: number | null
  days_until: number
  is_today: boolean
  next_birthday: string
  message_sent_this_year: boolean
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const DEFAULT_MESSAGES = [
  'Wishing you a wonderful birthday filled with joy and celebration! 🎂',
  'Happy Birthday! Thinking of you today and wishing you all the best. 🎉',
  'Many happy returns of the day! Hope your birthday is as wonderful as you are. 🌟',
  'Warmest birthday wishes to you! May this year bring you happiness and good health. 🎈',
]

function displayName(entry: BirthdayEntry): string {
  return entry.preferred_name ?? entry.full_name
}

function daysLabel(days: number): string {
  if (days === 0) return 'Today! 🎂'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

export default function NavigatorBirthdayPanel() {
  const [birthdays, setBirthdays] = useState<BirthdayEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [sendingFor, setSendingFor] = useState<string | null>(null)
  const [message, setMessage] = useState(DEFAULT_MESSAGES[0])
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/birthday-arc?days=${days}`)
      if (res.ok) {
        const data = await res.json()
        setBirthdays(data.birthdays ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => { load() }, [load])

  async function handleSend(memberId: string) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/birthday-arc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, message, delivery_method: 'in_app' }),
      })
      if (res.ok) {
        setSendingFor(null)
        setMessage(DEFAULT_MESSAGES[0])
        setSuccessMsg('Birthday message sent!')
        setTimeout(() => setSuccessMsg(''), 4000)
        load()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const todayBirthdays = birthdays.filter(b => b.is_today)
  const upcomingBirthdays = birthdays.filter(b => !b.is_today)

  return (
    <div className="space-y-6">
      {/* Window selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-gray-700">Show birthdays in next:</span>
        {[7, 14, 30, 60].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              days === d ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {d} days
          </button>
        ))}
      </div>

      {successMsg && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : birthdays.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-2xl mb-2">🎂</p>
          <p className="text-sm text-gray-500">No birthdays in the next {days} days.</p>
          <p className="text-xs text-gray-400 mt-1">Make sure members have their birth date set in their profile.</p>
        </div>
      ) : (
        <>
          {/* Today */}
          {todayBirthdays.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">🎂 Today</p>
              {todayBirthdays.map(b => (
                <BirthdayCard
                  key={b.member_id}
                  entry={b}
                  sendingFor={sendingFor}
                  message={message}
                  submitting={submitting}
                  defaultMessages={DEFAULT_MESSAGES}
                  onStartSend={() => { setSendingFor(b.member_id); setMessage(DEFAULT_MESSAGES[0]) }}
                  onCancelSend={() => setSendingFor(null)}
                  onMessageChange={setMessage}
                  onSend={() => handleSend(b.member_id)}
                  highlight
                />
              ))}
            </div>
          )}

          {/* Upcoming */}
          {upcomingBirthdays.length > 0 && (
            <div className="space-y-2">
              {todayBirthdays.length > 0 && (
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Upcoming</p>
              )}
              {upcomingBirthdays.map(b => (
                <BirthdayCard
                  key={b.member_id}
                  entry={b}
                  sendingFor={sendingFor}
                  message={message}
                  submitting={submitting}
                  defaultMessages={DEFAULT_MESSAGES}
                  onStartSend={() => { setSendingFor(b.member_id); setMessage(DEFAULT_MESSAGES[0]) }}
                  onCancelSend={() => setSendingFor(null)}
                  onMessageChange={setMessage}
                  onSend={() => handleSend(b.member_id)}
                  highlight={false}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function BirthdayCard({
  entry, sendingFor, message, submitting, defaultMessages,
  onStartSend, onCancelSend, onMessageChange, onSend, highlight,
}: {
  entry: BirthdayEntry
  sendingFor: string | null
  message: string
  submitting: boolean
  defaultMessages: string[]
  onStartSend: () => void
  onCancelSend: () => void
  onMessageChange: (m: string) => void
  onSend: () => void
  highlight: boolean
}) {
  const isOpen = sendingFor === entry.member_id

  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${highlight ? 'bg-amber-200 text-amber-800' : 'bg-indigo-100 text-indigo-700'}`}>
            {MONTH_NAMES[entry.birth_month - 1]}<br/>
            <span className="text-xs leading-none">{entry.birth_day}</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{displayName(entry)}</p>
            <p className="text-sm text-gray-500">
              {daysLabel(entry.days_until)}
              {entry.age && ` · Turning ${entry.age}`}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          {entry.message_sent_this_year ? (
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
              ✓ Sent
            </span>
          ) : (
            <button
              onClick={onStartSend}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors ${
                highlight ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              Send message
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1.5">Quick picks:</p>
            <div className="flex flex-wrap gap-1.5">
              {defaultMessages.map((m, i) => (
                <button
                  key={i}
                  onClick={() => onMessageChange(m)}
                  className={`rounded-lg px-2 py-1 text-xs border transition-colors ${
                    message === m ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Option {i + 1}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={message}
            onChange={e => onMessageChange(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={onSend}
              disabled={submitting || !message.trim()}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Sending…' : 'Send birthday message'}
            </button>
            <button
              onClick={onCancelSend}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
