'use client'

/**
 * app/dashboard/pets/page.tsx — G7.24 Pet Profiles
 *
 * Members can add and manage their pet profiles.
 * Grace uses this information to personalize conversations.
 */

import { useState, useEffect } from 'react'

type Pet = {
  id: string
  name: string
  species: string
  breed?: string
  age_years?: number
  vet_name?: string
  vet_phone?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  care_notes?: string
}

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐶',
  cat: '🐱',
  bird: '🐦',
  fish: '🐟',
  rabbit: '🐰',
  hamster: '🐹',
  other: '🐾',
}

const BLANK_PET = {
  name: '', species: 'dog', breed: '', age_years: '',
  vet_name: '', vet_phone: '',
  emergency_contact_name: '', emergency_contact_phone: '',
  care_notes: '',
}

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...BLANK_PET })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadPets()
  }, [])

  async function loadPets() {
    setLoading(true)
    const res = await fetch('/api/pets?member_id=self')
    const data = await res.json()
    setPets(data.pets ?? [])
    setLoading(false)
  }

  async function addPet() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: 'self',
          name: form.name,
          species: form.species,
          breed: form.breed || null,
          age_years: form.age_years ? Number(form.age_years) : null,
          vet_name: form.vet_name || null,
          vet_phone: form.vet_phone || null,
          emergency_contact_name: form.emergency_contact_name || null,
          emergency_contact_phone: form.emergency_contact_phone || null,
          care_notes: form.care_notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPets((prev) => [...prev, data.pet])
      setShowForm(false)
      setForm({ ...BLANK_PET })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function deletePet(id: string) {
    if (!confirm('Remove this pet profile?')) return
    setDeletingId(id)
    await fetch(`/api/pets/${id}`, { method: 'DELETE' })
    setPets((prev) => prev.filter((p) => p.id !== id))
    setDeletingId(null)
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>My Pets</h1>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          + Add Pet
        </button>
      </div>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        Your pets are part of your life. Grace and your navigator keep them in mind during your conversations.
      </p>

      {/* Add pet form */}
      {showForm && (
        <div style={{ border: '2px solid #6366f1', borderRadius: 14, padding: 20, marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>Tell us about your pet</h2>
          {error && <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem', fontWeight: 500 }}>Name *</label>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Max"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem', fontWeight: 500 }}>Species *</label>
              <select value={form.species} onChange={(e) => setForm((p) => ({ ...p, species: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}>
                {Object.keys(SPECIES_EMOJI).map((s) => (
                  <option key={s} value={s}>{SPECIES_EMOJI[s]} {s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem', fontWeight: 500 }}>Breed</label>
              <input value={form.breed} onChange={(e) => setForm((p) => ({ ...p, breed: e.target.value }))}
                placeholder="e.g. Labrador Retriever"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem', fontWeight: 500 }}>Age (years)</label>
              <input type="number" min="0" max="30" value={form.age_years} onChange={(e) => setForm((p) => ({ ...p, age_years: e.target.value }))}
                placeholder="e.g. 3"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem', fontWeight: 500 }}>Vet name</label>
              <input value={form.vet_name} onChange={(e) => setForm((p) => ({ ...p, vet_name: e.target.value }))}
                placeholder="Dr. Chen"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem', fontWeight: 500 }}>Vet phone</label>
              <input value={form.vet_phone} onChange={(e) => setForm((p) => ({ ...p, vet_phone: e.target.value }))}
                placeholder="(650) 555-0100"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem', fontWeight: 500 }}>
              🆘 Who should care for {form.name || 'this pet'} if something happens to me?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input value={form.emergency_contact_name} onChange={(e) => setForm((p) => ({ ...p, emergency_contact_name: e.target.value }))}
                placeholder="Contact name"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
              <input value={form.emergency_contact_phone} onChange={(e) => setForm((p) => ({ ...p, emergency_contact_phone: e.target.value }))}
                placeholder="Contact phone"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem', fontWeight: 500 }}>Any care notes? (medications, diet, habits)</label>
            <textarea value={form.care_notes} onChange={(e) => setForm((p) => ({ ...p, care_notes: e.target.value }))}
              rows={2} placeholder="e.g. Takes arthritis medication twice daily with food"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setShowForm(false); setForm({ ...BLANK_PET }) }}
              style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={addPet} disabled={!form.name || saving}
              style={{
                flex: 2, padding: '10px',
                background: form.name ? '#6366f1' : '#e5e7eb',
                color: form.name ? '#fff' : '#9ca3af',
                border: 'none', borderRadius: 8,
                cursor: form.name ? 'pointer' : 'default', fontWeight: 600
              }}>
              {saving ? 'Saving…' : `Add ${form.name || 'pet'}`}
            </button>
          </div>
        </div>
      )}

      {/* Pet list */}
      {loading ? (
        <p style={{ color: '#9ca3af', textAlign: 'center', paddingTop: 40 }}>Loading…</p>
      ) : pets.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 40, color: '#9ca3af' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🐾</div>
          <p>No pets added yet.</p>
          <p style={{ fontSize: '0.875rem' }}>Add your pet and Grace will ask about them during calls!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pets.map((pet) => (
            <div key={pet.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: '2rem' }}>{SPECIES_EMOJI[pet.species] ?? '🐾'}</div>
                  <div>
                    <strong style={{ fontSize: '1.1rem' }}>{pet.name}</strong>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      {pet.breed ? `${pet.breed} · ` : ''}{pet.species}
                      {pet.age_years != null ? ` · ${pet.age_years} yr${pet.age_years !== 1 ? 's' : ''}` : ''}
                    </div>
                  </div>
                </div>
                <button onClick={() => deletePet(pet.id)} disabled={deletingId === pet.id}
                  style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                  Remove
                </button>
              </div>

              {(pet.vet_name || pet.emergency_contact_name) && (
                <div style={{ marginTop: 10, fontSize: '0.85rem', color: '#6b7280', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {pet.vet_name && <span>🏥 Vet: {pet.vet_name}{pet.vet_phone ? ` · ${pet.vet_phone}` : ''}</span>}
                  {pet.emergency_contact_name && (
                    <span>🆘 Emergency: {pet.emergency_contact_name}{pet.emergency_contact_phone ? ` · ${pet.emergency_contact_phone}` : ''}</span>
                  )}
                </div>
              )}

              {pet.care_notes && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: '#f9fafb', borderRadius: 8, fontSize: '0.85rem', color: '#6b7280' }}>
                  📋 {pet.care_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
