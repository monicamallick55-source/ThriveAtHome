'use client'
// components/grief/GriefSupportClient.tsx
// Life transitions page — 4 pathway cards + trusted professional directory

import { useState } from 'react'

interface Advisor {
  id: string
  full_name: string
  advisor_type: 'therapist' | 'grief_counselor' | 'chaplain'
  specialty?: string
  bio?: string
  phone?: string
  email?: string
  telehealth_ok: boolean
  license_number?: string
  license_state?: string
  member_request_only: boolean
}

interface Connection {
  advisor_id: string
  status: string
}

interface TransitionPlan {
  id: string
  title: string
  status: string
  family_can_view: boolean
  target_move_date?: string
  facility_name?: string
}

interface Props {
  memberId: string
  advisors: Advisor[]
  connections: Connection[]
  transitionPlans: TransitionPlan[]
}

const PATHWAYS = [
  {
    id: 'divorce',
    icon: '💔',
    title: 'Late-life divorce or separation',
    description: "Ending a long marriage later in life brings unique legal, financial, and emotional challenges. You don't have to navigate this alone.",
    navigatorAction: "Your navigator will help you understand your rights, connect you with a trusted attorney, and make sure you have emotional support during this transition.",
    resources: [
      { label: 'AARP Divorce After 50 Guide', url: 'https://www.aarp.org/money/investing/info-2012/gray-divorce-rising.html' },
      { label: 'National Center on Elder Law', url: 'https://www.ncler.acl.gov' },
      { label: 'WomensLaw.org — Legal Help', url: 'https://www.womenslaw.org' },
    ],
    taskTitle: 'Support with late-life divorce or separation',
    color: 'rose',
  },
  {
    id: 'dementia',
    icon: '🧠',
    title: 'Dementia or MCI diagnosis',
    description: "A diagnosis of Alzheimer's, another dementia, or mild cognitive impairment (MCI) changes everything. Early planning and support make a meaningful difference.",
    navigatorAction: "Your navigator will connect you with memory care specialists, help you put legal and care plans in place early, and make sure family caregivers have support too.",
    resources: [
      { label: 'Alzheimer\'s Association 24/7 Helpline', url: 'https://www.alz.org/help-support/resources/helpline' },
      { label: 'Lewy Body Dementia Association', url: 'https://www.lbda.org' },
      { label: 'Family Caregiver Alliance — Dementia', url: 'https://www.caregiver.org/resource/dementia/' },
      { label: 'BrightFocus Foundation', url: 'https://www.brightfocus.org/alzheimers' },
    ],
    taskTitle: 'Support with dementia or MCI diagnosis',
    color: 'purple',
  },
  {
    id: 'child-moving',
    icon: '🏠',
    title: 'Adult child moving away',
    description: "When a child who has been nearby moves to another city or country, it can feel like a significant loss — and a good reason to build stronger local connections.",
    navigatorAction: "Your navigator will help you strengthen your local support network, set up ways to stay close with your child, and make sure you feel connected right here.",
    resources: [
      { label: 'AARP Local Resources Finder', url: 'https://local.aarp.org' },
      { label: 'Aging Life Care Association', url: 'https://www.aginglifecare.org' },
      { label: 'Eldercare Locator', url: 'https://eldercare.acl.gov' },
    ],
    taskTitle: 'Support after adult child moving away',
    color: 'amber',
  },
  {
    id: 'housing',
    icon: '🏘️',
    title: 'Housing insecurity or forced move',
    description: 'Facing the possibility of losing your home — whether from a rent increase, a health change, or another reason — is one of the most stressful situations there is.',
    navigatorAction: 'Your navigator will connect you with housing counsellors, explore home-sharing options, and help you access every benefit and programme you are entitled to.',
    resources: [
      { label: 'HUD Housing Counseling', url: 'https://www.hud.gov/findacounselor' },
      { label: 'National Foundation for Credit Counseling', url: 'https://www.nfcc.org' },
      { label: 'Benefits.gov — Housing Assistance', url: 'https://www.benefits.gov' },
      { label: 'Home sharing options', url: '/dashboard/home-sharing' },
    ],
    taskTitle: 'Support with housing insecurity or forced move',
    color: 'blue',
  },
]

const CATEGORY_LABELS: Record<string, string> = {
  therapist: 'Licensed Therapist',
  grief_counselor: 'Grief Counselor',
  chaplain: 'Chaplain',
}

const COLOR_MAP: Record<string, { bg: string; border: string; icon: string; btn: string; tag: string }> = {
  rose:   { bg: 'bg-rose-50',   border: 'border-rose-200',   icon: 'bg-rose-100',   btn: 'bg-rose-600 hover:bg-rose-700', tag: 'bg-rose-100 text-rose-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'bg-purple-100', btn: 'bg-purple-600 hover:bg-purple-700', tag: 'bg-purple-100 text-purple-700' },
  amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  icon: 'bg-amber-100',  btn: 'bg-amber-600 hover:bg-amber-700', tag: 'bg-amber-100 text-amber-700' },
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: 'bg-blue-100',   btn: 'bg-blue-600 hover:bg-blue-700', tag: 'bg-blue-100 text-blue-700' },
}

