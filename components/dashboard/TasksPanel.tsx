import { SectionError } from './SectionError'
import type { FamilyTaskItem } from '@/lib/data/tasks'
import Link from 'next/link'

const taskTypeLabel: Record<string, string> = {
  errand: 'Errand',
  appointment: 'Appointment',
  call: 'Phone call',
  other: 'Task',
}

const taskTypeColor: Record<string, string> = {
  errand: 'var(--color-navy-light)',
  appointment: 'var(--color-concern-text)',
  call: 'var(--color-teal)',
  other: 'var(--color-text-muted)',
}

function formatDue(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `Due ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`
}

export interface TasksPanelProps {
  tasks: FamilyTaskItem[]
  error: string | null
}

export function TasksPanel({ tasks, error }: TasksPanelProps) {
  if (error) return <SectionError message={error} />

  const pending = tasks.filter((t) => !t.completed)
  const done = tasks.filter((t) => t.completed)

  if (tasks.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '18px', fontFamily: 'var(--font-body)', margin: 0 }}>
          No family tasks yet.
        </p>
        <Link
          href="/dashboard/family"
          style={{ fontSize: '18px', color: 'var(--color-teal)', fontFamily: 'var(--font-body)', fontWeight: 500, textDecoration: 'none' }}
        >
          Go to Family Tools →
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {pending.map((task) => (
        <div
          key={task.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            backgroundColor: 'var(--color-cream)',
            border: '1px solid var(--color-warm-grey)',
            borderRadius: 'var(--radius-md)',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: taskTypeColor[task.task_type] ?? 'var(--color-text-muted)',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>
              {task.title}
            </p>
            {task.due_date && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                {formatDue(task.due_date)}
              </p>
            )}
          </div>
          <span
            style={{
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              color: taskTypeColor[task.task_type] ?? 'var(--color-text-muted)',
            }}
          >
            {taskTypeLabel[task.task_type] ?? task.task_type}
          </span>
        </div>
      ))}

      {done.length > 0 && (
        <details style={{ marginTop: '4px' }}>
          <summary style={{ cursor: 'pointer', fontSize: '15px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', padding: '8px 0' }}>
            {done.length} completed task{done.length === 1 ? '' : 's'}
          </summary>
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {done.slice(0, 5).map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  backgroundColor: 'var(--color-warm-grey)',
                  borderRadius: 'var(--radius-md)',
                  opacity: 0.7,
                }}
              >
                <span style={{ color: 'var(--color-teal)', fontWeight: 600, fontSize: '16px' }}>✓</span>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-muted)', textDecoration: 'line-through', margin: 0 }}>
                  {task.title}
                </p>
              </div>
            ))}
          </div>
        </details>
      )}

      <div style={{ paddingTop: '8px' }}>
        <Link
          href="/dashboard/family"
          style={{ fontSize: '18px', color: 'var(--color-teal)', fontFamily: 'var(--font-body)', fontWeight: 500, textDecoration: 'none' }}
        >
          Manage tasks →
        </Link>
      </div>
    </div>
  )
}
