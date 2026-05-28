'use client'

import { useState } from 'react'
import type { SkillWithMember } from '@/lib/data/skill-exchange'
import type { Database } from '@/types/database'

type SkillRow = Database['public']['Tables']['skills_offered']['Row']
type TimeCreditsRow = Database['public']['Tables']['time_credits']['Row']
type TransactionRow = Database['public']['Tables']['time_credit_transactions']['Row']
type ExchangeRow = Database['public']['Tables']['skill_exchanges']['Row']

const CATEGORIES = [
  { value: 'cooking', label: 'Cooking & Recipes' },
  { value: 'language', label: 'Language & Conversation' },
  { value: 'music', label: 'Music & Singing' },
  { value: 'crafts', label: 'Crafts & Arts' },
  { value: 'gardening', label: 'Gardening' },
  { value: 'technology', label: 'Technology Help' },
  { value: 'storytelling', label: 'Stories & History' },
  { value: 'exercise', label: 'Exercise & Movement' },
  { value: 'other', label: 'Other' },
]

const DELIVERY = [
  { value: 'phone', label: 'Phone call' },
  { value: 'video', label: 'Video call' },
  { value: 'in_person', label: 'In person' },
]

const CATEGORY_COLORS: Record<string, string> = {
  cooking: '#E8703A',
  language: '#2A5298',
  music: '#7C3AED',
  crafts: '#D97706',
  gardening: '#1A7A6A',
  technology: '#0F766E',
  storytelling: '#B45309',
  exercise: '#DC2626',
  other: '#6B7280',
}

interface Props {
  allSkills: SkillWithMember[]
  mySkills: SkillRow[]
  myCredits: TimeCreditsRow | null
  myTransactions: TransactionRow[]
  myExchanges: ExchangeRow[]
  hasMember: boolean
}

