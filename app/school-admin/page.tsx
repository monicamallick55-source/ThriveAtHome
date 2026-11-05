'use client'

/**
 * app/school-admin/page.tsx — G7.9 K-12 Curriculum Programs
 * School partnership programs connecting seniors with students.
 * Shows programs by grade band; members can volunteer to participate.
 */

import { useState, useEffect } from 'react'

type SchoolProgram = {
  id: string
  school_name: string
  name: string
  program_type: string
  grade_band: string
  is_remote: boolean
  frequency: string | null
  session_duration_minutes: number | null
  max_participants: number | null
  contact_name: string | null
  contact_email: string | null
  description: string | null
  curriculum_notes: string | null
  district: string | null
  city: string | null
  state: string | null
  my_status: string | null
}

type Participation = {
  id: string
  program_id: string
  status: string
  created_at: string
  school_programs: {
    name: string
    school_name: string
    program_type: string
    grade_band: string
    is_remote: boolean
  } | null
}

const GRADE_BANDS = ['K-2', '3-5', '6-8', '9-12', 'K-5', 'K-8', 'K-12', '6-12']

const TYPE_LABELS: Record<string, string> = {
  pen_pals: '✉️ Pen Pals',
  virtual_reading: '📖 Virtual Reading',
  stem_mentorship: '🔬 STEM Mentorship',
  art_music: '🎨 Art & Music',
  life_skills: '🧰 Life Skills',
  history_storytelling: '📜 History & Storytelling',
  career_day: '💼 Career Day',
  tutoring: '📐 Tutoring',
  book_club: '📚 Book Club',
  general: '🤝 General',
}

const GRADE_ICONS: Record<string, string> = {
  'K-2': '🌱',
  '3-5': '🌿',
  '6-8': '🌳',
  '9-12': '🎓',
  'K-5': '🌱',
  'K-8': '🌿',
  'K-12': '🌳',
  '6-12': '🎓',
}

