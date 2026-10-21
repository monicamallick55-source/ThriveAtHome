import Link from 'next/link'
import { RESOURCE_TOPICS } from '@/lib/content/resources'

export const metadata = {
  title: 'Senior Living Resources | ThriveAtHome',
  description: 'Guides, articles, and expert advice to help seniors live independently and families support their loved ones.',
}

const TOPIC_ICONS: Record<string, string> = {
  'caregiver-support':   '🤝',
  'daily-living':        '🏠',
  'home-organization':   '📦',
  'in-home-care':        '👩‍⚕️',
  'legal-planning':      '📋',
  'public-assistance':   '💼',
  'purpose-fulfillment': '✨',
  'retirement-planning': '📊',
  'senior-fitness':      '🏃',
  'home-safety':         '🛡️',
  'smart-home-tech':     '📱',
  'moving-downsizing':   '🚚',
}

export default function ResourcesPage() {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0d9488', marginBottom: 12 }}>
          Resource Library
        </p>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, lineHeight: 1.15, marginBottom: 16 }}>
          Everything you need to thrive at home
        </h1>
        <p style={{ fontSize: 18, color: '#64748b', maxWidth: 600, margin: '0 auto' }}>
          Expert-written guides across the topics that matter most — from daily independence to legal planning, fitness, and family support.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
        {RESOURCE_TOPICS.map((topic: any) => (
          <Link key={topic.slug} href={`/resources/${topic.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '28px 24px', height: '100%', cursor: 'pointer' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{TOPIC_ICONS[topic.slug] ?? '📄'}</div>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{topic.title}</h2>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>{topic.description}</p>
              {topic.subtopics && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {topic.subtopics.slice(0, 3).map((s: string) => (
                    <span key={s} style={{ fontSize: 11, fontWeight: 500, background: '#f0fdfa', color: '#0d9488', borderRadius: 20, padding: '3px 10px' }}>{s}</span>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 16, fontSize: 13, color: '#94a3b8' }}>{topic.articleCount} articles →</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 72, background: '#f0fdfa', borderRadius: 16, padding: '40px 32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Not sure where to start?</h2>
        <p style={{ color: '#475569', marginBottom: 24, maxWidth: 480, margin: '0 auto 24px' }}>
          Talk to Quinn, our AI concierge, and get personalized recommendations for your situation.
        </p>
        <Link href="/for-families" style={{ display: 'inline-block', background: '#0d9488', color: '#fff', borderRadius: 8, padding: '12px 28px', fontWeight: 600, textDecoration: 'none', fontSize: 15 }}>
          Get personalized guidance
        </Link>
      </div>
    </main>
  )
}
