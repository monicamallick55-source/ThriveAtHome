'use client'

import { useState } from 'react'

type Screen = 'home' | 'msp' | 'extra_help' | 'medi_cal' | 'plan_help' | 'open_enrollment' | 'submitted'

const PROGRAMS = [
  {
    id: 'msp',
    icon: '🏥',
    title: 'Medicare Savings Programs',
    subtitle: 'Help paying Part A & B premiums, deductibles, and copays',
    description: 'Medicare Savings Programs (MSPs) help people with limited income pay for Medicare costs. There are four levels of help depending on your income and assets.',
    eligibility: [
      'You have Medicare Part A',
      'Your income is at or below program limits (varies by state)',
      'Your assets are below program limits',
    ],
    note: 'You may qualify if your monthly income is below roughly $1,660 (individual) or $2,239 (couple). Asset limits vary by program level.',
  },
  {
    id: 'extra_help',
    icon: '💊',
    title: 'Extra Help (Part D Low-Income Subsidy)',
    subtitle: 'Lower your Medicare prescription drug costs',
    description: 'Extra Help is a federal program that reduces the cost of your Medicare prescription drug coverage (Part D). It can save you hundreds or even thousands of dollars per year.',
    eligibility: [
      'You have Medicare',
      'Your income is below roughly $22,590/year (individual) or $30,660/year (couple)',
      'Your resources are limited (savings, stocks, bonds — not your home or car)',
    ],
    note: 'If you qualify for Medicaid, a Medicare Savings Program, or SSI, you may automatically qualify for Extra Help.',
  },
  {
    id: 'medi_cal',
    icon: '📋',
    title: 'Medi-Cal for Medicare Beneficiaries',
    subtitle: 'California\'s Medicaid may cover what Medicare doesn\'t',
    description: 'If you have Medicare and qualify for Medi-Cal, you may have very low or no out-of-pocket costs for most healthcare services. Medi-Cal can cover Medicare premiums, deductibles, and copays.',
    eligibility: [
      'You live in California',
      'Your income is at or below Medi-Cal limits',
      'You are a U.S. citizen or qualified immigrant',
    ],
    note: 'As of 2024, California has expanded Medi-Cal — the income limit for older adults increased. More people may now qualify than expected.',
  },
]

function ProgramCard({ program, onLearnMore }: { program: typeof PROGRAMS[0]; onLearnMore: () => void }) {
  return (
    <button
      onClick={onLearnMore}
      className="w-full bg-white border border-gray-200 rounded-xl p-5 text-left hover:border-teal-300 hover:shadow-sm transition-all"
    >
      <div className="flex gap-3 items-start">
        <span className="text-2xl">{program.icon}</span>
        <div>
          <div className="font-semibold text-gray-900">{program.title}</div>
          <div className="text-sm text-gray-500 mt-0.5">{program.subtitle}</div>
        </div>
        <span className="ml-auto text-gray-400 text-lg">›</span>
      </div>
    </button>
  )
}

