'use client'

import { useState } from 'react'
import type { CulturalCircle, CirclePost, CircleEvent, CirclePostComment } from '@/lib/data/circles'

const CIRCLE_COLORS = [
  '#E8401C', '#1E6B9E', '#2A8A5E', '#8A4A2E',
  '#6A3D9A', '#D4880E', '#C74B8A', '#1A7A6A',
  '#5A2D82', '#C04A1A', '#2A6E3A', '#9A1A3A',
]

function formatEventDate(dateStr: string, timeStr: string | null): string {
  const date = new Date(dateStr + 'T00:00:00')
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  let out = `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`
  if (timeStr) {
    const [h, m] = timeStr.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 === 0 ? 12 : h % 12
    out += ` at ${hour12}:${String(m).padStart(2, '0')} ${ampm}`
  }
  return out
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

interface Props {
  circle: CulturalCircle
  circleIndex: number
  initialPosts: CirclePost[]
  events: CircleEvent[]
  isJoined: boolean
  hasMember: boolean
}

interface PostWithComments extends CirclePost {
  comments?: CirclePostComment[]
  commentsLoaded?: boolean
  commentsOpen?: boolean
  commentDraft?: string
  commentPosting?: boolean
}

export default function CircleDetailClient({
  circle, circleIndex, initialPosts, events, isJoined, hasMember,
}: Props) {
  const [joined, setJoined] = useState(isJoined)
  const [posts, setPosts] = useState<PostWithComments[]>(initialPosts)
  const [postContent, setPostContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [rsvpedEvents, setRsvpedEvents] = useState<Set<string>>(
    new Set(events.filter(e => e.user_has_rsvped).map((e: any) => e.id))
  )
  const [joinLoading, setJoinLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const accentColor = CIRCLE_COLORS[circleIndex % CIRCLE_COLORS.length]

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleJoinLeave = async () => {
    setJoinLoading(true)
    try {
      const res = await fetch(joined ? '/api/circles/leave' : '/api/circles/join', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circleId: circle.id }),
      })
      if (res.ok) { setJoined(!joined); showToast(joined ? `Left ${circle.circle_name}` : `Joined ${circle.circle_name}`) }
    } finally { setJoinLoading(false) }
  }

  const handlePost = async () => {
    if (!postContent.trim()) return
    setPosting(true)
    try {
      const res = await fetch('/api/circles/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circleId: circle.id, content: postContent.trim() }),
      })
      if (res.ok) {
        const { post } = await res.json()
        setPosts(prev => [{ ...post, member_name: 'You', comments: [], commentsLoaded: true, commentsOpen: false }, ...prev])
        setPostContent('')
        showToast('Post shared with the community')
      }
    } finally { setPosting(false) }
  }

  const handleRsvp = async (eventId: string, cancel: boolean) => {
    const res = await fetch('/api/circles/events/rsvp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, cancel }),
    })
    if (res.ok) {
      setRsvpedEvents(prev => { const next = new Set(prev); if (cancel) next.delete(eventId); else next.add(eventId); return next })
      showToast(cancel ? 'RSVP cancelled' : 'RSVP confirmed! Dial-in details below.')
    }
  }

  const toggleComments = async (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const opening = !p.commentsOpen
      // If opening and not yet loaded, mark loading (will fetch below)
      return { ...p, commentsOpen: opening }
    }))

    // Fetch comments if not loaded
    const post = posts.find(p => p.id === postId)
    if (!post?.commentsLoaded) {
      const res = await fetch(`/api/circles/posts/${postId}/comments`)
      if (res.ok) {
        const comments: CirclePostComment[] = await res.json()
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments, commentsLoaded: true } : p))
      }
    }
  }

  const updateDraft = (postId: string, val: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentDraft: val } : p))
  }

  const submitComment = async (postId: string) => {
    const post = posts.find(p => p.id === postId)
    const content = post?.commentDraft?.trim()
    if (!content) return
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentPosting: true } : p))
    try {
      const res = await fetch(`/api/circles/posts/${postId}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        const comment: CirclePostComment = await res.json()
        setPosts(prev => prev.map(p => p.id === postId
          ? { ...p, comments: [...(p.comments ?? []), { ...comment, member_name: 'You' }], commentDraft: '', commentPosting: false }
          : p))
      } else {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentPosting: false } : p))
      }
    } catch {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentPosting: false } : p))
    }
  }

  const deleteComment = async (postId: string, commentId: string) => {
    const res = await fetch(`/api/circles/comments/${commentId}`, { method: 'DELETE' })
    if (res.ok) {
      setPosts(prev => prev.map(p => p.id === postId
        ? { ...p, comments: (p.comments ?? []).filter(c => c.id !== commentId) }
        : p))
    }
  }

  return (
    <div style={{ flex: 1, padding: '32px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {toast && (
          <div style={{
            position: 'fixed', bottom: '24px', right: '24px',
            backgroundColor: 'var(--color-navy)', color: 'white',
            padding: '12px 20px', borderRadius: '12px',
            fontFamily: 'var(--font-body)', fontSize: '15px',
            zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}>{toast}</div>
        )}

        {/* Circle header */}
        <div style={{
          backgroundColor: 'white', borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: '24px',
        }}>
          <div style={{ height: '8px', backgroundColor: accentColor }} />
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                  {circle.circle_name}
                </h1>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: '0 0 12px' }}>
                  {circle.member_count} {circle.member_count === 1 ? 'member' : 'members'}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-primary)', lineHeight: 1.6, margin: 0 }}>
                  {circle.description}
                </p>
              </div>
              {hasMember && (
                <button onClick={handleJoinLeave} disabled={joinLoading} style={{
                  padding: '10px 20px', borderRadius: '10px',
                  fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500,
                  cursor: joinLoading ? 'wait' : 'pointer', border: `1px solid ${accentColor}`,
                  backgroundColor: joined ? 'white' : accentColor, color: joined ? accentColor : 'white',
                  opacity: joinLoading ? 0.7 : 1, whiteSpace: 'nowrap',
                }}>
                  {joinLoading ? '...' : joined ? 'Leave circle' : 'Join circle'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming events */}
        {events.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>Upcoming Events</h2>
            {events.map((event: any) => {
              const rsvped = rsvpedEvents.has(event.id)
              return (
                <div key={event.id} style={{
                  backgroundColor: 'white', borderRadius: '14px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)', padding: '20px', marginBottom: '12px',
                  borderLeft: rsvped ? `4px solid ${accentColor}` : '4px solid transparent',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 4px' }}>{event.title}</h3>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 6px' }}>
                        {formatEventDate(event.event_date, event.event_time)}
                        {' · '}{event.format === 'phone' ? 'Phone only' : event.format === 'video' ? 'Video or phone' : 'In-person'}
                        {' · '}{event.rsvp_count} going
                      </p>
                      {event.description && (
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-primary)', margin: '0 0 8px', lineHeight: 1.5 }}>{event.description}</p>
                      )}
                      {rsvped && event.format === 'in_person' && event.location_address && (
                        <div style={{ backgroundColor: accentColor + '10', border: `1px solid ${accentColor}30`, borderRadius: '10px', padding: '12px 16px', marginTop: '8px' }}>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 4px' }}>You&apos;re going! Location:</p>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.6 }}>{event.location_address}</p>
                        </div>
                      )}
                      {rsvped && event.format !== 'in_person' && event.dial_in_number && (
                        <div style={{ backgroundColor: accentColor + '10', border: `1px solid ${accentColor}30`, borderRadius: '10px', padding: '12px 16px', marginTop: '8px' }}>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 4px' }}>You&apos;re going! Here&apos;s how to join:</p>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.6 }}>
                            Call <strong>{event.dial_in_number}</strong>{event.dial_in_code && <> and enter <strong>{event.dial_in_code}</strong> when prompted</>}. That&apos;s it.
                          </p>
                        </div>
                      )}
                    </div>
                    {hasMember && (
                      <button onClick={() => handleRsvp(event.id, rsvped)} style={{
                        padding: '8px 16px', borderRadius: '10px',
                        fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500,
                        cursor: 'pointer', border: `1px solid ${accentColor}`,
                        backgroundColor: rsvped ? 'white' : accentColor, color: rsvped ? accentColor : 'white', whiteSpace: 'nowrap',
                      }}>
                        {rsvped ? 'Cancel RSVP' : 'RSVP'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Community feed */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>Community Feed</h2>

          {joined && hasMember && (
            <div style={{ backgroundColor: 'white', borderRadius: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', padding: '16px', marginBottom: '16px' }}>
              <textarea
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                placeholder="Share something with the community..."
                rows={3}
                style={{ width: '100%', border: '1px solid var(--color-warm-grey)', borderRadius: '10px', padding: '12px', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-primary)', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.5 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button onClick={handlePost} disabled={posting || !postContent.trim()} style={{
                  padding: '9px 20px', borderRadius: '10px',
                  fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500,
                  cursor: (posting || !postContent.trim()) ? 'not-allowed' : 'pointer',
                  border: 'none', backgroundColor: accentColor, color: 'white',
                  opacity: (posting || !postContent.trim()) ? 0.6 : 1,
                }}>
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          )}

          {!joined && hasMember && (
            <div style={{ backgroundColor: 'white', borderRadius: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', padding: '20px', marginBottom: '16px', textAlign: 'center', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', fontSize: '15px' }}>
              Join this circle to post and engage with the community.
            </div>
          )}

          {posts.length === 0 ? (
            <div style={{ backgroundColor: 'white', borderRadius: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', fontSize: '16px' }}>
              No posts yet. Be the first to share something!
            </div>
          ) : (
            posts.map((post: PostWithComments) => (
              <div key={post.id} style={{ backgroundColor: 'white', borderRadius: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', padding: '18px', marginBottom: '10px' }}>
                {/* Post header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: accentColor + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '16px', color: accentColor, fontWeight: 600, flexShrink: 0 }}>
                    {(post.member_name ?? 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{post.member_name ?? 'Community member'}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>{timeAgo(post.created_at)}</span>
                  </div>
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-primary)', margin: '0 0 12px', lineHeight: 1.6 }}>{post.content}</p>

                {/* Comment toggle */}
                <button
                  onClick={() => toggleComments(post.id)}
                  style={{ background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  💬 {post.commentsOpen ? 'Hide comments' : `Comments${post.comments ? ` (${post.comments.length})` : ''}`}
                </button>

                {/* Comments section */}
                {post.commentsOpen && (
                  <div style={{ marginTop: '12px', borderTop: '1px solid var(--color-warm-grey)', paddingTop: '12px' }}>
                    {!post.commentsLoaded ? (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>Loading...</p>
                    ) : post.comments?.length === 0 ? (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 10px' }}>No comments yet.</p>
                    ) : (
                      <div style={{ marginBottom: '12px' }}>
                        {post.comments?.map(c => (
                          <div key={c.id} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: accentColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '13px', color: accentColor, fontWeight: 600, flexShrink: 0 }}>
                              {(c.member_name ?? 'C').charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{c.member_name ?? 'Community member'}</span>
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>{timeAgo(c.created_at)}</span>
                                {c.member_name === 'You' && (
                                  <button onClick={() => deleteComment(post.id, c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--color-text-secondary)', padding: '0 4px', marginLeft: 'auto' }}>Delete</button>
                                )}
                              </div>
                              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.5 }}>{c.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment input — only for joined members */}
                    {joined && hasMember && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                        <textarea
                          value={post.commentDraft ?? ''}
                          onChange={e => updateDraft(post.id, e.target.value)}
                          placeholder="Write a comment..."
                          rows={2}
                          style={{ flex: 1, border: '1px solid var(--color-warm-grey)', borderRadius: '8px', padding: '8px 10px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-primary)', resize: 'none', outline: 'none', lineHeight: 1.5 }}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(post.id) } }}
                        />
                        <button
                          onClick={() => submitComment(post.id)}
                          disabled={post.commentPosting || !post.commentDraft?.trim()}
                          style={{ padding: '8px 14px', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, cursor: (post.commentPosting || !post.commentDraft?.trim()) ? 'not-allowed' : 'pointer', border: 'none', backgroundColor: accentColor, color: 'white', opacity: (post.commentPosting || !post.commentDraft?.trim()) ? 0.5 : 1, whiteSpace: 'nowrap' }}
                        >
                          {post.commentPosting ? '...' : 'Reply'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
