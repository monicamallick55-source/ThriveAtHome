'use client'
/**
 * /org-admin/ai-assistant
 * B2B AI Agent Configuration UI
 * Org admins select which of the 12 TAH agents to activate and configure each.
 */
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const AGENT_TYPES = [
  { type: 'navigator',      label: 'Care Navigator',      icon: '🧭', desc: 'Coordinates care, connects members to services' },
  { type: 'buddy',          label: 'Buddy Matching',       icon: '🤝', desc: 'Matches members with peer companions' },
  { type: 'grief',          label: 'Grief Support',        icon: '💙', desc: 'Compassionate support through loss and change' },
  { type: 'home_safety',    label: 'Home Safety',          icon: '🏠', desc: 'Identifies risks, connects to contractors' },
  { type: 'benefits',       label: 'Benefits Finder',      icon: '📋', desc: 'Discovers and explains benefits eligibility' },
  { type: 'medicare',       label: 'Medicare Help',        icon: '🏥', desc: 'Explains Medicare options and enrollment' },
  { type: 'fraud',          label: 'Fraud Protection',     icon: '🛡️', desc: 'Detects scams, guides reporting' },
  { type: 'transitions',    label: 'Life Transitions',     icon: '🌱', desc: 'Supports major life changes' },
  { type: 'skill_exchange', label: 'Skill Exchange',       icon: '🎓', desc: 'Facilitates peer skill sharing' },
  { type: 'community',      label: 'Community Connection', icon: '🌍', desc: 'Events, programs, volunteer opportunities' },
  { type: 'health',         label: 'Health Support',       icon: '❤️', desc: 'Wellness tracking and care coordination' },
  { type: 'encore',         label: 'Encore Careers',       icon: '⭐', desc: 'Meaningful work and purpose in later life' },
]

const TONE_OPTIONS = [
  { value: 'warm',         label: 'Warm & Personal',    desc: 'Friendly, uses first names, encouraging' },
  { value: 'professional', label: 'Professional',       desc: 'Clear, respectful, efficient' },
  { value: 'clinical',     label: 'Clinical',           desc: 'Precise language for healthcare settings' },
  { value: 'friendly',     label: 'Upbeat & Friendly',  desc: 'Conversational, simple language, positive' },
]

