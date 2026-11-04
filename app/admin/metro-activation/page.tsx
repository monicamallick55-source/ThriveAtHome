'use client'
import { useState, useEffect } from 'react'

type Chapter = {
  id: string; city: string; state: string; zip_codes: string[]
  service_radius_miles: number; coordinator_name: string | null
  coordinator_email: string | null; notes: string | null
  is_active: boolean; member_count?: number; created_at: string
}

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

export default function MetroActivationPage() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [myChapterId, setMyChapterId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stateFilter, setStateFilter] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editChapter, setEditChapter] = useState<Chapter | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ city:'', state:'', zip_codes:'', service_radius_miles:25, coordinator_name:'', coordinator_email:'', notes:'' })

  useEffect(() => { load() }, [stateFilter, showInactive])

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (stateFilter) params.set('state', stateFilter)
    if (showInactive) params.set('active_only', 'false')
    const res = await fetch('/api/metro-chapters?' + params)
    const data = await res.json()
    setChapters(data.chapters ?? [])
    setIsAdmin(data.is_admin ?? false)
    setMyChapterId(data.my_chapter_id ?? null)
    setLoading(false)
  }

  async function toggleActive(chapter: Chapter) {
    setSaving(true)
    await fetch('/api/metro-chapters', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ chapter_id: chapter.id, is_active: !chapter.is_active }) })
    setSaving(false); load()
  }

  async function saveEdit() {
    if (!editChapter) return
    setSaving(true)
    await fetch('/api/metro-chapters', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ chapter_id: editChapter.id, coordinator_name: editChapter.coordinator_name, coordinator_email: editChapter.coordinator_email, notes: editChapter.notes }) })
    setSaving(false); setEditChapter(null); setMsg('Chapter updated.'); load()
  }

  async function createChapter() {
    setSaving(true)
    const payload = { ...form, zip_codes: form.zip_codes.split(',').map(z => z.trim()).filter(Boolean) }
    const res = await fetch('/api/metro-chapters', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
    const data = await res.json()
    setSaving(false)
    if (data.chapter) { setShowCreateModal(false); setForm({ city:'', state:'', zip_codes:'', service_radius_miles:25, coordinator_name:'', coordinator_email:'', notes:'' }); setMsg('Chapter created.'); load() }
  }

  const filtered = chapters.filter(c => !stateFilter || c.state === stateFilter)

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Metro Chapter Activation</h1>
          <p className="text-gray-500 text-sm mt-1">Geographic service areas for ThriveAtHome communities</p>
        </div>
        {isAdmin && <button onClick={() => setShowCreateModal(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">+ Add Chapter</button>}
      </div>

      {msg && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg text-sm">{msg}</div>}

      {!isAdmin && myChapterId && (
        <div className="mb-6 bg-teal-50 border border-teal-200 rounded-xl p-4">
          <p className="text-teal-800 font-medium text-sm">Your Chapter</p>
          {chapters.filter(c => c.id === myChapterId).map(c => (
            <div key={c.id} className="mt-2">
              <p className="font-semibold text-gray-900">{c.city}, {c.state}</p>
              {c.coordinator_name && <p className="text-sm text-gray-600">Coordinator: {c.coordinator_name}</p>}
              {c.coordinator_email && <p className="text-sm text-teal-600">{c.coordinator_email}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All States</option>
          {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {isAdmin && (
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded" />
            Show inactive chapters
          </label>
        )}
        <div className="ml-auto text-sm text-gray-500 self-center">{filtered.length} chapter{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      {loading ? <div className="text-center py-16 text-gray-400">Loading chapters…</div>
      : filtered.length === 0 ? <div className="text-center py-16 text-gray-400">No chapters found.</div>
      : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className={`border rounded-xl p-4 ${c.id === myChapterId ? 'border-teal-400 bg-teal-50' : c.is_active ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{c.city}, {c.state}</h3>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => setEditChapter({...c})} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded">Edit</button>
                    <button onClick={() => toggleActive(c)} disabled={saving} className={`text-xs px-2 py-1 border rounded ${c.is_active ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}>
                      {c.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600 space-y-1 mt-3">
                <div>📍 Radius: {c.service_radius_miles} mi</div>
                {c.coordinator_name && <div>👤 {c.coordinator_name}</div>}
                {c.coordinator_email && <div className="text-teal-600 text-xs">{c.coordinator_email}</div>}
                {isAdmin && c.member_count !== undefined && <div className="text-gray-500">👥 {c.member_count} member{c.member_count !== 1 ? 's' : ''}</div>}
                {c.zip_codes && c.zip_codes.length > 0 && <div className="text-xs text-gray-400 mt-1">ZIP: {c.zip_codes.slice(0,4).join(', ')}{c.zip_codes.length > 4 ? ` +${c.zip_codes.length - 4}` : ''}</div>}
              </div>
              {c.notes && <p className="text-xs text-gray-500 mt-2 italic border-t pt-2">{c.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Add Metro Chapter</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium">City *</label>
                  <input value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="San Francisco" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">State *</label>
                  <select value={form.state} onChange={e => setForm(f => ({...f, state: e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1">
                    <option value="">—</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">ZIP Codes (comma-separated)</label>
                <input value={form.zip_codes} onChange={e => setForm(f => ({...f, zip_codes: e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="94102, 94103" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Service Radius (miles)</label>
                <input type="number" value={form.service_radius_miles} onChange={e => setForm(f => ({...f, service_radius_miles: parseInt(e.target.value)}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" min={1} max={200} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Coordinator Name</label>
                <input value={form.coordinator_name} onChange={e => setForm(f => ({...f, coordinator_name: e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Coordinator Email</label>
                <input type="email" value={form.coordinator_email} onChange={e => setForm(f => ({...f, coordinator_email: e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" rows={2} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={createChapter} disabled={saving || !form.city || !form.state} className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm disabled:opacity-50">{saving ? 'Creating…' : 'Create Chapter'}</button>
            </div>
          </div>
        </div>
      )}

      {editChapter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-1">Edit Chapter</h2>
            <p className="text-sm text-gray-500 mb-4">{editChapter.city}, {editChapter.state}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Coordinator Name</label>
                <input value={editChapter.coordinator_name ?? ''} onChange={e => setEditChapter(ch => ch ? {...ch, coordinator_name: e.target.value} : ch)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Coordinator Email</label>
                <input type="email" value={editChapter.coordinator_email ?? ''} onChange={e => setEditChapter(ch => ch ? {...ch, coordinator_email: e.target.value} : ch)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Notes</label>
                <textarea value={editChapter.notes ?? ''} onChange={e => setEditChapter(ch => ch ? {...ch, notes: e.target.value} : ch)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" rows={2} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditChapter(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm disabled:opacity-50">{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
