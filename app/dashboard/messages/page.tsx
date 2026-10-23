import { requireAuth } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { getConversations } from '@/lib/data/member-messages'
import MessagesClient from '@/components/messages/MessagesClient'

export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  const user = await requireAuth()
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  const memberId = fm?.member_id ?? null

  const { data: conversations } = memberId
    ? await getConversations(memberId)
    : { data: [] }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500,
        color: 'var(--color-navy)', margin: '0 0 8px',
      }}>Messages</h1>
      <p style={{
        fontFamily: 'var(--font-body)', fontSize: '16px',
        color: 'var(--color-text-secondary)', margin: '0 0 32px',
      }}>
        Send a private message to another member of your community.
      </p>
      <MessagesClient
        initialConversations={conversations ?? []}
        currentMemberId={memberId ?? ''}
      />
    </div>
  )
}
