// app/navigator/circles-content/page.tsx
// G5.6 — Navigator console for managing cultural circle content feeds

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import NavigatorContentPanel from '@/components/circles/NavigatorContentPanel'

export default async function NavigatorCirclesContentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) redirect('/dashboard')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  const { data: circles } = await admin
    .from('cultural_circles')
    .select('id, circle_name, community_type')
    .eq('is_active', true)
    .order('circle_name')

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Circle Content Feed</h1>
        <p className="text-gray-500 mt-1">
          Post articles, videos, recipes, and spotlights to community circle feeds.
        </p>
      </div>
      <NavigatorContentPanel circles={circles ?? []} />
    </div>
  )
}
