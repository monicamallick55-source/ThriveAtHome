'use client'

import { useState } from 'react'
import type { Metadata } from 'next'
import {
  Button, Card, CardHeader, CardTitle, CardBody,
  Badge, Input, Select, Textarea,
  Skeleton, SkeletonCard, SkeletonText,
  StatusDot, MoodEmoji, NotificationBell,
  ToastProvider, useToast,
  Modal, Tabs, ProgressBar,
} from '@/components/ui'

function ToastDemo() {
  const { push } = useToast()
  return (
    <div className="flex flex-wrap gap-3">
      {(['info', 'concern', 'urgent', 'emergency', 'success'] as const).map(s => (
        <Button key={s} variant="outline" size="sm"
          onClick={() => push({ title: `${s} toast`, body: 'This is the message body.', severity: s })}>
          {s}
        </Button>
      ))}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-gray-200 pt-8 mt-8">
      <h2 className="text-2xl font-semibold text-[#1B3A6B] mb-6">{title}</h2>
      {children}
    </section>
  )
}

export default function TestUiPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [selectVal, setSelectVal] = useState('')
  const [textareaVal, setTextareaVal] = useState('')

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#FAFAF8] p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#1B3A6B] mb-2">UI Component Gallery</h1>
        <p className="text-lg text-gray-500 mb-2">All 13 components — delete this page after Phase 8 approval.</p>

        {/* 1. Button */}
        <Section title="1. Button">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              {(['primary', 'secondary', 'outline', 'ghost', 'danger'] as const).map(v => (
                <Button key={v} variant={v}>{v}</Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              {(['sm', 'md', 'lg'] as const).map(s => (
                <Button key={s} size={s}>Size {s}</Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
              <Button fullWidth>Full width</Button>
            </div>
          </div>
        </Section>

        {/* 2. Card */}
        <Section title="2. Card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Default Card</CardTitle></CardHeader>
              <CardBody>Card body text here.</CardBody>
            </Card>
            <Card shadow="md" padding="lg">
              <CardHeader><CardTitle>Large Padding, Shadow MD</CardTitle></CardHeader>
              <CardBody>Another card variant.</CardBody>
            </Card>
          </div>
        </Section>

        {/* 3. Badge */}
        <Section title="3. Badge">
          <div className="flex flex-wrap gap-3">
            {(['info', 'concern', 'urgent', 'emergency', 'success', 'neutral'] as const).map(v => (
              <Badge key={v} variant={v} icon="●">{v}</Badge>
            ))}
          </div>
        </Section>

        {/* 4. Input */}
        <Section title="4. Input">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <Input label="Full name" value={inputVal} onChange={e => setInputVal(e.target.value)} placeholder="Margaret Chen" />
            <Input label="Email" type="email" required placeholder="you@example.com" hint="We'll send updates here." />
            <Input label="Phone" error="Please enter a valid phone number (+15550001234)" placeholder="+15550001234" />
          </div>
        </Section>

        {/* 5. Select */}
        <Section title="5. Select">
          <div className="max-w-xs">
            <Select
              label="Call frequency"
              value={selectVal}
              onChange={e => setSelectVal(e.target.value)}
              placeholder="Choose frequency"
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'every_other_day', label: 'Every other day' },
                { value: 'weekly', label: 'Weekly' },
              ]}
            />
          </div>
        </Section>

        {/* 6. Textarea */}
        <Section title="6. Textarea">
          <div className="max-w-lg">
            <Textarea
              label="Health conditions"
              value={textareaVal}
              onChange={e => setTextareaVal(e.target.value)}
              hint="List any conditions separated by commas."
              placeholder="e.g., high blood pressure, diabetes"
              rows={4}
            />
          </div>
        </Section>

        {/* 7. Skeleton */}
        <Section title="7. Skeleton">
          <div className="space-y-6 max-w-lg">
            <div className="flex items-center gap-3">
              <Skeleton height="h-12" width="w-12" rounded />
              <div className="flex-1 space-y-2">
                <Skeleton height="h-5" width="w-1/2" />
                <Skeleton height="h-4" width="w-3/4" />
              </div>
            </div>
            <SkeletonCard />
            <SkeletonText lines={4} />
          </div>
        </Section>

        {/* 8. StatusDot */}
        <Section title="8. StatusDot">
          <div className="flex flex-wrap gap-6">
            {(['ok', 'concern', 'urgent', 'emergency', 'unknown'] as const).map(l => (
              <StatusDot key={l} level={l} label={l} pulse={l !== 'ok' && l !== 'unknown'} />
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            {(['sm', 'md', 'lg'] as const).map(s => (
              <StatusDot key={s} level="urgent" size={s} label={`size ${s}`} pulse />
            ))}
          </div>
        </Section>

        {/* 9. MoodEmoji */}
        <Section title="9. MoodEmoji">
          <div className="flex flex-wrap gap-6 items-center">
            {[10, 8, 6, 4, 2, null].map(score => (
              <MoodEmoji key={score ?? 'null'} score={score} showScore size="lg" />
            ))}
          </div>
        </Section>

        {/* 10. NotificationBell */}
        <Section title="10. NotificationBell">
          <div className="flex gap-6 items-center">
            <NotificationBell count={0} />
            <NotificationBell count={3} />
            <NotificationBell count={99} />
            <NotificationBell count={150} />
          </div>
        </Section>

        {/* 11. Toast */}
        <Section title="11. Toast">
          <p className="text-base text-gray-500 mb-4">Click a button to fire a toast notification.</p>
          <ToastDemo />
        </Section>

        {/* 12. Modal */}
        <Section title="12. Modal">
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Example Modal"
            description="This dialog tests focus trap and Escape key close."
          >
            <div className="space-y-4">
              <p className="text-lg text-gray-700">Tab should stay inside this modal. Press Escape to close.</p>
              <Input label="Name inside modal" placeholder="Tab to this field" />
              <div className="flex gap-3 pt-2">
                <Button onClick={() => setModalOpen(false)}>Confirm</Button>
                <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              </div>
            </div>
          </Modal>
        </Section>

        {/* 13. Tabs */}
        <Section title="13. Tabs">
          <Tabs
            label="Health timeline range"
            tabs={[
              { id: '7d',  label: '7 days',  content: <p className="text-lg text-gray-700">Last 7 days of data.</p> },
              { id: '30d', label: '30 days', content: <p className="text-lg text-gray-700">Last 30 days of data.</p> },
              { id: '60d', label: '60 days', content: <p className="text-lg text-gray-700">Last 60 days of data.</p> },
              { id: '90d', label: '90 days', content: <p className="text-lg text-gray-700">Last 90 days of data.</p> },
            ]}
          />
        </Section>

        {/* 14. ProgressBar */}
        <Section title="14. ProgressBar">
          <div className="space-y-4 max-w-lg">
            <ProgressBar label="Onboarding completion" value={65} showValue color="teal" />
            <ProgressBar label="Mood score" value={7} max={10} showValue color="navy" size="lg" />
            <ProgressBar label="Alert level" value={90} showValue color="red" size="sm" />
          </div>
        </Section>

      </div>
    </ToastProvider>
  )
}
