'use client'
import { useState, useEffect } from 'react'

type Program = { id:string; university_name:string; name:string; program_type:string; contact_name:string|null; contact_email:string|null; required_hours:number|null; term_start:string|null; term_end:string|null; max_students:number|null; description:string|null; active_volunteers:number }
type App = { id:string; program_id:string; status:string; created_at:string; university_programs:{ name:string; university_name:string; program_type:string }|null }
type Hour = { id:string; service_date:string; hours:number; activity_type:string; notes:string|null; verified:boolean; university_programs:{ name:string; university_name:string }|null }

const TYPE_LABELS: Record<string,string> = { service_learning:'Service Learning', internship:'Internship', capstone:'Capstone', community_service:'Community Service', research:'Research', work_study:'Work Study' }
const STATUS_COLORS: Record<string,string> = { pending:'bg-yellow-100 text-yellow-700', approved:'bg-green-100 text-green-700', rejected:'bg-red-100 text-red-700', completed:'bg-blue-100 text-blue-700' }

export default function UniversityAdminPage() {
  const [tab, setTab] = useState<'programs'|'my_apps'|'my_hours'>('programs')
  const [programs, setPrograms] = useState<Program[]>([])
  const [myHours, setMyHours] = useState<Hour[]>([])
  const [myApps, setMyApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [applyTarget, setApplyTarget] = useState<Program|null>(null)
  const [applyNote, setApplyNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ university_name:'', name:'', program_type:'service_learning', contact_name:'', contact_email:'', required_hours:'', term_start:'', term_end:'', max_students:'', description:'' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [pr, mr] = await Promise.all([fetch('/api/university-volunteers'), fetch('/api/university-volunteers?my=true')])
    const [pd, md] = await Promise.all([pr.json(), mr.json()])
    setPrograms(pd.programs ?? []); setMyHours(md.hours ?? []); setMyApps(md.applications ?? [])
    setLoading(false)
  }

  async function applyToProgram() {
    if (!applyTarget) return
    setSaving(true)
    const res = await fetch('/api/volunteer-applications', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ program_id: applyTarget.id, notes: applyNote, program_source:'university' }) })
    const data = await res.json()
    setSaving(false)
    if (data.application) { setApplyTarget(null); setApplyNote(''); setMsg('Application submitted!'); load() }
  }

  async function createProgram() {
    setSaving(true)
    const payload = { ...form, required_hours: form.required_hours ? parseInt(form.required_hours) : null, max_students: form.max_students ? parseInt(form.max_students) : null }
    const res = await fetch('/api/university-volunteers', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
    const data = await res.json()
    setSaving(false)
    if (data.program) { setShowCreateModal(false); setMsg('Program created.'); load() }
  }

  const totalHours = myHours.reduce((s,h) => s + h.hours, 0)
  const verifiedHours = myHours.filter(h => h.verified).reduce((s,h) => s + h.hours, 0)

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">University Volunteer Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Student service-learning and community engagement programs</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">+ Add Program</button>
      </div>

      {msg && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg text-sm">{msg}</div>}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-indigo-50 rounded-xl p-4 text-center"><div className="text-3xl font-bold text-indigo-700">{totalHours}</div><div className="text-sm text-indigo-600 mt-1">Total Hours Logged</div></div>
        <div className="bg-green-50 rounded-xl p-4 text-center"><div className="text-3xl font-bold text-green-700">{verifiedHours}</div><div className="text-sm text-green-600 mt-1">Verified Hours</div></div>
        <div className="bg-purple-50 rounded-xl p-4 text-center"><div className="text-3xl font-bold text-purple-700">{myApps.filter(a => a.status === 'approved').length}</div><div className="text-sm text-purple-600 mt-1">Active Programs</div></div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
        {(['programs','my_apps','my_hours'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab===t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t==='programs' ? 'Open Programs' : t==='my_apps' ? 'My Applications' : 'My Hours'}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-16 text-gray-400">Loading…</div>
      : tab==='programs' ? (
        <div className="space-y-4">
          {programs.length === 0 ? <div className="text-center py-16 text-gray-400">No programs available yet.</div>
          : programs.map(p => (
            <div key={p.id} className="border border-gray-200 rounded-xl p-5 bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{TYPE_LABELS[p.program_type] ?? p.program_type}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">🏛️ {p.university_name}</p>
                </div>
                <button onClick={() => { setApplyTarget(p); setApplyNote('') }} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700">Apply</button>
              </div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                {p.required_hours && <div>⏱️ {p.required_hours} hrs required</div>}
                {p.max_students && <div>👥 Max {p.max_students} students</div>}
                {p.active_volunteers > 0 && <div>✅ {p.active_volunteers} active</div>}
                {p.term_start && <div>📅 {p.term_start} – {p.term_end ?? '?'}</div>}
              </div>
              {p.description && <p className="text-sm text-gray-600 mt-2">{p.description}</p>}
              {p.contact_email && <p className="text-xs text-gray-400 mt-2">Contact: {p.contact_name ?? ''} · {p.contact_email}</p>}
            </div>
          ))}
        </div>
      ) : tab==='my_apps' ? (
        <div className="space-y-3">
          {myApps.length === 0 ? <div className="text-center py-16 text-gray-400">No applications yet.</div>
          : myApps.map(a => (
            <div key={a.id} className="border border-gray-200 rounded-xl p-4 bg-white flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{a.university_programs?.name ?? '—'}</p>
                <p className="text-sm text-gray-500">{a.university_programs?.university_name}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[a.status] ?? 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
                <p className="text-xs text-gray-400 mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {myHours.length === 0 ? <div className="text-center py-16 text-gray-400">No hours logged yet.</div>
          : myHours.map(h => (
            <div key={h.id} className="border border-gray-200 rounded-xl p-4 bg-white flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{h.activity_type.replace(/_/g,' ')}</p>
                <p className="text-sm text-gray-500">{h.university_programs?.name ?? 'General volunteer'}</p>
                {h.notes && <p className="text-xs text-gray-400 mt-1">{h.notes}</p>}
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-indigo-700">{h.hours}h</p>
                <p className="text-xs text-gray-400">{new Date(h.service_date).toLocaleDateString()}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${h.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{h.verified ? 'Verified' : 'Pending'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {applyTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-1">Apply to Program</h2>
            <p className="text-sm text-gray-500 mb-4">{applyTarget.name} · {applyTarget.university_name}</p>
            <div>
              <label className="text-xs text-gray-500 font-medium">Why are you interested? (optional)</label>
              <textarea value={applyNote} onChange={e => setApplyNote(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" rows={3} placeholder="Share your motivation…" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setApplyTarget(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={applyToProgram} disabled={saving} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm disabled:opacity-50">{saving ? 'Submitting…' : 'Submit Application'}</button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md my-4">
            <h2 className="text-lg font-bold mb-4">Add University Program</h2>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-500 font-medium">University Name *</label><input value={form.university_name} onChange={e => setForm(f=>({...f,university_name:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="UC Berkeley" /></div>
              <div><label className="text-xs text-gray-500 font-medium">Program Name *</label><input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" /></div>
              <div><label className="text-xs text-gray-500 font-medium">Program Type *</label>
                <select value={form.program_type} onChange={e => setForm(f=>({...f,program_type:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1">
                  {Object.entries(TYPE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500 font-medium">Required Hours</label><input type="number" value={form.required_hours} onChange={e => setForm(f=>({...f,required_hours:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="40" /></div>
                <div><label className="text-xs text-gray-500 font-medium">Max Students</label><input type="number" value={form.max_students} onChange={e => setForm(f=>({...f,max_students:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500 font-medium">Term Start</label><input type="date" value={form.term_start} onChange={e => setForm(f=>({...f,term_start:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" /></div>
                <div><label className="text-xs text-gray-500 font-medium">Term End</label><input type="date" value={form.term_end} onChange={e => setForm(f=>({...f,term_end:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" /></div>
              </div>
              <div><label className="text-xs text-gray-500 font-medium">Contact Email</label><input type="email" value={form.contact_email} onChange={e => setForm(f=>({...f,contact_email:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" /></div>
              <div><label className="text-xs text-gray-500 font-medium">Description</label><textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" rows={2} /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={createProgram} disabled={saving || !form.university_name || !form.name} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm disabled:opacity-50">{saving ? 'Creating…' : 'Create Program'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
