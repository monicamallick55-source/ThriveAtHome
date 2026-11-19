'use client'
import Link from 'next/link'

export default function ForVolunteersPage() {
  return (
    <main style={{ fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-cream)' }}>

      {/* HERO */}
      <section style={{ backgroundColor: 'var(--color-navy)', color: 'white', padding: '80px 24px 72px', textAlign: 'center' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-teal)', marginBottom: '16px' }}>
            Become a Volunteer
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 500, lineHeight: 1.15, marginBottom: '24px' }}>
            Make a real difference.<br/>One connection at a time.
          </h1>
          <p style={{ fontSize: '18px', lineHeight: 1.7, color: 'rgba(255,255,255,0.82)', maxWidth: '560px', margin: '0 auto 40px' }}>
            Seniors in your community need friendly voices, helping hands, and someone who cares. You can be that person — on your own schedule.
          </p>
          <Link href="/signup?role=volunteer" style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'var(--color-teal)', color: 'white', fontWeight: 600, fontSize: '17px', padding: '16px 36px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
            Apply to Volunteer
          </Link>
        </div>
      </section>

      {/* VOLUNTEER TYPES */}
      <section style={{ padding: '72px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 500, color: 'var(--color-navy)', textAlign: 'center', marginBottom: '12px' }}>
          How you can help
        </h2>
        <p style={{ textAlign: 'center', fontSize: '17px', color: 'var(--color-warm-grey)', marginBottom: '48px', maxWidth: '560px', margin: '0 auto 48px' }}>
          Every volunteer role fits different schedules, skills, and comfort levels.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          {[
            { icon: '📞', title: 'Friendly Caller', desc: 'Weekly 20-minute check-in calls to reduce isolation and loneliness. Perfect for remote volunteers.' },
            { icon: '🤝', title: 'Buddy Companion', desc: 'Regular companionship visits or video chats. Build a genuine friendship with a local senior.' },
            { icon: '🚗', title: 'Errand & Transport', desc: 'Help with grocery runs, medical appointments, or picking up prescriptions.' },
            { icon: '💻', title: 'Tech Helper', desc: 'Teach smartphone basics, video calling, or how to use apps — patience is the only requirement.' },
            { icon: '🎓', title: 'Skill Sharer', desc: 'Lead a virtual class in anything you know — cooking, music, finance, art, language, fitness.' },
            { icon: '🏠', title: 'Home Safety Check', desc: 'Walk through a senior's home and identify fall risks or safety improvements.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>{icon}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '10px' }}>{title}</h3>
              <p style={{ fontSize: '15px', lineHeight: 1.65, color: 'var(--color-warm-grey)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VOLUNTEER TRACKS */}
      <section style={{ backgroundColor: 'white', padding: '72px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 500, color: 'var(--color-navy)', textAlign: 'center', marginBottom: '48px' }}>
            Volunteer tracks
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {[
              { label: 'General Community', desc: 'Open to everyone 18+. Flexible hours, any skill.' },
              { label: 'Students & University', desc: 'Earn service hours. We work with 50+ universities.' },
              { label: 'Veterans & VSOs', desc: 'Specialized roles supporting fellow veterans and their families.' },
              { label: 'Retired Professionals', desc: 'Apply your career expertise — legal, medical, financial, tech.' },
              { label: 'Corporate Teams', desc: 'Group volunteer days and employer-sponsored programs.' },
              { label: 'Faith Communities', desc: 'Coordinate with your congregation for local senior outreach.' },
              { label: 'Neighbors', desc: 'Hyperlocal help for seniors within a few blocks of your home.' },
              { label: 'K-12 Service Learning', desc: 'Structured programs with teacher oversight and learning goals.' },
            ].map(({ label, desc }) => (
              <div key={label} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '24px 20px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '8px' }}>{label}</h3>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--color-warm-grey)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IMPACT STATS */}
      <section style={{ backgroundColor: 'var(--color-teal)', color: 'white', padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 500, marginBottom: '48px' }}>
            The impact of your time
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '32px' }}>
            {[
              { stat: '2,400+', label: 'Active volunteers' },
              { stat: '14,000+', label: 'Seniors served' },
              { stat: '87%', label: 'Report reduced loneliness' },
              { stat: '4.9★', label: 'Volunteer satisfaction' },
            ].map(({ stat, label }) => (
              <div key={label}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 500, lineHeight: 1 }}>{stat}</div>
                <div style={{ fontSize: '15px', marginTop: '8px', opacity: 0.85 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '72px 24px', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 500, color: 'var(--color-navy)', textAlign: 'center', marginBottom: '48px' }}>
          How it works
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {[
            { step: '1', title: 'Apply in 5 minutes', desc: 'Tell us about yourself, your availability, and which roles interest you.' },
            { step: '2', title: 'Background check', desc: 'We run a quick background check — standard for working with seniors.' },
            { step: '3', title: 'Short orientation', desc: 'A 30-minute online session covers our safety guidelines and tools.' },
            { step: '4', title: 'Get matched', desc: 'We match you with seniors whose needs align with your skills and location.' },
            { step: '5', title: 'Start helping', desc: 'Your first connection is supported by a Care Navigator. You're never alone.' },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--color-teal)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px' }}>{step}</div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>{title}</h3>
                <p style={{ fontSize: '15px', lineHeight: 1.65, color: 'var(--color-warm-grey)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FOOTER */}
      <section style={{ backgroundColor: 'var(--color-navy)', color: 'white', padding: '72px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3vw, 42px)', fontWeight: 500, marginBottom: '20px' }}>
            Ready to make a difference?
          </h2>
          <p style={{ fontSize: '17px', lineHeight: 1.7, color: 'rgba(255,255,255,0.82)', marginBottom: '36px' }}>
            Join thousands of volunteers giving seniors the connection and support they deserve.
          </p>
          <Link href="/signup?role=volunteer" style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'var(--color-teal)', color: 'white', fontWeight: 600, fontSize: '17px', padding: '16px 40px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
            Apply to Volunteer
          </Link>
        </div>
      </section>

    </main>
  )
}
