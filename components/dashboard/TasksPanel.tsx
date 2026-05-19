// TasksPanel — shows family task items for this member (incomplete first).
import { Badge } from '@/components/ui/Badge'
import { SectionError } from './SectionError'
import type { FamilyTaskItem } from '@/lib/data/tasks'
import type { BadgeVariant } from '@/components/ui/Badge'
import Link from 'next/link'

const taskTypeBadge: Record<string, BadgeVariant> = {
  errand: 'info',
  appointment: 'concern',
  call: 'success',
  other: 'neutral',
}

function formatDue(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `Due ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
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
      <div className="space-y-3">
        <p className="text-gray-500 text-lg">No family tasks yet.</p>
        <Link
          href="/dashboard/family"
          className="text-lg text-brand-teal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal rounded"
        >
          Go to Family Tools →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {pending.map((task) => (
        <div
          key={task.id}
          className="rounded-xl border border-gray-200 bg-white px-5 py-4 flex flex-wrap items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            <p className="text-lg font-medium text-brand-navy">{task.title}</p>
            {task.due_date && (
              <p className="text-base text-gray-400">{formatDue(task.due_date)}</p>
            )}
          </div>
          <Badge variant={taskTypeBadge[task.task_type] ?? 'neutral'}>
            {task.task_type}
          </Badge>
        </div>
      ))}

      {done.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-base text-gray-400 hover:text-gray-600">
            {done.length} completed task{done.length === 1 ? '' : 's'}
          </summary>
          <div className="mt-2 space-y-2">
            {done.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-3 flex flex-wrap items-center gap-3 opacity-60"
              >
                <span className="text-xl text-green-500" aria-hidden="true">✓</span>
                <p className="text-lg text-gray-600 line-through">{task.title}</p>
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="pt-1">
        <Link
          href="/dashboard/family"
          className="text-lg text-brand-teal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal rounded"
        >
          Manage tasks →
        </Link>
      </div>
    </div>
  )
}
