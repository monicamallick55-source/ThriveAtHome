// app/plans/page.tsx — Public plan comparison page (G5.9)
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function PlansPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any
  const { data: features } = await db
    .from('plan_comparison_features')
    .select('feature, category, basic, complete, premier, sort_order')
    .order('sort_order')

  const rows = (features ?? []) as Array<{ feature: string; category: string; basic: string; complete: string; premier: string }>

  const categories = [...new Set(rows.map(r => r.category))]

  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900">Choose Your Plan</h1>
        <p className="text-gray-500 mt-3 text-lg">All plans include Aria AI, family dashboard, and community access.</p>
      </div>

      {/* Plan header cards */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        {[
          { name: 'Basic', price: '$39', annual: '$421', tier: 'basic', color: 'border-gray-200' },
          { name: 'Complete', price: '$79', annual: '$853', tier: 'complete', color: 'border-indigo-400', highlight: true },
          { name: 'Premier', price: '$199', annual: '$2,149', tier: 'premier', color: 'border-purple-400' },
        ].map(plan => (
          <div key={plan.tier} className={`rounded-2xl border-2 p-6 text-center ${plan.color} ${plan.highlight ? 'bg-indigo-50' : 'bg-white'}`}>
            {plan.highlight && <span className="inline-block bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">Most Popular</span>}
            <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
            <p className="text-4xl font-bold text-gray-900 mt-2">{plan.price}<span className="text-base font-normal text-gray-500">/mo</span></p>
            <p className="text-sm text-gray-400 mt-1">{plan.annual}/yr (save 10%)</p>
            <Link
              href={`/enroll?plan=${plan.tier}`}
              className={`mt-5 block w-full py-2.5 rounded-lg font-medium text-sm transition ${
                plan.highlight
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Get Started
            </Link>
          </div>
        ))}
      </div>

      {/* Feature comparison table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-6 py-3 font-semibold text-gray-700 w-1/2">Feature</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-700">Basic</th>
              <th className="text-center px-4 py-3 font-semibold text-indigo-700 bg-indigo-50">Complete</th>
              <th className="text-center px-4 py-3 font-semibold text-purple-700">Premier</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <>
                <tr key={`cat-${cat}`} className="bg-gray-50 border-t border-b border-gray-100">
                  <td colSpan={4} className="px-6 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 capitalize">{cat}</td>
                </tr>
                {rows.filter(r => r.category === cat).map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-6 py-3 text-gray-700">{row.feature}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{row.basic}</td>
                    <td className="px-4 py-3 text-center text-indigo-700 bg-indigo-50/50 font-medium">{row.complete}</td>
                    <td className="px-4 py-3 text-center text-purple-700">{row.premier}</td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-center text-sm text-gray-400 mt-8">
        Questions? <a href="mailto:hello@thriveathome.com" className="underline">Contact us</a> — we&apos;re happy to help you choose.
      </p>
    </main>
  )
}