export default function GriefSupportClient({ memberId, advisors, connections, transitionPlans }: Props) {
  const [expandedPathway, setExpandedPathway] = useState<string | null>(null)
  const [requestingAdvisor, setRequestingAdvisor] = useState<string | null>(null)
  const [requestNote, setRequestNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [taskSubmitting, setTaskSubmitting] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  const connectionMap = Object.fromEntries(connections.map(c => [c.advisor_id, c.status]))

  async function handleNavigatorTask(pathway: typeof PATHWAYS[0]) {
    setTaskSubmitting(pathway.id)
    try {
      await fetch('/api/navigator-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          title: pathway.taskTitle,
          priority: 'normal',
          advisor_type: 'life_transition',
        }),
      })
      setSuccessMsg(`Your navigator has been notified and will reach out soon.`)
      setTimeout(() => setSuccessMsg(''), 5000)
    } finally {
      setTaskSubmitting(null)
    }
  }

  async function handleAdvisorRequest(advisorId: string) {
    setSubmitting(true)
    try {
      await fetch('/api/advisor-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advisor_id: advisorId, member_note: requestNote }),
      })
      setRequestingAdvisor(null)
      setRequestNote('')
      setSuccessMsg('Introduction requested. Your navigator will be in touch.')
      setTimeout(() => setSuccessMsg(''), 5000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Life Transitions Support</h1>
        <p className="text-gray-500 mt-1">
          Major life changes are hard. Your navigator is here to help — and you are not alone.
        </p>
      </div>

      {successMsg && (
        <div className="mb-6 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          {successMsg}
        </div>
      )}

      {/* Active transition plans */}
      {transitionPlans.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Active Move Plans</h2>
          <div className="space-y-2">
            {transitionPlans.map(plan => (
              <div key={plan.id} className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-indigo-900">{plan.title}</p>
                  {plan.facility_name && <p className="text-sm text-indigo-700">{plan.facility_name}</p>}
                  {plan.target_move_date && (
                    <p className="text-xs text-indigo-600 mt-0.5">
                      Target: {new Date(plan.target_move_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <a
                  href={`/dashboard/transitions/${plan.id}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  View plan →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pathway cards */}
      <div className="space-y-4 mb-10">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Common transitions we support</h2>
        {PATHWAYS.map(pathway => {
          const c = COLOR_MAP[pathway.color]
          const isExpanded = expandedPathway === pathway.id
          return (
            <div key={pathway.id} className={`rounded-xl border ${c.border} ${c.bg} overflow-hidden`}>
              <button
                onClick={() => setExpandedPathway(isExpanded ? null : pathway.id)}
                className="w-full text-left p-5 flex items-start gap-4"
              >
                <span className={`text-2xl flex-shrink-0 rounded-xl p-2 ${c.icon}`}>{pathway.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{pathway.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{pathway.description}</p>
                </div>
                <svg
                  className={`h-5 w-5 text-gray-400 flex-shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 border-t border-gray-200 pt-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">What your navigator will do</p>
                    <p className="text-sm text-gray-700">{pathway.navigatorAction}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Trusted resources</p>
                    <ul className="space-y-1">
                      {pathway.resources.map(r => (
                        <li key={r.url}>
                          <a
                            href={r.url}
                            target={r.url.startsWith('http') ? '_blank' : undefined}
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                          >
                            {r.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-400 mt-2">
                      Please confirm resources are current before relying on them. Your navigator can help verify.
                    </p>
                  </div>

                  <button
                    onClick={() => handleNavigatorTask(pathway)}
                    disabled={taskSubmitting === pathway.id}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${c.btn}`}
                  >
                    {taskSubmitting === pathway.id ? 'Sending…' : 'Talk to my navigator'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Professional advisors */}
      {advisors.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Professional Support</h2>
          <p className="text-sm text-gray-500 mb-4">
            Your navigator can make a warm introduction to any of these trusted professionals.
          </p>
          <div className="space-y-3">
            {advisors.map(advisor => {
              const status = connectionMap[advisor.id]
              return (
                <div key={advisor.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900">{advisor.full_name}</p>
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                          {CATEGORY_LABELS[advisor.advisor_type] ?? advisor.advisor_type}
                        </span>
                        {advisor.telehealth_ok && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-700">
                            Telehealth available
                          </span>
                        )}
                      </div>
                      {advisor.specialty && <p className="text-sm text-gray-500 mt-0.5">{advisor.specialty}</p>}
                      {advisor.bio && <p className="text-sm text-gray-600 mt-1">{advisor.bio}</p>}
                      {advisor.license_number && (
                        <p className="text-xs text-gray-400 mt-1">
                          License: {advisor.license_state} {advisor.license_number}
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {status ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 capitalize">
                          {status.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <button
                          onClick={() => setRequestingAdvisor(advisor.id)}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
                        >
                          Request intro
                        </button>
                      )}
                    </div>
                  </div>

                  {requestingAdvisor === advisor.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-700 mb-2">
                        Your navigator will make the introduction. Add a note (optional):
                      </p>
                      <textarea
                        value={requestNote}
                        onChange={e => setRequestNote(e.target.value)}
                        placeholder="e.g. I am going through a difficult divorce and would like to speak with someone."
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleAdvisorRequest(advisor.id)}
                          disabled={submitting}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          {submitting ? 'Sending…' : 'Send request'}
                        </button>
                        <button
                          onClick={() => { setRequestingAdvisor(null); setRequestNote('') }}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {advisors.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">
            Your navigator can connect you with licensed therapists, grief counselors, and chaplains.
            Ask your navigator for a referral.
          </p>
        </div>
      )}
    </div>
  )
}
