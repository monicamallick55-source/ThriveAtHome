'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  recipientId: string
  recipientName: string
}

export default function SendMessageButton({ recipientId, recipientName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend() {
    if (!body.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recipientId, body: body.trim() }),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) { setError(json.error ?? 'Failed to send'); return }
      setSent(true)
      setTimeout(() => {
        setOpen(false)
        setSent(false)
        setBody('')
        router.push('/dashboard/messages')
      }, 1200)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          backgroundColor: 'transparent',
          color: 'var(--color-teal)',
          border: '1px solid var(--color-teal)',
          borderRadius: '8px', padding: '8px 16px',
          fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
          cursor: 'pointer',
        }}>
        ✉ Message
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }} onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '16px', padding: '28px 24px',
            width: '100%', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: '0 0 6px' }}>
              Message {recipientName}
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 16px' }}>
              Your message will go to their inbox.
            </p>
            {sent ? (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-teal)', fontWeight: 600, textAlign: 'center', padding: '12px 0' }}>✓ Sent! Taking you to Messages…</p>
            ) : (
              <>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder={`Write a message to ${recipientName}…`}
                  maxLength={2000}
                  rows={4}
                  autoFocus
                  style={{
                    width: '100%', resize: 'vertical', borderRadius: '10px',
                    border: '1px solid var(--color-border)', padding: '10px 12px',
                    fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: 1.4,
                    boxSizing: 'border-box', marginBottom: '12px',
                  }}
                />
                {error && <p style={{ color: '#c0392b', fontFamily: 'var(--font-body)', fontSize: '13px', marginBottom: '8px' }}>{error}</p>}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setOpen(false)} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px 18px', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Cancel</button>
                  <button onClick={handleSend} disabled={sending || !body.trim()} style={{ backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 22px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: sending || !body.trim() ? 'not-allowed' : 'pointer', opacity: sending || !body.trim() ? 0.6 : 1 }}>
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
