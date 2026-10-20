'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type PortalType = 'aaa' | 'org' | 'agency' | 'senior_center' | 'network'

interface OrgOption {
  id: string
  name: string
}

interface UserRow {
  family_member_id: string
  user_id: string
  email: string
  full_name: string
  role: string
  aaa_id: string | null
  org_id: string | null
  agency_id: string | null
  senior_center_id: string | null
  network_id: string | null
}

const PORTAL_LABELS: Record<PortalType, { label: string; table: string; fk: string; portal: string }> = {
  aaa:           { label: 'Area Agency on Aging (AAA)',  table: 'area_agencies_on_aging', fk: 'aaa_id',           portal: '/aaa-admin' },
  org:           { label: 'Community Org',               table: 'community_orgs',          fk: 'org_id',           portal: '/org-admin' },
  agency:        { label: 'Care Agency',                 table: 'care_agencies',            fk: 'agency_id',        portal: '/agency-admin' },
  senior_center: { label: 'Senior Center',               table: 'senior_centers',           fk: 'senior_center_id', portal: '/senior-center-admin' },
  network:       { label: 'Network Account',             table: 'network_accounts',         fk: 'network_id',       portal: '/network-admin' },
}

const ROLE_TO_PORTAL: Record<string, PortalType[]> = {
  aaa_admin:           ['aaa'],
  org_admin:           ['org'],
  agency_admin:        ['agency'],
  senior_center_admin: ['senior_center'],
  network_admin:       ['network'],
  navigator:           ['org', 'agency'],
  admin:               ['aaa', 'org', 'agency', 'senior_center', 'network'],
}

function statusDot(linked: boolean) {
  return (
    <span style={{
      display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
      backgroundColor: linked ? '#16a34a' : '#dc2626',
      marginRight: 8, flexShrink: 0,
    }} />
  )
}

export default function OrgLinkingPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [orgs, setOrgs] = useState<Record<PortalType, OrgOption[]>>({ aaa: [], org: [], agency: [], senior_center: [], network: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/org-linking')
    const data = await res.json()
    setUsers(data.users ?? [])
    setOrgs(data.orgs ?? { aaa: [], org: [], agency: [], senior_center: [], network: [] })
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function link(familyMemberId: string, fk: string, orgId: string | null) {
    setSaving(familyMemberId + fk)
    const res = await fetch('/api/admin/org-linking', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ family_member_id: familyMemberId, fk, org_id: orgId }),
    })
    if (res.ok) {
      setMsg({ type: 'ok', text: 'Saved.' })
      await load()
    } else {
      const e = await res.json()
      setMsg({ type: 'err', text: e.error ?? 'Save failed.' })
    }
    setSaving(null)
    setTimeout(() => setMsg(null), 3000)
  }

  const filtered = users.filter(u => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      u.email?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Nav */}
      <nav style={{ backgroundColor: '#0f172a', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/admin" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecoration: 'none' }}>← Admin</Link>
          <span style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>Org Linking</span>
        </div>
        <a href="/api/auth/signout" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecoration: 'none' }}>Sign out</a>
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Link users to org portals</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            For each org-admin, AAA admin, agency admin, senior center admin, or network admin user — set which organisation their portal should show.
            Green dot = linked, red = not yet linked.
          </p>
        </div>

        {/* Toast */}
        {msg && (
          <div style={{
            marginBottom: 16, padding: '10px 16px', borderRadius: 8, fontSize: 14,
            backgroundColor: msg.type === 'ok' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${msg.type === 'ok' ? '#bbf7d0' : '#fecaca'}`,
            color: msg.type === 'ok' ? '#166534' : '#991b1b',
          }}>
            {msg.text}
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name, email, or role…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', maxWidth: 400, padding: '10px 14px', borderRadius: 8,
            border: '1px solid #e2e8f0', fontSize: 14, marginBottom: 20,
            outline: 'none', boxSizing: 'border-box',
          }}
        />

        {loading ? (
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading users…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 14 }}>No org-admin users found.{search ? ' Try a different search.' : ''}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(u => {
              const portals = ROLE_TO_PORTAL[u.role] ?? []
              const currentIds: Record<string, string | null> = {
                aaa_id: u.aaa_id,
                org_id: u.org_id,
                agency_id: u.agency_id,
                senior_center_id: u.senior_center_id,
                network_id: u.network_id,
              }

              return (
                <div key={u.family_member_id} style={{
                  backgroundColor: 'white', border: '1px solid #e2e8f0',
                  borderRadius: 12, padding: 20,
                }}>
                  {/* User header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 15, color: '#0f172a', marginBottom: 2 }}>{u.full_name || '(no name)'}</p>
                      <p style={{ fontSize: 13, color: '#64748b' }}>{u.email}</p>
                    </div>
                    <span style={{
                      backgroundColor: '#f1f5f9', color: '#475569',
                      fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                      fontFamily: 'monospace',
                    }}>
                      {u.role}
                    </span>
                  </div>

                  {portals.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#94a3b8' }}>No org portals for this role.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {portals.map(pType => {
                        const meta = PORTAL_LABELS[pType]
                        const fk = meta.fk
                        const currentVal = currentIds[fk]
                        const options = orgs[pType] ?? []
                        const isSaving = saving === u.family_member_id + fk

                        return (
                          <div key={pType} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 14px', borderRadius: 8,
                            backgroundColor: currentVal ? '#f0fdf4' : '#fff7ed',
                            border: `1px solid ${currentVal ? '#bbf7d0' : '#fed7aa'}`,
                            flexWrap: 'wrap',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', minWidth: 200 }}>
                              {statusDot(!!currentVal)}
                              <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{meta.label}</span>
                            </div>

                            <select
                              value={currentVal ?? ''}
                              disabled={isSaving}
                              onChange={e => link(u.family_member_id, fk, e.target.value || null)}
                              style={{
                                flex: 1, minWidth: 200, padding: '7px 10px',
                                border: '1px solid #d1d5db', borderRadius: 6,
                                fontSize: 13, backgroundColor: 'white', color: '#111827',
                                cursor: isSaving ? 'wait' : 'pointer',
                              }}
                            >
                              <option value="">— not linked —</option>
                              {options.map(o => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                              ))}
                            </select>

                            {isSaving && (
                              <span style={{ fontSize: 12, color: '#6b7280' }}>Saving…</span>
                            )}

                            {currentVal && (
                              <a
                                href={meta.portal}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: 12, color: '#0284c7', textDecoration: 'none', whiteSpace: 'nowrap' }}
                              >
                                View portal ↗
                              </a>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div style={{ marginTop: 32, padding: 16, backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>How this works</p>
          <ul style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, paddingLeft: 20 }}>
            <li>Select an org from the dropdown — it saves immediately.</li>
            <li>The user&apos;s portal will show that org&apos;s data on their next page load.</li>
            <li>To unlink, choose <em>— not linked —</em> from the dropdown.</li>
            <li>Green = linked and active. Orange = unlinked (user sees &quot;contact ThriveAtHome&quot; message).</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
