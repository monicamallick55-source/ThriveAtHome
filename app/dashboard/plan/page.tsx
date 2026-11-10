import Link from 'next/link'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function PlanPage() {
  const user = await requireAuth()
  const planTier = (user as any)?.app_metadata?.plan_tier ?? 'basic'

  const TIERS = [
    { id: 'basic', name: 'Basic', price: 'Free', features: ['Community access', 'Basic support'] },
    { id: 'standard', name: 'Standard', price: '$29/mo', features: ['2 navigator hours/mo', 'Buddy calls', 'Community access'] },
    { id: 'premium', name: 'Premium', price: '$79/mo', features: ['Unlimited navigator hours', 'Priority support', 'All features'] },
  ]

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Your Plan</h1>
      <p className="text-gray-600 mb-6">Current plan: <strong className="capitalize">{planTier}</strong></p>
      <div className="grid gap-4 md:grid-cols-3">
        {TIERS.map(tier => (
          <div key={tier.id} className={`border rounded-lg p-4 ${tier.id === planTier ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
            <h2 className="font-semibold text-lg">{tier.name}</h2>
            <p className="text-2xl font-bold my-2">{tier.price}</p>
            <ul className="text-sm text-gray-600 space-y-1">
              {tier.features.map(f => <li key={f}>✓ {f}</li>)}
            </ul>
            {tier.id !== planTier && (
              <Link href="/dashboard/plan/upgrade" className="mt-4 block text-center bg-blue-600 text-white rounded px-3 py-2 text-sm">
                Upgrade
              </Link>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 text-sm text-gray-500">
        <Link href="/dashboard/plan/billing" className="underline">Billing history</Link>
      </div>
    </main>
  )
}
