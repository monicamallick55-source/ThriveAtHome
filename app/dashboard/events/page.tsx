import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { getUpcomingEvents } from '@/lib/data/events'
import EventsClient from '@/components/events/EventsClient'

export const metadata: Metadata = { title: 'Events — ThriveAtHome' }

export default async function EventsPage() {
  const user = await requireAuth()
  const { data: fm } = await getFamilyMemberByAuthId(user.id)

  const { data: events } = await getUpcomingEvents(fm?.member_id ?? undefined)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 40,
        backgroundColor: 'white', borderBottom: '1px solid var(--color-warm-grey)',
        boxShadow: 'var(--shadow-sm)', height: '64px', display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
            ← Dashboard
          </Link>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', fontWeight: 500 }}>ThriveAtHome</span>
          <div style={{ width: '100px' }} />
        </div>
      </nav>

      {/* Header */}
      <div style={{ backgroundColor: 'var(--color-navy)', padding: '32px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 500,
            color: 'white', margin: '0 0 8px',
          }}>
            Community Events
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
            Phone and video events hosted by your care team — all you need is a phone.
          </p>
        </div>
      </div>

      {/* Content */}
      <main style={{ flex: 1, maxWidth: '900px', margin: '0 auto', padding: '32px 24px', width: '100%' }}>
        <EventsClient initialEvents={events ?? []} />
      </main>
    </div>
  )
}
