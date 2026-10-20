'use client'
// components/circles/CircleDetailClient.tsx
// Circle detail page — posts feed with inline comments, reporting, and event proposal.
// G2.1 Comments · G2.2 Reporting · G2.3 Propose-event form (modal stub carried forward)

import { useState, useRef, useOptimistic, useCallback } from 'react'
import type { CirclePostComment } from '@/lib/data/circles'
import CircleContentFeed from '@/components/circles/CircleContentFeed'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Member {
  id: string
  preferred_name: string | null
  full_name: string | null
  role?: string // 'admin' | 'navigator' | 'member' | undefined
}

interface CirclePost {
  id: string
  created_at: string
  circle_id: string
  member_id: string
  content: string
  comment_count: number
  is_hidden: boolean
  members: { preferred_name: string | null; full_name: string | null } | null
}

interface Circle {
  id: string
  name: string
  description: string | null
  member_count: number
}

interface CircleEvent {
  id: string
  title: string
  description: string | null
  event_date: string
  event_time: string | null
  format: string | null
  location_address: string | null
  rsvp_count: number
  video_link: string | null
  dial_in_number: string | null
  dial_in_code: string | null
  user_has_rsvped?: boolean
  is_platform_wide?: boolean | null
}

interface Props {
  circle: Circle
  initialPosts: CirclePost[]
  currentMember?: Member | null
  // Navigation / join state passed from page
  circleIndex?: number
  events?: CircleEvent[]
  isJoined?: boolean
  hasMember?: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function displayName(
  m: { preferred_name: string | null; full_name: string | null } | null | undefined,
): string {
  return m?.preferred_name ?? m?.full_name ?? 'A member'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function isStaff(role?: string) {
  return role === 'admin' || role === 'navigator'
}

// ── Report modal ──────────────────────────────────────────────────────────────

const REPORT_REASONS = [
  { value: 'unkind', label: 'This seems unkind or hurtful' },
  { value: 'spam', label: 'This looks like spam' },
  { value: 'scam_or_fraud', label: 'This looks like a scam' },
  { value: 'private_info', label: 'Private information is being shared' },
  { value: 'worried_about_member', label: "I'm worried about this person" },
  { value: 'other', label: 'Something else' },
] as const

type ReportTarget =
  | { type: 'post'; id: string }
  | { type: 'comment'; id: string }

interface ReportModalProps {
  target: ReportTarget
  onClose: () => void
}

function ReportModal({ target, onClose }: ReportModalProps) {
  const [reason, setReason] = useState<string>('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!reason || submitting) return
    setSubmitting(true)
    setError(null)

    const body =
      target.type === 'post'
        ? { postId: target.id, reason, details: details.trim() || undefined }
        : { commentId: target.id, reason, details: details.trim() || undefined }

    try {
      const res = await fetch('/api/circles/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok || res.status === 409) {
        setDone(true)
      } else {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal
      aria-label="Report content"
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        {done ? (
          <div className="text-center space-y-4 py-4">
            <p className="text-4xl" aria-hidden>🙏</p>
            <p className="text-[18px] text-gray-700 font-semibold">Thank you for letting us know.</p>
            <p className="text-[18px] text-gray-500">
              A care team member will look at this soon.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-brand-teal text-white font-semibold py-3 rounded-xl text-[18px] min-h-[52px]"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-brand-navy">
              Report {target.type === 'post' ? 'post' : 'comment'}
            </h2>
            <p className="text-[18px] text-gray-500">
              What's the concern? Your report is private.
            </p>

            {/* Reason radio list */}
            <fieldset className="space-y-2">
              <legend className="sr-only">Select a reason</legend>
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors
                    ${reason === r.value
                      ? 'border-brand-teal bg-brand-teal/5'
                      : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-brand-teal w-5 h-5 flex-shrink-0"
                  />
                  <span className="text-[18px] text-gray-800">{r.label}</span>
                </label>
              ))}
            </fieldset>

            {/* Optional details */}
            <div className="space-y-1">
              <label htmlFor="report-details" className="text-[17px] text-gray-600 font-medium">
                Additional details (optional, max 500 characters)
              </label>
              <textarea
                id="report-details"
                rows={3}
                maxLength={500}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Tell us more if you'd like…"
                className="w-full border border-gray-200 rounded-lg p-3 text-[18px]
                           focus:outline-none focus:ring-2 focus:ring-brand-teal resize-none"
              />
            </div>

            {error && (
              <p className="text-red-600 text-[18px]" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3
                           rounded-xl text-[18px] min-h-[52px] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reason || submitting}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white
                           font-semibold py-3 rounded-xl text-[18px] min-h-[52px] transition-colors"
              >
                {submitting ? 'Sending…' : 'Submit report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Post "⋯" menu ─────────────────────────────────────────────────────────────

interface ContentMenuProps {
  onReport: () => void
}

function ContentMenu({ onReport }: ContentMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-gray-400 hover:text-gray-600 px-2 py-1 rounded min-h-[48px] min-w-[48px]
                   flex items-center justify-center text-xl transition-colors"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        ⋯
      </button>
      {open && (
        <>
          {/* Backdrop to close */}
          <div
            className="fixed inset-0 z-30"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border
                       border-gray-100 py-1 min-w-[160px] z-40"
          >
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onReport()
              }}
              className="w-full text-left px-4 py-3 text-[18px] text-red-600 hover:bg-red-50
                         transition-colors font-medium"
            >
              🚩 Report
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Comment thread sub-component ──────────────────────────────────────────────

interface CommentThreadProps {
  postId: string
  initialCount: number
  currentMemberId: string | null
}

function CommentThread({ postId, initialCount, currentMemberId }: CommentThreadProps) {
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState<CirclePostComment[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Optimistic list: real list + pending append
  const [optimisticComments, addOptimistic] = useOptimistic<
    CirclePostComment[],
    CirclePostComment
  >(comments, (state, newComment) => [...state, newComment])

  const loadComments = useCallback(async () => {
    if (loaded) return
    setLoading(true)
    try {
      const res = await fetch(`/api/circles/posts/${postId}/comments`)
      if (res.ok) {
        const data = (await res.json()) as CirclePostComment[]
        setComments(data)
        setLoaded(true)
      }
    } finally {
      setLoading(false)
    }
  }, [postId, loaded])

  const toggleOpen = async () => {
    if (!open) await loadComments()
    setOpen((v) => !v)
  }

  const handleSubmit = async () => {
    if (!draft.trim() || submitting || !currentMemberId) return
    setError(null)
    setSubmitting(true)

    // Optimistic placeholder
    const placeholder: CirclePostComment = {
      id: `optimistic-${Date.now()}`,
      created_at: new Date().toISOString(),
      post_id: postId,
      member_id: currentMemberId,
      content: draft.trim(),
      is_hidden: false,
      members: null,
    }
    addOptimistic(placeholder)
    const savedDraft = draft
    setDraft('')

    try {
      const res = await fetch(`/api/circles/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: savedDraft.trim() }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError((body as { error?: string }).error ?? 'Could not add your comment. Please try again.')
        setDraft(savedDraft)
        return
      }

      const created = (await res.json()) as CirclePostComment
      setComments((prev) => {
        const without = prev.filter((c) => !c.id.startsWith('optimistic-'))
        return [...without, created]
      })
      setLoaded(true)
      setCount((n) => n + 1)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete your comment?')) return
    const res = await fetch(`/api/circles/comments/${commentId}`, { method: 'DELETE' })
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      setCount((n) => Math.max(0, n - 1))
    }
  }

  const remaining = 1000 - draft.length

  return (
    <div className="border-t border-gray-100 pt-2">
      {/* Toggle button */}
      <button
        onClick={toggleOpen}
        className="flex items-center gap-1.5 text-gray-500 hover:text-brand-teal transition-colors
                   min-h-[48px] px-1 text-[18px] font-medium"
        aria-expanded={open}
        aria-label={`${count} comment${count !== 1 ? 's' : ''}. Click to ${open ? 'hide' : 'show'} comments.`}
      >
        <span aria-hidden>💬</span>
        <span>{count} {count === 1 ? 'comment' : 'comments'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          {/* Comment list */}
          {loading && (
            <p className="text-gray-400 text-[18px] pl-2">Loading comments…</p>
          )}
          {!loading && optimisticComments.length === 0 && (
            <p className="text-gray-400 text-[18px] pl-2">
              No comments yet. Be the first to reply!
            </p>
          )}

          <ul className="space-y-3" aria-label="Comments">
            {optimisticComments.map((c) => (
              <li key={c.id} className="flex gap-3">
                {/* Avatar initial */}
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-teal/20 flex items-center justify-center
                               text-brand-teal font-semibold text-[15px]"
                  aria-hidden
                >
                  {displayName(c.members).charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold text-brand-navy text-[18px]">
                      {displayName(c.members)}
                    </span>
                    <span className="text-gray-400 text-[15px]">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-gray-700 text-[18px] break-words">{c.content}</p>

                  <div className="flex items-center gap-3 mt-0.5">
                    {/* Delete own comment */}
                    {currentMemberId && c.member_id === currentMemberId && !c.id.startsWith('optimistic-') && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-[15px] text-red-400 hover:text-red-600 transition-colors"
                        aria-label="Delete this comment"
                      >
                        Delete
                      </button>
                    )}
                    {/* Report comment (not own, not optimistic) */}
                    {currentMemberId && c.member_id !== currentMemberId && !c.id.startsWith('optimistic-') && (
                      <button
                        onClick={() => setReportTarget({ type: 'comment', id: c.id })}
                        className="text-[15px] text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Report this comment"
                      >
                        Report
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Reply form */}
          {currentMemberId ? (
            <div className="space-y-2 pt-1">
              <label htmlFor={`reply-${postId}`} className="sr-only">
                Write a reply (max 1 000 characters)
              </label>
              <textarea
                id={`reply-${postId}`}
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a reply…"
                rows={3}
                maxLength={1000}
                className="w-full rounded-lg border border-gray-200 p-3 text-[18px]
                           focus:outline-none focus:ring-2 focus:ring-brand-teal resize-none"
                aria-describedby={`reply-count-${postId}`}
              />
              <div className="flex items-center justify-between gap-2">
                <span
                  id={`reply-count-${postId}`}
                  className={`text-[15px] ${remaining < 50 ? 'text-amber-600' : 'text-gray-400'}`}
                  aria-live="polite"
                >
                  {remaining} characters left
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!draft.trim() || submitting}
                  className="bg-brand-teal hover:bg-brand-teal-light disabled:opacity-50
                             text-white font-semibold px-5 py-2 rounded-lg text-[18px]
                             min-h-[48px] transition-colors"
                >
                  {submitting ? 'Posting…' : 'Reply'}
                </button>
              </div>
              {error && (
                <p className="text-red-600 text-[18px]" role="alert">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-[18px]">Sign in to add a comment.</p>
          )}
        </div>
      )}

      {/* Report modal for comments */}
      {reportTarget && (
        <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} />
      )}
    </div>
  )
}

// ── Propose-event modal (G2.3) ─────────────────────────────────────────────────

function ProposeEventModal({ circleId, onClose }: { circleId: string; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [format, setFormat] = useState<'phone' | 'video' | 'in_person'>('video')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!title.trim() || !date) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/circles/events/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circleId, title, description, date, time, format }),
      })
      if (res.ok) {
        setSuccess(true)
      } else {
        const body = await res.json().catch(() => ({}))
        setError((body as { error?: string }).error ?? 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div
        role="dialog"
        aria-modal
        aria-label="Event proposed"
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-4 shadow-xl">
          <p className="text-5xl" aria-hidden>🎉</p>
          <p className="text-[18px] text-gray-700">
            Thanks! A coordinator will review your event, usually within 2 days.
          </p>
          <button
            onClick={onClose}
            className="bg-brand-teal text-white font-semibold px-6 py-3 rounded-xl text-[18px] min-h-[52px] w-full"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      role="dialog"
      aria-modal
      aria-label="Propose an event"
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-brand-navy">Propose an Event</h2>

        <div className="space-y-1">
          <label htmlFor="event-title" className="font-semibold text-brand-navy text-[18px]">
            Event title *
          </label>
          <input
            id="event-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[18px]
                       focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="event-desc" className="font-semibold text-brand-navy text-[18px]">
            Description
          </label>
          <textarea
            id="event-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[18px]
                       focus:outline-none focus:ring-2 focus:ring-brand-teal resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="event-date" className="font-semibold text-brand-navy text-[18px]">
              Date *
            </label>
            <input
              id="event-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[18px]
                         focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="event-time" className="font-semibold text-brand-navy text-[18px]">
              Time
            </label>
            <input
              id="event-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[18px]
                         focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </div>
        </div>

        <div className="space-y-1">
          <fieldset>
            <legend className="font-semibold text-brand-navy text-[18px] mb-1">Format</legend>
            <div className="flex gap-4">
              {(['phone', 'video', 'in_person'] as const).map((f) => (
                <label key={f} className="flex items-center gap-1.5 text-[18px] cursor-pointer">
                  <input
                    type="radio"
                    name="event-format"
                    value={f}
                    checked={format === f}
                    onChange={() => setFormat(f)}
                    className="accent-brand-teal w-4 h-4"
                  />
                  {f === 'phone' ? 'Phone' : f === 'video' ? 'Video' : 'In person'}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {error && (
          <p className="text-red-600 text-[18px]" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 font-semibold px-4 py-3
                       rounded-xl text-[18px] min-h-[52px] hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !date || submitting}
            className="flex-1 bg-brand-teal text-white font-semibold px-4 py-3
                       rounded-xl text-[18px] min-h-[52px] disabled:opacity-50
                       hover:bg-brand-teal-light transition-colors"
          >
            {submitting ? 'Submitting…' : 'Submit for Review'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Post compose box ──────────────────────────────────────────────────────────

interface PostComposeProps {
  circleId: string
  currentMember: Member
  onPosted: (post: CirclePost) => void
}

function PostCompose({ circleId, currentMember, onPosted }: PostComposeProps) {
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePost = async () => {
    if (!draft.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/circles/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circleId, content: draft.trim() }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError((body as { error?: string }).error ?? 'Could not post. Please try again.')
        return
      }
      const { post } = await res.json() as { post: CirclePost }
      onPosted({ ...post, members: { preferred_name: currentMember.preferred_name, full_name: currentMember.full_name } })
      setDraft('')
    } finally {
      setSubmitting(false)
    }
  }

  const remaining = 2000 - draft.length

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-brand-navy/10 flex items-center justify-center text-brand-navy font-bold text-[17px]" aria-hidden>
          {displayName(currentMember).charAt(0).toUpperCase()}
        </div>
        <span className="font-semibold text-brand-navy text-[18px]">{displayName(currentMember)}</span>
      </div>
      <textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        placeholder={`Share something with ${'’'}your circle…`}
        rows={4}
        maxLength={2000}
        className="w-full border border-gray-200 rounded-xl p-3 text-[18px] focus:outline-none focus:ring-2 focus:ring-brand-teal resize-none"
        aria-label="Write a post"
      />
      <div className="flex items-center justify-between gap-3">
        <span className={`text-[15px] ${remaining < 100 ? 'text-amber-600' : 'text-gray-400'}`}>
          {remaining} characters left
        </span>
        <button
          onClick={handlePost}
          disabled={!draft.trim() || submitting}
          className="bg-brand-teal text-white font-semibold px-6 py-2.5 rounded-xl text-[18px] min-h-[48px] disabled:opacity-50 hover:bg-brand-teal-light transition-colors"
        >
          {submitting ? 'Posting…' : 'Post'}
        </button>
      </div>
      {error && <p className="text-red-600 text-[18px]" role="alert">{error}</p>}
    </div>
  )
}

// ── Events tab ────────────────────────────────────────────────────────────────

function formatEventDate(dateStr: string, timeStr: string | null): string {
  const date = new Date(dateStr + (timeStr ? 'T' + timeStr : ''))
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) +
    (timeStr ? ' at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '')
}

function EventsTab({ events, currentMemberId }: { events: CircleEvent[]; currentMemberId: string | null }) {
  const [rsvpState, setRsvpState] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {}
    events.forEach(e => { if (e.user_has_rsvped) m[e.id] = true })
    return m
  })
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const toggleRsvp = async (eventId: string) => {
    if (!currentMemberId) return
    const going = rsvpState[eventId]
    setLoading(l => ({ ...l, [eventId]: true }))
    try {
      const res = await fetch(`/api/circles/events/${eventId}/rsvp`, {
        method: going ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) setRsvpState(s => ({ ...s, [eventId]: !going }))
    } finally {
      setLoading(l => ({ ...l, [eventId]: false }))
    }
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-4xl" aria-hidden>📅</p>
        <p className="text-gray-500 text-[18px]">No upcoming events yet.</p>
        <p className="text-gray-400 text-[16px]">Use &ldquo;Propose an Event&rdquo; to suggest one!</p>
      </div>
    )
  }

  return (
    <ul className="space-y-4">
      {events.map(event => {
        const going = !!rsvpState[event.id]
        const busy = !!loading[event.id]
        return (
          <li key={event.id} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-1 flex-1 min-w-0">
                <h3 className="font-bold text-brand-navy text-[20px] leading-tight">{event.title}</h3>
                <p className="text-teal-700 font-medium text-[17px]">📅 {formatEventDate(event.event_date, event.event_time)}</p>
                {event.format && (
                  <p className="text-gray-500 text-[16px]">
                    {event.format === 'phone' ? '📞 Phone call' : event.format === 'video' ? '💻 Video call' : '📍 In person'}
                    {event.location_address ? ` · ${event.location_address}` : ''}
                  </p>
                )}
                {event.description && <p className="text-gray-600 text-[17px] leading-relaxed">{event.description}</p>}
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-gray-400 text-[15px]">{event.rsvp_count + (going && !event.user_has_rsvped ? 1 : 0)} going</span>
                {currentMemberId ? (
                  <button
                    onClick={() => toggleRsvp(event.id)}
                    disabled={busy}
                    className={`font-semibold px-5 py-2 rounded-xl text-[17px] min-h-[48px] min-w-[120px] transition-colors disabled:opacity-50 ${
                      going
                        ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                        : 'bg-brand-teal text-white hover:bg-brand-teal-light'
                    }`}
                  >
                    {busy ? '…' : going ? '✓ Going' : 'RSVP'}
                  </button>
                ) : (
                  <span className="text-gray-400 text-[15px]">Sign in to RSVP</span>
                )}
              </div>
            </div>
            {/* Show dial-in/video only after RSVP */}
            {going && (event.dial_in_number || event.video_link) && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-[17px] space-y-1">
                <p className="font-semibold text-teal-800">Your join details</p>
                {event.dial_in_number && <p className="text-teal-700">📞 {event.dial_in_number}{event.dial_in_code ? ` · Code: ${event.dial_in_code}` : ''}</p>}
                {event.video_link && <a href={event.video_link} target="_blank" rel="noreferrer" className="text-teal-700 underline">💻 Join video call</a>}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CircleDetailClient({ circle, initialPosts, currentMember, events = [] }: Props) {
  const [posts, setPosts] = useState<CirclePost[]>(initialPosts)
  const [proposing, setProposing] = useState(false)
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null)
  const [activeTab, setActiveTab] = useState<'posts' | 'events' | 'content'>('posts')

  const staff = isStaff(currentMember?.role)

  const handlePosted = (post: CirclePost) => {
    setPosts(prev => [post, ...prev])
  }

  const TABS = [
    { key: 'posts' as const, label: '💬 Posts' },
    { key: 'events' as const, label: `📅 Events${events.length > 0 ? ` (${events.length})` : ''}` },
    { key: 'content' as const, label: '📚 Content' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Circle header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-brand-navy">{circle.name}</h1>
        {circle.description && (
          <p className="text-gray-600 text-[18px]">{circle.description}</p>
        )}
        <p className="text-gray-400 text-[17px]">
          {circle.member_count} {circle.member_count === 1 ? 'member' : 'members'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {currentMember && (
          <button
            onClick={() => setProposing(true)}
            className="border border-brand-teal text-brand-teal font-semibold px-5 py-2.5
                       rounded-xl text-[18px] min-h-[52px] flex items-center hover:bg-brand-teal/5
                       transition-colors"
          >
            + Propose an Event
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-[17px] font-medium transition-colors border-b-2 -mb-px whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.key
                ? 'border-brand-teal text-brand-teal'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Post compose */}
      {activeTab === 'posts' && currentMember && (
        <PostCompose circleId={circle.id} currentMember={currentMember} onPosted={handlePosted} />
      )}
      {activeTab === 'posts' && !currentMember && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
          <p className="text-gray-500 text-[18px]">
            <a href="/login" className="text-brand-teal underline font-medium">Sign in</a> to post and comment in this circle.
          </p>
        </div>
      )}

      {/* Content feed tab */}
      {activeTab === 'content' && (
        <CircleContentFeed circleId={circle.id} circleName={circle.name} />
      )}

      {/* Events tab */}
      {activeTab === 'events' && (
        <EventsTab events={events} currentMemberId={currentMember?.id ?? null} />
      )}

      {/* Posts */}
      {activeTab === 'posts' && <section aria-label="Circle posts">
        {posts.length === 0 ? (
          <p className="text-gray-400 text-[18px] text-center py-12">
            No posts yet. Be the first to share something!
          </p>
        ) : (
          <ul className="space-y-6">
            {posts.map((post) => (
              <li
                key={post.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3"
              >
                {/* Post header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full bg-brand-navy/10 flex items-center
                                  justify-center text-brand-navy font-bold text-[17px]"
                      aria-hidden
                    >
                      {displayName(post.members).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-brand-navy text-[18px]">
                        {displayName(post.members)}
                      </p>
                      <p className="text-gray-400 text-[15px]">{formatDate(post.created_at)}</p>
                    </div>
                  </div>

                  {/* ⋯ menu — only for members who aren't the post author, or for staff */}
                  {currentMember && (post.member_id !== currentMember.id || staff) && (
                    <ContentMenu
                      onReport={() => setReportTarget({ type: 'post', id: post.id })}
                    />
                  )}
                </div>

                {/* Staff-only: hidden banner */}
                {post.is_hidden && staff && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[16px] text-amber-700">
                    🚫 This post is hidden from members.
                  </div>
                )}

                {/* Post body */}
                <p className="text-gray-800 text-[18px] leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>

                {/* Comment thread */}
                <CommentThread
                  postId={post.id}
                  initialCount={post.comment_count}
                  currentMemberId={currentMember?.id ?? null}
                />
              </li>
            ))}
          </ul>
        )}
      </section>}

      {/* Propose-event modal */}
      {proposing && (
        <ProposeEventModal
          circleId={circle.id}
          onClose={() => setProposing(false)}
        />
      )}

      {/* Report modal for posts */}
      {reportTarget && (
        <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} />
      )}
    </div>
  )
}
