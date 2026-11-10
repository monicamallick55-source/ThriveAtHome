interface Props {
  params: { token: string }
}

export default function EmployerInvitePage({ params }: Props) {
  return (
    <main style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        You&rsquo;ve Been Invited
      </h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>
        Your employer has invited you to join their ThriveAtHome corporate wellness program.
      </p>
      <div style={{ background: '#f8f9fc', border: '1px solid #e2e6ed', borderRadius: 10, padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Accept Your Invitation</h2>
        <a
          href={`/signup?invite=${params.token}&type=employer`}
          style={{ display: 'inline-block', background: '#2563eb', color: '#fff', padding: '10px 24px', borderRadius: 6, fontWeight: 600, textDecoration: 'none' }}
        >
          Create Account
        </a>
      </div>
      <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
        Already have an account? <a href="/login" style={{ color: '#2563eb' }}>Sign in</a> to link this invitation.
      </p>
    </main>
  )
}
