'use client'
// FamilyTaskBoard — task board with Realtime subscriptions for INSERT and UPDATE events.
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { SectionError } from './SectionError'
import type { FamilyTaskItem } from '@/lib/data/tasks'

function formatDue(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export interface FamilyTaskBoardProps {
  memberId: string
  familyMemberId: string
  initialTasks: FamilyTaskItem[]
  error: string | null
}

export function FamilyTaskBoard({
  memberId,
  familyMemberId,
  initialTasks,
  error,
}: FamilyTaskBoardProps) {
  const [tasks, setTasks] = useState<FamilyTaskItem[]>(initialTasks)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [completing, setCompleting] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Realtime: subscribe to INSERT and UPDATE on family_task_items for this member
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`tasks:${memberId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'family_task_items',
          filter: `member_id=eq.${memberId}`,
        },
        (payload) => {
          const newTask = payload.new as FamilyTaskItem
          // Avoid duplicate if we optimistically added it ourselves
          setTasks((prev) =>
            prev.some((t: any) => t.id === newTask.id) ? prev : [newTask, ...prev]
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'family_task_items',
          filter: `member_id=eq.${memberId}`,
        },
        (payload) => {
          const updated = payload.new as FamilyTaskItem
          setTasks((prev) => prev.map((t: any) => (t.id === updated.id ? updated : t)))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [memberId])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    setFormError(null)

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberId,
        title: title.trim(),
        taskType: 'other',
        dueDate: dueDate || null,
      }),
    })

    const json = await res.json()
    if (!res.ok) {
      setFormError(json.error ?? 'Failed to create task.')
    } else {
      // Optimistically prepend — Realtime will deduplicate
      setTasks((prev) => [json.task as FamilyTaskItem, ...prev])
      setTitle('')
      setDueDate('')
      inputRef.current?.focus()
    }
    setSubmitting(false)
  }

  async function handleComplete(taskId: string) {
    setCompleting(taskId)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('family_task_items')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', taskId)
    // Realtime UPDATE will update the state — optimistically mark locally too
    if (!err) {
      setTasks((prev) =>
        prev.map((t: any) =>
          t.id === taskId ? { ...t, completed: true, completed_at: new Date().toISOString() } : t
        )
      )
    }
    setCompleting(null)
  }

  if (error) return <SectionError message={error} />

  const pending = tasks.filter((t: any) => !t.completed)
  const completed = tasks.filter((t: any) => t.completed)

  return (
    <div className="space-y-4">
      {/* Add task form */}
      <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3" aria-label="Add task">
        <div className="flex-1">
          <Input
            ref={inputRef}
            label="New task"
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Schedule doctor appointment"
            error={formError ?? undefined}
          />
        </div>
        <div className="sm:w-40">
          <Input
            label="Due date (optional)"
            id="task-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={!title.trim()}
            className="min-h-[52px]"
            aria-label="Add task"
          >
            Add
          </Button>
        </div>
      </form>

      {/* Pending tasks */}
      {pending.length === 0 && completed.length === 0 && (
        <p className="text-gray-500 text-lg">No tasks yet. Add one above.</p>
      )}

      <ul className="space-y-2" aria-label="Pending tasks">
        {pending.map((task: any) => (
          <li
            key={task.id}
            className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4"
          >
            <div className="space-y-1 min-w-0">
              <p className="text-lg font-medium text-brand-navy">{task.title}</p>
              {task.due_date && (
                <p className="text-base text-gray-500">Due {formatDue(task.due_date)}</p>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleComplete(task.id)}
              loading={completing === task.id}
              className="shrink-0"
              aria-label={`Mark "${task.title}" as done`}
            >
              Done
            </Button>
          </li>
        ))}
      </ul>

      {/* Completed tasks — collapsed */}
      {completed.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-base text-gray-400 hover:text-gray-600">
            {completed.length} completed task{completed.length === 1 ? '' : 's'}
          </summary>
          <ul className="mt-2 space-y-2" aria-label="Completed tasks">
            {completed.map((task: any) => (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-5 py-3 opacity-60"
              >
                <Badge variant="success">Done</Badge>
                <span className="text-lg text-gray-500 line-through">{task.title}</span>
                {task.due_date && (
                  <span className="text-base text-gray-400 ml-auto">
                    {formatDue(task.due_date)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
