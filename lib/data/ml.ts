// M23 — Advanced AI/ML Layer read model (server-side, admin client).
// Surfaces the latest stored scores for the family dashboard and navigator panel.
import { createAdminClient } from '../supabase/admin'
import type {
  WellnessBaselineRow,
  BehavioralAnomalyRow,
  FallRiskScoreRow,
  IsolationScoreRow,
  GriefPatternFlagRow,
} from '../../types/database'

type Result<T> = { data: T; error: string | null }

export async function getLatestFallRisk(
  memberId: string
): Promise<Result<FallRiskScoreRow | null>> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('fall_risk_scores')
    .select('*')
    .eq('member_id', memberId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return { data: (data as FallRiskScoreRow | null) ?? null, error: error?.message ?? null }
}

export async function getLatestIsolationScore(
  memberId: string
): Promise<Result<IsolationScoreRow | null>> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('isolation_scores')
    .select('*')
    .eq('member_id', memberId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return { data: (data as IsolationScoreRow | null) ?? null, error: error?.message ?? null }
}

export async function getLatestGriefPatternFlag(
  memberId: string
): Promise<Result<GriefPatternFlagRow | null>> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('grief_pattern_flags')
    .select('*')
    .eq('member_id', memberId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return { data: (data as GriefPatternFlagRow | null) ?? null, error: error?.message ?? null }
}

export async function getRecentBehavioralAnomalies(
  memberId: string,
  limit = 10
): Promise<Result<BehavioralAnomalyRow[]>> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('behavioral_anomalies')
    .select('*')
    .eq('member_id', memberId)
    .order('detected_at', { ascending: false })
    .limit(limit)
  return { data: (data ?? []) as BehavioralAnomalyRow[], error: error?.message ?? null }
}

export interface MlSummary {
  baseline: WellnessBaselineRow | null
  latestAnomaly: BehavioralAnomalyRow | null
  fallRisk: FallRiskScoreRow | null
  isolation: IsolationScoreRow | null
  griefFlag: GriefPatternFlagRow | null
  hasAnySignal: boolean
}

/** Everything the dashboard / navigator panel needs in one call. */
export async function getMlSummaryForMember(memberId: string): Promise<Result<MlSummary>> {
  const admin = createAdminClient()
  const [baselineRes, anomalyRes, fallRes, isoRes, griefRes] = await Promise.all([
    admin.from('wellness_baselines').select('*').eq('member_id', memberId).maybeSingle(),
    admin
      .from('behavioral_anomalies')
      .select('*')
      .eq('member_id', memberId)
      .order('detected_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('fall_risk_scores')
      .select('*')
      .eq('member_id', memberId)
      .order('computed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('isolation_scores')
      .select('*')
      .eq('member_id', memberId)
      .order('computed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('grief_pattern_flags')
      .select('*')
      .eq('member_id', memberId)
      .order('computed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const baseline = (baselineRes.data as WellnessBaselineRow | null) ?? null
  const latestAnomaly = (anomalyRes.data as BehavioralAnomalyRow | null) ?? null
  const fallRisk = (fallRes.data as FallRiskScoreRow | null) ?? null
  const isolation = (isoRes.data as IsolationScoreRow | null) ?? null
  const griefFlag = (griefRes.data as GriefPatternFlagRow | null) ?? null

  const hasAnySignal = Boolean(
    (latestAnomaly && latestAnomaly.severity !== 'info') ||
      (fallRisk && fallRisk.risk_band !== 'low') ||
      (isolation && isolation.risk_band !== 'low') ||
      (griefFlag && griefFlag.risk_band !== 'none')
  )

  return {
    data: { baseline, latestAnomaly, fallRisk, isolation, griefFlag, hasAnySignal },
    error: baselineRes.error?.message ?? null,
  }
}
