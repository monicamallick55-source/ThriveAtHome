import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

type SkillRow = Database['public']['Tables']['skills_offered']['Row']
type TimeCreditsRow = Database['public']['Tables']['time_credits']['Row']
type ExchangeRow = Database['public']['Tables']['skill_exchanges']['Row']
type TransactionRow = Database['public']['Tables']['time_credit_transactions']['Row']

export interface SkillWithMember extends SkillRow {
  teacher_name: string
}

export async function getActiveSkills(): Promise<SkillWithMember[]> {
  try {
    const admin = createAdminClient()
    const { data: skills } = await admin
      .from('skills_offered')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (!skills || skills.length === 0) return []

    // fetch member names
    const memberIds = [...new Set(skills.map(s => s.member_id))]
    const { data: members } = await admin
      .from('members')
      .select('id, preferred_name, full_name')
      .in('id', memberIds)

    const nameMap = new Map<string, string>()
    for (const m of (members ?? [])) {
      nameMap.set(m.id, m.preferred_name || m.full_name.split(' ')[0])
    }

    return skills.map(s => ({
      ...s,
      teacher_name: nameMap.get(s.member_id) ?? 'Community Member',
    }))
  } catch {
    return []
  }
}

export async function getMemberSkills(memberId: string): Promise<SkillRow[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('skills_offered')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
    return data ?? []
  } catch {
    return []
  }
}

export async function registerSkill(params: {
  member_id: string
  skill_name: string
  skill_category: string
  description: string
  delivery_method: string
  max_group_size: number
}): Promise<{ data: SkillRow | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('skills_offered')
      .insert(params)
      .select()
      .maybeSingle()
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

export async function requestExchange(params: {
  learner_member_id: string
  teacher_member_id: string
  skill_id: string
  scheduled_date?: string
}): Promise<{ data: ExchangeRow | null; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('skill_exchanges')
      .insert({ ...params, status: 'scheduled' })
      .select()
      .maybeSingle()
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

export async function getMemberExchanges(memberId: string): Promise<ExchangeRow[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('skill_exchanges')
      .select('*')
      .or(`teacher_member_id.eq.${memberId},learner_member_id.eq.${memberId}`)
      .order('created_at', { ascending: false })
    return data ?? []
  } catch {
    return []
  }
}

export async function getMemberCredits(memberId: string): Promise<TimeCreditsRow | null> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('time_credits')
      .select('*')
      .eq('member_id', memberId)
      .maybeSingle()
    return data
  } catch {
    return null
  }
}

export async function getMemberTransactions(memberId: string): Promise<TransactionRow[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('time_credit_transactions')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(20)
    return data ?? []
  } catch {
    return []
  }
}

export async function completeExchange(exchangeId: string): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient()

    const { data: exchange } = await admin
      .from('skill_exchanges')
      .select('*')
      .eq('id', exchangeId)
      .maybeSingle()

    if (!exchange) return { error: 'Exchange not found' }

    const credits = exchange.duration_hours

    // update exchange status
    await admin
      .from('skill_exchanges')
      .update({ status: 'completed', credits_transferred: credits })
      .eq('id', exchangeId)

    // upsert teacher credits
    const { data: teacherCredits } = await admin
      .from('time_credits')
      .select('*')
      .eq('member_id', exchange.teacher_member_id)
      .maybeSingle()

    if (teacherCredits) {
      await admin
        .from('time_credits')
        .update({
          balance: teacherCredits.balance + credits,
          lifetime_earned: teacherCredits.lifetime_earned + credits,
        })
        .eq('member_id', exchange.teacher_member_id)
    } else {
      await admin
        .from('time_credits')
        .insert({ member_id: exchange.teacher_member_id, balance: credits, lifetime_earned: credits })
    }

    // log transaction for teacher
    await admin.from('time_credit_transactions').insert({
      member_id: exchange.teacher_member_id,
      amount: credits,
      type: 'earned',
      exchange_id: exchangeId,
      description: `Earned ${credits} credit${credits !== 1 ? 's' : ''} for teaching`,
    })

    // upsert learner credits (spent)
    const { data: learnerCredits } = await admin
      .from('time_credits')
      .select('*')
      .eq('member_id', exchange.learner_member_id)
      .maybeSingle()

    if (learnerCredits) {
      await admin
        .from('time_credits')
        .update({
          lifetime_spent: learnerCredits.lifetime_spent + credits,
        })
        .eq('member_id', exchange.learner_member_id)
    } else {
      await admin
        .from('time_credits')
        .insert({ member_id: exchange.learner_member_id, balance: 0, lifetime_spent: credits })
    }

    await admin.from('time_credit_transactions').insert({
      member_id: exchange.learner_member_id,
      amount: -credits,
      type: 'spent',
      exchange_id: exchangeId,
      description: `Used ${credits} credit${credits !== 1 ? 's' : ''} for learning`,
    })

    return { error: null }
  } catch (err) {
    return { error: String(err) }
  }
}
