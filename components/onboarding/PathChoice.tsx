'use client'

interface PathChoiceProps {
  onSelf: () => void
  onVoice: () => void
}

export default function PathChoice({ onSelf, onVoice }: PathChoiceProps) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', padding: '32px 16px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px' }}>
          <a href="/" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← Home
          </a>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-navy)', fontWeight: 500, margin: 0 }}>Thrive@Home</p>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--color-navy)', fontWeight: 600, margin: '0 0 12px' }}>
            Welcome! Let&apos;s get you set up
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)', margin: 0 }}>
            How would you like to complete your profile?
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button onClick={onSelf} style={{ width: '100%', background: 'var(--color-warm-white)', border: '2px solid var(--color-warm-grey)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', cursor: 'pointer', textAlign: 'left', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '32px' }}>✏️</span>
              <div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '19px', fontWeight: 600, color: 'var(--color-navy)', margin: '0 0 4px' }}>I&apos;ll fill it in myself</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0 }}>Complete the short form at your own pace</p>
              </div>
            </div>
          </button>
          <button onClick={onVoice} style={{ width: '100%', background: 'linear-gradient(135deg, var(--color-navy) 0%, #1a4d6e 100%)', border: '2px solid transparent', borderRadius: 'var(--radius-xl)', padding: '28px 32px', cursor: 'pointer', textAlign: 'left', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '32px' }}>🎙️</span>
              <div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '19px', fontWeight: 600, color: '#fff', margin: '0 0 4px' }}>Quinn can help fill the form</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(255,255,255,0.75)', margin: '0 0 8px' }}>Talk with Quinn — she&apos;ll ask the questions, confirm what she heard, and submit your profile for you</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.18)', borderRadius: '20px', padding: '4px 12px' }}>📞 Starts immediately</span>
              </div>
            </div>
          </button>
        </div>
        <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '24px' }}>Either way, it only takes a few minutes.</p>
      </div>
    </div>
  )
}
