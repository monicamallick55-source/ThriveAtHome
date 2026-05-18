// Family task data access functions — server-side only, uses admin client.
import { createAdminClient } from '../supabase/admin'
import type { Database } from '../../types/database'

export type FamilyTaskItem = Database['public']['Tables']['family_task_items']['Row']

/** Fetch all incomplete tasks for a member, then completed ones, newest first within each group. */
export async function getTasksForMember(
  memberId: string
): Promise<{ data: FamilyTaskItem[] | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('family_task_items')
      .select('*')
      .eq('member_id', memberId)
      .order('completed', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[data/tasks/getTasksForMember]', error)
      return { data: null, error: error.message }
    }
    return { data: (data ?? []) as FamilyTaskItem[], error: null }
  } catch (e) {
    console.error('[data/tasks/getTasksForMember] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

interface CreateTaskInput {
  memberId: string
  createdBy: string
  assignedTo?: string | null
  title: string
  taskType?: string
  dueDate?: string | null
}

/** Create a new family task. */
export async function createFamilyTask(
  input: CreateTaskInput
): Promise<{ data: FamilyTaskItem | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('family_task_items')
      .insert({
        member_id: input.memberId,
        created_by: input.createdBy,
        assigned_to: input.assignedTo ?? null,
        title: input.title,
        task_type: input.taskType ?? 'other',
        due_date: input.dueDate ?? null,
        completed: false,
      })
      .select('*')
      .maybeSingle()
    if (error) {
      console.error('[data/tasks/createFamilyTask]', error)
      return { data: null, error: error.message }
    }
    if (!data) return { data: null, error: 'Insert returned no data' }
    return { data: data as FamilyTaskItem, error: null }
  } catch (e) {
    console.error('[data/tasks/createFamilyTask] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Mark a family task as completed. */
export async function completeFamilyTask(
  taskId: string
): Promise<{ data: FamilyTaskItem | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('family_task_items')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', taskId)
      .select('*')
      .maybeSingle()
    if (error) {
      console.error('[data/tasks/completeFamilyTask]', error)
      return { data: null, error: error.message }
    }
    if (!data) return { data: null, error: 'Not found' }
    return { data: data as FamilyTaskItem, error: null }
  } catch (e) {
    console.error('[data/tasks/completeFamilyTask] Unexpected error:', e)
    return { data: null, error: e instanceof Error ? e.message : String(e) }
  }
}
