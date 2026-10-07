import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ circleId: string }>
}

export default async function CircleMembersPage({ params }: Props) {
  const { circleId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: circle } = await supabase
    .from('cultural_circles')
    .select('id, circle_name, description')
    .eq('id', circleId)
    .maybeSingle()

  if (!circle) redirect('/dashboard/cultural-circles')

  const { data: memberships } = await supabase
    .from('circle_memberships')
    .select('id, is_ambassador, joined_at, member:members(id, preferred_name, full_name)')
    .eq('circle_id', circleId)
    .order('joined_at', { ascending: true })

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link href="/dashboard/cultural-circles" className="text-sm text-indigo-600 hover:underline mb-4 block">
        ← Back to circles
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{circle.circle_name}</h1>
      {circle.description && (
        <p className="text-gray-500 mb-6">{circle.description}</p>
      )}
      <h2 className="text-lg font-semibold text-gray-700 mb-3">
        Members ({memberships?.length ?? 0})
      </h2>
      <ul className="divide-y divide-gray-100 bg-white rounded-xl shadow-sm border border-gray-200">
        {memberships?.length ? memberships.map((m) => {
          const member = m.member as any
          const name = member?.preferred_name || member?.full_name || 'Unknown'
          return (
            <li key={m.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-gray-800 font-medium">{name}</span>
              {m.is_ambassador && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  Ambassador
                </span>
              )}
            </li>
          )
        }) : (
          <li className="px-4 py-6 text-center text-gray-400">No members yet</li>
        )}
      </ul>
    </div>
  )
}
