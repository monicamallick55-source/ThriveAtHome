import Link from 'next/link'

const TUTORIAL_CATEGORIES = [
  {
    emoji: '📱',
    title: 'Smartphone Basics',
    description: 'Making calls, sending texts, adjusting settings, and staying safe',
    tutorials: [
      'How to make and receive phone calls',
      'Sending and reading text messages',
      'Adjusting text size and display brightness',
      'Setting up voicemail',
      'How to block unwanted calls',
    ],
  },
  {
    emoji: '📹',
    title: 'Video Calls',
    description: 'FaceTime, Zoom, and video chatting with family',
    tutorials: [
      'How to use FaceTime on iPhone or iPad',
      'Joining a Zoom meeting',
      'Video calling on Android',
      'Troubleshooting a blurry or frozen video call',
      'How to turn on captions during video calls',
    ],
  },
  {
    emoji: '🛡️',
    title: 'Online Safety',
    description: 'Protecting yourself from scams, fraud, and privacy risks',
    tutorials: [
      'Recognising and avoiding phone scams',
      'What is phishing and how to spot it',
      'Safe online shopping — what to look for',
      'Creating strong passwords and staying secure',
      'What to do if you think you have been scammed',
    ],
  },
  {
    emoji: '💻',
    title: 'Computer & Tablet',
    description: 'Getting started with your computer, iPad, or tablet',
    tutorials: [
      'Turning on and shutting down your computer',
      'How to browse the internet safely',
      'Sending and receiving email',
      'Finding and using apps on your tablet',
      'How to keep your device updated',
    ],
  },
  {
    emoji: '📺',
    title: 'TV & Streaming',
    description: 'Netflix, YouTube, and enjoying entertainment at home',
    tutorials: [
      'Setting up Netflix or Amazon Prime',
      'How to use the YouTube app',
      'Connecting your phone to a smart TV',
      'Adjusting volume and captions on streaming services',
      'How to find specific shows and movies',
    ],
  },
]

export default function TechTutorialsPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', paddingBottom: '80px' }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'white', borderBottom: '1px solid var(--color-warm-grey)', boxShadow: 'var(--shadow-sm)', height: '64px', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard/services" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
            ← Tech Help
          </Link>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', fontWeight: 500 }}>ThriveAtHome</span>
          <div style={{ width: '120px' }} aria-hidden="true" />
        </div>
      </nav>

      {/* Header */}
      <div style={{ backgroundColor: 'var(--color-navy)', padding: '40px 24px 56px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 500, color: 'var(--color-cream)', letterSpacing: '-0.01em', margin: '0 0 12px' }}>
            Tech Help Tutorials
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'rgba(250,250,245,0.8)', margin: 0, lineHeight: 1.65 }}>
            Simple, clear guides for everyday technology — no jargon, no rushing.
          </p>
        </div>
      </div>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Helpline reminder */}
        <div style={{ backgroundColor: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 'var(--radius-xl)', padding: '20px 24px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '28px' }} aria-hidden="true">📞</span>
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: '#065f46', margin: '0 0 2px' }}>
              Need a real person? Call our Tech Helpline
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#047857', margin: 0 }}>
              <strong>(555) 987-6543</strong> — Monday through Friday, 9 AM to 5 PM. A volunteer tech helper will walk you through it step by step.
            </p>
          </div>
        </div>

        {/* Tutorial categories */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {TUTORIAL_CATEGORIES.map((category) => (
            <div
              key={category.title}
              style={{ backgroundColor: 'white', borderRadius: 'var(--radius-xl)', border: '1.5px solid var(--color-warm-grey)', boxShadow: 'var(--shadow-card)', padding: '28px 32px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <span style={{ fontSize: '32px', lineHeight: 1 }} aria-hidden="true">{category.emoji}</span>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>
                    {category.title}
                  </h2>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                    {category.description}
                  </p>
                </div>
              </div>
              <ul style={{ margin: 0, paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {category.tutorials.map((tutorial) => (
                  <li key={tutorial} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '28px', height: '28px', backgroundColor: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>▶</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-primary)' }}>
                      {tutorial}
                    </span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)', backgroundColor: '#f0fdf4', border: '1px solid #d1fae5', borderRadius: '20px', padding: '2px 8px', flexShrink: 0 }}>
                      Coming soon
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Request help CTA */}
        <div style={{ marginTop: '40px', backgroundColor: 'var(--color-navy)', borderRadius: 'var(--radius-xl)', padding: '32px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 500, color: 'var(--color-cream)', margin: '0 0 8px' }}>
            Don&apos;t see what you need?
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(250,250,245,0.8)', margin: '0 0 20px', lineHeight: 1.6 }}>
            Our volunteer tech helpers can assist with almost any technology question — in person or by phone.
          </p>
          <Link
            href="/dashboard/services"
            style={{ display: 'inline-block', padding: '14px 28px', backgroundColor: 'var(--color-teal)', color: 'white', borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, textDecoration: 'none', minHeight: '52px' }}
          >
            Request tech help →
          </Link>
        </div>
      </main>
    </div>
  )
}
