/**
 * lib/volunteers/trainingGate.ts — G4
 * Checks whether a volunteer has completed required training for a role.
 * Call before any match/assignment.
 */
import { SupabaseClient } from '@supabase/supabase-js'

export type VolunteerRole = 'buddy' | 'companion' | 'driver' | 'general'

const ROLE_MODULES: Record<VolunteerRole, string[]> = {
  general: ['orientation', 'hipaa_privacy', 'senior_sensitivity'],
  buddy:   ['orientation', 'hipaa_privacy', 'senior_sensitivity', 'buddy_skills'],
  companion: ['orientation', 'hipaa_privacy', 'senior_sensitivity', 'companion_safety'],
  driver:  ['orientation', 'hipaa_privacy', 'senior_sensitivity', 'driver_safety'],
}

export interface TrainingStatus {
  cleared: boolean
  completed: string[]
  missing: string[]
}

export async function checkTrainingGate(
  supabase: SupabaseClient,
  volunteerId: string,
  role: VolunteerRole
): Promise<TrainingStatus> {
  const required = ROLE_MODULES[role] ?? ROLE_MODULES.general

  const { data } = await supabase
    .from('volunteer_training_completions')
    .select('module_name')
    .eq('volunteer_id', volunteerId)
    .in('module_name', required)

  const completed = (data ?? []).map((r: { module_name: string }) => r.module_name)
  const missing = required.filter(m => !completed.includes(m))

  return { cleared: missing.length === 0, completed, missing }
}

export async function assertTrainingCleared(
  supabase: SupabaseClient,
  volunteerId: string,
  role: VolunteerRole
): Promise<void> {
  const status = await checkTrainingGate(supabase, volunteerId, role)
  if (!status.cleared) {
    throw new Error(
      `Volunteer not cleared for ${role} role. Missing: ${status.missing.join(', ')}. ` +
      `Complete training at /dashboard/training`
    )
  }
}
