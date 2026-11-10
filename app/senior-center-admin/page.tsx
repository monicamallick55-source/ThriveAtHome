'use client'
import { useState, useEffect } from 'react'
import SupportWidget from '@/components/SupportWidget'
export default function SeniorCenterAdminPage() {
  const [stats, setStats] = useState<any>(null)
  useEffect(() => { fetch('/api/senior-center-admin/stats').then(r=>r.json()).then(setStats).catch(()=>setStats({})) }, [])
  return (
    <div style={{ fontFamily:'system-ui,sans-serif', minHeight:'100vh', background:'#f9fafb' }}>
      <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'20px 32px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div><h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'#1f2937', margin:0 }}>Senior Center Admin</h1><p style={{ color:'#6b7280', fontSize:'0.85rem', margin:'2px 0 0' }}>Senior Center Portal</p></div>
          <a href="/senior-center-admin/support" style={{ padding:'8px 16px', border:'1px solid #e5e7eb', borderRadius:8, fontSize:'0.85rem', color:'#374151', textDecoration:'none' }}>Support</a>
        </div>
      </div>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px', display:'grid', gridTemplateColumns:'1fr 320px', gap:32 }}>
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16, marginBottom:24 }}>
            {[{l:'Total Members',v:stats?.total_members??'—'},{l:'Active This Month',v:stats?.active_members??'—'},{l:'Volunteer Matches',v:stats?.volunteer_matches??'—'},{l:'Events This Month',v:stats?.events_this_month??'—'}].map(s=>(
              <div key={s.l} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'20px 24px' }}>
                <div style={{ fontSize:'1.6rem', fontWeight:800, color:'#1f2937' }}>{s.v}</div>
                <div style={{ fontSize:'0.8rem', color:'#6b7280', marginTop:4 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:24 }}>
            <h2 style={{ fontSize:'1rem', fontWeight:700, color:'#1f2937', margin:'0 0 12px' }}>Quick Actions</h2>
            <div style={{ display:'flex', gap:12 }}>
              <a href="/senior-center-admin/members" style={{ padding:'10px 20px', background:'#6366f1', color:'#fff', borderRadius:8, textDecoration:'none', fontSize:'0.875rem', fontWeight:600 }}>Manage Members</a>
              <a href="/senior-center-admin/reports" style={{ padding:'10px 20px', background:'#fff', border:'1px solid #e5e7eb', color:'#374151', borderRadius:8, textDecoration:'none', fontSize:'0.875rem' }}>Reports</a>
            </div>
          </div>
        </div>
        <div><SupportWidget variant="b2b" compact /></div>
      </div>
    </div>
  )
}
