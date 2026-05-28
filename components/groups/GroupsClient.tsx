'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { CulturalCircle } from '@/lib/data/circles'

const GROUP_COLORS = [
  '#2A8A5E', '#1E6B9E', '#E8401C', '#8A4A2E',
  '#6A3D9A', '#D4880E', '#C74B8A', '#1A7A6A',
]

const GROUP_ICONS: Record<string, string> = {
  Gardening: '🌱',
  Books: '📚',
  Music: '🎵',
  Cooking: '🍳',
  'Faith & spirituality': '🕊️',
  Sports: '🏅',
  'Travel memories': '✈️',
  Family: '🎨',
}

interface Props {
  groups: CulturalCircle[]
  joinedGroupIds: string[]
  hasMember: boolean
}

export default function GroupsClient({ groups, joinedGroupIds, hasMember }: Props) {
  const [joined, setJoined] = useState<Set<string>>(new Set(joinedGroupIds))
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function toggleMembership(groupId: string, groupName: string) {
    if (!hasMember) { showToast("Set up your senior's profile to join groups."); return }
    const isJoined = joined.has(groupId)
    setLoadingId(groupId)
    const endpoint = isJoined ? '/api/circles/leave' : '/api/circles/join'
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circleId: groupId }),
      })
      if (res.ok) {
        startTransition(() => {
          setJoined(prev => {
            const next = new Set(prev)
            isJoined ? next.delete(groupId) : next.add(groupId)
            return next
          })
          showToast(isJoined ? `Left ${groupName}` : `Joined ${groupName}!`)
        })
      } else {
        showToast('Something went wrong. Please try again.')
      }
    } catch {
      showToast('Network error. Please try again.')
    } finally {
      setLoadingId(null)
    }
  }

  const myGroups = groups.filter(g => joined.has(g.id))
  const otherGroups = groups.filter(g => !joined.has(g.id))

  return (
    <main style={{ flex: 1, padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '38px', fontWeight: 500,
            color: 'var(--color-navy)', marginBottom: '12px', letterSpacing: '-0.01em',
          }}>
            Interest Groups
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '18px',
            color: 'var(--color-text-secondary)', lineHeight: 1.65, maxWidth: '600px',
          }}>
            Connect with others who share your passions. Join a group to take part in conversations, events, and shared activities.
          </p>
        </div>

        {/* My Groups */}
        {myGroups.length > 0 && (
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600,
              color: 'var(--color-text-secondary)', letterSpacing: '0.08em',
              textTransform: 'uppercase', marginBottom: '20px',
            }}>
              Your Groups
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {myGroups.map((g, i) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  color={GROUP_COLORS[i % GROUP_COLORS.length]}
                  icon={GROUP_ICONS[g.interest_tag ?? ''] ?? '⭐'}
                  isJoined={true}
                  isLoading={loadingId === g.id}
                  onToggle={() => toggleMembership(g.id, g.circle_name)}
                />
              ))}
            </div>
          </section>
        )}

        {/* All Groups */}
        {otherGroups.length > 0 && (
          <section>
            <h2 style={{
              fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600,
              color: 'var(--color-text-secondary)', letterSpacing: '0.08em',
              textTransform: 'uppercase', marginBottom: '20px',
            }}>
              {myGroups.length > 0 ? 'More Groups' : 'All Groups'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {otherGroups.map((g, i) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  color={GROUP_COLORS[(myGroups.length + i) % GROUP_COLORS.length]}
                  icon={GROUP_ICONS[g.interest_tag ?? ''] ?? '⭐'}
                  isJoined={false}
                  isLoading={loadingId === g.id}
                  onToggle={() => toggleMembership(g.id, g.circle_name)}
                />
              ))}
            </div>
          </section>
        )}

        {groups.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '80px 32px',
            background: 'white', borderRadius: '16px',
            border: '1px solid var(--color-warm-grey)',
          }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)' }}>
              No interest groups available yet. Check back soon!
            </p>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: 'var(--color-navy)', color: 'white',
          padding: '14px 28px', borderRadius: '100px',
          fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 100,
          whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}
    </main>
  )
}

function GroupCard({
  group,
  color,
  icon,
  isJoined,
  isLoading,
  onToggle,
}: {
  group: CulturalCircle
  color: string
  icon: string
  isJoined: boolean
  isLoading: boolean
  onToggle: () => void
}) {
  return (
    <Link
      href={`/dashboard/communities/${group.id}`}
      style={{ textDecoration: 'none' }}
    >
      <div style={{
        background: 'white', borderRadius: '16px', overflow: 'hidden',
        border: isJoined ? `2px solid ${color}` : '1px solid var(--color-warm-grey)',
        boxShadow: isJoined ? `0 4px 20px ${color}22` : '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${color}33`
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = isJoined ? `0 4px 20px ${color}22` : '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        {/* Color header */}
        <div style={{ backgroundColor: color, height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '36px' }}>{icon}</span>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500,
              color: 'var(--color-navy)', lineHeight: 1.3, margin: 0,
            }}>
              {group.circle_name}
            </h3>
            {isJoined && (
              <span style={{
                flexShrink: 0,
                background: `${color}18`, color,
                fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em',
                textTransform: 'uppercase', padding: '3px 10px', borderRadius: '100px',
                fontFamily: 'var(--font-body)',
              }}>
                Joined
              </span>
            )}
          </div>

          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)',
            lineHeight: 1.55, marginBottom: '20px',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          } as React.CSSProperties}>
            {group.description}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)',
            }}>
              {group.member_count === 0 ? 'Be the first to join' : `${group.member_count} member${group.member_count !== 1 ? 's' : ''}`}
            </span>
            <button
              onClick={e => { e.preventDefault(); onToggle() }}
              disabled={isLoading}
              style={{
                backgroundColor: isJoined ? 'transparent' : color,
                color: isJoined ? color : 'white',
                border: `2px solid ${color}`,
                borderRadius: '100px', padding: '7px 18px',
                fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600,
                cursor: isLoading ? 'wait' : 'pointer',
                transition: 'all 0.15s ease',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? '...' : isJoined ? 'Leave' : 'Join'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
