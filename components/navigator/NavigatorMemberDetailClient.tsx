'use client'
// components/navigator/NavigatorMemberDetailClient.tsx
// Navigator member detail view — profile info, introductions history,
// and "Suggest an introduction" action (G2.6).

import { useState } from 'react'
import SuggestIntroductionModal from './SuggestIntroductionModal'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Member {
  id: string
  full_name: string | null
  preferred_name: string | null
  email: string | null
  phone: string | null
  city: string | null
  state: string | null
  directory_bio: string | null
  directory_opt_in: boolean
  risk_level: string | null
  aria_call_opted_in: boolean
  created_at: string
  subscription_tier: string | null
  org_id: string | null
}

interface ConnectionParty {
  id: string
  preferred_name: string | null
  full_name: string | null
}

interface Introduction {
  id: string
  created_at: string
  status: string
  intro_note: string | null
  requester_accepted: boolean
  recipient_accepted: boolean
  requester: ConnectionParty | null
  recipient: ConnectionParty | null
}

interface Props {
  member: Member
  introductions: Introduction[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function displayName(
  m: { preferred_name: string | null; full_name: string | null } | null,
): string {
  return m?.preferred_name ?? m?.full_name ?? 'A member'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
    blocked: 'bg-gray-200 text-gray-600',
  }
  return map[status] ?? 'bg-gray-100 text-gray-500'
}

function riskBadge(risk: string | null) {
  if (!risk) return null
  const map: Record<string, string> = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700',
    critical: 'bg-red-200 text-red-800 font-bold',
  }
  return map[risk] ?? 'bg-gray-100 text-gray-600'
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NavigatorMemberDetailClient({ member, introductions }: Props) {
  const [showIntroModal, setShowIntroModal] = useState(false)
  const [localIntros, setLocalIntros] = useState<Introduction[]>(introductions)

  const memberName = displayName(member)
  const risk = riskBadge(member.risk_level)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

      {/* Back link */}
      <a
        href="/navigator/members"
        className="inline-flex items-center gap-1.5 text-brand-teal text-[18px] hover:underline"
      >
        ← Back to members
      </a>

      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-full bg-brand-navy/10 flex items-center justify-center
                          text-brand-navy font-bold text-2xl flex-shrink-0"
              aria-hidden
            >
              {memberName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brand-navy">{memberName}</h1>
              {member.preferred_name && member.full_name && member.preferred_name !== member.full_name && (
                <p className="text-gray-400 text-[16px]">{member.full_name}</p>
              )}
              {(member.city || member.state) && (
                <p className="text-gray-500 text-[17px]">
                  {[member.city, member.state].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Risk badge */}
          {member.risk_level && risk && (
            <span className={`px-3 py-1 rounded-full text-[15px] ${risk}`}>
              Risk: {member.risk_level}
            </span>
          )}
        </div>

        {/* Details grid */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[17px]">
          {member.email && (
            <>
              <dt className="text-gray-400 font-medium">Email</dt>
              <dd className="text-gray-700 break-all">{member.email}</dd>
            </>
          )}
          {member.phone && (
            <>
              <dt className="text-gray-400 font-medium">Phone</dt>
              <dd className="text-gray-700">{member.phone}</dd>
            </>
          )}
          <dt className="text-gray-400 font-medium">Plan</dt>
          <dd className="text-gray-700 capitalize">{member.subscription_tier ?? '—'}</dd>

          <dt className="text-gray-400 font-medium">Aria calls</dt>
          <dd className={member.aria_call_opted_in ? 'text-green-600' : 'text-gray-400'}>
            {member.aria_call_opted_in ? 'Opted in' : 'Not opted in'}
          </dd>

          <dt className="text-gray-400 font-medium">Member since</dt>
          <dd className="text-gray-700">{formatDate(member.created_at)}</dd>
        </dl>

        {member.directory_bio && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-gray-500 text-[16px] italic">{member.directory_bio}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setShowIntroModal(true)}
          className="bg-brand-teal text-white font-semibold px-5 py-2.5 rounded-xl
                     text-[18px] min-h-[52px] hover:bg-brand-teal-light transition-colors
                     flex items-center gap-2"
        >
          🤝 Suggest an introduction
        </button>
        <a
          href={`/navigator/members/${member.id}/tasks`}
          className="border border-brand-teal text-brand-teal font-semibold px-5 py-2.5
                     rounded-xl text-[18px] min-h-[52px] flex items-center
                     hover:bg-brand-teal/5 transition-colors"
        >
          View tasks
        </a>
      </div>

      {/* Introductions history */}
      <section aria-label="Navigator-facilitated introductions">
        <h2 className="text-xl font-bold text-brand-navy mb-4">
          Introductions ({localIntros.length})
        </h2>

        {localIntros.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-gray-400 text-[18px]">
              No introductions yet. Use the button above to suggest one.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {localIntros.map((intro) => {
              const otherParty =
                intro.requester?.id === member.id ? intro.recipient : intro.requester
              const isRequester = intro.requester?.id === member.id
              const memberAccepted = isRequester
                ? intro.requester_accepted
                : intro.recipient_accepted
              const otherAccepted = isRequester
                ? intro.recipient_accepted
                : intro.requester_accepted

              return (
                <li
                  key={intro.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full bg-brand-teal/20 flex-shrink-0
                                    flex items-center justify-center text-brand-teal font-semibold"
                        aria-hidden
                      >
                        {displayName(otherParty).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-brand-navy text-[18px]">
                          {memberName} ↔ {displayName(otherParty)}
                        </p>
                        <p className="text-gray-400 text-[15px]">{formatDate(intro.created_at)}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[14px] capitalize ${statusBadge(intro.status)}`}>
                      {intro.status}
                    </span>
                  </div>

                  {intro.intro_note && (
                    <p className="text-gray-600 text-[17px] italic pl-12">
                      "{intro.intro_note}"
                    </p>
                  )}

                  {/* Dual-accept progress */}
                  {intro.status === 'pending' && (
                    <div className="flex gap-4 pl-12 text-[15px]">
                      <span className={memberAccepted ? 'text-green-600' : 'text-gray-400'}>
                        {memberAccepted ? '✓' : '○'} {memberName.split(' ')[0]}
                      </span>
                      <span className={otherAccepted ? 'text-green-600' : 'text-gray-400'}>
                        {otherAccepted ? '✓' : '○'} {displayName(otherParty).split(' ')[0]}
                      </span>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Suggest introduction modal */}
      {showIntroModal && (
        <SuggestIntroductionModal
          subjectMember={{
            id: member.id,
            preferred_name: member.preferred_name,
            full_name: member.full_name,
            city: member.city,
          }}
          onClose={() => {
            setShowIntroModal(false)
            // Refresh introductions list after submit
            fetch(`/api/navigator/members/${member.id}`)
              .then((r) => r.json())
              .then((d) => { if (d.introductions) setLocalIntros(d.introductions) })
              .catch(() => {})
          }}
        />
      )}
    </div>
  )
}
