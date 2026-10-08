'use client'
// components/navigator/SuggestIntroductionModal.tsx
// Navigator UI: search for a second member and create a facilitated introduction.
// Mounted on the navigator member detail page.

import { useState, useCallback } from 'react'

interface Member {
  id: string
  preferred_name: string | null
  full_name: string | null
  city?: string | null
  directory_bio?: string | null
}

interface Props {
  /** The member the navigator is currently viewing — party A. */
  subjectMember: Member
  onClose: () => void
}

function displayName(m: Pick<Member, 'preferred_name' | 'full_name'>): string {
  return m.preferred_name ?? m.full_name ?? 'A member'
}

export default function SuggestIntroductionModal({ subjectMember, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Member[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Member | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/directory?q=${encodeURIComponent(q)}&limit=8`)
      if (res.ok) {
        const data = (await res.json()) as Member[]
        // Exclude the subject member
        setResults(data.filter((m) => m.id !== subjectMember.id))
      }
    } finally {
      setSearching(false)
    }
  }, [subjectMember.id])

  const handleQueryChange = (v: string) => {
    setQuery(v)
    search(v)
  }

  const handleSubmit = async () => {
    if (!selected || submitting) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/navigator/introductions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberIdA: subjectMember.id,
          memberIdB: selected.id,
          note: note.trim() || undefined,
        }),
      })

      if (res.ok) {
        setDone(true)
      } else {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const nameA = displayName(subjectMember)

  return (
    <div
      role="dialog"
      aria-modal
      aria-label="Suggest an introduction"
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">

        {done ? (
          <div className="text-center space-y-4 py-6">
            <p className="text-5xl" aria-hidden>🤝</p>
            <p className="text-2xl font-bold text-brand-navy">Introduction sent!</p>
            <p className="text-[18px] text-gray-600">
              Both {nameA} and {displayName(selected!)} have been notified. Messaging unlocks
              once they both accept.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-brand-teal text-white font-semibold py-3 rounded-xl
                         text-[18px] min-h-[52px]"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-2xl font-bold text-brand-navy">Suggest an introduction</h2>
              <p className="text-[18px] text-gray-500 mt-1">
                Introduce <span className="font-semibold text-brand-navy">{nameA}</span> to another
                member. Both must accept before they can message each other.
              </p>
            </div>

            {/* Step 1 — pick the other member */}
            {!selected ? (
              <div className="space-y-3">
                <label htmlFor="intro-search" className="font-semibold text-brand-navy text-[18px]">
                  Search for a member
                </label>
                <input
                  id="intro-search"
                  type="search"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Type a name…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[18px]
                             focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  autoFocus
                />

                {searching && (
                  <p className="text-gray-400 text-[17px]">Searching…</p>
                )}

                {!searching && results.length === 0 && query.trim().length >= 2 && (
                  <p className="text-gray-400 text-[17px]">No members found.</p>
                )}

                <ul className="space-y-2">
                  {results.map((m) => (
                    <li key={m.id}>
                      <button
                        onClick={() => { setSelected(m); setQuery(''); setResults([]) }}
                        className="w-full text-left flex items-center gap-3 p-3 rounded-xl
                                   border-2 border-gray-100 hover:border-brand-teal
                                   hover:bg-brand-teal/5 transition-colors"
                      >
                        {/* Avatar initial */}
                        <div
                          className="w-10 h-10 rounded-full bg-brand-navy/10 flex-shrink-0
                                      flex items-center justify-center text-brand-navy font-bold text-[17px]"
                          aria-hidden
                        >
                          {displayName(m).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-brand-navy text-[18px]">
                            {displayName(m)}
                          </p>
                          {m.city && (
                            <p className="text-gray-400 text-[15px]">{m.city}</p>
                          )}
                          {m.directory_bio && (
                            <p className="text-gray-500 text-[15px] line-clamp-1">{m.directory_bio}</p>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <>
                {/* Step 2 — confirm + add note */}
                <div className="flex items-center gap-3 p-4 bg-brand-teal/5 rounded-xl">
                  <div
                    className="w-10 h-10 rounded-full bg-brand-teal/20 flex-shrink-0
                                flex items-center justify-center text-brand-teal font-bold text-[17px]"
                    aria-hidden
                  >
                    {displayName(selected).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-brand-navy text-[18px]">{displayName(selected)}</p>
                    {selected.city && (
                      <p className="text-gray-400 text-[15px]">{selected.city}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-gray-400 hover:text-gray-600 text-[15px] flex-shrink-0"
                    aria-label="Change selected member"
                  >
                    Change
                  </button>
                </div>

                <div className="space-y-1">
                  <label htmlFor="intro-note" className="font-semibold text-brand-navy text-[18px]">
                    Introduction note
                    <span className="font-normal text-gray-400 ml-1">(optional, max 300 chars)</span>
                  </label>
                  <textarea
                    id="intro-note"
                    rows={3}
                    maxLength={300}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={`e.g. "You both grew up in Ohio and love bridge."`}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[18px]
                               focus:outline-none focus:ring-2 focus:ring-brand-teal resize-none"
                  />
                  <p className="text-[15px] text-gray-400 text-right">
                    {300 - note.length} characters left
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[16px] text-amber-700">
                  Both {nameA} and {displayName(selected)} will be notified. Messaging only
                  unlocks when <strong>both</strong> accept.
                </div>

                {error && (
                  <p className="text-red-600 text-[18px]" role="alert">{error}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={onClose}
                    className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3
                               rounded-xl text-[18px] min-h-[52px] hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 bg-brand-teal text-white font-semibold py-3
                               rounded-xl text-[18px] min-h-[52px] disabled:opacity-50
                               hover:bg-brand-teal-light transition-colors"
                  >
                    {submitting ? 'Sending…' : 'Send introduction'}
                  </button>
                </div>
              </>
            )}

            {/* Cancel visible in step 1 */}
            {!selected && (
              <button
                onClick={onClose}
                className="w-full border border-gray-200 text-gray-600 font-semibold py-3
                           rounded-xl text-[18px] min-h-[52px] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
