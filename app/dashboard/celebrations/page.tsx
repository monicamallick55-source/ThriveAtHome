import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getMemberForAuthUser } from '@/lib/data/members'
import { getCelebrationEvents, getNextBirthdayDate, isTodayBirthday } from '@/lib/data/celebrations'
import type { CelebrationEvent } from '@/lib/data/celebrations'

export const metadata: Metadata = { title: 'Celebrations — ThriveAtHome' }

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function CelebrationTypeLabel({ type }: { type: string }) {
  const labels: Record<string, { emoji: string; label: string; color: string }> = {
    birthday: { emoji: '🎂', label: 'Birthday', color: '#f9c74f' },
    milestone_first_call: { emoji: '📞', label: 'First Check-In', color: '#4cc9f0' },
    milestone_30_day_streak: { emoji: '🔥', label: '30-Day Streak', color: '#f77f00' },
    milestone_90_days: { emoji: '⭐', label: '90 Days Together', color: '#9d4edd' },
    anniversary: { emoji: '🌟', label: 'Anniversary', color: '#43aa8b' },
    pet_birthday: { emoji: '🎂', label: 'Pet Birthday', color: '#f9844a' },
    pet_adoption_anniversary: { emoji: '🏡', label: 'Adoption Anniversary', color: '#43aa8b' },
    pet_senior_milestone: { emoji: '🌟', label: 'Senior Companion', color: '#9d4edd' },
  }
  const info = labels[type] ?? { emoji: '🎉', label: type.replace(/_/g, ' '), color: '#4361ee' }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        backgroundColor: info.color + '22',
        color: info.color,
        border: `1px solid ${info.color}44`,
      }}
    >
      {info.emoji} {info.label}
    </span>
  )
}

function UpcomingCard({ event, isToday }: { event: CelebrationEvent; isToday: boolean }) {
  const days = daysUntil(event.event_date)
  return (
    <div
      style={{
        backgroundColor: isToday ? '#fff9e6' : 'white',
        border: isToday ? '2px solid #f9c74f' : '1px solid var(--color-warm-grey)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <CelebrationTypeLabel type={event.celebration_type} />
        {isToday ? (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, color: '#d4a017', backgroundColor: '#fff3cd', padding: '4px 12px', borderRadius: '20px' }}>
            Today!
          </span>
        ) : (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            {days === 1 ? 'Tomorrow' : `In ${days} days`}
          </span>
        )}
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
        {formatDate(event.event_date)}
      </p>
      {event.ai_message && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0, fontStyle: 'italic' }}>
          {event.ai_message}
        </p>
      )}
    </div>
  )
}

function PastMilestoneCard({ event }: { event: CelebrationEvent }) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid var(--color-warm-grey)',
        borderRadius: 'var(--radius-xl)',
        padding: '20px 24px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <CelebrationTypeLabel type={event.celebration_type} />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>
          {formatDate(event.event_date)}
        </span>
      </div>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', backgroundColor: '#f0f0f0', padding: '4px 10px', borderRadius: '12px' }}>
        Celebrated
      </span>
    </div>
  )
}

export default async function CelebrationsPage() {
  const user = await requireAuth()
  const { data: member } = await getMemberForAuthUser(user.id)
  if (!member) redirect('/onboarding')

  const { data: allEvents } = await getCelebrationEvents(member.id)
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = (allEvents ?? []).filter((e) => e.event_date >= today)
  const past = (allEvents ?? []).filter((e) => e.event_date < today)

  const todayBirthday = member.date_of_birth ? isTodayBirthday(member.date_of_birth) : false
  const nextBirthday = member.date_of_birth ? getNextBirthdayDate(member.date_of_birth) : null
  const nextBirthdayStr = nextBirthday ? nextBirthday.toISOString().slice(0, 10) : null
  const birthdayAlreadyScheduled =
    nextBirthdayStr && upcoming.some((e) => e.celebration_type === 'birthday' && e.event_date === nextBirthdayStr)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: 'white',
          borderBottom: '1px solid var(--color-warm-grey)',
          boxShadow: 'var(--shadow-sm)',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            padding: '0 24px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/dashboard"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
            }}
          >
            ← Dashboard
          </Link>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              color: 'var(--color-navy)',
              fontWeight: 500,
            }}
          >
            ThriveAtHome
          </span>
          <div style={{ width: '100px' }} aria-hidden="true" />
        </div>
      </nav>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '36px',
            fontWeight: 500,
            color: 'var(--color-navy)',
            marginBottom: '8px',
          }}
        >
          Celebrations
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '18px',
            color: 'var(--color-text-secondary)',
            marginBottom: '40px',
          }}
        >
          Upcoming milestones and special moments for {member.preferred_name}.
        </p>

        {todayBirthday && (
          <div
            style={{
              background: 'linear-gradient(135deg, #f9c74f 0%, #f8961e 100%)',
              borderRadius: 'var(--radius-xl)',
              padding: '32px',
              textAlign: 'center',
              marginBottom: '32px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎂</div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '28px',
                fontWeight: 600,
                color: '#1a1a2e',
                margin: '0 0 8px',
              }}
            >
              Happy Birthday, {member.preferred_name}!
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '17px',
                color: '#1a1a2e',
                margin: 0,
                opacity: 0.8,
              }}
            >
              Wishing you a wonderful day filled with joy and connection.
            </p>
          </div>
        )}

        {/* Upcoming celebrations */}
        <section style={{ marginBottom: '48px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: 500,
              color: 'var(--color-navy)',
              marginBottom: '16px',
            }}
          >
            Coming up
          </h2>

          {upcoming.length === 0 && !nextBirthdayStr && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-muted)' }}>
              No upcoming celebrations scheduled.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {upcoming.map((event) => (
              <UpcomingCard
                key={event.id}
                event={event}
                isToday={event.event_date === today}
              />
            ))}

            {nextBirthdayStr && !birthdayAlreadyScheduled && (
              <div
                style={{
                  backgroundColor: 'white',
                  border: '1px dashed #f9c74f',
                  borderRadius: 'var(--radius-xl)',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <span style={{ fontSize: '32px' }}>🎂</span>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 500, color: 'var(--color-navy)', margin: '0 0 4px' }}>
                    {member.preferred_name}&apos;s Birthday
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    {formatDate(nextBirthdayStr)} &mdash; {daysUntil(nextBirthdayStr) === 0 ? 'Today!' : `In ${daysUntil(nextBirthdayStr)} days`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Past milestones */}
        {past.length > 0 && (
          <section>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 500,
                color: 'var(--color-navy)',
                marginBottom: '16px',
              }}
            >
              Past milestones
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {past.map((event) => (
                <PastMilestoneCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {past.length === 0 && upcoming.length === 0 && !nextBirthdayStr && (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 24px',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <p>Milestones and celebrations will appear here as {member.preferred_name} builds their journey with ThriveAtHome.</p>
          </div>
        )}
      </main>
    </div>
  )
}
