'use client'
import { useState } from 'react'
import { useToast } from '@/components/ui/Toast'

export function CallRequestPanel({ preferredName }: { preferredName: string }) {
  const { push: showToast } = useToast()
  const [loadingNow, setLoadingNow] = useState(false)
  const [loadingSched, setLoadingSched] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [schedTime, setSchedTime] = useState('')
  const [notes, setNotes] = useState('')

  async function handleCallNow() {
    setLoadingNow(true)
    try {
      const res = await fetch('/api/member/request-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediate: true }),
      })
      if (res.ok) {
        showToast({ title: 'We\'ll call you in the next few minutes!', severity: 'success' })
      } else {
        const data = await res.json().catch(() => ({}))
        showToast({ title: data.error ?? 'Could not send your request. Please try again.', severity: 'urgent' })
      }
    } catch {
      showToast({ title: 'Could not reach the server. Please try again.', severity: 'urgent' })
    } finally {
      setLoadingNow(false)
    }
  }

  async function handleSchedule() {
    setLoadingSched(true)
    try {
      const res = await fetch('/api/member/request-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          immediate: false,
          preferred_time: schedTime || undefined,
          notes: notes || undefined,
        }),
      })
      if (res.ok) {
        showToast({ title: 'Your call request has been saved — we\'ll be in touch!', severity: 'success' })
        setScheduleOpen(false)
        setSchedTime('')
        setNotes('')
      } else {
        const data = await res.json().catch(() => ({}))
        showToast({ title: data.error ?? 'Could not send your request. Please try again.', severity: 'urgent' })
      }
    } catch {
      showToast({ title: 'Could not reach the server. Please try again.', severity: 'urgent' })
    } finally {
      setLoadingSched(false)
    }
  }

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        border: '1.5px solid var(--color-warm-grey)',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 4px' }}>
          Want to talk now?
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-muted)', margin: 0 }}>
          Request a call from Aria or your care team any time.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleCallNow}
          disabled={loadingNow}
          style={{
            padding: '12px 24px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor: 'var(--color-teal)',
            color: 'white',
            fontSize: '17px',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            cursor: loadingNow ? 'not-allowed' : 'pointer',
            opacity: loadingNow ? 0.7 : 1,
            minHeight: '48px',
            transition: 'opacity 0.2s',
          }}
        >
          {loadingNow ? 'Requesting…' : '📞 Call me now'}
        </button>

        <button
          type="button"
          onClick={() => setScheduleOpen((o) => !o)}
          style={{
            padding: '12px 24px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--color-teal)',
            backgroundColor: 'white',
            color: 'var(--color-teal)',
            fontSize: '17px',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: '48px',
            transition: 'background-color 0.2s',
          }}
        >
          🗓 Schedule a call
        </button>
      </div>

      {scheduleOpen && (
        <div
          style={{
            borderTop: '1px solid var(--color-warm-grey)',
            paddingTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div>
            <label
              htmlFor="sched-time"
              style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}
            >
              Preferred time <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(optional)</span>
            </label>
            <input
              id="sched-time"
              type="datetime-local"
              value={schedTime}
              onChange={(e) => setSchedTime(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '320px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--color-warm-grey)',
                fontSize: '16px',
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="sched-notes"
              style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}
            >
              Anything you&apos;d like to discuss? <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(optional)</span>
            </label>
            <textarea
              id="sched-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. I'd like help with a prescription question."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--color-warm-grey)',
                fontSize: '16px',
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-primary)',
                outline: 'none',
                resize: 'vertical',
                minHeight: '72px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleSchedule}
              disabled={loadingSched}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: 'var(--color-navy)',
                color: 'white',
                fontSize: '16px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                cursor: loadingSched ? 'not-allowed' : 'pointer',
                opacity: loadingSched ? 0.7 : 1,
                minHeight: '44px',
              }}
            >
              {loadingSched ? 'Saving…' : 'Request this call'}
            </button>
            <button
              type="button"
              onClick={() => setScheduleOpen(false)}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--color-warm-grey)',
                backgroundColor: 'white',
                color: 'var(--color-text-muted)',
                fontSize: '16px',
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                minHeight: '44px',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
