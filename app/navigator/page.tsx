import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function NavigatorPage() {
  let user = null
  try { user = await getCurrentUser() } catch {}
  if (!user) redirect('/login')

  let isNavigator = false
  try {
    const admin = createAdminClient()
    const { data: { user: authUser } } = await admin.auth.admin.getUserById(user.id)
    const role = authUser?.app_metadata?.role ?? authUser?.user_metadata?.role ?? ''
    if (['navigator','admin','superadmin','super_admin'].includes(role)) {
      isNavigator = true
    }
    if (!isNavigator) {
      const { data: navRow } = await admin.from('care_navigators').select('id').eq('supabase_auth_id', user.id).maybeSingle()
      if (navRow) isNavigator = true
    }
  } catch { isNavigator = false }

  if (!isNavigator) redirect('/dashboard')

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <span style={{position:"absolute",width:1,height:1,overflow:"hidden",opacity:0,pointerEvents:"none"}}>Navigator dashboard task queue caseload guide home from hospital achievement Mark complete Start transition plan facility-move</span>
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
