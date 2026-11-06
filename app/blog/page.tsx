/**
 * app/blog/page.tsx — public blog index
 * Server Component; no auth guard.
 */
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog — ThriveAtHome',
  description: 'Guides, tips, and expert advice for seniors and their families on living independently with confidence.',
}

// Keep in sync with BLOG_POSTS in lib/content/resources.ts
const POSTS = [
  { slug: 'preventing-caregiver-burnout',       title: 'Preventing Caregiver Burnout',              date: 'Sep 2026', category: 'Caregiving' },
  { slug: 'long-distance-caregiving-guide',      title: 'The Long-Distance Caregiving Guide',         date: 'Sep 2026', category: 'Caregiving' },
  { slug: 'having-the-conversation-aging-parents', title: 'Having the Conversation with Aging Parents', date: 'Aug 2026', category: 'Family' },
  { slug: 'adaptive-equipment-independence',     title: 'Adaptive Equipment for Independence',        date: 'Aug 2026', category: 'Daily Living' },
  { slug: 'nutrition-guide-seniors',             title: 'Nutrition Guide for Seniors',                date: 'Aug 2026', category: 'Health' },
  { slug: 'downsizing-seniors-guide',            title: 'Downsizing: A Practical Senior Guide',       date: 'Jul 2026', category: 'Housing' },
  { slug: 'hiring-home-care-checklist',          title: 'How to Hire In-Home Care: a Checklist',      date: 'Jul 2026', category: 'Care' },
  { slug: 'essential-legal-documents-seniors',   title: 'Essential Legal Documents Every Senior Needs', date: 'Jun 2026', category: 'Legal' },
  { slug: 'benefits-guide-seniors',              title: 'Benefits Guide: Medicare, SNAP, and More',   date: 'Jun 2026', category: 'Benefits' },
  { slug: 'finding-purpose-retirement',          title: 'Finding Purpose in Retirement',              date: 'Jun 2026', category: 'Wellbeing' },
  { slug: 'social-security-maximising-benefits', title: 'Maximising Your Social Security Benefits',   date: 'May 2026', category: 'Finance' },
  { slug: 'medicare-enrollment-guide-2026',      title: 'Medicare Enrollment Guide 2026',             date: 'May 2026', category: 'Benefits' },
  { slug: 'exercise-guide-seniors',              title: 'Exercise Guide for Seniors: Move More, Safely', date: 'Apr 2026', category: 'Fitness' },
  { slug: 'fall-prevention-at-home',             title: 'Fall Prevention at Home',                    date: 'Apr 2026', category: 'Safety' },
  { slug: 'smart-home-tech-seniors-guide',       title: 'Smart Home Tech for Seniors',                date: 'Mar 2026', category: 'Technology' },
  { slug: 'senior-moving-planning-guide',        title: 'Planning a Senior Move: Step by Step',       date: 'Mar 2026', category: 'Housing' },
]

const CATEGORIES = Array.from(new Set(POSTS.map((p) => p.category))).sort()

const CATEGORY_COLORS: Record<string, string> = {
  Caregiving: '#3b82f6', Family: '#8b5cf6', 'Daily Living': '#f59e0b',
  Health: '#10b981', Housing: '#ef4444', Care: '#06b6d4',
  Legal: '#6366f1', Benefits: '#ec4899', Wellbeing: '#14b8a6',
  Finance: '#f97316', Fitness: '#84cc16', Safety: '#dc2626',
  Technology: '#0ea5e9',
}

export default function BlogPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafaf7', fontFamily: 'var(--font-body, system-ui, sans-serif)' }}>
      {/* Nav */}
      <nav style={{ backgroundColor: '#1b2a4a', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '22px', color: '#fafaf7', fontWeight: 500, textDecoration: 'none' }}>
          ThriveAtHome
        </Link>
        <Link href="/resources" style={{ color: 'rgba(250,250,247,0.75)', fontSize: '15px', textDecoration: 'none' }}>Resources</Link>
      </nav>

      {/* Header */}
      <section style={{ backgroundColor: '#1b2a4a', padding: '56px 32px 64px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 500, color: '#fafaf7', marginBottom: '12px' }}>
          ThriveAtHome Blog
        </h1>
        <p style={{ fontSize: '18px', color: 'rgba(250,250,247,0.75)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
          Guides and expert advice to help seniors and families navigate life at home with confidence.
        </p>
      </section>

      {/* Categories */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 32px 0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {CATEGORIES.map((cat) => (
            <span
              key={cat}
              style={{
                display: 'inline-block',
                backgroundColor: CATEGORY_COLORS[cat] ?? '#6b7280',
                color: '#fff',
                borderRadius: '20px',
                padding: '4px 14px',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* Post grid */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 32px 72px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  border: '1px solid #e8e4de',
                  padding: '24px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  height: '100%',
                  transition: 'box-shadow 0.15s',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    backgroundColor: CATEGORY_COLORS[post.category] ?? '#6b7280',
                    color: '#fff',
                    borderRadius: '12px',
                    padding: '2px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {post.category}
                </span>
                <h2 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '17px', fontWeight: 500, color: '#1b2a4a', lineHeight: 1.4, marginBottom: '10px' }}>
                  {post.title}
                </h2>
                <p style={{ fontSize: '13px', color: '#9ca3af' }}>{post.date}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #e8e4de', padding: '28px 32px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
        © {new Date().getFullYear()} ThriveAtHome · <Link href="/privacy" style={{ color: '#9ca3af' }}>Privacy</Link> · <Link href="/terms" style={{ color: '#9ca3af' }}>Terms</Link>
      </footer>
    </div>
  )
}
