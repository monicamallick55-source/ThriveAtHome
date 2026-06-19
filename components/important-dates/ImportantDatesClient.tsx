'use client'

import { useState, useEffect, useRef } from 'react'
import type { TrackedItem, ItemType, TrackedItemStatus } from '@/lib/data/tracked-items-types'
import { ITEM_TYPE_DEFAULTS } from '@/lib/data/tracked-items-types'

interface AttachmentUrl { path: string; url: string; original_name: string; mime: string }

async function fetchSignedUrls(paths: string[]): Promise<AttachmentUrl[]> {
  if (!paths.length) return []
  const res = await fetch('/api/tracked-items/signed-urls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paths }),
  })
  if (!res.ok) return []
  const json = await res.json()
  return json.urls ?? []
}

// ── Urgency helpers ────────────────────────────────────────────────────────

function getDaysUntil(dateStr: string): number {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  d.setUTCHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function urgencyColor(days: number): string {
  if (days <= 7) return '#dc2626'   // red
  if (days <= 30) return '#d97706'  // amber
  return '#059669'                  // green
}

function urgencyBg(days: number): string {
  if (days <= 7) return '#fef2f2'
  if (days <= 30) return '#fffbeb'
  return '#f0fdf4'
}

function countdownLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} day${days !== 1 ? 's' : ''}`
}

// ── Item type selector data ────────────────────────────────────────────────

const ITEM_TYPE_OPTIONS: { type: ItemType; emoji: string; label: string }[] = [
  { type: 'prescription',     emoji: '💊', label: 'Prescription' },
  { type: 'home_insurance',   emoji: '🏠', label: 'Home Insurance' },
  { type: 'car_insurance',    emoji: '🚗', label: 'Car Insurance' },
  { type: 'health_insurance', emoji: '🏥', label: 'Health Insurance' },
  { type: 'drivers_license',  emoji: '🪪', label: "Driver's License" },
  { type: 'car_registration', emoji: '📋', label: 'Car Registration' },
  { type: 'aaa_membership',   emoji: '🛣️',  label: 'AAA Membership' },
  { type: 'passport',         emoji: '✈️',  label: 'Passport' },
  { type: 'gym_membership',   emoji: '🏋️',  label: 'Gym Membership' },
  { type: 'appointment',      emoji: '📅', label: 'Appointment' },
  { type: 'other',            emoji: '➕', label: 'Other' },
]

// ── Shared styles ─────────────────────────────────────────────────────────

const INPUT: React.CSSProperties = {
  width: '100%',
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  border: '1.5px solid var(--color-warm-grey)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 14px',
  outline: 'none',
  backgroundColor: 'white',
  boxSizing: 'border-box',
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'block', marginBottom: '6px' }}>
      {children}{required && <span style={{ color: '#dc2626', marginLeft: '3px' }}>*</span>}
    </label>
  )
}

// ── Add/Edit modal ─────────────────────────────────────────────────────────

interface ItemFormProps {
  initial?: TrackedItem
  onSaved: (item: TrackedItem) => void
  onCancel: () => void
}

function ItemForm({ initial, onSaved, onCancel }: ItemFormProps) {
  const [itemType, setItemType] = useState<ItemType>(initial?.item_type ?? 'other')
  const [itemName, setItemName] = useState(initial?.item_name ?? '')
  const [date, setDate] = useState(initial?.expiration_or_appointment_date ?? '')
  const [reminderDays, setReminderDays] = useState(
    initial?.reminder_lead_days ?? ITEM_TYPE_DEFAULTS.other.reminder_lead_days
  )
  const [isRecurring, setIsRecurring] = useState(
    initial?.is_recurring ?? ITEM_TYPE_DEFAULTS.other.is_recurring
  )
  const [cycleDays, setCycleDays] = useState<number | ''>(
    initial?.recurrence_cycle_days ?? ''
  )
  const [contactInfo, setContactInfo] = useState(initial?.renewal_contact_info ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function onTypeChange(t: ItemType) {
    setItemType(t)
    const d = ITEM_TYPE_DEFAULTS[t]
    setReminderDays(d.reminder_lead_days)
    setIsRecurring(d.is_recurring)
    setCycleDays(d.recurrence_cycle_days ?? '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!itemName.trim()) { setError('Item name is required.'); return }
    if (!date) { setError('Date is required.'); return }
    setSubmitting(true); setError(null)

    const defaults = ITEM_TYPE_DEFAULTS[itemType]
    const body = {
      item_type: itemType,
      category: defaults.category,
      item_name: itemName.trim(),
      expiration_or_appointment_date: date,
      reminder_lead_days: reminderDays,
      is_recurring: isRecurring,
      recurrence_cycle_days: isRecurring && cycleDays !== '' ? Number(cycleDays) : null,
      renewal_contact_info: contactInfo.trim() || null,
      notes: notes.trim() || null,
    }

    try {
      const url = initial ? `/api/tracked-items/${initial.id}` : '/api/tracked-items'
      const method = initial ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error ?? 'Could not save item.'); return }
      onSaved(json.item)
    } catch { setError('Network error. Please try again.') } finally { setSubmitting(false) }
  }

  return (
    <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', margin: '0 0 20px' }}>
        {initial ? 'Edit item' : 'Add important date'}
      </h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <Label required>Type</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
            {ITEM_TYPE_OPTIONS.map(opt => (
              <button
                key={opt.type}
                type="button"
                onClick={() => onTypeChange(opt.type)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 10px',
                  border: `2px solid ${itemType === opt.type ? 'var(--color-teal)' : 'var(--color-warm-grey)'}`,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: itemType === opt.type ? '#f0fdfa' : 'white',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: '13px',
                  color: 'var(--color-text-primary)',
                  textAlign: 'left',
                }}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label required>Name / description</Label>
          <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} placeholder={
            itemType === 'prescription' ? 'e.g. Metformin' :
            itemType === 'appointment' ? 'e.g. Dr. Smith annual physical' :
            itemType === 'car_registration' ? 'e.g. Honda Civic registration' :
            'Name this item'
          } style={INPUT} required />
        </div>
        <div>
          <Label required>{itemType === 'appointment' ? 'Appointment date' : 'Expiration / renewal date'}</Label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={INPUT} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <Label>Reminder lead time (days)</Label>
            <input type="number" min={1} max={365} value={reminderDays} onChange={e => setReminderDays(parseInt(e.target.value) || 1)} style={INPUT} />
          </div>
          <div>
            <Label>Recurring?</Label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
              {[true, false].map(v => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setIsRecurring(v)}
                  style={{
                    flex: 1, padding: '10px 0',
                    border: `2px solid ${isRecurring === v ? 'var(--color-teal)' : 'var(--color-warm-grey)'}`,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isRecurring === v ? '#f0fdfa' : 'white',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: '14px',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
        </div>
        {isRecurring && (
          <div>
            <Label>Repeat every (days)</Label>
            <input type="number" min={1} max={3650} value={cycleDays} onChange={e => setCycleDays(e.target.value === '' ? '' : parseInt(e.target.value))} placeholder="e.g. 365 for annual, 28 for monthly" style={INPUT} />
          </div>
        )}
        <div>
          <Label>Renewal / contact info (optional)</Label>
          <input type="text" value={contactInfo} onChange={e => setContactInfo(e.target.value)} placeholder="e.g. (800) 555-0100 or website" style={INPUT} />
        </div>
        <div>
          <Label>Notes (optional)</Label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any notes or reminders for yourself…" style={{ ...INPUT, resize: 'vertical', minHeight: '64px' }} />
        </div>
        {error && (
          <p role="alert" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#dc2626', backgroundColor: '#fef2f2', borderRadius: 'var(--radius-sm)', padding: '10px 14px', margin: 0 }}>
            ⚠️ {error}
          </p>
        )}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} disabled={submitting} style={{ fontFamily: 'var(--font-body)', fontSize: '15px', padding: '10px 20px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-warm-grey)', backgroundColor: 'white', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, padding: '10px 24px', borderRadius: 'var(--radius-md)', border: 'none', backgroundColor: 'var(--color-navy)', color: 'white', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Saving…' : initial ? 'Save changes' : 'Add item'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Item card ─────────────────────────────────────────────────────────────

interface ItemCardProps {
  item: TrackedItem
  onUpdated: (item: TrackedItem) => void
  onDeleted: (id: string) => void
}

function ItemCard({ item, onUpdated, onDeleted }: ItemCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [showReschedule, setShowReschedule] = useState(false)
  const [helpRequested, setHelpRequested] = useState(false)
  const [attachments, setAttachments] = useState<AttachmentUrl[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (expanded && item.attachments.length > 0) {
      fetchSignedUrls(item.attachments).then(setAttachments)
    }
  }, [expanded, item.attachments])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setUploadError(null)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('item_id', item.id)
    try {
      const res = await fetch('/api/tracked-items/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) { setUploadError(json.error ?? 'Upload failed.'); return }
      const newUrl: AttachmentUrl = { path: json.path, url: '', original_name: json.original_name, mime: json.mime }
      // Re-fetch signed URLs so new file has a valid URL
      const newPaths = [...item.attachments, json.path]
      const urls = await fetchSignedUrls(newPaths)
      setAttachments(urls)
      // Update the item in parent state
      onUpdated({ ...item, attachments: newPaths })
    } catch { setUploadError('Network error. Please try again.') } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const days = getDaysUntil(item.expiration_or_appointment_date)
  const color = urgencyColor(days)
  const bg = urgencyBg(days)
  const defaults = ITEM_TYPE_DEFAULTS[item.item_type]
  const emoji = defaults?.emoji ?? '📅'
  const isAppointment = item.category === 'appointment'

  async function doAction(action: string, extra?: Record<string, unknown>) {
    setActionLoading(true); setActionError(null)
    try {
      const res = await fetch(`/api/tracked-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setActionError(json.error ?? 'Something went wrong.'); return }
      if (action === 'request_help') { setHelpRequested(true); return }
      if (json.item) onUpdated(json.item)
      if (action === 'cancel') onDeleted(item.id)
    } catch { setActionError('Network error. Please try again.') } finally { setActionLoading(false) }
  }

  async function handleDelete() {
    if (!confirm('Delete this item?')) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/tracked-items/${item.id}`, { method: 'DELETE' })
      if (res.ok) onDeleted(item.id)
      else setActionError('Could not delete item.')
    } catch { setActionError('Network error.') } finally { setActionLoading(false) }
  }

  if (editing) {
    return (
      <ItemForm
        initial={item}
        onSaved={updated => { onUpdated(updated); setEditing(false) }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: `1.5px solid ${color}20`, overflow: 'hidden' }}>
      {/* Card header */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: 'white', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
          {emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.item_name}
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
            {isAppointment ? 'Appointment' : 'Renewal'} · {item.expiration_or_appointment_date}
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, color, margin: '0 0 2px' }}>
            {countdownLabel(days)}
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
            {item.attachments.length > 0 && <span title={`${item.attachments.length} document(s)`}>📎 </span>}
            {expanded ? '▲ hide' : '▼ details'}
          </p>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${color}20` }}>
          {item.renewal_contact_info && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '12px 0 0' }}>
              📞 {item.renewal_contact_info}
            </p>
          )}
          {item.notes && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '8px 0 0' }}>
              📝 {item.notes}
            </p>
          )}
          {item.is_recurring && item.recurrence_cycle_days && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: '8px 0 0' }}>
              🔄 Repeats every {item.recurrence_cycle_days} days
            </p>
          )}
          {item.reminder_lead_days && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
              🔔 Reminder {item.reminder_lead_days} day{item.reminder_lead_days !== 1 ? 's' : ''} before
            </p>
          )}

          {actionError && (
            <p role="alert" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#dc2626', backgroundColor: '#fef2f2', borderRadius: 'var(--radius-sm)', padding: '8px 12px', margin: '12px 0 0' }}>
              ⚠️ {actionError}
            </p>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
            <ActionPill
              label="✅ I already took care of it"
              onClick={() => doAction('complete')}
              disabled={actionLoading}
              color="#059669"
            />
            <ActionPill
              label="⏰ Remind me in a week"
              onClick={() => doAction('snooze', { days: 7 })}
              disabled={actionLoading}
              color="#d97706"
            />
            {!helpRequested ? (
              <ActionPill
                label="🙋 Help me renew this"
                onClick={() => doAction('request_help')}
                disabled={actionLoading}
                color="#0369a1"
              />
            ) : (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#059669', padding: '6px 12px', backgroundColor: '#f0fdf4', borderRadius: '100px' }}>
                ✓ Navigator notified
              </span>
            )}
            {isAppointment && !showReschedule && (
              <ActionPill
                label="📆 Reschedule"
                onClick={() => setShowReschedule(true)}
                disabled={actionLoading}
                color="#6b21a8"
              />
            )}
            {isAppointment && (
              <ActionPill
                label="❌ Cancel appointment"
                onClick={() => doAction('cancel')}
                disabled={actionLoading}
                color="#dc2626"
              />
            )}
          </div>

          {showReschedule && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="date"
                value={rescheduleDate}
                onChange={e => setRescheduleDate(e.target.value)}
                style={{ ...INPUT, width: 'auto', flex: 1 }}
              />
              <button
                onClick={() => { if (rescheduleDate) doAction('reschedule', { new_date: rescheduleDate }); setShowReschedule(false) }}
                disabled={actionLoading || !rescheduleDate}
                style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, padding: '10px 16px', borderRadius: 'var(--radius-md)', border: 'none', backgroundColor: '#6b21a8', color: 'white', cursor: 'pointer', opacity: !rescheduleDate ? 0.5 : 1 }}
              >
                Confirm
              </button>
              <button
                onClick={() => setShowReschedule(false)}
                style={{ fontFamily: 'var(--font-body)', fontSize: '14px', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-warm-grey)', backgroundColor: 'white', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Attachments */}
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--color-warm-grey)' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>
              📎 Documents
            </p>
            {attachments.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                {attachments.map(a => (
                  <a
                    key={a.path}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-warm-grey)', backgroundColor: 'white', textDecoration: 'none', color: 'var(--color-navy)', fontFamily: 'var(--font-body)', fontSize: '12px' }}
                  >
                    {a.mime === 'application/pdf' ? '📄' : '🖼️'}
                    <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.original_name}</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>↗</span>
                  </a>
                ))}
              </div>
            )}
            {uploadError && (
              <p role="alert" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#dc2626', margin: '0 0 6px' }}>
                ⚠️ {uploadError}
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ display: 'none' }}
              aria-label="Upload attachment"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-teal)', backgroundColor: 'transparent', border: '1.5px dashed var(--color-teal)', borderRadius: 'var(--radius-sm)', padding: '6px 14px', cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.6 : 1 }}
            >
              {uploading ? 'Uploading…' : '+ Upload document'}
            </button>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
              Insurance card, registration, appointment confirmation — JPEG, PNG, or PDF up to 10 MB
            </p>
          </div>

          {/* Edit / Delete */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--color-warm-grey)' }}>
            <button
              onClick={() => setEditing(true)}
              style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-navy)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              ✏️ Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#dc2626', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              🗑 Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionPill({ label, onClick, disabled, color }: { label: string; onClick: () => void; disabled: boolean; color: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600,
        padding: '7px 14px', borderRadius: '100px',
        border: `1.5px solid ${color}`,
        backgroundColor: `${color}10`,
        color,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

