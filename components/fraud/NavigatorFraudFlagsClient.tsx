'use client'
// components/fraud/NavigatorFraudFlagsClient.tsx
// G7.1 — Navigator view: review open fraud flags, update status, contact member.

import { useState, useTransition } from 'react'

const SCAM_LABELS: Record<string, string> = {
  gift_card: '🎁 Gift Card',
  government_impersonation: '🏛️ Gov. Impersonation',
  grandparent: '👴 Grandparent',
  romance: '💔 Romance',
  tech_support: '💻 Tech Support',
  lottery_prize: '🎰 Lottery / Prize',
  investment_crypto: '₿ Crypto / Investment',
  charity: '🤲 Charity',
  large_purchase: '💳 Large Purchase',
  other: '⚠️ Suspected Fraud',
}

const SOURCE_LABELS: Record<string, string> = {
  call_transcript: 'Call transcript',
  community_post: 'Community post',
  private_message: 'Private message',
  gift_order: 'Gift order',
  navigator: 'Navigator report',
  family: 'Family report',
  buddy: 'Buddy report',
}

interface FraudFlag {
  id: string
  created_at: string
  source: string
  scam_type: string
  matched_text: string | null
  severity: 'concern' | 'urgent'
  status: string
  family_notified_at: string | null
  source_id: string | null
  members: { id: string; full_name: string; phone: string }
}

interface ResolvedFlag {
  id: string
  created_at: string
  scam_type: string
  severity: string
  status: string
  resolution_note: string | null
  members: { id: string; full_name: string }
}

