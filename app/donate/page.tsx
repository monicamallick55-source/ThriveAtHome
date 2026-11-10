export default function DonatePage() {
  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1>Support ThriveAtHome</h1>
      <p>Your donation helps seniors live with independence, dignity, and joy.</p>
      <p style={{ color: '#666', fontSize: '0.875rem' }}>
        ThriveAtHome is a for-profit company. Donations are <strong>not tax-deductible</strong>.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', margin: '1.5rem 0', flexWrap: 'wrap' }}>
        <button>$25</button>
        <button>$50</button>
        <button>$100</button>
        <button>$250</button>
        <button>Custom</button>
      </div>
      <form>
        <div style={{ marginBottom: '1rem' }}>
          <label>Name<br/>
            <input type="text" name="name" placeholder="Your name" style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Email<br/>
            <input type="email" name="email" placeholder="your@email.com" style={{ width: '100%' }} />
          </label>
        </div>
        <button type="submit">Donate Now</button>
      </form>
    </main>
  )
}
