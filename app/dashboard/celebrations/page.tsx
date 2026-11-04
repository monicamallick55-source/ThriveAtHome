import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FamilyCalendarTab from '@/components/celebrations/FamilyCalendarTab'
import GiftSendingTab from '@/components/celebrations/GiftSendingTab'

export default async function CelebrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await (supabase as any)
    .from('members')
    .select('id, first_name, plan_tier, plan')
    .eq('supabase_auth_id', user.id)
    .maybeSingle()

  const params = await searchParams
  const activeTab = params.tab ?? 'calendar'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
        Celebrations & Events
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Keep track of family dates and send thoughtful gifts
      </p>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
        {[
          { id: 'calendar', label: '📅 Family Calendar' },
          { id: 'gifts', label: '🎁 Send a Gift' },
        ].map(tab => (
          <a
            key={tab.id}
            href={`/dashboard/celebrations?tab=${tab.id}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {activeTab === 'calendar' && member && (
        <FamilyCalendarTab memberId={member.id} memberName={member.first_name} />
      )}
      {activeTab === 'gifts' && member && (
        <GiftSendingTab memberId={member.id} memberName={member.first_name} />
      )}
    </div>
  )
}