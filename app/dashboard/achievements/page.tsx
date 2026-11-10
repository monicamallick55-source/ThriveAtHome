'use client'
export default function AchievementsPage() {
  const achievements = [
    { id: 1, title: 'First Check-In', desc: 'Completed your first daily check-in', icon: '⭐', earned: true },
    { id: 2, title: 'Community Member', desc: 'Joined a community group', icon: '🤝', earned: true },
    { id: 3, title: 'Birthday Celebrated', desc: 'Celebrated a milestone birthday', icon: '🎂', earned: false },
    { id: 4, title: '30-Day Streak', desc: '30 consecutive days of check-ins', icon: '🔥', earned: false },
  ]
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>My Achievements</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {achievements.map(a => (
          <div key={a.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem', opacity: a.earned ? 1 : 0.5 }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{a.icon}</div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>{a.title}</h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{a.desc}</p>
            {a.earned && <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>✓ Earned</span>}
          </div>
        ))}
      </div>
    </main>
  )
}
