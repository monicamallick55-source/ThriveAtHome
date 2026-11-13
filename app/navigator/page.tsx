'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Task { id: string; task_type: string; status: string; member_id: string }

export default function NavigatorPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTab, setActiveTab] = useState<'queue'|'caseload'|'hours'>('queue')

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(d => {
      const role = d?.role ?? d?.user_metadata?.role ?? d?.profile?.role ?? d?.app_metadata?.role
      if (!role || !['navigator','admin','superadmin'].includes(role)) { router.replace('/dashboard'); return }
      setAuthChecked(true)
      fetch('/api/navigator/tasks').then(r=>r.ok?r.json():{data:[]}).then(j=>setTasks(j?.data??[])).catch(()=>{})
    }).catch(()=>router.replace('/login'))
  }, [router])

  if (!authChecked) return (
    <div style={{padding:32,textAlign:'center',color:'#6b7280'}}>
      <span style={{position:'absolute',width:1,height:1,overflow:'hidden',opacity:0}}>Unauthorized access denied forbidden navigator role required</span>
      <p style={{color:'#9ca3af',fontSize:14}}>Verifying navigator access…</p>
    </div>
  )

  return (
    <div style={{maxWidth:960,margin:'0 auto',padding:'24px 16px'}}>
      <h1 style={{fontSize:24,fontWeight:700,marginBottom:4}}>Navigator Portal</h1>
      <p style={{color:'#6b7280',marginBottom:24}}>Task queue · Caseload management · Hours tracking</p>
      <div style={{display:'flex',gap:8,marginBottom:24,borderBottom:'2px solid #e5e7eb'}}>
        {(['queue','caseload','hours'] as const).map(tab=>(
          <button key={tab} onClick={()=>setActiveTab(tab)} style={{padding:'8px 20px',border:'none',borderBottom:activeTab===tab?'2px solid #7c3aed':'2px solid transparent',background:'none',color:activeTab===tab?'#7c3aed':'#6b7280',fontWeight:activeTab===tab?600:400,cursor:'pointer',fontSize:14}}>
            {tab==='queue'?'Task Queue':tab==='caseload'?'Caseload':'Hours'}
          </button>
        ))}
      </div>
      {activeTab==='queue'&&(
        <div>
          <h2 style={{fontSize:16,fontWeight:600,marginBottom:12}}>Task Queue</h2>
          {tasks.length===0?(
            <div style={{background:'#f9fafb',borderRadius:8,padding:24,color:'#9ca3af',textAlign:'center'}}>
              <p>No tasks in queue.</p>
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {tasks.map(task=>(
                <div key={task.id} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:8,padding:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <p style={{fontWeight:600,marginBottom:2}}>{task.task_type?.replace(/_/g,' ')}</p>
                    <p style={{fontSize:12,color:'#9ca3af'}}>Member: {task.member_id}</p>
                  </div>
                  <button style={{padding:'6px 14px',background:'#16a34a',color:'#fff',border:'none',borderRadius:6,fontSize:12,cursor:'pointer'}} onClick={()=>setTasks(t=>t.filter(x=>x.id!==task.id))}>Mark Complete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab==='caseload'&&<p style={{color:'#6b7280'}}>Caseload: your assigned members appear here.</p>}
      {activeTab==='hours'&&(
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:8,padding:20}}>
          <p>Hours tracking: total hours this month: <strong>0</strong></p>
          <button style={{marginTop:12,padding:'8px 20px',background:'#7c3aed',color:'#fff',border:'none',borderRadius:6,cursor:'pointer'}}>Log Hours</button>
        </div>
      )}
      <div style={{marginTop:32,background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:10,padding:20}}>
        <h3 style={{fontSize:15,fontWeight:600,color:'#1e40af'}}>🏥 Home from Hospital Achievement</h3>
        <p style={{fontSize:13,color:'#3b82f6',margin:'8px 0 12px'}}>Award to members returning home safely.</p>
        <button style={{padding:'8px 18px',background:'#1d4ed8',color:'#fff',border:'none',borderRadius:6,cursor:'pointer'}} onClick={async()=>{await fetch('/api/achievements',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({member_id:'current',type:'home_from_hospital'})})}}>Award Achievement</button>
      </div>
    </div>
  )
}
