'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { CulturalCircle } from '@/lib/data/circles'

const LANGUAGE_LABELS: Record<string, string> = {
  spanish: 'Español',
  mandarin: '中文',
  vietnamese: 'Tiếng Việt',
  korean: '한국어',
  hindi: 'हिन्दी',
  tagalog: 'Tagalog',
  arabic: 'العربية',
  polish: 'Polski',
  english: 'English',
}

const CIRCLE_COLORS = [
  '#E8401C', '#1E6B9E', '#2A8A5E', '#8A4A2E',
  '#6A3D9A', '#D4880E', '#C74B8A', '#1A7A6A',
  '#5A2D82', '#C04A1A', '#2A6E3A', '#9A1A3A',
]

interface Props {
  circles: CulturalCircle[]
  joinedCircleIds: string[]
}

export default function CulturalCirclesClient({ circles, joinedCircleIds }: Props) {
  const [joined, setJoined] = useState<Set<string>>(new Set(joinedCircleIds))
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleJoin = async (circleId: string, circleName: string) => {
    setLoadingId(circleId)
    try {
      const res = await fetch('/api/circles/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circleId }),
      })
      if (res.ok) {
        startTransition(() => {
          setJoined(prev => new Set([...prev, circleId]))
        })
        showToast(`Joined ${circleName}`)
      }
    } finally {
      setLoadingId(null)
    }
  }

  const handleLeave = async (circleId: string, circleName: string) => {
    setLoadingId(circleId)
    try {
      const res = await fetch('/api/circles/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circleId }),
      })
      if (res.ok) {
        startTransition(() => {
          setJoined(prev => {
            const next = new Set(prev)
            next.delete(circleId)
            return next
          })
        })
        showToast(`Left ${circleName}`)
      }
    } finally {
      setLoadingId(null)
    }
  }

  const joinedCircles = circles.filter(c => joined.has(c.id))
  const otherCircles = circles.filter(c => !joined.has(c.id))

  const CircleCard = ({ circle, colorIndex }: { circle: CulturalCircle; colorIndex: number }) => {
    const isJoined = joined.has(circle.id)
    const isLoading = loadingId === circle.id
    const accentColor = CIRCLE_COLORS[colorIndex % CIRCLE_COLORS.length]
    const langLabel = LANGUAGE_LABELS[circle.primary_language] ?? circle.primary_language

    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        border: isJoined ? `2px solid ${accentColor}` : '2px solid transparent',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Color header bar */}
        <div style={{
          height: '6px',
          backgroundColor: accentColor,
        }} />
        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 500,
              color: 'var(--color-navy)',
              margin: 0,
              lineHeight: 1.3,
            }}>
              {circle.circle_name}
            </h3>
            {isJoined && (
              <span style={{
                backgroundColor: accentColor + '20',
                color: accentColor,
                fontSize: '12px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px',
                whiteSpace: 'nowrap',
                marginLeft: '8px',
              }}>Joined</span>
            )}
          </div>

          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            marginBottom: '10px',
            display: 'block',
          }}>
            {langLabel} · {circle.member_count} {circle.member_count === 1 ? 'member' : 'members'}
          </span>

          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '15px',
            color: 'var(--color-text-primary)',
            lineHeight: 1.55,
            margin: 0,
            flex: 1,
          }}>
            {circle.description}
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <Link
              href={`/dashboard/cultural-circles/${circle.id}`}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '9px 14px',
                borderRadius: '10px',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--color-navy)',
                backgroundColor: 'var(--color-cream)',
                textDecoration: 'none',
                border: '1px solid var(--color-warm-grey)',
                transition: 'background-color 0.15s',
              }}
            >
              View circle
            </Link>
            <button
              onClick={() => isJoined ? handleLeave(circle.id, circle.circle_name) : handleJoin(circle.id, circle.circle_name)}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: '10px',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: isLoading ? 'wait' : 'pointer',
                border: `1px solid ${accentColor}`,
                backgroundColor: isJoined ? 'white' : accentColor,
                color: isJoined ? accentColor : 'white',
                transition: 'all 0.15s',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? '...' : isJoined ? 'Leave' : 'Join'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const allCirclesWithIndex = circles.map((c, i) => ({ circle: c, index: i }))
  const joinedWithIndex = allCirclesWithIndex.filter(({ circle }) => joined.has(circle.id))
  const otherWithIndex = allCirclesWithIndex.filter(({ circle }) => !joined.has(circle.id))

  return (
    <div style={{ flex: 1, padding: '32px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--color-navy)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '12px',
            fontFamily: 'var(--font-body)',
            fontSize: '15px',
            zIndex: 100,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}>
            {toast}
          </div>
        )}

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '36px',
            fontWeight: 500,
            color: 'var(--color-navy)',
            margin: '0 0 8px',
            letterSpacing: '-0.01em',
          }}>
            Cultural Community Circles
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '18px',
            color: 'var(--color-text-secondary)',
            margin: 0,
            lineHeight: 1.5,
          }}>
            Connect with others who share your heritage, language, and traditions.
          </p>
        </div>

        {/* Joined circles */}
        {joinedWithIndex.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              margin: '0 0 16px',
            }}>
              Your Communities
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
            }}>
              {joinedWithIndex.map(({ circle, index }) => (
                <CircleCard key={circle.id} circle={circle} colorIndex={index} />
              ))}
            </div>
          </div>
        )}

        {/* Other circles */}
        {otherWithIndex.length > 0 && (
          <div>
            {joinedWithIndex.length > 0 && (
              <h2 style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                margin: '0 0 16px',
              }}>
                All Communities
              </h2>
            )}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
            }}>
              {otherWithIndex.map(({ circle, index }) => (
                <CircleCard key={circle.id} circle={circle} colorIndex={index} />
              ))}
            </div>
          </div>
        )}

        {circles.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 32px',
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-body)',
            fontSize: '18px',
          }}>
            Community circles are being set up. Check back soon.
          </div>
        )}
      </div>
    </div>
  )
}
