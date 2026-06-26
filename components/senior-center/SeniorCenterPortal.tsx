'use client'

import { useState } from 'react'
import type {
  SeniorCenterRow,
  CenterDropinRow,
  CenterActivityRow,
  RoomBookingRow,
  CongregrateMealRow,
  SeniorCenterStats,
} from '@/types/database'

const ACTIVITY_TYPES = [
  { value: 'class', label: 'Class / Workshop' },
  { value: 'exercise', label: 'Exercise / Fitness' },
  { value: 'arts', label: 'Arts & Crafts' },
  { value: 'social', label: 'Social Event' },
  { value: 'educational', label: 'Educational Program' },
  { value: 'health', label: 'Health & Wellness' },
  { value: 'trip', label: 'Day Trip / Outing' },
  { value: 'volunteer', label: 'Volunteer Activity' },
  { value: 'other', label: 'Other' },
]

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack / Refreshments' },
]

const VISITOR_TYPES = [
  { value: 'member', label: 'Member' },
  { value: 'guest', label: 'Guest / Visitor' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'staff', label: 'Staff' },
]

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div style={{ backgroundColor: 'var(--color-warm-white)', border: '1px solid var(--color-warm-grey)', borderRadius: '12px', padding: '20px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: '32px', fontWeight: 700, color: color ?? 'var(--color-navy)', fontFamily: 'var(--font-display)' }}>{value}</div>
      <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{label}</div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

interface Props {
  center: SeniorCenterRow
  initialDropins: CenterDropinRow[]
  initialActivities: CenterActivityRow[]
  initialRooms: RoomBookingRow[]
  initialMeals: CongregrateMealRow[]
  stats: SeniorCenterStats | null
}

export default function SeniorCenterPortal({ center, initialDropins, initialActivities, initialRooms, initialMeals, stats }: Props) {
  const [activeTab, setActiveTab] = useState<'attendance' | 'activities' | 'rooms' | 'meals'>('attendance')

  // Attendance state
  const [dropins, setDropins] = useState<CenterDropinRow[]>(initialDropins)
  const [showCheckinForm, setShowCheckinForm] = useState(false)
  const [checkinName, setCheckinName] = useState('')
  const [checkinType, setCheckinType] = useState('member')
  const [checkinNotes, setCheckinNotes] = useState('')
  const [checkinSaving, setCheckinSaving] = useState(false)
  const [checkinError, setCheckinError] = useState('')
  const [checkinSuccess, setCheckinSuccess] = useState('')

  // Activities state
  const [activities, setActivities] = useState<CenterActivityRow[]>(initialActivities)
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [activityForm, setActivityForm] = useState({ title: '', activity_type: 'class', room: '', instructor_name: '', scheduled_at: '', duration_minutes: '60', max_capacity: '', description: '' })
  const [activitySaving, setActivitySaving] = useState(false)
  const [activityError, setActivityError] = useState('')
  const [activitySuccess, setActivitySuccess] = useState('')
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null)
  const [regName, setRegName] = useState('')
  const [regSaving, setRegSaving] = useState(false)
  const [regSuccess, setRegSuccess] = useState<Record<string, string>>({})

  // Room bookings state
  const [rooms, setRooms] = useState<RoomBookingRow[]>(initialRooms)
  const [showRoomForm, setShowRoomForm] = useState(false)
  const [roomForm, setRoomForm] = useState({ room: '', booking_title: '', booked_by: '', start_time: '', end_time: '', notes: '' })
  const [roomSaving, setRoomSaving] = useState(false)
  const [roomError, setRoomError] = useState('')
  const [roomSuccess, setRoomSuccess] = useState('')

  // Meals state
  const [meals, setMeals] = useState<CongregrateMealRow[]>(initialMeals)
  const [showMealForm, setShowMealForm] = useState(false)
  const [mealForm, setMealForm] = useState({ meal_date: new Date().toISOString().split('T')[0], meal_type: 'lunch', attendee_count: '', menu_description: '', notes: '' })
  const [mealSaving, setMealSaving] = useState(false)
  const [mealError, setMealError] = useState('')
  const [mealSuccess, setMealSuccess] = useState('')

  async function handleCheckin() {
    if (!checkinName.trim()) { setCheckinError('Please enter a name.'); return }
    setCheckinSaving(true); setCheckinError('')
    const res = await fetch('/api/senior-center/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ center_id: center.id, visitor_name: checkinName.trim(), visitor_type: checkinType, notes: checkinNotes || null }),
    })
    const json = await res.json().catch(() => ({ error: 'Unexpected response' }))
    setCheckinSaving(false)
    if (!res.ok) { setCheckinError(json.error ?? 'Check-in failed.'); return }
    setDropins(prev => [json.data, ...prev])
    setCheckinName(''); setCheckinType('member'); setCheckinNotes('')
    setShowCheckinForm(false)
    setCheckinSuccess(`${json.data.visitor_name} checked in successfully.`)
    setTimeout(() => setCheckinSuccess(''), 4000)
  }

  async function handleCheckout(dropinId: string) {
    const res = await fetch('/api/senior-center/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dropin_id: dropinId }),
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok) {
      setDropins(prev => prev.map(d => d.id === dropinId ? json.data : d))
    }
  }

  async function handleCreateActivity() {
    if (!activityForm.title.trim() || !activityForm.scheduled_at) { setActivityError('Title and date/time are required.'); return }
    setActivitySaving(true); setActivityError('')
    const res = await fetch('/api/senior-center/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        center_id: center.id,
        title: activityForm.title.trim(),
        activity_type: activityForm.activity_type,
        room: activityForm.room || null,
        instructor_name: activityForm.instructor_name || null,
        scheduled_at: new Date(activityForm.scheduled_at).toISOString(),
        duration_minutes: parseInt(activityForm.duration_minutes) || 60,
        max_capacity: activityForm.max_capacity ? parseInt(activityForm.max_capacity) : null,
        description: activityForm.description || null,
      }),
    })
    const json = await res.json().catch(() => ({ error: 'Unexpected response' }))
    setActivitySaving(false)
    if (!res.ok) { setActivityError(json.error ?? 'Failed to create activity.'); return }
    setActivities(prev => [...prev, json.data].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()))
    setActivityForm({ title: '', activity_type: 'class', room: '', instructor_name: '', scheduled_at: '', duration_minutes: '60', max_capacity: '', description: '' })
    setShowActivityForm(false)
    setActivitySuccess(`"${json.data.title}" added to calendar.`)
    setTimeout(() => setActivitySuccess(''), 4000)
  }

  async function handleRegister(activityId: string) {
    if (!regName.trim()) return
    setRegSaving(true)
    const res = await fetch('/api/senior-center/activities', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity_id: activityId, center_id: center.id, visitor_name: regName.trim() }),
    })
    const json = await res.json().catch(() => ({}))
    setRegSaving(false)
    if (res.ok) {
      setActivities(prev => prev.map(a => a.id === activityId ? { ...a, registration_count: a.registration_count + 1 } : a))
      setRegSuccess(prev => ({ ...prev, [activityId]: `${regName.trim()} registered.` }))
      setRegName('')
      setTimeout(() => setRegSuccess(prev => { const n = { ...prev }; delete n[activityId]; return n }), 4000)
    }
  }

  async function handleCreateRoomBooking() {
    if (!roomForm.room.trim() || !roomForm.booking_title.trim() || !roomForm.start_time || !roomForm.end_time) { setRoomError('Room, title, start and end times are required.'); return }
    setRoomSaving(true); setRoomError('')
    const res = await fetch('/api/senior-center/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        center_id: center.id,
        room: roomForm.room.trim(),
        booking_title: roomForm.booking_title.trim(),
        booked_by: roomForm.booked_by || null,
        start_time: new Date(roomForm.start_time).toISOString(),
        end_time: new Date(roomForm.end_time).toISOString(),
        notes: roomForm.notes || null,
      }),
    })
    const json = await res.json().catch(() => ({ error: 'Unexpected response' }))
    setRoomSaving(false)
    if (!res.ok) { setRoomError(json.error ?? 'Failed to book room.'); return }
    setRooms(prev => [...prev, json.data].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()))
    setRoomForm({ room: '', booking_title: '', booked_by: '', start_time: '', end_time: '', notes: '' })
    setShowRoomForm(false)
    setRoomSuccess(`"${json.data.room}" booked for ${json.data.booking_title}.`)
    setTimeout(() => setRoomSuccess(''), 4000)
  }

  async function handleCancelRoom(bookingId: string) {
    const res = await fetch('/api/senior-center/rooms', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId }),
    })
    if (res.ok) {
      setRooms(prev => prev.map(r => r.id === bookingId ? { ...r, status: 'cancelled' } : r))
    }
  }

  async function handleLogMeal() {
    if (!mealForm.meal_date || !mealForm.attendee_count) { setMealError('Date and attendee count are required.'); return }
    setMealSaving(true); setMealError('')
    const res = await fetch('/api/senior-center/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        center_id: center.id,
        meal_date: mealForm.meal_date,
        meal_type: mealForm.meal_type,
        attendee_count: parseInt(mealForm.attendee_count),
        menu_description: mealForm.menu_description || null,
        notes: mealForm.notes || null,
      }),
    })
    const json = await res.json().catch(() => ({ error: 'Unexpected response' }))
    setMealSaving(false)
    if (!res.ok) { setMealError(json.error ?? 'Failed to log meal.'); return }
    setMeals(prev => {
      const filtered = prev.filter(m => !(m.meal_date === json.data.meal_date && m.meal_type === json.data.meal_type))
      return [json.data, ...filtered].sort((a, b) => b.meal_date.localeCompare(a.meal_date))
    })
    setMealForm(f => ({ ...f, attendee_count: '', menu_description: '', notes: '' }))
    setShowMealForm(false)
    setMealSuccess(`${json.data.meal_type} logged: ${json.data.attendee_count} attendees on ${json.data.meal_date}.`)
    setTimeout(() => setMealSuccess(''), 5000)
  }

  const activeDropins = dropins.filter(d => !d.check_out_at)
  const completedDropins = dropins.filter(d => d.check_out_at)

  const tabs = [
    { id: 'attendance', label: '👥 Daily Attendance', count: activeDropins.length },
    { id: 'activities', label: '📅 Activity Calendar', count: activities.length },
    { id: 'rooms', label: '🏢 Room Bookings', count: rooms.filter(r => r.status !== 'cancelled').length },
    { id: 'meals', label: '🍽️ Congregate Meals', count: null },
  ] as const

  const inputStyle: React.CSSProperties = { width: '100%', height: '44px', padding: '0 12px', border: '1.5px solid var(--color-warm-grey)', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-primary)', backgroundColor: 'var(--color-warm-white)', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }
  const btnPrimary: React.CSSProperties = { height: '44px', padding: '0 20px', backgroundColor: 'var(--color-navy)', color: 'var(--color-cream)', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }
  const btnSecondary: React.CSSProperties = { height: '44px', padding: '0 20px', backgroundColor: 'transparent', color: 'var(--color-navy)', border: '1.5px solid var(--color-navy)', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }
  const cardStyle: React.CSSProperties = { backgroundColor: 'var(--color-warm-white)', border: '1px solid var(--color-warm-grey)', borderRadius: '12px', padding: '16px 20px', marginBottom: '12px' }
  const successBanner: React.CSSProperties = { backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#065F46', fontFamily: 'var(--font-body)', fontSize: '15px' }
  const errorBanner: React.CSSProperties = { backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#991B1B', fontFamily: 'var(--font-body)', fontSize: '15px' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)' }}>
      {/* Nav header */}
      <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-cream)', fontWeight: 500 }}>ThriveAtHome</span>
          <span style={{ color: 'var(--color-cream)', opacity: 0.5, fontSize: '18px' }}>|</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-cream)', opacity: 0.85 }}>{center.center_name}</span>
        </div>
        <a href="/api/auth/signout" style={{ color: 'var(--color-cream)', opacity: 0.7, fontFamily: 'var(--font-body)', fontSize: '14px', textDecoration: 'none' }}>Sign out</a>
      </nav>

      {/* Stats bar */}
      <div style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', maxWidth: '1100px', margin: '0 auto' }}>
          <StatCard label="Today's visitors" value={stats?.today_dropins ?? 0} color="var(--color-cream)" />
          <StatCard label="This week" value={stats?.this_week_dropins ?? 0} color="var(--color-cream)" />
          <StatCard label="Upcoming activities" value={stats?.upcoming_activities ?? 0} color="var(--color-cream)" />
          <StatCard label="Meals this month" value={stats?.this_month_meals ?? 0} sub={`${stats?.total_meals_attendees_this_month ?? 0} total attendees`} color="var(--color-cream)" />
          <StatCard label="Rooms booked today" value={stats?.rooms_booked_today ?? 0} color="var(--color-cream)" />
        </div>
      </div>

      {/* Center info bar */}
      <div style={{ backgroundColor: 'var(--color-warm-white)', borderBottom: '1px solid var(--color-warm-grey)', padding: '12px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '24px', flexWrap: 'wrap', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          <span>📍 {center.address}, {center.city}, {center.state}</span>
          {center.phone && <span>📞 {center.phone}</span>}
          <span>🕐 {center.operating_hours}</span>
          <span>👥 Capacity: {center.capacity}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '2px solid var(--color-warm-grey)', backgroundColor: 'var(--color-warm-white)', padding: '0 32px' }}>
        <div style={{ display: 'flex', gap: '4px', maxWidth: '1100px', margin: '0 auto', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '14px 20px', border: 'none', borderBottom: activeTab === tab.id ? '3px solid var(--color-navy)' : '3px solid transparent', backgroundColor: 'transparent', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: activeTab === tab.id ? 700 : 500, color: activeTab === tab.id ? 'var(--color-navy)' : 'var(--color-text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span style={{ backgroundColor: 'var(--color-teal)', color: 'white', borderRadius: '12px', fontSize: '12px', padding: '1px 8px', fontWeight: 700 }}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px' }}>

        {/* ─── ATTENDANCE TAB ─── */}
        {activeTab === 'attendance' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>Daily Attendance — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
              <button style={btnPrimary} onClick={() => setShowCheckinForm(v => !v)}>+ Check In Visitor</button>
            </div>

            {checkinSuccess && <div style={successBanner}>✓ {checkinSuccess}</div>}

            {showCheckinForm && (
              <div style={{ ...cardStyle, borderColor: 'var(--color-teal)', marginBottom: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginTop: 0, marginBottom: '16px' }}>New Check-In</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>Name *</label>
                    <input style={inputStyle} value={checkinName} onChange={e => setCheckinName(e.target.value)} placeholder="Visitor name" />
                  </div>
                  <div>
                    <label style={labelStyle}>Visitor type</label>
                    <select style={inputStyle} value={checkinType} onChange={e => setCheckinType(e.target.value)}>
                      {VISITOR_TYPES.map(vt => <option key={vt.value} value={vt.value}>{vt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Notes (optional)</label>
                    <input style={inputStyle} value={checkinNotes} onChange={e => setCheckinNotes(e.target.value)} placeholder="Any notes" />
                  </div>
                </div>
                {checkinError && <div style={errorBanner}>{checkinError}</div>}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button style={btnPrimary} onClick={handleCheckin} disabled={checkinSaving}>{checkinSaving ? 'Checking in...' : 'Check In'}</button>
                  <button style={btnSecondary} onClick={() => { setShowCheckinForm(false); setCheckinError('') }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Active visitors */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '12px' }}>Currently here ({activeDropins.length})</h3>
              {activeDropins.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>No active check-ins yet today.</p>
              ) : (
                activeDropins.map(d => (
                  <div key={d.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderLeft: '4px solid var(--color-teal)' }}>
                    <div>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--color-navy)' }}>{d.visitor_name}</span>
                      <span style={{ marginLeft: '12px', fontSize: '13px', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-cream)', padding: '2px 10px', borderRadius: '12px' }}>{d.visitor_type}</span>
                      {d.notes && <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{d.notes}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>In at {formatTime(d.check_in_at)}</span>
                      <button onClick={() => handleCheckout(d.id)} style={{ ...btnSecondary, height: '36px', padding: '0 16px', fontSize: '14px' }}>Check Out</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Checked out */}
            {completedDropins.length > 0 && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '12px' }}>Checked out today ({completedDropins.length})</h3>
                {completedDropins.map(d => (
                  <div key={d.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', opacity: 0.7 }}>
                    <div>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)' }}>{d.visitor_name}</span>
                      <span style={{ marginLeft: '12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{d.visitor_type}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>{formatTime(d.check_in_at)} – {d.check_out_at ? formatTime(d.check_out_at) : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── ACTIVITIES TAB ─── */}
        {activeTab === 'activities' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>Activity Calendar</h2>
              <button style={btnPrimary} onClick={() => setShowActivityForm(v => !v)}>+ Add Activity</button>
            </div>

            {activitySuccess && <div style={successBanner}>✓ {activitySuccess}</div>}

            {showActivityForm && (
              <div style={{ ...cardStyle, borderColor: 'var(--color-teal)', marginBottom: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginTop: 0, marginBottom: '16px' }}>New Activity</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>Activity title *</label>
                    <input style={inputStyle} value={activityForm.title} onChange={e => setActivityForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Morning Yoga" />
                  </div>
                  <div>
                    <label style={labelStyle}>Type</label>
                    <select style={inputStyle} value={activityForm.activity_type} onChange={e => setActivityForm(f => ({ ...f, activity_type: e.target.value }))}>
                      {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Date & time *</label>
                    <input type="datetime-local" style={inputStyle} value={activityForm.scheduled_at} onChange={e => setActivityForm(f => ({ ...f, scheduled_at: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Duration (minutes)</label>
                    <input type="number" style={inputStyle} value={activityForm.duration_minutes} onChange={e => setActivityForm(f => ({ ...f, duration_minutes: e.target.value }))} min="15" max="480" />
                  </div>
                  <div>
                    <label style={labelStyle}>Room</label>
                    <input style={inputStyle} value={activityForm.room} onChange={e => setActivityForm(f => ({ ...f, room: e.target.value }))} placeholder="e.g. Main Hall" />
                  </div>
                  <div>
                    <label style={labelStyle}>Instructor / Facilitator</label>
                    <input style={inputStyle} value={activityForm.instructor_name} onChange={e => setActivityForm(f => ({ ...f, instructor_name: e.target.value }))} placeholder="Name (optional)" />
                  </div>
                  <div>
                    <label style={labelStyle}>Max capacity</label>
                    <input type="number" style={inputStyle} value={activityForm.max_capacity} onChange={e => setActivityForm(f => ({ ...f, max_capacity: e.target.value }))} placeholder="Leave blank for unlimited" min="1" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Description (optional)</label>
                    <textarea style={{ ...inputStyle, height: '72px', padding: '10px 12px', resize: 'vertical' as const }} value={activityForm.description} onChange={e => setActivityForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of the activity" />
                  </div>
                </div>
                {activityError && <div style={errorBanner}>{activityError}</div>}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button style={btnPrimary} onClick={handleCreateActivity} disabled={activitySaving}>{activitySaving ? 'Saving...' : 'Add to Calendar'}</button>
                  <button style={btnSecondary} onClick={() => { setShowActivityForm(false); setActivityError('') }}>Cancel</button>
                </div>
              </div>
            )}

            {activities.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>No upcoming activities scheduled. Click "+ Add Activity" to get started.</p>
            ) : (
              activities.map(a => (
                <div key={a.id} style={{ ...cardStyle, borderLeft: expandedActivity === a.id ? '4px solid var(--color-teal)' : '4px solid transparent' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 700, color: 'var(--color-navy)' }}>{a.title}</div>
                      <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <span>📅 {formatDate(a.scheduled_at)} at {formatTime(a.scheduled_at)}</span>
                        {a.room && <span>🏢 {a.room}</span>}
                        {a.instructor_name && <span>👤 {a.instructor_name}</span>}
                        <span>⏱ {a.duration_minutes} min</span>
                        {a.max_capacity && <span>👥 {a.registration_count}/{a.max_capacity} registered</span>}
                        {!a.max_capacity && a.registration_count > 0 && <span>👥 {a.registration_count} registered</span>}
                      </div>
                    </div>
                    <button onClick={() => setExpandedActivity(expandedActivity === a.id ? null : a.id)} style={{ ...btnSecondary, height: '34px', padding: '0 14px', fontSize: '13px' }}>
                      {expandedActivity === a.id ? 'Collapse ▲' : 'Register ▼'}
                    </button>
                  </div>

                  {expandedActivity === a.id && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-warm-grey)', paddingTop: '16px' }}>
                      {regSuccess[a.id] && <div style={successBanner}>✓ {regSuccess[a.id]}</div>}
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <label style={labelStyle}>Register an attendee</label>
                          <input style={inputStyle} value={regName} onChange={e => setRegName(e.target.value)} placeholder="Attendee name" />
                        </div>
                        <button style={btnPrimary} onClick={() => handleRegister(a.id)} disabled={regSaving || !regName.trim()}>{regSaving ? 'Registering...' : 'Register'}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── ROOM BOOKINGS TAB ─── */}
        {activeTab === 'rooms' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>Room Bookings — Today</h2>
              <button style={btnPrimary} onClick={() => setShowRoomForm(v => !v)}>+ Book a Room</button>
            </div>

            {roomSuccess && <div style={successBanner}>✓ {roomSuccess}</div>}

            {showRoomForm && (
              <div style={{ ...cardStyle, borderColor: 'var(--color-teal)', marginBottom: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginTop: 0, marginBottom: '16px' }}>New Room Booking</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>Room name *</label>
                    <input style={inputStyle} value={roomForm.room} onChange={e => setRoomForm(f => ({ ...f, room: e.target.value }))} placeholder="e.g. Main Hall, Room A" />
                  </div>
                  <div>
                    <label style={labelStyle}>Booking title *</label>
                    <input style={inputStyle} value={roomForm.booking_title} onChange={e => setRoomForm(f => ({ ...f, booking_title: e.target.value }))} placeholder="e.g. Yoga Class, Staff Meeting" />
                  </div>
                  <div>
                    <label style={labelStyle}>Booked by</label>
                    <input style={inputStyle} value={roomForm.booked_by} onChange={e => setRoomForm(f => ({ ...f, booked_by: e.target.value }))} placeholder="Name (optional)" />
                  </div>
                  <div>
                    <label style={labelStyle}>Start time *</label>
                    <input type="datetime-local" style={inputStyle} value={roomForm.start_time} onChange={e => setRoomForm(f => ({ ...f, start_time: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>End time *</label>
                    <input type="datetime-local" style={inputStyle} value={roomForm.end_time} onChange={e => setRoomForm(f => ({ ...f, end_time: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Notes</label>
                    <input style={inputStyle} value={roomForm.notes} onChange={e => setRoomForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special setup needed?" />
                  </div>
                </div>
                {roomError && <div style={errorBanner}>{roomError}</div>}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button style={btnPrimary} onClick={handleCreateRoomBooking} disabled={roomSaving}>{roomSaving ? 'Booking...' : 'Book Room'}</button>
                  <button style={btnSecondary} onClick={() => { setShowRoomForm(false); setRoomError('') }}>Cancel</button>
                </div>
              </div>
            )}

            {rooms.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>No room bookings for today. Click "+ Book a Room" to add one.</p>
            ) : (
              rooms.map(r => (
                <div key={r.id} style={{ ...cardStyle, opacity: r.status === 'cancelled' ? 0.5 : 1, borderLeft: r.status === 'confirmed' ? '4px solid var(--color-teal)' : '4px solid var(--color-warm-grey)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 700, color: 'var(--color-navy)' }}>{r.room}</div>
                      <div style={{ fontSize: '15px', color: 'var(--color-text-primary)', marginTop: '2px' }}>{r.booking_title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <span>⏰ {formatTime(r.start_time)} – {formatTime(r.end_time)}</span>
                        {r.booked_by && <span>👤 {r.booked_by}</span>}
                        {r.notes && <span>📝 {r.notes}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '12px', fontWeight: 600, backgroundColor: r.status === 'confirmed' ? '#D1FAE5' : '#FEE2E2', color: r.status === 'confirmed' ? '#065F46' : '#991B1B' }}>{r.status}</span>
                      {r.status === 'confirmed' && (
                        <button onClick={() => handleCancelRoom(r.id)} style={{ ...btnSecondary, height: '32px', padding: '0 12px', fontSize: '13px', borderColor: '#EF4444', color: '#DC2626' }}>Cancel</button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── MEALS TAB ─── */}
        {activeTab === 'meals' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--color-navy)', margin: 0 }}>Congregate Meal Log</h2>
              <button style={btnPrimary} onClick={() => setShowMealForm(v => !v)}>+ Log a Meal</button>
            </div>

            <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', fontFamily: 'var(--font-body)', fontSize: '14px', color: '#1E40AF' }}>
              Track daily congregate meal attendance for OAA Title III-C1 (congregate nutrition) reporting. Each entry represents one meal service for a given date.
            </div>

            {mealSuccess && <div style={successBanner}>✓ {mealSuccess}</div>}

            {showMealForm && (
              <div style={{ ...cardStyle, borderColor: 'var(--color-teal)', marginBottom: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)', marginTop: 0, marginBottom: '16px' }}>Log Meal Service</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>Date *</label>
                    <input type="date" style={inputStyle} value={mealForm.meal_date} onChange={e => setMealForm(f => ({ ...f, meal_date: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Meal type *</label>
                    <select style={inputStyle} value={mealForm.meal_type} onChange={e => setMealForm(f => ({ ...f, meal_type: e.target.value }))}>
                      {MEAL_TYPES.map(mt => <option key={mt.value} value={mt.value}>{mt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Attendee count *</label>
                    <input type="number" style={inputStyle} value={mealForm.attendee_count} onChange={e => setMealForm(f => ({ ...f, attendee_count: e.target.value }))} min="0" placeholder="Number of seniors served" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Menu description (optional)</label>
                    <input style={inputStyle} value={mealForm.menu_description} onChange={e => setMealForm(f => ({ ...f, menu_description: e.target.value }))} placeholder="e.g. Chicken with rice, garden salad, fruit cup" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Notes (optional)</label>
                    <input style={inputStyle} value={mealForm.notes} onChange={e => setMealForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes about the meal service" />
                  </div>
                </div>
                {mealError && <div style={errorBanner}>{mealError}</div>}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button style={btnPrimary} onClick={handleLogMeal} disabled={mealSaving}>{mealSaving ? 'Logging...' : 'Log Meal'}</button>
                  <button style={btnSecondary} onClick={() => { setShowMealForm(false); setMealError('') }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Meal log table */}
            {meals.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>No meals logged yet. Click "+ Log a Meal" to start tracking.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-navy)', color: 'var(--color-cream)' }}>
                      {['Date', 'Meal', 'Attendees', 'Menu', 'Notes'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {meals.map((m, i) => (
                      <tr key={m.id} style={{ backgroundColor: i % 2 === 0 ? 'var(--color-warm-white)' : 'var(--color-cream)' }}>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{m.meal_date}</td>
                        <td style={{ padding: '10px 14px', textTransform: 'capitalize' }}>{m.meal_type}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--color-navy)' }}>{m.attendee_count}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>{m.menu_description ?? '—'}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>{m.notes ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
