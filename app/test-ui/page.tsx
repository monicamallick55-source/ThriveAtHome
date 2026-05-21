'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/Skeleton'
import { StatusDot } from '@/components/ui/StatusDot'
import { MoodEmoji } from '@/components/ui/MoodEmoji'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import { ProgressBar } from '@/components/ui/ProgressBar'

function ToastDemo() {
  const { push } = useToast()
  return (
    <div className="flex flex-wrap gap-3">
      <Button size="sm" variant="ghost" onClick={() => push({ title: 'Information', body: 'Your preferences have been saved.', severity: 'info' })}>
        Info toast
      </Button>
      <Button size="sm" variant="ghost" onClick={() => push({ title: 'Saved', body: 'Task created successfully.', severity: 'success' })}>
        Success toast
      </Button>
      <Button size="sm" variant="ghost" onClick={() => push({ title: 'Something to note', body: 'Margaret&apos;s call time is approaching.', severity: 'concern' })}>
        Concern toast
      </Button>
      <Button size="sm" variant="ghost" onClick={() => push({ title: 'Needs attention', body: 'Margaret missed her check-in this morning.', severity: 'urgent' })}>
        Urgent toast
      </Button>
      <Button size="sm" variant="danger" onClick={() => push({ title: 'Emergency alert — please check in immediately', severity: 'emergency' })}>
        Emergency toast
      </Button>
    </div>
  )
}

function ModalDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Confirm action" description="Review the details before continuing.">
        <p className="text-base text-[var(--color-text-secondary)] mb-6">
          Are you sure you want to proceed? This action will update Margaret&apos;s care preferences.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="teal" onClick={() => setOpen(false)}>Confirm</Button>
        </div>
      </Modal>
    </>
  )
}

const tabContent = (label: string) => (
  <p className="text-base text-[var(--color-text-secondary)]">Content for the <strong>{label}</strong> tab.</p>
)

