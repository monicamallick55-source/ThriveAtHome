'use client'

import { useState } from 'react'

interface MemberStub { id: string; preferred_name: string | null; full_name: string | null }
interface Connection {
  id: string
  created_at: string
  requester_id: string
  addressee_id: string
  status: string
  intro_note: string | null
  requester: MemberStub
  addressee: MemberStub
}
interface Message {
  id: string
  created_at: string
  sender_id: string
  body: string
  read_at: string | null
  flagged: boolean
}

function displayName(m: MemberStub | null): string {
  if (!m) return 'Member'
  return m.preferred_name ?? m.full_name?.split(' ')[0] ?? 'Member'
}

export default function FriendsClient({ memberId, initialConnections }: {
  memberId: string
  initialConnections: Connection[]
}) {
  const [connections, setConnections] = useState<Connection[]>(initialConnections)
  const [activeConnId, setActiveConnId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [msgLoading, setMsgLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [tab, setTab] = useState<'friends' | 'requests'>('friends')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const friends = connections.filter(c => c.status === 'accepted')
  const incoming = connections.filter(c => c.status === 'pending' && c.addressee_id === memberId)
  const outgoing = connections.filter(c => c.status === 'pending' && c.requester_id === memberId)

  const openThread = async (connId: string) => {
    setActiveConnId(connId)
    setMsgLoading(true)
    try {
      const res = await fetch(`/api/connections/${connId}/messages`)
      if (res.ok) setMessages(await res.json())
      await fetch(`/api/connections/${connId}/read`, { method: 'POST' })
    } finally { setMsgLoading(false) }
  }

  const sendMessage = async () => {
    if (!draft.trim() || !activeConnId) return
    setSending(true)
    try {
      const res = await fetch(`/api/connections/${activeConnId}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft.trim() }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages(prev => [...prev, msg])
        setDraft('')
        if (msg.flagged) showToast('Message sent. Our team reviews flagged messages for your safety.')
      }
    } finally { setSending(false) }
  }

  const respondToRequest = async (connId: string, status: 'accepted' | 'declined') => {
    const res = await fetch(`/api/connections/${connId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setConnections(prev => prev.map(c => c.id === connId ? { ...c, ...updated } : c))
      showToast(status === 'accepted' ? 'Friend request accepted!' : 'Request declined.')
    }
  }

  const activeConn = connections.find(c => c.id === activeConnId)
  const otherMember = activeConn
    ? (activeConn.requester_id === memberId ? activeConn.addressee : activeConn.requester)
    : null

  return (
    <div style={{ flex: 1, padding: '32px 24px', fontFamily: 'var(--font-body)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {toast && (
          <div style={{
            position: 'fixed', bottom: '24px', right: '24px',
            backgroundColor: 'var(--color-navy)', color: 'white',
            padding: '12px 20px', borderRadius: '12px', fontSize: '15px',
            zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}>{toast}</div>
        )}

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 24px' }}>Friends</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {(['friends', 'requests'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: '20px', fontSize: '15px', fontWeight: 500,
              cursor: 'pointer', border: 'none',
              backgroundColor: tab === t ? 'var(--color-navy)' : '#f0f0f0',
              color: tab === t ? 'white' : 'var(--color-text-primary)',
            }}>
              {t === 'friends' ? `Friends (${friends.length})` : `Requests (${incoming.length})`}
            </button>
          ))}
        </div>

        {tab === 'requests' && (
          <div>
            {incoming.length === 0 && outgoing.length === 0 && (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '16px' }}>No pending requests.</p>
            )}
            {incoming.length > 0 && (
              <>
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>Incoming</h2>
                {incoming.map(c => (
                  <div key={c.id} style={{ backgroundColor: 'white', borderRadius: '14px', padding: '20px', marginBottom: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                    <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 6px' }}>{displayName(c.requester)}</p>
                    {c.intro_note && <p style={{ fontSize: '15px', color: 'var(--color-text-primary)', margin: '0 0 14px', fontStyle: 'italic' }}>&ldquo;{c.intro_note}&rdquo;</p>}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => respondToRequest(c.id, 'accepted')} style={{
                        padding: '8px 20px', borderRadius: '10px', fontSize: '15px', fontWeight: 500,
                        cursor: 'pointer', border: 'none', backgroundColor: 'var(--color-navy)', color: 'white',
                      }}>Accept</button>
                      <button onClick={() => respondToRequest(c.id, 'declined')} style={{
                        padding: '8px 20px', borderRadius: '10px', fontSize: '15px', fontWeight: 500,
                        cursor: 'pointer', border: '1px solid #ddd', backgroundColor: 'white', color: 'var(--color-text-primary)',
                      }}>Decline</button>
                    </div>
                  </div>
                ))}
              </>
            )}
            {outgoing.length > 0 && (
              <>
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '16px 0 12px' }}>Sent</h2>
                {outgoing.map(c => (
                  <div key={c.id} style={{ backgroundColor: 'white', borderRadius: '14px', padding: '16px 20px', marginBottom: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                    <p style={{ fontSize: '16px', color: 'var(--color-navy)', margin: 0 }}>
                      Request sent to <strong>{displayName(c.addressee)}</strong> — waiting for response
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {tab === 'friends' && !activeConnId && (
          <div>
            {friends.length === 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '32px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                <p style={{ fontSize: '17px', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>No friends yet.</p>
                <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0 }}>Visit a circle and tap &ldquo;Add friend&rdquo; on a member to get started.</p>
              </div>
            )}
            {friends.map(c => {
              const other = c.requester_id === memberId ? c.addressee : c.requester
              return (
                <div key={c.id} onClick={() => openThread(c.id)} style={{
                  backgroundColor: 'white', borderRadius: '14px', padding: '18px 20px', marginBottom: '12px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>{displayName(other)}</p>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Message →</span>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'friends' && activeConnId && (
          <div>
            <button onClick={() => setActiveConnId(null)} style={{
              marginBottom: '16px', padding: '8px 16px', borderRadius: '10px', fontSize: '14px',
              cursor: 'pointer', border: '1px solid #ddd', backgroundColor: 'white', color: 'var(--color-text-primary)',
            }}>← Back to friends</button>

            <div style={{ backgroundColor: 'white', borderRadius: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
                  {displayName(otherMember ?? null)}
                </h2>
              </div>

              <div style={{ padding: '20px', minHeight: '300px', maxHeight: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {msgLoading && <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>Loading…</p>}
                {!msgLoading && messages.length === 0 && (
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>No messages yet. Say hello!</p>
                )}
                {messages.map(m => {
                  const mine = m.sender_id === memberId
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '70%', padding: '12px 16px', borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        backgroundColor: mine ? 'var(--color-navy)' : '#f4f4f4',
                        color: mine ? 'white' : 'var(--color-text-primary)',
                        fontSize: '18px', lineHeight: 1.5,
                      }}>
                        {m.body}
                        {m.flagged && <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>⚠️ Under review</div>}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ padding: '16px 20px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '12px' }}>
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Write a message… (Enter to send)"
                  rows={2}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #ddd',
                    fontSize: '18px', fontFamily: 'var(--font-body)', resize: 'none', lineHeight: 1.5,
                  }}
                />
                <button onClick={sendMessage} disabled={sending || !draft.trim()} style={{
                  padding: '10px 20px', borderRadius: '10px', fontSize: '16px', fontWeight: 500,
                  cursor: (sending || !draft.trim()) ? 'not-allowed' : 'pointer',
                  border: 'none', backgroundColor: 'var(--color-navy)', color: 'white',
                  opacity: (sending || !draft.trim()) ? 0.5 : 1, alignSelf: 'flex-end',
                }}>Send</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
