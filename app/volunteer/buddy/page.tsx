import { createClient } from '@/lib/supabase/server'
import { getBuddyAssignments } from '@/lib/data/buddies'
import { redirect } from 'next/navigation'
import BuddyAssignmentCard from './_components/BuddyAssignmentCard'

export default async function BuddyPortalPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: volunteer } = await (supabase as any).from('volunteers').select('id,first_name,buddy_capacity,buddy_active_count').eq('supabase_auth_id', user.id).single()
  if (!volunteer) redirect('/volunteer/dashboard')
  const { data: assignments } = await getBuddyAssignments(volunteer.id)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Buddies</h1>
          <p className="text-gray-500 text-sm mt-1">Your assigned seniors — the people counting on your weekly call</p>
        </div>
        <div className="text-right text-sm">
          <div className="font-semibold text-[#1B3A6B]">{volunteer.buddy_active_count} active</div>
          <div className="text-gray-400">of {volunteer.buddy_capacity} max</div>
        </div>
      </div>
      {assignments && assignments.length > 0 ? (
        <div className="space-y-4">{assignments.map(a => <BuddyAssignmentCard key={a.id} assignment={a} volunteerId={volunteer.id} />)}</div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🤝</div>
          <p className="font-medium text-gray-600">No buddy assignments yet</p>
          <p className="text-sm mt-1">Your coordinator will assign seniors to you once you're matched.</p>
        </div>
      )}
      <div className="mt-8 p-5 bg-blue-50 border border-blue-100 rounded-2xl text-sm text-blue-800">
        <p className="font-semibold mb-1">Your role as a buddy 🌟</p>
        <p>Your job is the relationship — not to solve problems or give advice. If you hear something concerning, log it and let the navigator know. They handle the response. You handle the friendship.</p>
      </div>
    </div>
  )
}
