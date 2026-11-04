'use client'

import { useState } from 'react'

const PATHWAYS = [
  {
    id: 'late_life_divorce',
    icon: '💔',
    title: 'Late-Life Divorce or Separation',
    description: 'Ending a long-term relationship later in life brings unique emotional and practical challenges — from housing and finances to rebuilding social connection.',
    navigator_actions: ['Benefits review', 'Housing options assessment', 'Connection to peer support group', 'Referral to elder law attorney if needed'],
    resources: [
      { label: 'AARP Divorce & Separation Resources', url: 'https://www.aarp.org/relationships/love-and-dating/info-2017/divorce-later-life.html' },
      { label: 'National Family Mediation', url: 'https://www.nfmediators.co.uk' },
    ],
  },
  {
    id: 'dementia_mci',
    icon: '🧠',
    title: 'Dementia or MCI Diagnosis',
    description: 'A new diagnosis of dementia or Mild Cognitive Impairment is life-changing. We help both the person diagnosed and their family caregivers navigate next steps with dignity.',
    navigator_actions: ['Connect to Alzheimer\'s Association local chapter', 'Legal document review (advance directive, POA)', 'Caregiver respite options', 'Memory-safe home assessment'],
    resources: [
      { label: 'Alzheimer\'s Association 24/7 Helpline', url: 'https://www.alz.org/help-support/resources/helpline' },
      { label: 'Lewy Body Dementia Association', url: 'https://www.lbda.org' },
    ],
  },
  {
    id: 'adult_child_moving',
    icon: '🏠',
    title: 'Adult Child Moving Away',
    description: 'When a close family member moves, the change in support and connection can feel significant. We help you build local community and stay connected across distance.',
    navigator_actions: ['Increase buddy call frequency', 'Introductions to local social groups', 'Family dashboard setup for remote family member', 'Emergency contact plan review'],
    resources: [
      { label: 'ElderCare Locator (US DHHS)', url: 'https://eldercare.acl.gov' },
      { label: 'Aging Life Care Association', url: 'https://www.aginglifecare.org' },
    ],
  },
  {
    id: 'housing_insecurity',
    icon: '🔑',
    title: 'Housing Insecurity or Forced Move',
    description: 'Facing a move you didn\'t plan — whether from rent increases, accessibility needs, or property changes — is stressful. We connect you to housing options and financial assistance.',
    navigator_actions: ['Benefits screening for housing assistance programs', 'Home-sharing programme options', 'Moving support coordination', 'Connection to local housing authority'],
    resources: [
      { label: 'HUD Housing Counseling', url: 'https://www.hud.gov/program_offices/housing/sfh/hcc' },
      { label: 'California Senior Legal Services', url: 'https://www.seniorlaw.com' },
    ],
  },
]

export default function LifeTransitionsPage() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const requestHelp = async (pathwayId: string, pathwayTitle: string) => {
    setSubmitting(true)
    try {
      await fetch('/api/navigator-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: 'life_transition_support',
          notes: `Member requested navigator support for: ${pathwayTitle}`,
          priority: 'medium',
          metadata: { pathway: pathwayId },
        }),
      })
      setSubmitted(pathwayId)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Life Transitions Support</h1>
      <p className="text-gray-500 text-sm mb-6">Your navigator can help you navigate major life changes — with practical support, trusted resources, and compassionate guidance.</p>

      <div className="space-y-3">
        {PATHWAYS.map(p => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
            >
              <span className="text-2xl">{p.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{p.title}</div>
                <div className="text-sm text-gray-500 mt-0.5 line-clamp-1">{p.description}</div>
              </div>
              <span className="text-gray-400">{expanded === p.id ? '▲' : '▼'}</span>
            </button>

            {expanded === p.id && (
              <div className="px-5 pb-5 border-t border-gray-100">
                <p className="text-gray-600 text-sm mt-3 mb-4">{p.description}</p>

                <h3 className="font-semibold text-gray-800 text-sm mb-2">What your navigator will do:</h3>
                <ul className="space-y-1 mb-4">
                  {p.navigator_actions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-teal-500 mt-0.5">✓</span><span>{a}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="font-semibold text-gray-800 text-sm mb-2">Trusted resources:</h3>
                <div className="space-y-1 mb-5">
                  {p.resources.map((r, i) => (
                    <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                      className="block text-sm text-teal-600 hover:underline">{r.label} ↗</a>
                  ))}
                </div>

                {submitted === p.id ? (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm text-teal-700">
                    ✅ Your navigator has been notified and will reach out to you soon.
                  </div>
                ) : (
                  <button
                    onClick={() => requestHelp(p.id, p.title)}
                    disabled={submitting}
                    className="w-full bg-teal-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Sending…' : 'Talk to my navigator about this'}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
