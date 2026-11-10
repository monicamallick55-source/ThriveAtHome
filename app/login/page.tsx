'use client'
import { useState } from 'react'

const ROLE_REDIRECTS: Record<string, string> = {
  employer: '/employer-admin', k12admin: '/school-admin',
  admin: '/admin', super_admin: '/admin', navigator: '/navigator',
  volunteer: '/volunteer/dashboard', orgadmin: '/org-admin',
  vsoadmin: '/vso-admin', uniadmin: '/university-admin',
  network: '/network-admin', seniorcenter: '/senior-center-admin',
  aaa: '/aaa-admin', agency: '/agency-admin', family: '/dashboard/family',
  member: '/dashboard', k12student: '/volunteer/dashboard',
  careworker: '/care-worker', student: '/volunteer/dashboard',
  veteran: '/volunteer/dashboard', retired_pro: '/volunteer/dashboard',
  corporate: '/volunteer/dashboard', neighbor: '/volunteer/dashboard',
  faith: '/volunteer/dashboard',
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Sign in failed'); setLoading(false); return }
      window.location.assign(data.redirect ?? '/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f9fafb', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 4px 24px rgba(0,0,0,0.08)', padding:'40px 36px', width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🌿</div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:700, margin:0 }}>Thrive@Home</h1>
          <p style={{ color:'#6b7280', marginTop:4, fontSize:'0.9rem' }}>Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:16 }}>
            <label htmlFor="email" style={{ display:'block', fontSize:'0.875rem', fontWeight:500, marginBottom:6 }}>Email</label>
            <input id="email" name="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"
              style={{ width:'100%', border:'1px solid #d1d5db', borderRadius:8, padding:'10px 12px', fontSize:'0.9rem', boxSizing:'border-box' }} />
          </div>
          <div style={{ marginBottom:24 }}>
            <label htmlFor="password" style={{ display:'block', fontSize:'0.875rem', fontWeight:500, marginBottom:6 }}>Password</label>
            <div style={{ position:'relative' }}>
              <input id="password" name="password" type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"
                style={{ width:'100%', border:'1px solid #d1d5db', borderRadius:8, padding:'10px 40px 10px 12px', fontSize:'0.9rem', boxSizing:'border-box' }} />
              <button type="button" onClick={()=>setShowPassword(s=>!s)} aria-label={showPassword?'Hide password':'Show password'}
                style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6b7280', fontSize:'0.8rem' }}>
                {showPassword?'Hide':'Show'}
              </button>
            </div>
          </div>
          {error && <p role="alert" style={{ color:'#dc2626', fontSize:'0.875rem', marginBottom:16, background:'#fef2f2', padding:'8px 12px', borderRadius:6 }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ width:'100%', background:'#6366f1', color:'#fff', border:'none', borderRadius:8, padding:'12px', fontSize:'0.95rem', fontWeight:600, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1 }}>
            {loading?'Signing in…':'Sign In'}
          </button>
        </form>
        <p style={{ textAlign:'center', marginTop:20, fontSize:'0.875rem', color:'#6b7280' }}>
          Don&apos;t have an account? <a href="/signup" style={{ color:'#6366f1', fontWeight:500 }}>Sign up</a>
        </p>
      </div>
    </main>
  )
}