export default function NavigatorFraudFlagsClient({
  flags: initialFlags,
  resolved,
}: {
  flags: FraudFlag[]
  resolved: ResolvedFlag[]
}) {
  const [flags, setFlags] = useState(initialFlags)
  const [activeTab, setActiveTab] = useState<'open' | 'resolved'>('open')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)

  const urgent = flags.filter((f) => f.severity === 'urgent')
  const concern = flags.filter((f) => f.severity === 'concern')

  async function updateStatus(flagId: string, status: string, note?: string) {
    startTransition(async () => {
      const res = await fetch(`/api/fraud-flags/${flagId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolutionNote: note }),
      })
      if (res.ok) {
        setFlags((prev) => prev.filter((f) => f.id !== flagId))
        showToast(`Flag marked as ${status}`)
      } else {
        showToast('Update failed — please try again')
      }
    })
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function formatDate(s: string) {
    return new Date(s).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  function FlagCard({ flag }: { flag: FraudFlag }) {
    const expanded = expandedId === flag.id
    const isUrgent = flag.severity === 'urgent'

    return (
      <div
        style={{
          border: `1px solid ${isUrgent ? '#fca5a5' : '#e5e7eb'}`,
          borderLeft: `4px solid ${isUrgent ? '#dc2626' : '#f59e0b'}`,
          borderRadius: 8,
          background: isUrgent ? '#fff5f5' : '#fff',
          marginBottom: 12,
        }}
      >
        {/* Header row */}
        <div
          style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }}
          onClick={() => setExpandedId(expanded ? null : flag.id)}
        >
          {isUrgent && (
            <span style={{
              background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 700,
              padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap', marginTop: 2,
            }}>
              URGENT
            </span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              {flag.members?.full_name ?? 'Unknown member'}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
              {SCAM_LABELS[flag.scam_type] ?? flag.scam_type} · {SOURCE_LABELS[flag.source] ?? flag.source} · {formatDate(flag.created_at)}
            </div>
          </div>
          <span style={{ color: '#9ca3af', fontSize: 18, userSelect: 'none' }}>
            {expanded ? '▾' : '›'}
          </span>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div style={{ borderTop: '1px solid #f3f4f6', padding: '14px 16px' }}>
            {flag.matched_text && (
              <div style={{
                background: '#fef3c7', border: '1px solid #fcd34d',
                borderRadius: 6, padding: '10px 12px', fontSize: 13,
                color: '#92400e', marginBottom: 14, fontStyle: 'italic',
              }}>
                "{flag.matched_text}"
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <a
                href={`/navigator/members/${flag.members?.id}`}
                style={{
                  display: 'inline-block', padding: '7px 14px', background: '#1d4ed8',
                  color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                View member profile
              </a>
              {flag.members?.phone && (
                <div style={{
                  padding: '7px 14px', background: '#f3f4f6', borderRadius: 6,
                  fontSize: 13, color: '#374151',
                }}>
                  📞 {flag.members.phone}
                </div>
              )}
              {flag.family_notified_at && (
                <div style={{
                  padding: '7px 14px', background: '#ecfdf5', borderRadius: 6,
                  fontSize: 12, color: '#065f46',
                }}>
                  ✓ Family notified {formatDate(flag.family_notified_at)}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                Resolution note (optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Spoke to member, confirmed false alarm…"
                value={resolutionNotes[flag.id] ?? ''}
                onChange={(e) =>
                  setResolutionNotes((prev) => ({ ...prev, [flag.id]: e.target.value }))
                }
                style={{
                  width: '100%', padding: '8px 10px', border: '1px solid #d1d5db',
                  borderRadius: 6, fontSize: 13, resize: 'vertical', fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                disabled={isPending}
                onClick={() => updateStatus(flag.id, 'reviewing')}
                style={{
                  padding: '7px 14px', background: '#fef3c7', border: '1px solid #fcd34d',
                  borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#92400e', cursor: 'pointer',
                }}
              >
                Mark reviewing
              </button>
              <button
                disabled={isPending}
                onClick={() => updateStatus(flag.id, 'confirmed', resolutionNotes[flag.id])}
                style={{
                  padding: '7px 14px', background: '#fef2f2', border: '1px solid #fca5a5',
                  borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#dc2626', cursor: 'pointer',
                }}
              >
                Confirm scam
              </button>
              <button
                disabled={isPending}
                onClick={() => updateStatus(flag.id, 'false_positive', resolutionNotes[flag.id])}
                style={{
                  padding: '7px 14px', background: '#f3f4f6', border: '1px solid #d1d5db',
                  borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
                }}
              >
                False positive
              </button>
              <button
                disabled={isPending}
                onClick={() => updateStatus(flag.id, 'resolved', resolutionNotes[flag.id])}
                style={{
                  padding: '7px 14px', background: '#ecfdf5', border: '1px solid #6ee7b7',
                  borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#065f46', cursor: 'pointer',
                }}
              >
                Mark resolved
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, background: '#1f2937', color: '#fff',
          padding: '10px 18px', borderRadius: 8, fontSize: 14, zIndex: 999,
        }}>
          {toast}
        </div>
      )}

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🛡️ Fraud & Scam Flags</h1>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
        Review detected scam patterns, confirm or dismiss, and contact at-risk members.
      </p>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {urgent.length > 0 && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 20,
            padding: '6px 14px', fontSize: 13, fontWeight: 700, color: '#dc2626',
          }}>
            ⚠️ {urgent.length} URGENT
          </div>
        )}
        <div style={{
          background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 20,
          padding: '6px 14px', fontSize: 13, color: '#92400e',
        }}>
          {concern.length} needs review
        </div>
        <div style={{
          background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 20,
          padding: '6px 14px', fontSize: 13, color: '#6b7280',
        }}>
          {resolved.length} resolved (30d)
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid #e5e7eb' }}>
        {(['open', 'resolved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: activeTab === tab ? 700 : 400,
              color: activeTab === tab ? '#1d4ed8' : '#6b7280',
              borderBottom: activeTab === tab ? '2px solid #1d4ed8' : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            {tab === 'open' ? `Active (${flags.length})` : `Resolved (${resolved.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'open' && (
        <div>
          {flags.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px 20px', color: '#9ca3af',
              background: '#f9fafb', borderRadius: 8,
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🛡️</div>
              <div style={{ fontWeight: 600 }}>No open fraud flags</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>The platform will surface new flags automatically</div>
            </div>
          ) : (
            <>
              {urgent.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                    ⚠️ Urgent — possible active scam
                  </div>
                  {urgent.map((f) => <FlagCard key={f.id} flag={f} />)}
                </div>
              )}
              {concern.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Needs review
                  </div>
                  {concern.map((f) => <FlagCard key={f.id} flag={f} />)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'resolved' && (
        <div>
          {resolved.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
              No resolved flags in the last 30 days.
            </div>
          ) : (
            resolved.map((f) => (
              <div
                key={f.id}
                style={{
                  border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px',
                  marginBottom: 10, background: '#f9fafb',
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{
                    background: f.status === 'confirmed' ? '#fef2f2' : '#f3f4f6',
                    color: f.status === 'confirmed' ? '#dc2626' : '#6b7280',
                    fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                  }}>
                    {f.status.replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{f.members?.full_name}</span>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>— {SCAM_LABELS[f.scam_type] ?? f.scam_type}</span>
                  <span style={{ fontSize: 12, color: '#d1d5db', marginLeft: 'auto' }}>
                    {formatDate(f.created_at)}
                  </span>
                </div>
                {f.resolution_note && (
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                    Note: {f.resolution_note}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
