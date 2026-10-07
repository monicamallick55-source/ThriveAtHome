import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import { createClient } from '@/lib/supabase/server'
import FriendsClient from '@/components/dashboard/FriendsClient'

export default async function FriendsPage() {
  const user = await requireAuth()
  const { data: member } = await getMemberForAuthUser(user.id)
  if (!member) redirect('/dashboard')

  const supabase = await createClient()
  const { data: connections } = await (supabase.from as any)('member_connections')
    .select('*, requester:members!requester_id(id,preferred_name,full_name), addressee:members!addressee_id(id,preferred_name,full_name)')
    .or(`requester_id.eq.${member.id},addressee_id.eq.${member.id}`)
    .order('created_at', { ascending: false })

  return (
    <FriendsClient
      memberId={member.id}
      initialConnections={connections ?? []}
    />
  )
}
