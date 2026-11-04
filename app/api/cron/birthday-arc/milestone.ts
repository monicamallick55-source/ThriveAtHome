/**
 * app/api/cron/birthday-arc/milestone.ts — G5.4
 * Called by birthday-arc cron 30 days before a milestone birthday.
 */
import { SupabaseClient } from '@supabase/supabase-js'

const MILESTONES: Record<number, string> = {
  70: 'life_story_video_prompt',
  75: 'memory_book_navigator_call',
  80: 'recorded_phone_interview',
  85: 'full_celebration_community_toast',
  90: 'full_celebration_community_toast',
  95: 'full_celebration_community_toast',
  100: 'full_celebration_community_toast',
}

export async function handleMilestone(
  supabase: SupabaseClient,
  member: { id: string; org_id: string; first_name: string; turning_age: number }
) {
  const offering = MILESTONES[member.turning_age]
  if (!offering) return

  await supabase.from('navigator_tasks').insert({
    member_id: member.id,
    task_type: 'milestone_birthday',
    notes: `${member.first_name} turns ${member.turning_age} in 30 days. Milestone offering: ${offering.replace(/_/g, ' ')}. Coordinate with family.`,
    priority: member.turning_age >= 85 ? 'high' : 'medium',
    status: 'pending',
    metadata: { milestone_age: member.turning_age, offering },
  }).then(({ error: _e }: { error: unknown }) => void _e)

  if (offering === 'full_celebration_community_toast') {
    await supabase.from('events').insert({
      org_id: member.org_id,
      title: `Community Toast: ${member.first_name}'s ${member.turning_age}th Birthday`,
      description: `Join us to celebrate ${member.first_name}'s ${member.turning_age}th birthday milestone!`,
      event_type: 'milestone_celebration',
      status: 'draft',
      metadata: { member_id: member.id, milestone_age: member.turning_age },
    }).then(({ error: _e }: { error: unknown }) => void _e)
  }
}
