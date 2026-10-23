// Member-to-member direct messaging — server-side only, uses admin client.
// Separate from lib/data/messages.ts (family messages / Aria call history).
import { createAdminClient } from '../supabase/admin'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MessageRow {
  id: string
  sender_id: string
  recipient_id: string
  conversation_key: string
  body: string
  sent_at: string
  read_at: string | null
}

export interface ConversationSummary {
  conversation_key: string
  other_member_id: string
  other_member_name: string
  other_member_avatar: string | null
  last_message: string
  last_message_at: string
  unread_count: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeConversationKey(a: string, b: string): string {
  return [a, b].sort().join(':')
}

// ─── Data functions ───────────────────────────────────────────────────────────

/** List all conversations for a member, most recent first. */
export async function getConversations(
  memberId: string
): Promise<{ data: ConversationSummary[]; error: string | null }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    // Get all messages where member is sender or recipient
    const { data: messages, error } = await db
      .from('member_messages')
      .select('*')
      .or(`sender_id.eq.${memberId},recipient_id.eq.${memberId}`)
      .order('sent_at', { ascending: false })

    if (error) return { data: [], error: error.message }
    if (!messages?.length) return { data: [], error: null }

    // Group by conversation_key — keep only the latest message per thread
    const threads = new Map<string, MessageRow>()
    for (const msg of messages as MessageRow[]) {
      if (!threads.has(msg.conversation_key)) {
        threads.set(msg.conversation_key, msg)
      }
    }

    // Count unread per thread
    const unreadCounts = new Map<string, number>()
    for (const msg of messages as MessageRow[]) {
      if (msg.recipient_id === memberId && !msg.read_at) {
        unreadCounts.set(
          msg.conversation_key,
          (unreadCounts.get(msg.conversation_key) ?? 0) + 1
        )
      }
    }

    // Collect the other member IDs
    const otherIds = [...threads.values()].map((m) =>
      m.sender_id === memberId ? m.recipient_id : m.sender_id
    )

    // Fetch member display info
    const { data: members } = await db
      .from('members')
      .select('id, first_name, last_name, avatar_url')
      .in('id', otherIds)

    const memberMap = new Map<string, { first_name: string; last_name: string; avatar_url: string | null }>(
      (members ?? []).map((m: { id: string; first_name: string; last_name: string; avatar_url: string | null }) => [m.id, m])
    )

    const summaries: ConversationSummary[] = [...threads.values()].map((msg) => {
      const otherId = msg.sender_id === memberId ? msg.recipient_id : msg.sender_id
      const other = memberMap.get(otherId)
      return {
        conversation_key: msg.conversation_key,
        other_member_id: otherId,
        other_member_name: other
          ? `${other.first_name} ${other.last_name}`.trim()
          : 'Unknown Member',
        other_member_avatar: other?.avatar_url ?? null,
        last_message: msg.body,
        last_message_at: msg.sent_at,
        unread_count: unreadCounts.get(msg.conversation_key) ?? 0,
      }
    })

    return { data: summaries, error: null }
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : String(e) }
  }
}

/** Fetch all messages in a thread, oldest first. Marks unread messages as read. */
export async function getThread(
  memberId: string,
  conversationKey: string
): Promise<{ data: MessageRow[]; error: string | null }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    const { data, error } = await db
      .from('member_messages')
      .select('*')
      .eq('conversation_key', conversationKey)
      .order('sent_at', { ascending: true })

    if (error) return { data: [], error: error.message }

    // Mark unread messages as read
    const unreadIds = (data as MessageRow[])
      .filter((m) => m.recipient_id === memberId && !m.read_at)
      .map((m) => m.id)

    if (unreadIds.length > 0) {
      await db
        .from('member_messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds)
    }

    return { data: (data ?? []) as MessageRow[], error: null }
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : String(e) }
  }
}

/** Send a message from one member to another. */
export async function sendMessage(
  senderId: string,
  recipientId: string,
  body: string
): Promise<{ data: MessageRow | null; error: string | null }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    const conversationKey = makeConversationKey(senderId, recipientId)

    const { data, error } = await db
      .from('member_messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        conversation_key: conversationKey,
        body: body.trim(),
      })
      .select('*')
      .maybeSingle()

    if (error) return { data: null, error: error.message }
    return { data: data as MessageRow, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Get count of unread messages for a member (for nav badge). */
export async function getUnreadCount(
  memberId: string
): Promise<{ count: number; error: string | null }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    const { count, error } = await db
      .from('member_messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', memberId)
      .is('read_at', null)

    if (error) return { count: 0, error: error.message }
    return { count: count ?? 0, error: null }
  } catch (e) {
    return { count: 0, error: e instanceof Error ? e.message : String(e) }
  }
}
