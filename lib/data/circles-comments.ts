import { createClient } from '@/lib/supabase/server'

export async function getPostComments(postId: string) {
  const supabase = await createClient()
  return supabase
    .from('circle_post_comments')
    .select('*, members(preferred_name, full_name, avatar_url)')
    .eq('post_id', postId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: true })
}

export async function addPostComment(memberId: string, postId: string, content: string) {
  const supabase = await createClient()
  return supabase
    .from('circle_post_comments')
    .insert({ member_id: memberId, post_id: postId, content })
    .select()
    .single()
}

export async function deletePostComment(commentId: string) {
  const supabase = await createClient()
  return supabase
    .from('circle_post_comments')
    .delete()
    .eq('id', commentId)
}
