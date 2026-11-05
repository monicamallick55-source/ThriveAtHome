'use client'

/**
 * app/dashboard/grief-support/page.tsx — Grief Support & Pathways
 * TC-LT001, TC-M008, TC-MHC004
 * Must contain all 9 grief pathway keywords.
 */

export default function GriefSupportPage() {
  const PATHWAYS = [
    {
      id: 'loss',
      icon: '🕊️',
      title: 'Loss of a Loved One',
      keywords: 'loss of a loved one',
      description: 'Compassionate support after the death of a spouse, partner, family member, or close friend. Connect with others who understand.',
      color: '#7c3aed',
    },
    {
      id: 'diagnosis',
      icon: '🏥',
      title: 'Major Health Diagnosis',
      keywords: 'major health diagnosis',
      description: 'Navigating a serious health diagnosis — your own or a loved one\'s. Find resources, peer support, and guided next steps.',
      color: '#dc2626',
    },
    {
      id: 'life-change',
      icon: '🔄',
      title: 'Major Life Change',
      keywords: 'major life change',
      description: 'Big transitions — moving, retirement, the end of a career — can bring unexpected grief. You are not alone.',
      color: '#d97706',
    },
    {
      id: 'caregiver',
      icon: '🤝',
      title: 'Caregiver Support',
      keywords: 'caregiver support',
      description: 'Supporting someone you love is deeply meaningful — and deeply exhausting. Find support for yourself as a caregiver.',
      color: '#16a34a',
    },
    {
      id: 'divorce',
      icon: '💔',
      title: 'Divorce & Separation',
      keywords: 'divorce',
      description: 'The end of a long marriage or partnership brings its own kind of grief. Connect with others navigating this path.',
      color: '#e11d48',
    },
    {
      id: 'independence',
      icon: '🏠',
      title: 'Loss of Independence',
      keywords: 'loss of independence',
      description: 'Adjusting to needing more help — with mobility, driving, or daily tasks — can be difficult. Support is here.',
      color: '#0891b2',
    },
    {
      id: 'anticipatory',
      icon: '⏳',
      title: 'Anticipatory Grief',
      keywords: 'anticipatory grief',
      description: 'Grieving a loss before it happens — a terminal diagnosis, a loved one\'s decline — is real and valid. Find guidance here.',
      color: '#6366f1',
    },
    {
      id: 'financial',
      icon: '💼',
      title: 'Financial Loss & Hardship',
      keywords: 'financial loss',
      description: 'Major financial changes — job loss, retirement income shifts, or unexpected costs — can trigger grief and anxiety.',
      color: '#059669',
    },
    {
      id: 'pet',
      icon: '🐾',
      title: 'Pet Loss',
      keywords: 'pet loss',
      description: 'Losing a beloved animal companion is a real and significant loss. Connect with others who understand the depth of this grief.',
      color: '#c2410c',
    },
  ]

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 0' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Grief Support</h1>
      <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
        Grief takes many forms. ThriveAtHome offers compassionate support for each of life&apos;s most
        difficult transitions. Choose a pathway that resonates with where you are right now.
      </p>

      <div style={{ display: 'grid', gap: 16 }}>
        {PATHWAYS.map(pathway => (
          <div
            key={pathway.id}
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderLeft: `4px solid ${pathway.color}`,
              borderRadius: 10,
              padding: 20,
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: 28, flexShrink: 0 }}>{pathway.icon}</span>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#111827' }}>
                {pathway.title}
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
                {pathway.description}
              </p>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <a
                  href={`/dashboard/grief-support/${pathway.id}`}
                  style={{
                    padding: '6px 14px',
                    background: pathway.color,
                    color: '#fff',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  Explore Pathway
                </a>
                <a
                  href="/dashboard/grief-circles"
                  style={{
                    padding: '6px 14px',
                    background: '#f3f4f6',
                    color: '#374151',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  Join a Circle
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 32,
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: 12,
        padding: 20,
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 14, color: '#15803d', fontWeight: 500, margin: 0 }}>
          🤝 Need immediate support? Your Navigator is here to help.
        </p>
        <a
          href="/dashboard/navigator"
          style={{
            display: 'inline-block',
            marginTop: 10,
            padding: '8px 20px',
            background: '#16a34a',
            color: '#fff',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Talk to My Navigator
        </a>
      </div>
    </div>
  )
}
