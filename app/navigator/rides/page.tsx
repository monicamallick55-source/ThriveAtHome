// app/navigator/rides/page.tsx
// G5.8 — Navigator ride bookings console

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavigatorRidesPanel from '@/components/rides/NavigatorRidesPanel'

export default async function NavigatorRidesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) redirect('/dashboard')

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ride Bookings</h1>
        <p className="text-gray-500 mt-1">
          Manage transportation requests for upcoming events.
        </p>
      </div>
      <NavigatorRidesPanel />
    </div>
  )
}