export default function TestUiPage() {
  const [inputError, setInputError] = useState('')
  const [bellCount, setBellCount] = useState(3)

  return (
    <ToastProvider>
      <main className="min-h-screen bg-[var(--color-cream)] py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-16">

          <header>
            <h1 className="font-display text-4xl text-[var(--color-navy)] mb-2">All 14 Components — P2 Visual Review</h1>
            <p className="text-base text-[var(--color-text-muted)]">Design system: Warm Luxury Care. Background should be warm cream, not pure white.</p>
          </header>

          {/* 1. Button */}
          <section>
            <h2 className="font-display text-2xl text-[var(--color-navy)] mb-6">1. Button</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="primary">Primary (navy)</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="teal">Teal CTA</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
                <Button variant="primary" loading>Loading…</Button>
                <Button variant="primary" disabled>Disabled</Button>
              </div>
              <Button variant="primary" fullWidth>Full-width button</Button>
            </div>
          </section>

          {/* 2. Card */}
          <section>
            <h2 className="font-display text-2xl text-[var(--color-navy)] mb-6">2. Card</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card variant="default">
                <CardHeader><CardTitle>Default card</CardTitle></CardHeader>
                <CardBody>Warm white background, warm-grey border, subtle shadow.</CardBody>
              </Card>
              <Card variant="highlight">
                <CardHeader><CardTitle>Highlight card</CardTitle></CardHeader>
                <CardBody>Teal left border. Used for positive information.</CardBody>
              </Card>
              <Card variant="warning">
                <CardHeader><CardTitle>Warning card</CardTitle></CardHeader>
                <CardBody>Amber left border. Something to pay attention to.</CardBody>
              </Card>
              <Card variant="danger">
                <CardHeader><CardTitle>Danger card</CardTitle></CardHeader>
                <CardBody>Red left border. Needs immediate review.</CardBody>
              </Card>
            </div>
          </section>

          {/* 3. Badge */}
          <section>
            <h2 className="font-display text-2xl text-[var(--color-navy)] mb-6">3. Badge</h2>
            <div className="flex flex-wrap gap-3">
              <Badge variant="neutral">Neutral</Badge>
              <Badge variant="info" icon="ℹ">Info</Badge>
              <Badge variant="concern" icon="⚠">Concern</Badge>
              <Badge variant="urgent" icon="⚠">Urgent</Badge>
              <Badge variant="emergency" icon="🚨">Emergency</Badge>
              <Badge variant="success" icon="✓">Success</Badge>
            </div>
          </section>

          {/* 4. Input */}
          <section>
            <h2 className="font-display text-2xl text-[var(--color-navy)] mb-6">4. Input</h2>
            <div className="space-y-6 max-w-md">
              <Input label="Full name" placeholder="Margaret Chen" />
              <Input label="Email address" type="email" placeholder="margaret@example.com" hint="We'll send updates to this address." />
              <Input
                label="Phone number"
                type="tel"
                placeholder="(555) 123-4567"
                error={inputError}
                onFocus={() => setInputError('')}
              />
              <Button size="sm" variant="ghost" onClick={() => setInputError('Please enter a valid phone number in (555) 000-0000 format.')}>
                Show error state
              </Button>
            </div>
          </section>

          {/* 5. Select */}
          <section>
            <h2 className="font-display text-2xl text-[var(--color-navy)] mb-6">5. Select</h2>
            <div className="max-w-md space-y-4">
              <Select
                label="Relationship to senior"
                placeholder="Choose your relationship…"
                hint="This helps us personalise the experience."
                options={[
                  { value: 'adult_child', label: 'Adult child' },
                  { value: 'spouse', label: 'Spouse or partner' },
                  { value: 'sibling', label: 'Sibling' },
                  { value: 'other', label: 'Other family member' },
                ]}
              />
            </div>
          </section>

          {/* 6. Textarea */}
          <section>
            <h2 className="font-display text-2xl text-[var(--color-navy)] mb-6">6. Textarea</h2>
            <div className="max-w-md">
              <Textarea
                label="Topics to avoid"
                placeholder="e.g. recent political events, the news…"
                hint="We'll make sure Aria steers clear of these."
              />
            </div>
          </section>

          {/* 7. Skeleton */}
          <section>
            <h2 className="font-display text-2xl text-[var(--color-navy)] mb-6">7. Skeleton</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">Loading-state placeholders — animated shapes that appear while data is fetching.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-[var(--radius-lg)] border border-[var(--color-warm-grey)]">
                <p className="text-sm text-[var(--color-text-muted)] mb-3">Profile row skeleton</p>
                <div className="flex items-center gap-3">
                  <Skeleton height="h-12" width="w-12" rounded />
                  <div className="flex-1 space-y-2">
                    <Skeleton height="h-4" width="w-2/3" />
                    <Skeleton height="h-3" width="w-1/2" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-[var(--radius-lg)] border border-[var(--color-warm-grey)]">
                <p className="text-sm text-[var(--color-text-muted)] mb-3">SkeletonCard</p>
                <SkeletonCard />
              </div>
              <div className="bg-white p-4 rounded-[var(--radius-lg)] border border-[var(--color-warm-grey)]">
                <p className="text-sm text-[var(--color-text-muted)] mb-3">SkeletonText (4 lines)</p>
                <SkeletonText lines={4} />
              </div>
            </div>
          </section>

          {/* 8. StatusDot */}
          <section>
            <h2 className="font-display text-2xl text-[var(--color-navy)] mb-6">8. StatusDot</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">Always shows dot + label — colour is never the sole indicator.</p>
            <div className="flex flex-wrap gap-6">
              <StatusDot level="no_alerts" size="sm" />
              <StatusDot level="no_alerts" size="md" />
              <StatusDot level="no_alerts" size="lg" />
              <StatusDot level="informational" size="md" />
              <StatusDot level="concern" size="md" />
              <StatusDot level="urgent" size="md" />
              <StatusDot level="emergency" size="md" />
            </div>
          </section>

          {/* 9. MoodEmoji */}
          <section>
            <h2 className="font-display text-2xl text-[var(--color-navy)] mb-6">9. MoodEmoji</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">Pill display: emoji + score + label. All 6 states.</p>
            <div className="flex flex-wrap gap-3">
              <MoodEmoji score={null} />
              <MoodEmoji score={9} />
              <MoodEmoji score={7} />
              <MoodEmoji score={5} />
              <MoodEmoji score={3} />
              <MoodEmoji score={1} />
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <MoodEmoji score={8} size="sm" />
              <MoodEmoji score={8} size="md" />
              <MoodEmoji score={8} size="lg" />
            </div>
          </section>

          {/* 10. NotificationBell */}
          <section>
            <h2 className="font-display text-2xl text-[var(--color-navy)] mb-6">10. NotificationBell</h2>
            <div className="flex items-center gap-6">
              <NotificationBell count={0} onClick={() => {}} />
              <NotificationBell count={bellCount} onClick={() => setBellCount(0)} />
              <Button size="sm" variant="ghost" onClick={() => setBellCount(3)}>Reset (3 unread)</Button>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] mt-2">Click the bell with unread count to clear it.</p>
          </section>

          {/* 11. Toast */}
          <section>
            <h2 className="font-display text-2xl text-[var(--color-navy)] mb-6">11. Toast</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">Appears top-right. Auto-dismisses after 6 seconds.</p>
            <ToastDemo />
          </section>

          {/* 12. Modal */}
          <section>
            <h2 className="font-display text-2xl text-[var(--color-navy)] mb-6">12. Modal</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">Tab stays inside modal. Escape closes. Click backdrop closes.</p>
            <ModalDemo />
          </section>

          {/* 13. Tabs */}
          <section>
            <h2 className="font-display text-2xl text-[var(--color-navy)] mb-6">13. Tabs</h2>
            <div className="space-y-8">
              <div>
                <p className="text-sm text-[var(--color-text-muted)] mb-3">Underline variant (default)</p>
                <Tabs
                  label="Health timeline"
                  tabs={[
                    { id: '7d', label: '7 days', content: tabContent('7 days') },
                    { id: '30d', label: '30 days', content: tabContent('30 days') },
                    { id: '60d', label: '60 days', content: tabContent('60 days') },
                    { id: '90d', label: '90 days', content: tabContent('90 days') },
                  ]}
                />
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)] mb-3">Pill variant</p>
                <Tabs
                  label="Filter tasks"
                  variant="pill"
                  tabs={[
                    { id: 'open', label: 'Open', content: tabContent('Open') },
                    { id: 'done', label: 'Completed', content: tabContent('Completed') },
                  ]}
                />
              </div>
            </div>
          </section>

          {/* 14. ProgressBar */}
          <section>
            <h2 className="font-display text-2xl text-[var(--color-navy)] mb-6">14. ProgressBar</h2>
            <div className="max-w-md space-y-4">
              <ProgressBar label="Password strength" value={75} showValue color="teal" size="md" />
              <ProgressBar label="Profile completeness" value={40} showValue color="navy" size="lg" />
              <ProgressBar label="Onboarding step 2 of 3" value={66} max={100} color="green" size="sm" />
            </div>
          </section>

        </div>
      </main>
    </ToastProvider>
  )
}
