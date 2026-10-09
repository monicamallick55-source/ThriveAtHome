// app/dashboard/time-bank/page.tsx
// Member-facing time-bank credits page

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TimeBankCredits from '@/components/time-bank/TimeBankCredits'

export default async function TimeBankPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Time-Bank Credits</h1>
        <p className="text-gray-500 mt-1">
          Credits earned when family members volunteer for other seniors in our community.
          Redeem them for care services.
        </p>
      </div>

      <TimeBankCredits />

      <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5">
        <h2 className="text-sm font-semibold text-blue-900 mb-2">How it works</h2>
        <ul className="space-y-1.5 text-sm text-blue-800">
          <li className="flex gap-2">
            <span className="text-blue-400">1.</span>
            A family member volunteers to help another senior (grocery run, companionship call, etc.)
          </li>
          <li className="flex gap-2">
            <span className="text-blue-400">2.</span>
            Staff records the session — 1 credit is added per hour served
          </li>
          <li className="flex gap-2">
            <span className="text-blue-400">3.</span>
            Credits accumulate on your account and can be redeemed for services
          </li>
        </ul>
      </div>
    </div>
  )
}
