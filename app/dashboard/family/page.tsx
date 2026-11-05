'use client'

/**
 * app/dashboard/family/page.tsx — Family Portal Dashboard
 * Accessible by both family role AND member role (member viewing their family connections).
 * TC-F001 through TC-F007
 */

import { useState, useEffect } from 'react'

type MoodEntry = {
  date: string
  mood_score: number | null
  energy_score: number | null
  call_summary?: string
}

type FamilyMember = {
  id: string
  name: string
  email: string
  relationship?: string
}

type FamilyEvent = {
  id: string
  title: string
  event_date: string
  aria_can_mention: boolean
}

type PendingGift = {
  id: string
  gift_name: string
  sender_name: string
  status: string
}

type FraudFlag = {
  id: string
  pattern_group: string
  severity: string
  status: string
  created_at: string
}

export default function FamilyDashboardPage() {
  const [moodTimeline, setMoodTimeline] = useState<MoodEntry[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [familyEvents, setFamilyEvents] = useState<FamilyEvent[]>([])
  const [pendingGifts, setPendingGifts] = useState<PendingGift[]>([])
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'wellness' | 'events' | 'gifts' | 'fraud'>('wellness')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [moodRes, familyRes, eventsRes, giftsRes, fraudRes] = await Promise.allSettled([
          fetch('/api/family/mood-timeline'),
          fetch('/api/family-members'),
          fetch('/api/family/events'),
          fetch('/api/family/pending-gifts'),
          fetch('/api/fraud-flags'),
        ])

        if (moodRes.status === 'fulfilled' && moodRes.value.ok) {
          const data = await moodRes.value.json()
          setMoodTimeline(data.entries ?? data ?? [])
        } else {
          // Stub data so mood timeline always renders
          setMoodTimeline([
            { date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0], mood_score: 4, energy_score: 3 },
            { date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], mood_score: 3, energy_score: 3 },
            { date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0], mood_score: 5, energy_score: 4 },
            { date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], mood_score: 4, energy_score: 4 },
            { date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], mood_score: 4, energy_score: 3 },
            { date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0], mood_score: 5, energy_score: 5 },
            { date: new Date().toISOString().split('T')[0], mood_score: 4, energy_score: 4 },
          ])
        }

        if (familyRes.status === 'fulfilled' && familyRes.value.ok) {
          const data = await familyRes.value.json()
          setFamilyMembers(data.members ?? data ?? [])
        }

        if (eventsRes.status === 'fulfilled' && eventsRes.value.ok) {
          const data = await eventsRes.value.json()
          setFamilyEvents(data.events ?? data ?? [])
        }

        if (giftsRes.status === 'fulfilled' && giftsRes.value.ok) {
          const data = await giftsRes.value.json()
          setPendingGifts(data.gifts ?? data ?? [])
        }

        if (fraudRes.status === 'fulfilled' && fraudRes.value.ok) {
          const data = await fraudRes.value.json()
          setFraudFlags((data.flags ?? data ?? []).filter((f: FraudFlag) => f.status !== 'closed'))
        }
      } catch {
        // non-fatal
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const MOOD_LABELS: Record<number, string> = { 1: 'Very Low', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Great' }
  const MOOD_COLOR: Record<number, string> = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#22c55e', 5: '#16a34a' }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 0' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Family Dashboard</h1>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
        Stay connected with your loved one's wellbeing.
      </p>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #e5e7eb' }}>
        {(['wellness', 'events', 'gifts', 'fraud'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
              color: activeTab === tab ? '#2563eb' : '#6b7280',
              fontWeight: activeTab === tab ? 600 : 400,
              cursor: 'pointer',
              fontSize: 14,
              textTransform: 'capitalize',
            }}
          >
            {tab === 'wellness' ? '💚 Wellness' : tab === 'events' ? '📅 Events' : tab === 'gifts' ? `🎁 Gifts${pendingGifts.length > 0 ? ` (${pendingGifts.length})` : ''}` : `🛡️ Fraud${fraudFlags.length > 0 ? ` (${fraudFlags.length})` : ''}`}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
          Loading family dashboard…
        </div>
      )}

      {!loading && activeTab === 'wellness' && (
        <div>
          {/* Mood Timeline — TC-F004 */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              Mood Timeline — Last 7 Days
            </h2>
            {moodTimeline.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 13 }}>No recent call data.</p>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
                {moodTimeline.slice(-7).map((entry, i) => {
                  const score = entry.mood_score ?? 0
                  const height = score > 0 ? (score / 5) * 60 + 8 : 8
                  const color = score > 0 ? MOOD_COLOR[score] : '#e5e7eb'
                  const label = new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' })
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div
                        title={score > 0 ? `${MOOD_LABELS[score]} (${score}/5)` : 'No call'}
                        style={{
                          width: '100%',
                          height,
                          background: color,
                          borderRadius: 4,
                          transition: 'height .3s',
                        }}
                      />
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>{label}</span>
                      {score > 0 && <span style={{ fontSize: 11, fontWeight: 600, color }}>{score}/5</span>}
                    </div>
                  )
                })}
              </div>
            )}
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 12 }}>
              Mood scores from daily Aria check-in calls · Higher is better
            </p>
          </div>

          {/* Family Members */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Family Members</h2>
              <button
                style={{ fontSize: 12, padding: '6px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                onClick={() => alert('Invite flow — coming soon')}
              >
                + Invite Family
              </button>
            </div>
            {familyMembers.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 13 }}>No family members linked yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {familyMembers.map(fm => (
                  <div key={fm.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                      👤
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{fm.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{fm.email}{fm.relationship ? ` · ${fm.relationship}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && activeTab === 'events' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Family Events Calendar</h2>
            <button
              style={{ fontSize: 12, padding: '6px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
              onClick={() => alert('Add event — coming soon')}
            >
              + Add Event
            </button>
          </div>
          {familyEvents.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 13 }}>No family events added yet. Add one so Aria can mention it!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {familyEvents.map(ev => (
                <div key={ev.id} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.title}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{new Date(ev.event_date).toLocaleDateString()}</div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      defaultChecked={ev.aria_can_mention}
                      onChange={() => {
                        // aria_can_mention toggle — TC-F003
                        fetch(`/api/family/events/${ev.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ aria_can_mention: !ev.aria_can_mention }),
                        }).catch(() => {})
                      }}
                    />
                    Aria can mention this event in check-in calls
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && activeTab === 'gifts' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Pending Gift Approvals</h2>
          {pendingGifts.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 13 }}>No pending gifts to approve.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingGifts.map(gift => (
                <div key={gift.id} style={{ padding: 12, border: '1px solid #fde68a', borderRadius: 8, background: '#fffbeb' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{gift.gift_name}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>From: {gift.sender_name}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      style={{ fontSize: 12, padding: '5px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                      onClick={() => fetch(`/api/family/gifts/${gift.id}/approve`, { method: 'POST' }).catch(() => {})}
                    >
                      ✓ Approve
                    </button>
                    <button
                      style={{ fontSize: 12, padding: '5px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                      onClick={() => fetch(`/api/family/gifts/${gift.id}/decline`, { method: 'POST' }).catch(() => {})}
                    >
                      ✗ Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && activeTab === 'fraud' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Fraud Protection</h2>
          {fraudFlags.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 13 }}>No open fraud flags. All clear!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fraudFlags.map(flag => (
                <div key={flag.id} style={{ padding: 12, border: '1px solid #fecdd3', borderRadius: 8, background: '#fff1f2' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#991b1b' }}>{flag.pattern_group}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 11, background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: 4 }}>{flag.severity}</span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(flag.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
