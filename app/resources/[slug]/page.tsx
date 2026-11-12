export default function ResourcePage({ params }: { params: { slug: string } }) {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
      <a href="/resources" style={{ color: '#6366f1', textDecoration: 'none', fontSize: 14 }}>← All Resources</a>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: 16, marginBottom: 8, textTransform: 'capitalize' }}>{params.slug.replace(/-/g, ' ')}</h1>
      <p style={{ color: '#6b7280' }}>This resource is being prepared. Check back soon.</p>
    </main>
  )
}