export default function SkillExchangeClient({
  allSkills,
  mySkills,
  myCredits,
  myTransactions,
  myExchanges,
  hasMember,
}: Props) {
  const [tab, setTab] = useState<'learn' | 'share' | 'credits'>('learn')
  const [skills, setSkills] = useState(allSkills)
  const [ownSkills, setOwnSkills] = useState(mySkills)
  const [credits, setCredits] = useState(myCredits)
  const [transactions, setTransactions] = useState(myTransactions)
  const [exchanges, setExchanges] = useState(myExchanges)

  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [toastIsError, setToastIsError] = useState(false)

  // share form state
  const [shareForm, setShareForm] = useState({
    skill_name: '',
    skill_category: 'other',
    description: '',
    delivery_method: 'phone',
    max_group_size: 1,
  })
  const [shareLoading, setShareLoading] = useState(false)

  function showToast(msg: string, isError = false) {
    setToastMsg(msg)
    setToastIsError(isError)
    setTimeout(() => setToastMsg(null), 4000)
  }

  async function handleRequestExchange(skillId: string) {
    if (!hasMember) { showToast('Set up a senior member profile first.', true); return }
    setLoadingId(skillId)
    try {
      const res = await fetch('/api/skill-exchange/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill_id: skillId }),
      })
      const json = await res.json()
      if (!res.ok) {
        showToast(json.error ?? 'Could not request exchange.', true)
      } else {
        setExchanges(prev => [json.exchange, ...prev])
        showToast('Exchange requested! Your care team will help coordinate.')
      }
    } catch {
      showToast('Connection error. Please try again.', true)
    } finally {
      setLoadingId(null)
    }
  }

  async function handleShareSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hasMember) { showToast('Set up a senior member profile first.', true); return }
    if (!shareForm.skill_name.trim() || !shareForm.description.trim()) {
      showToast('Please fill in skill name and description.', true)
      return
    }
    setShareLoading(true)
    try {
      const res = await fetch('/api/skill-exchange/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shareForm),
      })
      const json = await res.json()
      if (!res.ok) {
        showToast(json.error ?? 'Could not register skill.', true)
      } else {
        setOwnSkills(prev => [json.skill, ...prev])
        setSkills(prev => [{ ...json.skill, teacher_name: 'You' }, ...prev])
        setShareForm({ skill_name: '', skill_category: 'other', description: '', delivery_method: 'phone', max_group_size: 1 })
        showToast('Skill shared with the community!')
        setTab('learn')
      }
    } catch {
      showToast('Connection error. Please try again.', true)
    } finally {
      setShareLoading(false)
    }
  }

  const isRequested = (skillId: string) =>
    exchanges.some(ex => ex.skill_id === skillId)

  const balance = credits?.balance ?? 0
  const lifetimeEarned = credits?.lifetime_earned ?? 0
  const lifetimeSpent = credits?.lifetime_spent ?? 0

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <main style={{ flex: 1, maxWidth: '900px', margin: '0 auto', padding: '32px 24px', width: '100%' }}>
      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: toastIsError ? '#DC2626' : '#1A7A6A',
          color: 'white', padding: '12px 24px', borderRadius: '8px',
          fontFamily: 'var(--font-body)', fontSize: '16px', zIndex: 1000,
          boxShadow: 'var(--shadow-lg)',
        }}>
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', color: 'var(--color-navy)', margin: '0 0 8px', fontWeight: 500 }}>
          Skill Exchange
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)', margin: 0 }}>
          Share what you know, learn from others. Every skill shared earns a time credit.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', borderBottom: '2px solid var(--color-warm-grey)' }}>
        {([
          { key: 'learn', label: 'Learn' },
          { key: 'share', label: 'Share a Skill' },
          { key: 'credits', label: `My Credits${balance > 0 ? ` (${balance})` : ''}` },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '12px 24px',
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? 'var(--color-navy)' : 'var(--color-text-secondary)',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--color-navy)' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: '-2px',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Learn Tab */}
      {tab === 'learn' && (
        <div>
          {skills.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '64px 24px',
              backgroundColor: 'white', borderRadius: '12px',
              border: '1px solid var(--color-warm-grey)',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-navy)', marginBottom: '8px' }}>
                Be the first to share a skill
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)' }}>
                Click "Share a Skill" above to offer something to the community.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {skills.map(skill => {
                const color = CATEGORY_COLORS[skill.skill_category] ?? '#6B7280'
                const catLabel = CATEGORIES.find(c => c.value === skill.skill_category)?.label ?? skill.skill_category
                const delLabel = DELIVERY.find(d => d.value === skill.delivery_method)?.label ?? skill.delivery_method
                const requested = isRequested(skill.id)

                return (
                  <div key={skill.id} style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid var(--color-warm-grey)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <div style={{ height: '6px', backgroundColor: color }} />
                    <div style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--color-navy)', margin: 0, fontWeight: 500 }}>
                          {skill.skill_name}
                        </h3>
                        <span style={{
                          backgroundColor: `${color}18`, color, padding: '2px 10px',
                          borderRadius: '20px', fontSize: '12px', fontFamily: 'var(--font-body)',
                          fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '8px',
                        }}>
                          {catLabel}
                        </span>
                      </div>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: '0 0 12px', lineHeight: 1.55 }}>
                        {skill.description}
                      </p>
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                          👤 {skill.teacher_name}
                        </span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                          📞 {delLabel}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRequestExchange(skill.id)}
                        disabled={requested || loadingId === skill.id}
                        style={{
                          width: '100%',
                          padding: '10px',
                          backgroundColor: requested ? '#E5E7EB' : 'var(--color-navy)',
                          color: requested ? 'var(--color-text-secondary)' : 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontFamily: 'var(--font-body)',
                          fontSize: '15px',
                          fontWeight: 600,
                          cursor: requested ? 'default' : 'pointer',
                        }}
                      >
                        {loadingId === skill.id ? 'Requesting…' : requested ? '✓ Exchange Requested' : 'Request this exchange'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Share Tab */}
      {tab === 'share' && (
        <div style={{ maxWidth: '560px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
            What skill, knowledge, or hobby can you share with a fellow community member?
            Teaching earns you 1 time credit per hour.
          </p>

          <form onSubmit={handleShareSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>
                Skill or activity name *
              </label>
              <input
                value={shareForm.skill_name}
                onChange={e => setShareForm(f => ({ ...f, skill_name: e.target.value }))}
                placeholder="e.g. Italian cooking, Guitar basics, iPhone tips"
                style={{
                  width: '100%', padding: '10px 14px', border: '1.5px solid var(--color-warm-grey)',
                  borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '16px',
                  color: 'var(--color-navy)', backgroundColor: 'white', boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>
                Category
              </label>
              <select
                value={shareForm.skill_category}
                onChange={e => setShareForm(f => ({ ...f, skill_category: e.target.value }))}
                style={{
                  width: '100%', padding: '10px 14px', border: '1.5px solid var(--color-warm-grey)',
                  borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '16px',
                  color: 'var(--color-navy)', backgroundColor: 'white', boxSizing: 'border-box',
                }}
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>
                Description *
              </label>
              <textarea
                value={shareForm.description}
                onChange={e => setShareForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Tell others what you'll share and how the session will work…"
                rows={4}
                style={{
                  width: '100%', padding: '10px 14px', border: '1.5px solid var(--color-warm-grey)',
                  borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '16px',
                  color: 'var(--color-navy)', backgroundColor: 'white', resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>
                  How you&apos;ll connect
                </label>
                <select
                  value={shareForm.delivery_method}
                  onChange={e => setShareForm(f => ({ ...f, delivery_method: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 14px', border: '1.5px solid var(--color-warm-grey)',
                    borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '16px',
                    color: 'var(--color-navy)', backgroundColor: 'white', boxSizing: 'border-box',
                  }}
                >
                  {DELIVERY.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', display: 'block', marginBottom: '6px' }}>
                  Max group size
                </label>
                <select
                  value={shareForm.max_group_size}
                  onChange={e => setShareForm(f => ({ ...f, max_group_size: Number(e.target.value) }))}
                  style={{
                    width: '100%', padding: '10px 14px', border: '1.5px solid var(--color-warm-grey)',
                    borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '16px',
                    color: 'var(--color-navy)', backgroundColor: 'white', boxSizing: 'border-box',
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                    <option key={n} value={n}>{n === 1 ? '1 person (1-on-1)' : `Up to ${n} people`}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={shareLoading}
              style={{
                padding: '14px',
                backgroundColor: 'var(--color-navy)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontFamily: 'var(--font-body)',
                fontSize: '17px',
                fontWeight: 600,
                cursor: shareLoading ? 'not-allowed' : 'pointer',
                opacity: shareLoading ? 0.7 : 1,
              }}
            >
              {shareLoading ? 'Sharing…' : 'Share with community'}
            </button>
          </form>

          {ownSkills.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', marginBottom: '16px', fontWeight: 500 }}>
                Your shared skills
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {ownSkills.map(skill => (
                  <div key={skill.id} style={{
                    backgroundColor: 'white', borderRadius: '8px',
                    border: '1px solid var(--color-warm-grey)', padding: '16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--color-navy)' }}>
                        {skill.skill_name}
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        {CATEGORIES.find(c => c.value === skill.skill_category)?.label} · {DELIVERY.find(d => d.value === skill.delivery_method)?.label}
                      </div>
                    </div>
                    <span style={{
                      backgroundColor: skill.is_active ? '#D1FAE5' : '#F3F4F6',
                      color: skill.is_active ? '#065F46' : '#6B7280',
                      padding: '4px 12px', borderRadius: '20px',
                      fontSize: '13px', fontFamily: 'var(--font-body)', fontWeight: 600,
                    }}>
                      {skill.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Credits Tab */}
      {tab === 'credits' && (
        <div>
          {/* Balance card */}
          <div style={{
            backgroundColor: 'var(--color-navy)', color: 'white', borderRadius: '16px',
            padding: '32px', marginBottom: '32px', display: 'flex', gap: '40px',
            flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '15px', opacity: 0.75, marginBottom: '4px' }}>Current balance</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '52px', fontWeight: 500 }}>{balance}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '15px', opacity: 0.75 }}>time credit{balance !== 1 ? 's' : ''}</div>
            </div>
            <div style={{ display: 'flex', gap: '40px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '15px', opacity: 0.75, marginBottom: '4px' }}>Total earned</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500 }}>{lifetimeEarned}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '15px', opacity: 0.75, marginBottom: '4px' }}>Total used</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500 }}>{lifetimeSpent}</div>
              </div>
            </div>
          </div>

          {/* How credits work */}
          <div style={{
            backgroundColor: '#F0FDF9', border: '1px solid #A7F3D0', borderRadius: '12px',
            padding: '20px', marginBottom: '32px',
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#065F46', margin: '0 0 8px', fontWeight: 500 }}>
              How time credits work
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#047857', margin: 0, lineHeight: 1.6 }}>
              Teach 1 hour → earn 1 credit. Use credits to learn from others.
              Credits never expire and never have a cash value — they exist to encourage sharing.
            </p>
          </div>

          {/* Transaction history */}
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', marginBottom: '16px', fontWeight: 500 }}>
            Credit history
          </h2>
          {transactions.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 24px',
              backgroundColor: 'white', borderRadius: '12px',
              border: '1px solid var(--color-warm-grey)',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>💡</div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)', margin: 0 }}>
                No credits yet. Share a skill or complete an exchange to start earning!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {transactions.map(tx => (
                <div key={tx.id} style={{
                  backgroundColor: 'white', borderRadius: '8px',
                  border: '1px solid var(--color-warm-grey)', padding: '16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-navy)' }}>
                      {tx.description}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {formatDate(tx.created_at)}
                    </div>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500,
                    color: tx.amount > 0 ? '#065F46' : '#991B1B',
                  }}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  )
}
