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

export async function getLifeStoryEntry(id: string, memberId: string): Promise<{ data: LifeStoryEntry | null; error: string | null }> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('life_story_entries')
    .select('*')
    .eq('id', id)
    .eq('member_id', memberId)
    .maybeSingle()

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
  attachments?: string[]
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
      attachments: params.attachments ?? [],
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
  entryType?: string
  attachments?: string[]
}): Promise<{ data: LifeStoryEntry | null; error: string | null }> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('life_story_entries')
    .update({
      title: params.title,
      content: params.content,
      era: params.era || null,
      ...(params.entryType !== undefined ? { entry_type: params.entryType } : {}),
      ...(params.attachments !== undefined ? { attachments: params.attachments } : {}),
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

// ── Memory Books ────────────────────────────────────────────

type MemoryBook = Database['public']['Tables']['memory_books']['Row']
export type { MemoryBook }

export async function createMemoryBook(params: {
  memberId: string
  title: string
  dedication?: string | null
  layoutStyle?: string
  formatType?: string
  entryIds?: string[]
  coverPhotoPath?: string | null
  status?: string
  purchaseDate?: string | null
}): Promise<{ data: MemoryBook | null; error: string | null }> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('memory_books')
    .insert({
      member_id: params.memberId,
      title: params.title,
      dedication: params.dedication ?? null,
      layout_style: params.layoutStyle ?? 'classic',
      format_type: params.formatType ?? 'memory_book',
      entry_ids: params.entryIds ?? [],
      cover_photo_path: params.coverPhotoPath ?? null,
      status: params.status ?? 'pending',
      purchase_date: params.purchaseDate ?? null,
    })
    .select()
    .limit(1)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function upsertDraft(params: {
  memberId: string
  title: string
  dedication?: string | null
  formatType?: string
  layoutStyle?: string
  entryIds?: string[]
  coverPhotoPath?: string | null
}): Promise<{ data: MemoryBook | null; error: string | null }> {
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('memory_books')
    .select('id')
    .eq('member_id', params.memberId)
    .eq('status', 'draft')
    .limit(1)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from('memory_books')
      .update({
        title: params.title,
        dedication: params.dedication ?? null,
        format_type: params.formatType ?? 'memory_book',
        layout_style: params.layoutStyle ?? 'classic',
        entry_ids: params.entryIds ?? [],
        cover_photo_path: params.coverPhotoPath ?? null,
      })
      .eq('id', existing.id)
      .select()
      .limit(1)
      .maybeSingle()
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  }

  const { data, error } = await supabase
    .from('memory_books')
    .insert({
      member_id: params.memberId,
      title: params.title,
      dedication: params.dedication ?? null,
      format_type: params.formatType ?? 'memory_book',
      layout_style: params.layoutStyle ?? 'classic',
      entry_ids: params.entryIds ?? [],
      cover_photo_path: params.coverPhotoPath ?? null,
      status: 'draft',
    })
    .select()
    .limit(1)
    .maybeSingle()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function updateMemoryBookStoragePath(params: {
  id: string
  memberId: string
  storagePath: string
  collageStoragePath?: string | null
  pageCount?: number
  purchaseDate?: string | null
}): Promise<{ error: string | null }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('memory_books')
    .update({
      storage_path: params.storagePath,
      collage_storage_path: params.collageStoragePath ?? null,
      page_count: params.pageCount ?? null,
      status: 'generated',
      purchase_date: params.purchaseDate ?? null,
    })
    .eq('id', params.id)
    .eq('member_id', params.memberId)

  if (error) return { error: error.message }
  return { error: null }
}

export async function updateCollageStoragePath(params: {
  id: string
  memberId: string
  collageStoragePath: string
}): Promise<{ error: string | null }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('memory_books')
    .update({ collage_storage_path: params.collageStoragePath })
    .eq('id', params.id)
    .eq('member_id', params.memberId)

  if (error) return { error: error.message }
  return { error: null }
}

export async function incrementRegenCount(params: {
  id: string
  memberId: string
}): Promise<{ error: string | null }> {
  const supabase = createAdminClient()
  const { data: current } = await supabase
    .from('memory_books')
    .select('regeneration_count')
    .eq('id', params.id)
    .eq('member_id', params.memberId)
    .limit(1)
    .maybeSingle()
  const newCount = (current?.regeneration_count ?? 0) + 1
  const { error } = await supabase
    .from('memory_books')
    .update({ regeneration_count: newCount })
    .eq('id', params.id)
    .eq('member_id', params.memberId)
  if (error) return { error: error.message }
  return { error: null }
}

export async function getLatestPurchasedBook(params: {
  memberId: string
  formatType: string
}): Promise<{ data: MemoryBook | null; error: string | null }> {
  const supabase = createAdminClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('memory_books')
    .select('*')
    .eq('member_id', params.memberId)
    .eq('format_type', params.formatType)
    .eq('status', 'generated')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getMemoryBooks(memberId: string): Promise<{ data: MemoryBook[] | null; error: string | null }> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('memory_books')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
