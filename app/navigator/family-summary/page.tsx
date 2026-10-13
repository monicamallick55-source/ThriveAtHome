// app/navigator/family-summary/page.tsx
// G5.8 — Navigator: preview + manual trigger for family daily summary

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FamilySummaryPanel from '@/components/family/FamilySummaryPanel'

export default async function FamilySummaryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) redirect('/dashboard')

  // Get member list for picker
  const { data: members } = await supabase
    .from('members')
    .select('id, full_name, preferred_name')
    .eq('status', 'active')
    .order('full_name')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Family Daily Summary</h1>
        <p className="text-gray-500 mt-1">
          Preview and manually trigger daily SMS updates to family contacts.
        </p>
      </div>
      <FamilySummaryPanel members={members ?? []} />
    </div>
  )
}