interface Props {
  initialItems: TrackedItem[]
}

export default function ImportantDatesClient({ initialItems }: Props) {
  const [items, setItems] = useState<TrackedItem[]>(initialItems)
  const [showForm, setShowForm] = useState(false)

  const renewals = items.filter(i => i.category === 'renewal').sort((a, b) => getDaysUntil(a.expiration_or_appointment_date) - getDaysUntil(b.expiration_or_appointment_date))
  const appointments = items.filter(i => i.category === 'appointment').sort((a, b) => getDaysUntil(a.expiration_or_appointment_date) - getDaysUntil(b.expiration_or_appointment_date))

  function handleSaved(item: TrackedItem) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === item.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = item
        return next
      }
      return [item, ...prev]
    })
    setShowForm(false)
  }

  function handleUpdated(item: TrackedItem) {
    setItems(prev => prev.map(i => i.id === item.id ? item : i).filter(i => (i.status as TrackedItemStatus) === 'active' || (i.status as TrackedItemStatus) === 'snoozed'))
  }

  function handleDeleted(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div>
      {showForm ? (
        <div style={{ marginBottom: '28px' }}>
          <ItemForm onSaved={handleSaved} onCancel={() => setShowForm(false)} />
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 24px', marginBottom: '28px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-navy)', color: 'white',
            border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600,
          }}
        >
          <span>＋</span>
          <span>Add important date</span>
        </button>
      )}

      {items.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1.5px dashed var(--color-warm-grey)' }}>
          <p style={{ fontSize: '36px', margin: '0 0 12px' }}>📅</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: '0 0 8px' }}>No important dates yet</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Add prescriptions, insurance renewals, appointments, and more — and we'll remind you before they're due.
          </p>
        </div>
      )}

      {renewals.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 12px' }}>
            Renewals &amp; Subscriptions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {renewals.map(item => (
              <ItemCard key={item.id} item={item} onUpdated={handleUpdated} onDeleted={handleDeleted} />
            ))}
          </div>
        </section>
      )}

      {appointments.length > 0 && (
        <section>
          <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 12px' }}>
            Appointments
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {appointments.map(item => (
              <ItemCard key={item.id} item={item} onUpdated={handleUpdated} onDeleted={handleDeleted} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