export default function AIAssistantPage() {
  const router = useRouter()
  const [configs, setConfigs] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/org-admin/agent-configs')
      .then(r => { if (r.status === 401 || r.status === 403) router.push('/login'); return r.json() })
      .then(data => {
        if (Array.isArray(data)) {
          const map: Record<string, any> = {}
          data.forEach(c => { map[c.agent_type] = c })
          setConfigs(map)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function getConfig(type: string) {
    return configs[type] ?? {
      agent_type: type, is_active: false, persona_name: '', greeting: '',
      tone: 'warm', programs: [], contacts: [], custom_faqs: [],
      off_limits_topics: [], referral_triggers: [], system_prompt_override: '',
    }
  }

  function updateConfig(type: string, field: string, value: any) {
    setConfigs(prev => ({
      ...prev,
      [type]: { ...getConfig(type), [field]: value }
    }))
  }

  async function saveConfig(type: string) {
    setSaving(type)
    const cfg = getConfig(type)
    const res = await fetch('/api/org-admin/agent-configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    })
    setSaving(null)
    if (res.ok) {
      const saved = await res.json()
      setConfigs(prev => ({ ...prev, [type]: saved }))
      showToast(`${AGENT_TYPES.find(a => a.type === type)?.label} saved ✓`)
    } else {
      showToast('Save failed — check console')
    }
  }

  async function loadPreview(type: string) {
    setPreviewLoading(true)
    setPreview(null)
    const res = await fetch(`/api/org-admin/agent-preview?agent_type=${type}`)
    setPreviewLoading(false)
    if (res.ok) {
      const data = await res.json()
      setPreview(data.system_prompt)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  if (loading) return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <p>Loading agent configurations...</p>
    </div>
  )

  const activeAgent = AGENT_TYPES.find(a => a.type === activeTab)
  const activeCfg = activeTab ? getConfig(activeTab) : null

  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: 1100, margin: '0 auto', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>AI Assistant Configuration</h1>
        <p style={{ color: '#666', marginTop: '0.5rem' }}>
          Select which AI agents to activate for your members and customize each one for your organization.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, background: '#1a7f4b', color: '#fff',
          padding: '0.75rem 1.25rem', borderRadius: 8, fontWeight: 600, zIndex: 1000,
        }}>{toast}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: activeTab ? '320px 1fr' : '1fr', gap: '1.5rem' }}>
        {/* Agent grid */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: activeTab ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {AGENT_TYPES.map(agent => {
              const cfg = getConfig(agent.type)
              const isActive = cfg.is_active
              const isSelected = activeTab === agent.type
              return (
                <div key={agent.type} style={{
                  border: `2px solid ${isSelected ? '#2563eb' : isActive ? '#1a7f4b' : '#e5e7eb'}`,
                  borderRadius: 10, padding: '1rem', cursor: 'pointer', background: '#fff',
                  transition: 'all 0.15s',
                }} onClick={() => setActiveTab(isSelected ? null : agent.type)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '1.4rem' }}>{agent.icon}</span>
                      <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>{agent.label}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>{agent.desc}</div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                      onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={isActive}
                        onChange={e => { updateConfig(agent.type, 'is_active', e.target.checked); }}
                        style={{ width: 16, height: 16 }} />
                      <span style={{ fontSize: '0.8rem', color: isActive ? '#1a7f4b' : '#999' }}>
                        {isActive ? 'Active' : 'Off'}
                      </span>
                    </label>
                  </div>
                  {cfg.persona_name && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#2563eb' }}>
                      ✓ Configured as "{cfg.persona_name}"
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Config panel */}
        {activeTab && activeAgent && activeCfg && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
                {activeAgent.icon} Configure {activeAgent.label}
              </h2>
              <button onClick={() => setActiveTab(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#999' }}>✕</button>
            </div>

            {/* Persona */}
            <Section title="Persona">
              <Field label="Assistant Name">
                <input value={activeCfg.persona_name ?? ''} placeholder="e.g. Sage, Alex, Care Guide"
                  onChange={e => updateConfig(activeTab, 'persona_name', e.target.value)}
                  style={inputStyle} />
              </Field>
              <Field label="Opening Greeting">
                <input value={activeCfg.greeting ?? ''} placeholder="e.g. Welcome to Riverview Senior Center!"
                  onChange={e => updateConfig(activeTab, 'greeting', e.target.value)}
                  style={inputStyle} />
              </Field>
              <Field label="Tone">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {TONE_OPTIONS.map(t => (
                    <label key={t.value} style={{
                      border: `2px solid ${activeCfg.tone === t.value ? '#2563eb' : '#e5e7eb'}`,
                      borderRadius: 8, padding: '0.5rem 0.75rem', cursor: 'pointer',
                      background: activeCfg.tone === t.value ? '#eff6ff' : '#fff',
                    }}>
                      <input type="radio" name="tone" value={t.value}
                        checked={activeCfg.tone === t.value}
                        onChange={() => updateConfig(activeTab, 'tone', t.value)}
                        style={{ marginRight: 6 }} />
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t.label}</span>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 2 }}>{t.desc}</div>
                    </label>
                  ))}
                </div>
              </Field>
            </Section>

            {/* Programs */}
            <Section title="Programs & Services">
              <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 0.75rem' }}>
                Add your organization's specific programs. The agent will reference these when helping members.
              </p>
              {(activeCfg.programs ?? []).map((p: any, i: number) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <input placeholder="Program name" value={p.name ?? ''}
                      onChange={e => { const arr = [...activeCfg.programs]; arr[i] = { ...arr[i], name: e.target.value }; updateConfig(activeTab, 'programs', arr) }}
                      style={inputStyle} />
                    <input placeholder="Contact (name, phone)" value={p.contact ?? ''}
                      onChange={e => { const arr = [...activeCfg.programs]; arr[i] = { ...arr[i], contact: e.target.value }; updateConfig(activeTab, 'programs', arr) }}
                      style={inputStyle} />
                  </div>
                  <input placeholder="Description & eligibility" value={p.description ?? ''}
                    onChange={e => { const arr = [...activeCfg.programs]; arr[i] = { ...arr[i], description: e.target.value }; updateConfig(activeTab, 'programs', arr) }}
                    style={{ ...inputStyle, marginTop: '0.5rem' }} />
                  <button onClick={() => { const arr = activeCfg.programs.filter((_: any, j: number) => j !== i); updateConfig(activeTab, 'programs', arr) }}
                    style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
              ))}
              <button onClick={() => updateConfig(activeTab, 'programs', [...(activeCfg.programs ?? []), { name: '', description: '', contact: '' }])}
                style={addBtnStyle}>+ Add Program</button>
            </Section>

            {/* Custom FAQs */}
            <Section title="Custom FAQs">
              <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 0.75rem' }}>
                Common questions and answers specific to your organization.
              </p>
              {(activeCfg.custom_faqs ?? []).map((f: any, i: number) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.75rem', marginBottom: '0.5rem' }}>
                  <input placeholder="Question" value={f.q ?? ''}
                    onChange={e => { const arr = [...activeCfg.custom_faqs]; arr[i] = { ...arr[i], q: e.target.value }; updateConfig(activeTab, 'custom_faqs', arr) }}
                    style={inputStyle} />
                  <textarea placeholder="Answer" value={f.a ?? ''} rows={2}
                    onChange={e => { const arr = [...activeCfg.custom_faqs]; arr[i] = { ...arr[i], a: e.target.value }; updateConfig(activeTab, 'custom_faqs', arr) }}
                    style={{ ...inputStyle, marginTop: '0.5rem', resize: 'vertical' }} />
                  <button onClick={() => { const arr = activeCfg.custom_faqs.filter((_: any, j: number) => j !== i); updateConfig(activeTab, 'custom_faqs', arr) }}
                    style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                </div>
              ))}
              <button onClick={() => updateConfig(activeTab, 'custom_faqs', [...(activeCfg.custom_faqs ?? []), { q: '', a: '' }])}
                style={addBtnStyle}>+ Add FAQ</button>
            </Section>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => saveConfig(activeTab)} disabled={saving === activeTab}
                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8,
                  padding: '0.6rem 1.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}>
                {saving === activeTab ? 'Saving...' : 'Save Configuration'}
              </button>
              <button onClick={() => loadPreview(activeTab)} disabled={previewLoading}
                style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8,
                  padding: '0.6rem 1.25rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}>
                {previewLoading ? 'Loading...' : 'Preview System Prompt'}
              </button>
            </div>

            {/* Preview */}
            {preview && (
              <div style={{ marginTop: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: 8, padding: '1rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>
                  Assembled System Prompt ({preview.length} chars)
                </div>
                <pre style={{ fontSize: '0.78rem', whiteSpace: 'pre-wrap', color: '#475569',
                  margin: 0, maxHeight: 300, overflow: 'auto', fontFamily: 'monospace' }}>
                  {preview}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151',
        borderBottom: '1px solid #e5e7eb', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151',
        display: 'block', marginBottom: '0.3rem' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db',
  borderRadius: 6, fontSize: '0.9rem', boxSizing: 'border-box',
}

const addBtnStyle: React.CSSProperties = {
  background: '#f3f4f6', border: '1px dashed #9ca3af', borderRadius: 6,
  padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem',
  color: '#374151', fontWeight: 500,
}
