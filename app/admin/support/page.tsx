'use client'
import { useState, useEffect } from 'react'
type Ticket = { id: string; created_at: string; submitter_name: string|null; submitter_email: string; portal_type: string; category: string; priority: string; subject: string; description: string; status: string; assigned_to: string|null; sla_breach_at: string|null; resolved_at: string|null }
const SC: Record<string,string> = { open:'#ef4444', in_progress:'#f59e0b', waiting:'#6366f1', resolved:'#10b981', closed:'#9ca3af' }
const PC: Record<string,string> = { low:'#9ca3af', normal:'#6b7280', urgent:'#f59e0b', critical:'#ef4444' }
export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('open')
  const [selected, setSelected] = useState<Ticket|null>(null)
  const [updating, setUpdating] = useState(false)
  useEffect(() => { fetchTickets() }, [filterStatus])
  async function fetchTickets() {
    setLoading(true)
    try { const res = await fetch(`/api/admin/support?status=${filterStatus}`); const d = await res.json(); setTickets(d.tickets ?? []) }
    catch { setTickets([]) }
    finally { setLoading(false) }
  }
  async function updateStatus(id: string, status: string) {
    setUpdating(true)
    await fetch(`/api/admin/support/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setUpdating(false)
    if (selected?.id === id) setSelected({ ...selected, status })
    fetchTickets()
  }
  function slaColor(breach: string|null, status: string) {
    if (!breach || status === 'resolved' || status === 'closed') return '#10b981'
    const h = (new Date(breach).getTime() - Date.now()) / 3600000
    return h < 0 ? '#ef4444' : h < 2 ? '#f59e0b' : '#10b981'
  }
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937', margin: 0 }}>Support Tickets</h1>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 3 }}>{tickets.length} {filterStatus} ticket{tickets.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['open','in_progress','waiting','resolved','all'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: filterStatus===s?700:400, background: filterStatus===s?'#1f2937':'#f3f4f6', color: filterStatus===s?'#fff':'#6b7280' }}>
              {s.replace('_',' ')}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Loading…</p>}
          {!loading && tickets.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem', border: '1px dashed #e5e7eb', borderRadius: 12 }}>No {filterStatus} tickets</div>}
          {tickets.map(t => (
            <div key={t.id} onClick={() => setSelected(t===selected?null:t)} style={{ padding: '16px 18px', border: `1px solid ${selected?.id===t.id?'#6366f1':'#e5e7eb'}`, borderRadius: 12, background: selected?.id===t.id?'#fafafe':'#fff', cursor: 'pointer', boxShadow: selected?.id===t.id?'0 0 0 2px #c7d2fe':'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, background: SC[t.status]+'20', color: SC[t.status], padding: '2px 8px', borderRadius: 99 }}>{t.status.replace('_',' ')}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, background: PC[t.priority]+'20', color: PC[t.priority], padding: '2px 8px', borderRadius: 99 }}>{t.priority}</span>
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af', background: '#f3f4f6', padding: '2px 8px', borderRadius: 99 }}>{t.portal_type}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1f2937', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{t.submitter_name ?? t.submitter_email} · {t.category.replace('_',' ')}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{new Date(t.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                  {t.sla_breach_at && t.status!=='resolved' && t.status!=='closed' && (
                    <div style={{ fontSize: '0.68rem', marginTop: 2, color: slaColor(t.sla_breach_at, t.status), fontWeight: 700 }}>
                      SLA {new Date(t.sla_breach_at)<new Date()?'BREACHED':`by ${new Date(t.sla_breach_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {selected && (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: '22px', background: '#fff', position: 'sticky', top: 20, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: 4 }}>#{selected.id.slice(0,8)}</div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1f2937', margin: 0 }}>{selected.subject}</h2>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, fontSize: '0.82rem' }}>
              {[['From', `${selected.submitter_name??''} ${selected.submitter_email}`],['Portal',selected.portal_type],['Category',selected.category.replace('_',' ')],['Priority',selected.priority],['Submitted',new Date(selected.created_at).toLocaleString()]]
                .map(([k,v]) => <div key={k} style={{ display:'flex', gap:8 }}><span style={{ color:'#9ca3af', minWidth:80 }}>{k}</span><span style={{ color:'#1f2937', fontWeight:500 }}>{v}</span></div>)}
            </div>
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '14px', marginBottom: 20, fontSize: '0.875rem', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selected.description}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: 10 }}>Update status</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['open','in_progress','waiting','resolved','closed'].map(s => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)} disabled={updating||selected.status===s} style={{ padding: '7px 14px', borderRadius: 7, border: `1px solid ${SC[s]}`, cursor: selected.status===s?'default':'pointer', background: selected.status===s?SC[s]:'#fff', color: selected.status===s?'#fff':SC[s], fontWeight: 600, fontSize: '0.78rem', opacity: updating?0.5:1 }}>
                    {s.replace('_',' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
