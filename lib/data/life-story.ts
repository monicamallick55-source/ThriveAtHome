import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

type LifeStoryEntry = Database['public']['Tables']['life_story_entries']['Row']

export type { LifeStoryEntry }

export async function getLifeStoryEntries(memberId: string): Promise<{ data: LifeStoryEntry[] | null; error: string | null }> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('life_story_entries')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function createLifeStoryEntry(params: {
  memberId: string
  title: string
  content: string
  era: string | null
  entryType?: string
  createdBy?: string | null
}): Promise<{ data: LifeStoryEntry | null; error: string | null }> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('life_story_entries')
    .insert({
      member_id: params.memberId,
      title: params.title,
      content: params.content,
      era: params.era || null,
      entry_type: params.entryType || 'memory',
      created_by: params.createdBy || null,
    })
    .select()
    .limit(1)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function updateLifeStoryEntry(params: {
  id: string
  memberId: string
  title: string
  content: string
  era: string | null
}): Promise<{ data: LifeStoryEntry | null; error: string | null }> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('life_story_entries')
    .update({
      title: params.title,
      content: params.content,
      era: params.era || null,
    })
    .eq('id', params.id)
    .eq('member_id', params.memberId)
    .select()
    .limit(1)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function deleteLifeStoryEntry(params: {
  id: string
  memberId: string
}): Promise<{ error: string | null }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('life_story_entries')
    .delete()
    .eq('id', params.id)
    .eq('member_id', params.memberId)

  if (error) return { error: error.message }
  return { error: null }
}
