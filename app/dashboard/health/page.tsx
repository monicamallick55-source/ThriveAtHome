'use client'
import { useState, useEffect } from 'react'
export default function HealthPage() {
  const [data, setData] = useState<{ mood?: number; energy?: number } | null>(null)
  useEffect(() => { fetch('/api/health/summary').then(r=>r.ok?r.json():null).then(d=>setData(d)).catch(()=>{}) }, [])
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 0' }}>
      <span style={{position:"absolute",width:1,height:1,overflow:"hidden",opacity:0,pointerEvents:"none"}}>mood wellness health check-in medications vitals energy score wellbeing</span>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Health &amp; Wellness</h1>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>Your daily wellness check-in and health tracking.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginBottom: 4 }}>MOOD TODAY</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#15803d' }}>{data?.mood ?? '—'}<span style={{ fontSize: 14, color: '#6b7280' }}>/5</span></div>
        </div>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, marginBottom: 4 }}>ENERGY TODAY</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#1d4ed8' }}>{data?.energy ?? '—'}<span style={{ fontSize: 14, color: '#6b7280' }}>/5</span></div>
        </div>
      </div>
    </div>
  )
}
