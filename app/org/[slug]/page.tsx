import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublicOrgBySlug, getPublicOrgPrograms } from '@/lib/data/communityOrgs'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data: org } = await getPublicOrgBySlug(slug)
  if (!org) return { title: 'Village — ThriveAtHome' }
  return { title: `${org.org_name} — ThriveAtHome` }
}

const PROGRAM_TYPE_ICONS: Record<string, string> = {
  social: '🤝',
  transport: '🚗',
  meals: '🍽️',
  technology: '💻',
  health: '🩺',
  education: '📚',
  advocacy: '📢',
  home_maintenance: '🔧',
  general: '⭐',
}

export default async function PublicOrgPage({ params }: Props) {
  const { slug } = await params
  const [{ data: org }, ] = await Promise.all([
    getPublicOrgBySlug(slug),
  ])

  if (!org) notFound()

  const { data: programs } = await getPublicOrgPrograms(org.id)

  const orgTypeLabel = org.org_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      {/* Nav */}
      <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', fontWeight: 500, textDecoration: 'none' }}>ThriveAtHome</a>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <a href="/login" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontFamily: 'var(--font-body)', textDecoration: 'none' }}>Sign in</a>
          <a href="/signup" style={{ padding: '8px 18px', backgroundColor: 'var(--color-teal)', color: 'white', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: 600, textDecoration: 'none' }}>Join ThriveAtHome</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ backgroundColor: 'var(--color-navy)', padding: '48px 32px 56px', color: 'white', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>{orgTypeLabel}</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '42px', fontWeight: 500, color: 'var(--color-cream)', marginBottom: '16px', lineHeight: 1.15 }}>{org.org_name}</h1>
        {org.city && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'rgba(255,255,255,0.75)', marginBottom: '8px' }}>
            📍 {org.city}{org.state ? `, ${org.state}` : ''}
          </p>
        )}
        {org.member_count > 0 && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(255,255,255,0.65)' }}>
            {org.member_count} member{org.member_count !== 1 ? 's' : ''} and growing
          </p>
        )}
      </div>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 32px' }}>

        {/* About */}
        {org.description && (
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>About Us</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{org.description}</p>
            {org.service_area_description && (
              <div style={{ marginTop: '20px', padding: '16px 20px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #E8E4DC' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0 }}>
                  <strong>Service area:</strong> {org.service_area_description}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Programs */}
        {programs.length > 0 && (
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>Our Programs</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              Services and programs we offer to our community.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {programs.map(program => (
                <div key={program.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E8E4DC' }}>
                  <div style={{ fontSize: '28px', marginBottom: '12px' }}>{PROGRAM_TYPE_ICONS[program.program_type] ?? '⭐'}</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>{program.program_name}</h3>
                  {program.description && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>{program.description}</p>
                  )}
                  {program.schedule_description && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-teal)', fontWeight: 500 }}>📅 {program.schedule_description}</p>
                  )}
                  {program.volunteers_needed > 0 && (
                    <div style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: '#F0F9F7', borderRadius: '6px' }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-teal)', margin: 0 }}>
                        🙋 {program.volunteers_needed - program.volunteers_enrolled} volunteer spot{(program.volunteers_needed - program.volunteers_enrolled) !== 1 ? 's' : ''} open
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Membership */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>Become a Member</h2>
          {org.dues_description && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.65, fontStyle: 'italic' }}>{org.dues_description}</p>
          )}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { label: 'Sliding Scale — Low', cents: org.annual_dues_sliding_low_cents },
              { label: 'Sliding Scale — Mid', cents: org.annual_dues_sliding_mid_cents },
              { label: 'Standard', cents: org.annual_dues_standard_cents },
            ].map(tier => (
              <div key={tier.label} style={{ padding: '20px 28px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E8E4DC', textAlign: 'center', minWidth: '160px' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '28px', fontWeight: 700, color: 'var(--color-navy)' }}>
                  {tier.cents === 0 ? 'Free' : `$${Math.round(tier.cents / 100)}`}
                </div>
                {tier.cents > 0 && <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>/year</div>}
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginTop: '6px' }}>{tier.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Volunteer */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>Volunteer With Us</h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.65 }}>
            Help neighbors in your community. Volunteers give rides, share meals, offer tech help, and more — on your own schedule.
          </p>
          <a href="/volunteer/apply" style={{ display: 'inline-block', padding: '14px 32px', backgroundColor: 'var(--color-teal)', color: 'white', borderRadius: '10px', fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, textDecoration: 'none' }}>
            Apply to Volunteer
          </a>
        </section>

        {/* Contact */}
        <section style={{ padding: '32px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E8E4DC' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>Get in Touch</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0 }}>
              <strong>Contact:</strong> {org.contact_name}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0 }}>
              <strong>Email:</strong>{' '}
              <a href={`mailto:${org.contact_email}`} style={{ color: 'var(--color-teal)', textDecoration: 'none' }}>{org.contact_email}</a>
            </p>
            {org.contact_phone && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0 }}>
                <strong>Phone:</strong> {org.contact_phone}
              </p>
            )}
            {org.website_url && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0 }}>
                <strong>Website:</strong>{' '}
                <a href={org.website_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-teal)', textDecoration: 'none' }}>{org.website_url}</a>
              </p>
            )}
          </div>
        </section>

      </main>

      <footer style={{ textAlign: 'center', padding: '32px', borderTop: '1px solid #E8E4DC', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
        Powered by <a href="/" style={{ color: 'var(--color-teal)', textDecoration: 'none' }}>ThriveAtHome</a> — senior care coordination platform
      </footer>
    </div>
  )
}
