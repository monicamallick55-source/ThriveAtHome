'use client'
// FamilyChat — real-time family messaging for all members linked to a senior.
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { SectionError } from './SectionError'
import type { FamilyMessage } from '@/lib/data/messages'

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}

function formatDay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export interface FamilyChatProps {
  memberId: string
  familyMemberId: string
  initialMessages: FamilyMessage[]
  error: string | null
}

export function FamilyChat({
  memberId,
  familyMemberId,
  initialMessages,
  error,
}: FamilyChatProps) {
  const [messages, setMessages] = useState<FamilyMessage[]>(initialMessages)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime: subscribe to INSERT on family_messages for this member
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${memberId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'family_messages',
          filter: `member_id=eq.${memberId}`,
        },
        (payload) => {
          const newMsg = payload.new as FamilyMessage
          setMessages((prev) =>
            prev.some((m: any) => m.id === newMsg.id) ? prev : [...prev, newMsg]
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [memberId])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    setSendError(null)

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, body: body.trim() }),
    })

    const json = await res.json()
    if (!res.ok) {
      setSendError(json.error ?? 'Failed to send message.')
    } else {
      // Optimistically append — Realtime will deduplicate
      setMessages((prev) => {
        const newMsg = json.message as FamilyMessage
        return prev.some((m: any) => m.id === newMsg.id) ? prev : [...prev, newMsg]
      })
      setBody('')
    }
    setSending(false)
  }

  if (error) return <SectionError message={error} />

  // Group messages by day for date separators
  const grouped: { day: string; msgs: FamilyMessage[] }[] = []
  for (const msg of messages) {
    const day = formatDay(msg.created_at)
    const last = grouped[grouped.length - 1]
    if (last && last.day === day) {
      last.msgs.push(msg)
    } else {
      grouped.push({ day, msgs: [msg] })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Message list */}
      <div
        className="max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4"
        aria-label="Family messages"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <p className="text-gray-500 text-lg text-center py-4">
            No messages yet. Start the conversation below.
          </p>
        )}
        {grouped.map(({ day, msgs }) => (
          <div key={day}>
            <div className="text-center text-sm text-gray-400 my-2">{day}</div>
            <div className="space-y-2">
              {msgs.map((msg: any) => {
                const isOwn = msg.sender_id === familyMemberId
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs sm:max-w-sm rounded-2xl px-4 py-3 ${
                        isOwn
                          ? 'bg-brand-navy text-white rounded-br-sm'
                          : 'bg-white border border-gray-200 text-brand-navy rounded-bl-sm'
                      }`}
                    >
                      <p className="text-base leading-snug">{msg.body}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwn ? 'text-blue-200' : 'text-gray-400'
                        } text-right`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* Send form */}
      <form onSubmit={handleSend} className="flex flex-col gap-2" aria-label="Send message">
        <Textarea
          label="Your message"
          id="message-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message to your family group…"
          rows={3}
          error={sendError ?? undefined}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              handleSend(e as unknown as React.FormEvent)
            }
          }}
        />
        <Button
          type="submit"
          variant="primary"
          loading={sending}
          disabled={!body.trim()}
          className="self-end min-h-[52px]"
        >
          Send
        </Button>
      </form>
    </div>
  )
}
