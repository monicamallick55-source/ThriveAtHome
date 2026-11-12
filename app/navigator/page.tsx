'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Member { id: string; name: string; status: string }
interface Task { id: string; title: string; due: string; member: string }

export default function NavigatorPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'caseload'|'tasks'|'hours'>('caseload')
  const [members, setMembers] = useState<Member[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [hours, setHours] = useState(0)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        const role = d?.role ?? d?.user_metadata?.role ?? d?.profile?.role
        if (!role || !['navigator','admin','superadmin'].includes(role)) {
          router.replace('/dashboard')
          return
        }
        setAuthChecked(true)
        fetch('/api/navigator/members').then(r=>r.json()).then(d=>setMembers(d.members??[]))
        fetch('/api/navigator/tasks').then(r=>r.json()).then(d=>setTasks(d.tasks??[]))
        fetch('/api/navigator/hours').then(r=>r.json()).then(d=>setHours(d.hours??0))
      })
      .catch(() => router.replace('/login'))
  }, [router])

  if (!authChecked) return <div className="p-6 text-center text-gray-500">Loading…</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Navigator Dashboard</h1>
      <div className="flex gap-2 mb-6 border-b">
        {(['caseload','tasks','hours'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 capitalize ${tab===t?'border-b-2 border-blue-600 font-semibold':'text-gray-600'}`}>
            {t==='hours'?'Hours Tracking':t==='caseload'?'My Caseload':'Task Queue'}
          </button>
        ))}
      </div>
      {tab==='caseload' && (
        <div>
          <h2 className="font-semibold mb-3">Members ({members.length})</h2>
          {members.length===0?<p className="text-gray-500">No members assigned yet.</p>
            :members.map(m=>(
              <div key={m.id} className="border rounded p-3 mb-2 flex justify-between">
                <span>{m.name}</span><span className="text-sm text-gray-500 capitalize">{m.status}</span>
              </div>
            ))}
        </div>
      )}
      {tab==='tasks' && (
        <div>
          <h2 className="font-semibold mb-3">Task Queue ({tasks.length})</h2>
          {tasks.length===0?<p className="text-gray-500">No tasks pending.</p>
            :tasks.map(t=>(
              <div key={t.id} className="border rounded p-3 mb-2">
                <div className="font-medium">{t.title}</div>
                <div className="text-sm text-gray-500">Member: {t.member} · Due: {t.due}</div>
              </div>
            ))}
        </div>
      )}
      {tab==='hours' && (
        <div>
          <h2 className="font-semibold mb-3">Hours This Month</h2>
          <div className="text-4xl font-bold text-blue-600">{hours}<span className="text-lg font-normal text-gray-500 ml-1">hrs</span></div>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Log Hours</button>
        </div>
      )}
    </div>
  )
}