export default function SchoolAdminPage() {
  const [tab, setTab] = useState<'programs' | 'my_programs'>('programs')
  const [programs, setPrograms] = useState<SchoolProgram[]>([])
  const [myParts, setMyParts] = useState<Participation[]>([])
  const [loading, setLoading] = useState(true)
  const [gradeFilter, setGradeFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [joinTarget, setJoinTarget] = useState<SchoolProgram | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const [form, setForm] = useState({
    school_name: '', name: '', program_type: 'pen_pals', grade_band: 'K-5',
    is_remote: false, frequency: '', session_duration_minutes: '',
    max_participants: '', contact_name: '', contact_email: '',
    description: '', curriculum_notes: '', district: '', city: '', state: '',
  })

  useEffect(() => { load() }, [gradeFilter, typeFilter, remoteOnly])

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (gradeFilter) params.set('grade_band', gradeFilter)
    if (typeFilter) params.set('type', typeFilter)
    if (remoteOnly) params.set('remote', 'true')

    const [progRes, myRes] = await Promise.all([
      fetch(`/api/school-programs?${params}`),
      fetch('/api/school-programs?my=true'),
    ])
    const progData = await progRes.json()
    const myData = await myRes.json()
    setPrograms(progData.programs ?? [])
    setMyParts(myData.participations ?? [])
    setLoading(false)
  }

  async function joinProgram() {
    if (!joinTarget) return
    setSaving(true)
    const res = await fetch('/api/school-program-participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ program_id: joinTarget.id }),
    })
    setSaving(false)
    if (res.ok) {
      setJoinTarget(null)
      setMsg(`Signed up for ${joinTarget.name}!`)
      load()
    }
  }

  async function createProgram() {
    setSaving(true)
    const payload = {
      ...form,
      session_duration_minutes: form.session_duration_minutes ? parseInt(form.session_duration_minutes) : null,
      max_participants: form.max_participants ? parseInt(form.max_participants) : null,
    }
    const res = await fetch('/api/school-programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setSaving(false)
    if (data.program) {
      setShowCreateModal(false)
      setMsg('School program created.')
      load()
    }
  }

  // Group programs by grade band
  const grouped = programs.reduce((acc: Record<string, SchoolProgram[]>, p) => {
    if (!acc[p.grade_band]) acc[p.grade_band] = []
    acc[p.grade_band].push(p)
    return acc
  }, {})

  const sortedBands = GRADE_BANDS.filter(b => grouped[b])

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">K-12 School Programs</h1>
          <p className="text-gray-500 text-sm mt-1">Connecting seniors with students for intergenerational learning</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700">
          + Add Program
        </button>
      </div>

      {msg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg text-sm">{msg}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-orange-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-orange-700">{programs.length}</div>
          <div className="text-sm text-orange-600 mt-1">Active Programs</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-700">{new Set(programs.map(p => p.school_name)).size}</div>
          <div className="text-sm text-blue-600 mt-1">Partner Schools</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-700">{myParts.filter(p => p.status === 'active').length}</div>
          <div className="text-sm text-green-600 mt-1">My Programs</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
        {(['programs', 'my_programs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'programs' ? 'Find Programs' : 'My Programs'}
          </button>
        ))}
      </div>

      {tab === 'programs' && (
        <>
          {/* Filters */}
          <div className="flex gap-3 mb-5 flex-wrap">
            <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">All Grade Levels</option>
              {GRADE_BANDS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">All Types</option>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={remoteOnly} onChange={e => setRemoteOnly(e.target.checked)} className="rounded" />
              Virtual only
            </label>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400">Loading programs…</div>
          ) : sortedBands.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No programs match your filters.</div>
          ) : sortedBands.map(band => (
            <div key={band} className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-orange-100 text-orange-700 text-sm font-semibold px-3 py-1 rounded-full">
                  {GRADE_ICONS[band]} Grades {band}
                </div>
                <div className="h-px bg-gray-200 flex-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {grouped[band].map(p => (
                  <div key={p.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{p.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">🏫 {p.school_name}{p.city ? ` · ${p.city}, ${p.state}` : ''}</p>
                      </div>
                      {p.my_status ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">Joined</span>
                      ) : (
                        <button onClick={() => setJoinTarget(p)}
                          className="ml-2 bg-orange-600 text-white px-2.5 py-1 rounded-lg text-xs hover:bg-orange-700">
                          Join
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                        {TYPE_LABELS[p.program_type] ?? p.program_type}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_remote ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {p.is_remote ? '💻 Virtual' : '🏫 In-person'}
                      </span>
                    </div>

                    {p.description && <p className="text-xs text-gray-600">{p.description}</p>}

                    <div className="mt-2 flex gap-3 text-xs text-gray-400">
                      {p.frequency && <span>📅 {p.frequency}</span>}
                      {p.session_duration_minutes && <span>⏱️ {p.session_duration_minutes} min</span>}
                      {p.max_participants && <span>👥 Max {p.max_participants}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'my_programs' && (
        <div className="space-y-3">
          {myParts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No programs yet. Browse to find one to join!</div>
          ) : myParts.map(p => (
            <div key={p.id} className="border border-gray-200 rounded-xl p-4 bg-white flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{p.school_programs?.name ?? '—'}</p>
                <p className="text-sm text-gray-500">{p.school_programs?.school_name}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                    {TYPE_LABELS[p.school_programs?.program_type ?? ''] ?? ''}
                  </span>
                  <span className="text-xs text-gray-400">Grades {p.school_programs?.grade_band}</span>
                  {p.school_programs?.is_remote && <span className="text-xs text-blue-600">Virtual</span>}
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {p.status}
                </span>
                <p className="text-xs text-gray-400 mt-1">{new Date(p.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Join Confirm Modal */}
      {joinTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-2">Join School Program</h2>
            <p className="font-medium text-gray-900">{joinTarget.name}</p>
            <p className="text-sm text-gray-500 mb-1">{joinTarget.school_name}</p>
            <p className="text-xs text-gray-400 mb-4">
              Grades {joinTarget.grade_band} · {joinTarget.is_remote ? 'Virtual' : 'In-person'}
              {joinTarget.frequency ? ` · ${joinTarget.frequency}` : ''}
            </p>
            {joinTarget.curriculum_notes && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 mb-4">
                <strong>Note:</strong> {joinTarget.curriculum_notes}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setJoinTarget(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">
                Cancel
              </button>
              <button onClick={joinProgram} disabled={saving}
                className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm disabled:opacity-50">
                {saving ? 'Joining…' : 'Sign Up'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Program Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md my-4">
            <h2 className="text-lg font-bold mb-4">Add School Program</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">School Name *</label>
                <input value={form.school_name} onChange={e => setForm(f => ({ ...f, school_name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="Lincoln Elementary" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Program Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="Senior Pen Pal Program" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium">Type *</label>
                  <select value={form.program_type} onChange={e => setForm(f => ({ ...f, program_type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1">
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Grade Band *</label>
                  <select value={form.grade_band} onChange={e => setForm(f => ({ ...f, grade_band: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1">
                    {GRADE_BANDS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium">City</label>
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">State</label>
                  <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" maxLength={2} placeholder="CA" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Frequency</label>
                <input value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"
                  placeholder="Weekly, Monthly, Twice a semester…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium">Session (min)</label>
                  <input type="number" value={form.session_duration_minutes} onChange={e => setForm(f => ({ ...f, session_duration_minutes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="45" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Max Participants</label>
                  <input type="number" value={form.max_participants} onChange={e => setForm(f => ({ ...f, max_participants: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="12" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={form.is_remote} onChange={e => setForm(f => ({ ...f, is_remote: e.target.checked }))} className="rounded" />
                Virtual / Remote program
              </label>
              <div>
                <label className="text-xs text-gray-500 font-medium">Contact Email</label>
                <input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" rows={2} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Curriculum / Preparation Notes</label>
                <textarea value={form.curriculum_notes} onChange={e => setForm(f => ({ ...f, curriculum_notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" rows={2}
                  placeholder="Background check required, topics to avoid, materials provided…" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={createProgram} disabled={saving || !form.school_name || !form.name}
                className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm disabled:opacity-50">
                {saving ? 'Creating…' : 'Create Program'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
