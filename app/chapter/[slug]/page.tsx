// app/chapter/[slug]/page.tsx
// G5.3 — Public chapter landing page for each metro area

import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ChapterPage({ params }: Props) {
  const { slug } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any

  const { data: metro } = await db
    .from('metro_areas')
    .select('id, name, slug, state, status, member_count, is_active')
    .eq('slug', slug)
    .maybeSingle()

  if (!metro) notFound()

  const { data: events } = await db
    .from('events')
    .select('id, title, start_time, location, location_type')
    .eq('metro_area_id', metro.id)
    .eq('is_published', true)
    .gte('start_time', new Date().toISOString())
    .order('start_time')
    .limit(5)

  const { data: opportunities } = await db
    .from('volunteer_opportunities')
    .select('id, title, commitment_hours_per_week, skills_needed')
    .eq('metro_area_id', metro.id)
    .eq('status', 'open')
    .limit(5)

  const isOfficial = metro.status === 'official'

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        {isOfficial && (
          <span className="inline-block bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full mb-3">
            Official Chapter
          </span>
        )}
        <h1 className="text-3xl font-bold text-gray-900">ThriveAtHome — {metro.name}</h1>
        <p className="text-gray-500 mt-1">{metro.state}</p>
        {metro.member_count > 0 && (
          <p className="text-gray-600 mt-2">{metro.member_count} member{metro.member_count !== 1 ? 's' : ''} in this area</p>
        )}
      </div>

      {!isOfficial && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-blue-800 text-sm">
            This chapter is forming. Full local programming launches when the chapter reaches 50 members.
            Virtual services are available to all members nationwide now.
          </p>
        </div>
      )}

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📅 Upcoming Local Events</h2>
        {events && events.length > 0 ? (
          <ul className="space-y-3">
            {events.map((ev: { id: string; title: string; start_time: string; location: string | null; location_type: string }) => (
              <li key={ev.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <p className="font-medium text-gray-900">{ev.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {new Date(ev.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  {ev.location ? ` · ${ev.location}` : ''}{ev.location_type === 'virtual' ? ' · Virtual' : ''}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No local events scheduled yet. Check back soon.</p>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🤝 Volunteer Opportunities</h2>
        {opportunities && opportunities.length > 0 ? (
          <ul className="space-y-3">
            {opportunities.map((opp: { id: string; title: string; commitment_hours_per_week: number | null; skills_needed: string[] | null }) => (
              <li key={opp.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <p className="font-medium text-gray-900">{opp.title}</p>
                {opp.commitment_hours_per_week && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    ~{opp.commitment_hours_per_week} hr/week{opp.skills_needed?.length ? ` · ${opp.skills_needed.join(', ')}` : ''}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No open opportunities right now.</p>
        )}
      </section>

      <div className="border-t pt-8 flex gap-4">
        <Link href="/enroll" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition">
          Join ThriveAtHome
        </Link>
        <Link href="/volunteer" className="border border-indigo-600 text-indigo-600 px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-50 transition">
          Volunteer in {metro.name}
        </Link>
      </div>
    </main>
  )
}
