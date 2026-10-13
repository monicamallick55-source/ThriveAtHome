// app/navigator/birthdays/page.tsx
// G5.4 — Navigator birthday arc console

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavigatorBirthdayPanel from '@/components/achievements/NavigatorBirthdayPanel'

export default async function NavigatorBirthdaysPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) redirect('/dashboard')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upcoming Birthdays</h1>
        <p className="text-gray-500 mt-1">
          Send a personal birthday message to members celebrating soon.
        </p>
      </div>
      <NavigatorBirthdayPanel />
    </div>
  )
}
