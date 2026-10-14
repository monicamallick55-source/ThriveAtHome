'use client'
// G7.24 — Pet profiles UI: view, add, mark as passed
import { useState, useEffect } from 'react'

interface Pet {
  id: string
  name: string
  species: string
  breed: string | null
  birthday: string | null
  adopted_at: string | null
  color: string | null
  notes: string | null
  is_deceased: boolean
  passed_at: string | null
  birthday_coming_up: boolean
  milestones: { id: string; type: string; occurred_at: string; title: string }[]
}

interface Props {
  memberId: string
  canEdit?: boolean
}

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕', cat: '🐈', bird: '🦜', fish: '🐟', rabbit: '🐇', reptile: '🦎', other: '🐾',
}

const SPECIES_OPTIONS = ['dog', 'cat', 'bird', 'fish', 'rabbit', 'reptile', 'other']

function formatDate(s: string | null) {
  if (!s) return null
  return new Date(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function PetProfiles({ memberId, canEdit = false }: Props) {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmLoss, setConfirmLoss] = useState<string | null>(null)

  const [form, setForm] = useState({ name: '', species: 'dog', breed: '', birthday: '', adoptedAt: '', color: '', notes: '' })

  const loadPets = () => {
    setLoading(true)
    fetch(`/api/pets?memberId=${memberId}`)
      .then(r => r.json())
      .then(d => setPets(d.pets ?? []))
      .catch(() => setError('Unable to load pet profiles'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadPets() }, [memberId])

  const addPet = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId, name: form.name.trim(), species: form.species,
          breed: form.breed || null, birthday: form.birthday || null,
          adoptedAt: form.adoptedAt || null, color: form.color || null, notes: form.notes || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setForm({ name: '', species: 'dog', breed: '', birthday: '', adoptedAt: '', color: '', notes: '' })
      setShowForm(false)
      loadPets()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  const markDeceased = async (petId: string) => {
    setSaving(true)
    try {
      await fetch('/api/pets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId, action: 'mark_deceased' }),
      })
      setConfirmLoss(null)
      loadPets()
    } catch {
      setError('Could not save')
    } finally {
      setSaving(false)
    }
  }

  const activePets = pets.filter(p => !p.is_deceased)
  const deceasedPets = pets.filter(p => p.is_deceased)

  return (
    <div style={{ fontFamily: 'var(--font-body, system-ui, sans-serif)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1e3a5f', margin: 0 }}>🐾 My Pets</h3>
        {canEdit && (
          <button onClick={() => setShowForm(!showForm)}
            style={{ padding: '7px 14px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            + Add Pet
          </button>
        )}
      </div>

      {error && <div style={{ color: '#991b1b', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}

      {showForm && (
        <div style={{ background: '#f8f7f4', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '18px', marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 14px', fontSize: '14px', color: '#1e3a5f' }}>Add a pet 🐾</h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Pet name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Buddy"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Species *</label>
              <select value={form.species} onChange={e => setForm(f => ({ ...f, species: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}>
                {SPECIES_OPTIONS.map(s => <option key={s} value={s}>{SPECIES_EMOJI[s]} {s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Breed</label>
              <input value={form.breed} onChange={e => setForm(f => ({ ...f, breed: e.target.value }))} placeholder="Labrador"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Color / markings</label>
              <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="Golden with white paws"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Birthday</label>
              <input type="date" value={form.birthday} onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Adoption date</label>
              <input type="date" value={form.adoptedAt} onChange={e => setForm(f => ({ ...f, adoptedAt: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Favorite toy, vet name…"
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={addPet} disabled={saving || !form.name.trim()}
              style={{ flex: 1, padding: '9px', background: saving ? '#9ca3af' : '#1e3a5f', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
              {saving ? 'Saving…' : `Add ${form.name || 'pet'} 🐾`}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ padding: '9px 16px', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '7px', cursor: 'pointer', fontSize: '14px' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color: '#9ca3af', fontSize: '14px', padding: '20px 0' }}>Loading…</div>
      ) : activePets.length === 0 && deceasedPets.length === 0 ? (
        <div style={{ color: '#9ca3af', fontSize: '14px', padding: '20px 0', textAlign: 'center' }}>No pet profiles yet. Add your furry family members!</div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '12px' }}>
            {activePets.map(pet => (
              <div key={pet.id} style={{ background: '#fff', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: pet.birthday_coming_up ? '1px solid #fde68a' : '1px solid #f3f4f6' }}>
                {pet.birthday_coming_up && (
                  <div style={{ fontSize: '12px', color: '#92400e', background: '#fef3c7', padding: '4px 10px', borderRadius: '6px', marginBottom: '10px', fontWeight: 600 }}>
                    🎂 Birthday coming up!
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '22px', display: 'inline', marginRight: '8px' }}>{SPECIES_EMOJI[pet.species]}</div>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#1e3a5f' }}>{pet.name}</span>
                    {pet.breed && <span style={{ fontSize: '13px', color: '#9ca3af', marginLeft: '8px' }}>{pet.breed}</span>}

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {pet.birthday && <div style={{ fontSize: '13px', color: '#6b7280' }}>🎂 {formatDate(pet.birthday)}</div>}
                      {pet.adopted_at && <div style={{ fontSize: '13px', color: '#6b7280' }}>🏠 Adopted {formatDate(pet.adopted_at)}</div>}
                      {pet.color && <div style={{ fontSize: '13px', color: '#6b7280' }}>🎨 {pet.color}</div>}
                    </div>
                    {pet.notes && <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '6px', lineHeight: 1.5 }}>{pet.notes}</div>}
                  </div>

                  {canEdit && (
                    confirmLoss === pet.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: 600 }}>We're so sorry 💛</div>
                        <button onClick={() => markDeceased(pet.id)} disabled={saving}
                          style={{ padding: '6px 12px', background: '#991b1b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                          Confirm
                        </button>
                        <button onClick={() => setConfirmLoss(null)}
                          style={{ padding: '6px 12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmLoss(pet.id)}
                        style={{ padding: '6px 12px', background: '#f9fafb', color: '#9ca3af', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', flexShrink: 0 }}>
                        Mark as passed
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          {deceasedPets.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: '0 0 10px', fontWeight: 600 }}>In loving memory 🌈</h4>
              <div style={{ display: 'grid', gap: '8px' }}>
                {deceasedPets.map(pet => (
                  <div key={pet.id} style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px 16px', border: '1px solid #f3f4f6', opacity: 0.8 }}>
                    <span style={{ fontSize: '16px', marginRight: '6px' }}>{SPECIES_EMOJI[pet.species]}</span>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#6b7280' }}>{pet.name}</span>
                    {pet.passed_at && <span style={{ fontSize: '13px', color: '#9ca3af', marginLeft: '8px' }}>· Passed {formatDate(pet.passed_at)}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
