'use client'

/**
 * app/dashboard/plan-comparison/page.tsx — G5.9
 * Medicare plan comparison page for members.
 */

const PLAN_TYPES = [
  {
    id: 'original',
    name: 'Original Medicare',
    parts: 'Part A + Part B',
    icon: '🏛️',
    pros: [
      'Accepted by most doctors and hospitals nationwide',
      'No referrals needed to see specialists',
      'Predictable structure — well understood',
      'Pairs well with Medigap (supplemental) plans',
    ],
    cons: [
      'No cap on out-of-pocket costs (without Medigap)',
      'No prescription drug coverage (need Part D separately)',
      'No dental, vision, or hearing coverage',
    ],
    bestFor: 'People who travel frequently or have doctors in multiple states',
  },
  {
    id: 'advantage',
    name: 'Medicare Advantage',
    parts: 'Part C (bundles A + B)',
    icon: '⭐',
    pros: [
      'Often includes dental, vision, hearing, and fitness benefits',
      'Usually includes prescription drug coverage (Part D)',
      'Annual out-of-pocket maximum protects against high costs',
      'May have $0 or low monthly premium',
    ],
    cons: [
      'Network restrictions — must use in-network providers',
      'Referrals often required to see specialists',
      'Plan benefits and networks can change each year',
      'May require prior authorization for some services',
    ],
    bestFor: 'People who want all-in-one coverage and stay near home',
  },
  {
    id: 'medigap',
    name: 'Medigap (Supplement)',
    parts: 'Pairs with Original Medicare',
    icon: '🛡️',
    pros: [
      'Covers most or all of Original Medicare cost-sharing',
      'Nationwide coverage — see any Medicare-accepting provider',
      'Predictable costs each month',
      'No network restrictions',
    ],
    cons: [
      'Separate monthly premium (can be significant)',
      'Does not include Part D — need separate drug plan',
      'Underwriting may apply if enrolling outside open enrollment',
      'Not available if you have Medicare Advantage',
    ],
    bestFor: 'People who want maximum flexibility and predictable costs',
  },
]

export default function PlanComparisonPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Medicare Plan Comparison</h1>
        <p className="text-gray-600">
          Understanding your Medicare options helps you choose the coverage that fits your life.
          Compare the main types below — your navigator can help you dig deeper.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-10">
        {PLAN_TYPES.map(plan => (
          <div key={plan.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col">
            <div className="text-3xl mb-2">{plan.icon}</div>
            <h2 className="text-lg font-bold text-gray-900 mb-0.5">{plan.name}</h2>
            <p className="text-xs text-indigo-600 font-medium mb-4">{plan.parts}</p>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pros</p>
              <ul className="space-y-1.5">
                {plan.pros.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>{p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cons</p>
              <ul className="space-y-1.5">
                {plan.cons.map((c, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-amber-500 mt-0.5 shrink-0">•</span>{c}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500"><span className="font-semibold">Best for:</span> {plan.bestFor}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
        <h3 className="font-semibold text-indigo-900 mb-2">Not sure which plan is right for you?</h3>
        <p className="text-sm text-indigo-800 mb-4">
          A free, unbiased HICAP counselor can review your specific situation — medications,
          doctors, budget — and help you compare actual plans in your area.
        </p>
        <a
          href="/dashboard/medicare-help"
          className="inline-block bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Get Medicare Help →
        </a>
      </div>
    </div>
  )
}
