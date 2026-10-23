'use client'

import { useState, useRef, useEffect } from 'react'
import type { ConversationSummary } from '@/lib/data/member-messages'

interface MessageRow {
  id: string
  sender_id: string
  recipient_id: string
  conversation_key: string
  body: string
  read_at: string | null
  created_at: string
  sender_name: string
  sender_avatar: string | null
}

interface Props {
  initialConversations: ConversationSummary[]
  currentMemberId: string
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function Avatar({ name, url, size = 40 }: { name: string; url: string | null; size?: number }) {
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  if (url) {
    return (
      <img src={url} alt={name} style={{
        width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
      }} />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', backgroundColor: 'var(--color-teal)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, color: 'white', fontWeight: 700,
      fontSize: size > 36 ? '16px' : '13px', fontFamily: 'var(--font-body)',
    }}>
      {initials}
    </div>
  )
}

export default function MessagesClient({ initialConversations, currentMemberId }: Props) {
  const [conversations, setConversations] = useState<ConversationSummary[]>(initialConversations)
  const [activeKey, setActiveKey] = useState<string | null>(
    initialConversations[0]?.conversation_key ?? null
  )
  const [thread, setThread] = useState<MessageRow[]>([])
  const [threadLoading, setThreadLoading] = useState(false)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [newRecipientId, setNewRecipientId] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load thread when active conversation changes
  useEffect(() => {
    if (!activeKey) return
    setThreadLoading(true)
    setSendError(null)
    fetch(`/api/messages/thread?key=${encodeURIComponent(activeKey)}`, { credentials: 'include' })
      .then(r => r.json())
      .then((json: { messages?: MessageRow[] }) => {
        setThread(json.messages ?? [])
        // Mark as read — update local unread count
        setConversations(prev => prev.map(c =>
          c.conversation_key === activeKey ? { ...c, unread_count: 0 } : c
        ))
      })
      .catch(() => {})
      .finally(() => setThreadLoading(false))
  }, [activeKey])

  // Scroll to bottom when thread loads or new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  const activeConvo = conversations.find(c => c.conversation_key === activeKey)

  async function handleSend() {
    if (!body.trim() || !activeConvo) return
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recipientId: activeConvo.other_member_id, body: body.trim() }),
      })
      const json = await res.json() as { message?: MessageRow; error?: string }
      if (!res.ok) { setSendError(json.error ?? 'Failed to send'); return }
      if (json.message) {
        setThread(prev => [...prev, {
          ...json.message!,
          sender_name: 'You',
          sender_avatar: null,
        }])
        setConversations(prev => prev.map(c =>
          c.conversation_key === activeKey
            ? { ...c, last_message: body.trim(), last_message_at: new Date().toISOString() }
            : c
        ))
        setBody('')
      }
    } finally {
      setSending(false)
    }
  }

  async function handleStartNew() {
    if (!newRecipientId.trim() || !currentMemberId) return
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recipientId: newRecipientId.trim(), body: body.trim() || '👋 Hello!' }),
      })
      const json = await res.json() as { message?: MessageRow; error?: string }
      if (!res.ok) { setSendError(json.error ?? 'Failed'); return }
      if (json.message) {
        const key = json.message.conversation_key
        setActiveKey(key)
        setShowNew(false)
        setNewRecipientId('')
        setBody('')
        // Refresh conversations
        const cr = await fetch('/api/messages/conversations', { credentials: 'include' })
        const cj = await cr.json() as { conversations?: ConversationSummary[] }
        setConversations(cj.conversations ?? [])
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '0', border: '1px solid var(--color-border)', borderRadius: '16px', overflow: 'hidden', height: '560px', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>

      {/* Sidebar */}
      <div style={{ width: '240px', flexShrink: 0, borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)' }}>Conversations</span>
          <button
            onClick={() => setShowNew(!showNew)}
            title="New message"
            style={{ background: 'var(--color-teal)', border: 'none', borderRadius: '6px', color: 'white', width: '28px', height: '28px', cursor: 'pointer', fontSize: '18px', lineHeight: '28px', textAlign: 'center' }}>+</button>
        </div>

        {showNew && (
          <div style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', backgroundColor: '#f8fffe' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>Enter member ID to start a conversation:</p>
            <input
              placeholder="Member ID"
              value={newRecipientId}
              onChange={e => setNewRecipientId(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--color-border)', fontFamily: 'var(--font-body)', fontSize: '13px', boxSizing: 'border-box', marginBottom: '6px' }}
            />
            <input
              placeholder="First message (optional)"
              value={body}
              onChange={e => setBody(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--color-border)', fontFamily: 'var(--font-body)', fontSize: '13px', boxSizing: 'border-box', marginBottom: '8px' }}
            />
            <button onClick={handleStartNew} disabled={sending || !newRecipientId.trim()} style={{ backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: sending ? 0.6 : 1 }}>
              {sending ? 'Starting…' : 'Start chat'}
            </button>
          </div>
        )}

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {conversations.length === 0 && (
            <p style={{ padding: '20px 16px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>No conversations yet</p>
          )}
          {conversations.map(c => (
            <button
              key={c.conversation_key}
              onClick={() => setActiveKey(c.conversation_key)}
              style={{
                width: '100%', padding: '12px 16px', border: 'none', textAlign: 'left',
                backgroundColor: activeKey === c.conversation_key ? 'rgba(26,122,106,0.08)' : 'transparent',
                borderLeft: activeKey === c.conversation_key ? '3px solid var(--color-teal)' : '3px solid transparent',
                cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'flex-start',
              }}>
              <Avatar name={c.other_member_name} url={c.other_member_avatar} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)' }}>
                    {c.other_member_name}
                  </span>
                  {c.unread_count > 0 && (
                    <span style={{ backgroundColor: 'var(--color-teal)', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-body)' }}>{c.unread_count}</span>
                  )}
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.last_message}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>{timeAgo(c.last_message_at)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Thread */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {activeConvo ? (
          <>
            {/* Header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar name={activeConvo.other_member_name} url={activeConvo.other_member_avatar} size={38} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--color-navy)', fontWeight: 500 }}>{activeConvo.other_member_name}</span>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {threadLoading && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>Loading…</p>
              )}
              {!threadLoading && thread.map(msg => {
                const isMe = msg.sender_id === currentMemberId
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: '8px', alignItems: 'flex-end' }}>
                    {!isMe && <Avatar name={msg.sender_name} url={msg.sender_avatar} size={30} />}
                    <div style={{
                      maxWidth: '68%',
                      backgroundColor: isMe ? 'var(--color-teal)' : '#f2f4f6',
                      color: isMe ? 'white' : 'var(--color-text-primary)',
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '10px 14px',
                    }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', margin: 0, lineHeight: 1.4 }}>{msg.body}</p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', margin: '4px 0 0', opacity: 0.7 }}>{timeAgo(msg.created_at)}</p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Compose */}
            <div style={{ padding: '14px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Write a message… (Enter to send)"
                maxLength={2000}
                rows={2}
                style={{
                  flex: 1, resize: 'none', borderRadius: '10px', border: '1px solid var(--color-border)',
                  padding: '10px 12px', fontFamily: 'var(--font-body)', fontSize: '15px',
                  lineHeight: 1.4,
                }}
              />
              <button
                onClick={handleSend}
                disabled={sending || !body.trim()}
                style={{
                  backgroundColor: 'var(--color-teal)', color: 'white', border: 'none',
                  borderRadius: '10px', padding: '10px 18px', fontFamily: 'var(--font-body)',
                  fontSize: '15px', fontWeight: 600, cursor: sending || !body.trim() ? 'not-allowed' : 'pointer',
                  opacity: sending || !body.trim() ? 0.5 : 1, minHeight: '44px', minWidth: '70px',
                }}>
                {sending ? '…' : 'Send'}
              </button>
            </div>
            {sendError && <p style={{ padding: '0 16px 10px', fontFamily: 'var(--font-body)', fontSize: '13px', color: '#c0392b' }}>{sendError}</p>}
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', margin: '0 0 8px' }}>No conversation selected</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)' }}>Choose one from the left, or tap + to start new.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