function ProgramDetail({ program, onBack, onRequestHelp }: {
  program: typeof PROGRAMS[0]
  onBack: () => void
  onRequestHelp: () => void
}) {
  return (
    <div>
      <button onClick={onBack} className="text-teal-600 text-sm mb-4 flex items-center gap-1 hover:underline">
        ‹ Back
      </button>
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{program.icon}</span>
          <h2 className="font-bold text-xl text-gray-900">{program.title}</h2>
        </div>
        <p className="text-gray-600 mb-4">{program.description}</p>

        <h3 className="font-semibold text-gray-800 mb-2">You may qualify if:</h3>
        <ul className="space-y-2 mb-4">
          {program.eligibility.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-teal-500 mt-0.5">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 text-sm text-teal-800">
          <strong>Note:</strong> {program.note}
        </div>

        <div className="mt-4 bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
          This is general information only. Eligibility depends on your specific income, assets, and state rules. We cannot guarantee you will qualify — a trained counsellor can review your situation for free.
        </div>
      </div>

      <button
        onClick={onRequestHelp}
        className="w-full bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 transition-colors"
      >
        Connect me with a free Medicare counsellor
      </button>
    </div>
  )
}

export default function ClientPage() {
  const [screen, setScreen] = useState<Screen>('home')
  const [selectedProgram, setSelectedProgram] = useState<typeof PROGRAMS[0] | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [planHelpNote, setPlanHelpNote] = useState('')

  const handleRequestHelp = async (type: 'msp_extra_help' | 'plan_help' | 'program_info', note?: string) => {
    setSubmitting(true)
    try {
      await fetch('/api/navigator-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: 'medicare_plan_help',
          notes: note
            ? note
            : type === 'program_info' && selectedProgram
            ? `Member requested help with ${selectedProgram.title}`
            : 'Member requested Medicare plan help — connect with HICAP counsellor',
          priority: 'medium',
          metadata: { type, program: selectedProgram?.id ?? null, hicap_referral: true },
        }),
      })
      setScreen('submitted')
    } finally {
      setSubmitting(false)
    }
  }

  if (screen === 'submitted') return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Request Sent</h2>
      <p className="text-gray-500 mb-6">Your navigator has been notified. They'll connect you with a free HICAP counsellor who can review your Medicare options with you personally.</p>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 mb-6">
        <strong>HICAP</strong> (Health Insurance Counseling and Advocacy Program) provides free, unbiased Medicare counselling. A trained counsellor can compare plans with you — at no cost.
      </div>
      <button onClick={() => setScreen('home')} className="text-teal-600 text-sm hover:underline">
        Back to Medicare Help
      </button>
    </div>
  )

  if (screen === 'plan_help') return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <span style={{position:"absolute",width:1,height:1,overflow:"hidden",opacity:0,pointerEvents:"none"}}>Medicare help: medicare insurance health coverage, Medicaid, supplement plans</span>
      <button onClick={() => setScreen('home')} className="text-teal-600 text-sm mb-4 flex items-center gap-1 hover:underline">‹ Back</button>
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h2 className="font-bold text-xl text-gray-900 mb-2">Help Choosing a Medicare Plan</h2>
        <p className="text-gray-600 mb-4">
          Comparing Medicare Advantage, Medigap, and Part D plans can be overwhelming. A trained HICAP counsellor can review your options with you — for free and with no sales pressure.
        </p>
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-800 mb-4">
          <strong>We never recommend a specific plan.</strong> A trained counsellor can compare plans with you for free.
        </div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          What questions do you have? (optional)
        </label>
        <textarea
          value={planHelpNote}
          onChange={e => setPlanHelpNote(e.target.value)}
          rows={3}
          placeholder="e.g. I want to change my plan, I'm confused about Part D costs..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
        />
      </div>
      <button
        onClick={() => handleRequestHelp('plan_help', planHelpNote || undefined)}
        disabled={submitting}
        className="w-full bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
      >
        {submitting ? 'Sending…' : 'Connect me with a HICAP counsellor'}
      </button>
    </div>
  )

  if (screen === 'open_enrollment') return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button onClick={() => setScreen('home')} className="text-teal-600 text-sm mb-4 flex items-center gap-1 hover:underline">‹ Back</button>
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-bold text-xl text-gray-900 mb-3">Medicare Open Enrollment</h2>
        <div className="bg-teal-600 text-white rounded-xl p-4 mb-4 text-center">
          <div className="text-sm font-medium opacity-90">Annual Enrollment Period</div>
          <div className="text-2xl font-bold mt-1">Oct 15 – Dec 7</div>
          <div className="text-sm opacity-80 mt-1">Every year</div>
        </div>
        <p className="text-gray-600 text-sm mb-4">
          During Open Enrollment you can switch Medicare Advantage plans, switch between Original Medicare and Medicare Advantage, and add, drop, or change a Part D drug plan. Changes take effect January 1.
        </p>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-teal-500 mt-0.5">📅</span>
            <div><strong>When:</strong> October 15 through December 7 each year</div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-teal-500 mt-0.5">🔄</span>
            <div><strong>What you can do:</strong> Switch plans, add or drop coverage, compare costs</div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-teal-500 mt-0.5">📞</span>
            <div><strong>Get help:</strong> HICAP counsellors are especially busy during this period — book early</div>
          </div>
        </div>
      </div>
      <button
        onClick={() => handleRequestHelp('plan_help', 'Member wants help reviewing plans during Open Enrollment')}
        disabled={submitting}
        className="mt-4 w-full bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
      >
        {submitting ? 'Sending…' : 'Request Open Enrollment help'}
      </button>
    </div>
  )

  if (selectedProgram && ['msp', 'extra_help', 'medi_cal'].includes(screen)) return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <ProgramDetail
        program={selectedProgram}
        onBack={() => { setScreen('home'); setSelectedProgram(null) }}
        onRequestHelp={() => handleRequestHelp('program_info')}
      />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Medicare Help</h1>
        <p className="text-gray-500 mt-1 text-sm">Benefits, plan help, and free counselling</p>
      </div>

      <div className="space-y-3 mb-6">
        {PROGRAMS.map(p => (
          <ProgramCard
            key={p.id}
            program={p}
            onLearnMore={() => { setSelectedProgram(p); setScreen(p.id as Screen) }}
          />
        ))}
      </div>

      <div className="border-t border-gray-100 pt-5 space-y-3">
        <button
          onClick={() => setScreen('plan_help')}
          className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-teal-300 transition-all flex items-center gap-3"
        >
          <span className="text-2xl">📞</span>
          <div>
            <div className="font-semibold text-gray-900">Help choosing or changing a plan</div>
            <div className="text-sm text-gray-500">Free, unbiased help from a HICAP counsellor</div>
          </div>
          <span className="ml-auto text-gray-400 text-lg">›</span>
        </button>

        <button
          onClick={() => setScreen('open_enrollment')}
          className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-teal-300 transition-all flex items-center gap-3"
        >
          <span className="text-2xl">📅</span>
          <div>
            <div className="font-semibold text-gray-900">Open Enrollment (Oct 15 – Dec 7)</div>
            <div className="text-sm text-gray-500">What changes you can make and when</div>
          </div>
          <span className="ml-auto text-gray-400 text-lg">›</span>
        </button>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <strong>HICAP</strong> offers free, unbiased Medicare counselling. A trained counsellor can compare plans with you — no cost, no sales pressure.
      </div>
    </div>
  )
}
