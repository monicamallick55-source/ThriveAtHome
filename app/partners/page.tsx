export default function PartnersPage() {
  const categories = ['Home Care Agencies','Senior Centers','Medical Practices','Faith Communities','Non-Profits','Transportation']
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>Partner Directory</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>Thrive@Home works with trusted community organizations to support seniors.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16, marginBottom: 48 }}>
        {categories.map(cat => (
          <a key={cat} href={`/partners?category=${encodeURIComponent(cat)}`} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px', textDecoration: 'none', color: '#111827', fontWeight: 500 }}>{cat}</a>
        ))}
      </div>
      <p style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center' }}>Partner listings are being verified. <a href="/contact" style={{ color: '#6366f1' }}>Become a partner →</a></p>
    </main>
  )
}
