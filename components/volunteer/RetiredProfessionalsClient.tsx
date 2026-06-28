'use client'
import { useState } from 'react'

const SPECIALTIES = [
  { value: 'all', label: '✨ All Specialties' },
  { value: 'tax_help', label: '🧾 Tax Help' },
  { value: 'legal_guidance', label: '⚖️ Legal Guidance' },
  { value: 'medical_support', label: '🏥 Medical Support' },
  { value: 'tech_instruction', label: '💻 Tech Instruction' },
  { value: 'financial_planning', label: '📊 Financial Planning' },
  { value: 'career_counseling', label: '🎯 Career & Life Counseling' },
  { value: 'language_tutoring', label: '🌎 Language Tutoring' },
  { value: 'fitness_wellness', label: '🏃 Fitness & Wellness' },
  { value: 'other', label: '🌟 Other Expertise' },
]

const SPECIALTY_LABELS: Record<string, string> = Object.fromEntries(
  SPECIALTIES.filter(s => s.value !== 'all').map(s => [s.value, s.label])
)

interface Professional {
  id: string
  full_name: string
  city: string | null
  state: string | null
  volunteer_specialty: string | null
  professional_background: string | null
  interests: string[]
  languages: string[]
  total_hours_logged: number
  rating_average: number | null
}

interface Props { professionals: Professional[] }

export function RetiredProfessionalsClient({ professionals }: Props) {
  const [selectedSpecialty, setSelectedSpecialty] = useState('all')
  const [showApplyPrompt, setShowApplyPrompt] = useState(false)

  const filtered = selectedSpecialty === 'all'
    ? professionals
    : professionals.filter(p => p.volunteer_specialty === selectedSpecialty)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px' }}>
            Retired Professionals Network
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
            Experienced professionals sharing their expertise to help seniors navigate complex decisions.
          </p>
        </div>

        {/* Specialty filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
          {SPECIALTIES.map(s => (
            <button
              key={s.value}
              onClick={() => setSelectedSpecialty(s.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: selectedSpecialty === s.value ? '2px solid var(--color-teal)' : '1.5px solid var(--color-warm-grey)',
                backgroundColor: selectedSpecialty === s.value ? 'var(--color-teal)' : 'white',
                color: selectedSpecialty === s.value ? 'white' : 'var(--color-text-secondary)',
                fontSize: '14px',
                fontFamily: 'var(--font-body)',
                fontWeight: selectedSpecialty === s.value ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Become a professional volunteer CTA */}
        <div
          style={{
            backgroundColor: '#EEF2FF',
            border: '1.5px solid #C7D2FE',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <p style={{ fontWeight: 600, color: '#3730A3', fontFamily: 'var(--font-body)', fontSize: '16px', margin: 0 }}>
              Are you a retired professional?
            </p>
            <p style={{ color: '#4338CA', fontFamily: 'var(--font-body)', fontSize: '14px', margin: '4px 0 0' }}>
              Share your expertise and make a lasting difference in a senior&apos;s life.
            </p>
          </div>
          <a
            href="/volunteer/apply?track=professional"
            style={{
              backgroundColor: '#4F46E5',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '15px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Apply as a professional volunteer →
          </a>
        </div>

        {/* Professional cards */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px' }}>🎓</p>
            <p style={{ fontSize: '18px' }}>No professionals in this specialty yet.</p>
            <a href="/volunteer/apply?track=professional" style={{ color: 'var(--color-teal)', fontWeight: 600 }}>
              Be the first to volunteer →
            </a>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {filtered.map(pro => (
              <div
                key={pro.id}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid var(--color-warm-grey)',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#EEF2FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      flexShrink: 0,
                    }}
                  >
                    🎓
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--color-navy)', fontFamily: 'var(--font-body)', fontSize: '15px', margin: 0 }}>
                      {pro.full_name}
                    </p>
                    {(pro.city || pro.state) && (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontFamily: 'var(--font-body)', margin: '2px 0 0' }}>
                        📍 {[pro.city, pro.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {pro.volunteer_specialty && (
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#EEF2FF',
                      color: '#4338CA',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-body)',
                      width: 'fit-content',
                    }}
                  >
                    {SPECIALTY_LABELS[pro.volunteer_specialty] ?? pro.volunteer_specialty}
                  </span>
                )}

                {pro.professional_background && (
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', fontFamily: 'var(--font-body)', margin: 0, lineHeight: 1.5 }}>
                    {pro.professional_background.length > 120
                      ? pro.professional_background.slice(0, 120) + '…'
                      : pro.professional_background}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '12px', fontFamily: 'var(--font-body)' }}>
                    {Math.round(pro.total_hours_logged)} hrs volunteered
                    {pro.rating_average ? ` · ⭐ ${pro.rating_average.toFixed(1)}` : ''}
                  </span>
                </div>

                {pro.languages.length > 0 && (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', fontFamily: 'var(--font-body)', margin: 0 }}>
                    Speaks: {pro.languages.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {showApplyPrompt && (
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <a href="/volunteer/apply?track=professional" style={{ color: 'var(--color-teal)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
              Apply as a professional volunteer →
            </a>
          </div>
        )}
        {!showApplyPrompt && filtered.length > 0 && (
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              onClick={() => setShowApplyPrompt(true)}
              style={{ background: 'none', border: 'none', color: 'var(--color-teal)', fontWeight: 600, fontSize: '15px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              Join the Retired Professionals Network →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
