'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', backgroundColor: '#FAFAF5' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: 'white',
              borderRadius: '20px',
              border: '1px solid #E8E4DC',
              boxShadow: '0 4px 24px rgba(27,58,107,0.08)',
              padding: '48px 40px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠</div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 500,
                color: '#1B3A6B',
                marginBottom: '12px',
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: '18px',
                color: '#5E5852',
                marginBottom: '32px',
                lineHeight: 1.6,
              }}
            >
              We encountered an unexpected error. Please try again or contact our support team if the problem persists.
            </p>
            <button
              onClick={reset}
              style={{
                backgroundColor: '#1A7A6A',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 32px',
                fontSize: '18px',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '56px',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
