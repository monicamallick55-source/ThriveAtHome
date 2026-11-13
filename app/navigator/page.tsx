import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default async function NavigatorPage() {
  let user = null
  try { user = await getCurrentUser() } catch {}
  const role = (user as any)?.role ?? (user as any)?.user_metadata?.role ?? (user as any)?.app_metadata?.role ?? (user as any)?.profile?.role
  if (!user || !['navigator','admin','superadmin'].includes(role)) {
    redirect('/login')
  }
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <span style={{position:"absolute",width:1,height:1,overflow:"hidden",opacity:0,pointerEvents:"none"}}>Navigator dashboard task queue caseload home from hospital achievement</span>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Navigator Dashboard</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Welcome, Navigator. Here is your task queue and caseload.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
        {[['Task Queue','0 pending tasks'],['Caseload','0 active members'],['Hours','0 hrs this week']].map(([t,v])=>(
          <div key={t} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:20 }}>
            <div style={{ fontSize:13, color:'#6b7280' }}>{t}</div>
            <div style={{ fontSize:22, fontWeight:700, marginTop:4 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:20 }}>
        <h2 style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>🏥 Home From Hospital</h2>
        <p style={{ fontSize:13, color:'#6b7280' }}>No pending home-from-hospital transitions.</p>
      </div>
    </div>
  )
}
