// Interface for the advanced ML inference layer (M23).
// Covers sentiment NLP, time-series anomaly scoring (Isolation Forest),
// fall-risk prediction (XGBoost), and prolonged-grief pattern assessment.
//
// The stub implements each of these as a transparent, deterministic heuristic so
// every M23 feature works today. A real model-serving endpoint is plugged in
// during M23 activation once ML_INFERENCE_URL (and trained models) exist.

/** Aggregate sentiment / affect read from a set of recent check-in texts. */
export interface SentimentResult {
  /** -1 (very negative) .. 1 (very positive) */
  valence: number
  /** 0 .. 1 — density of loneliness / social-withdrawal language */
  loneliness: number
  /** 0 .. 1 — density of grief / bereavement language */
  grief: number
  labels: string[]
}

export interface BaselineStat {
  mean: number
  std: number
}

/** One feature and its baseline distribution, for anomaly scoring. */
export interface AnomalyInput {
  /** Current-window feature values keyed by name (e.g. mood, energy, steps). */
  current: Record<string, number>
  /** Rolling baseline mean/std keyed by the same names. */
  baseline: Record<string, BaselineStat>
}

export interface AnomalyResult {
  /** 0 .. 1 — higher means more anomalous vs the member's own baseline. */
  score: number
  /** Feature names that drove the score, most significant first. */
  drivers: string[]
}

/** Numeric feature vector for fall-risk prediction (already normalised 0..1-ish). */
export type FallRiskFeatures = Record<string, number>

export interface FallRiskResult {
  /** 0 .. 1 probability of a fall in the next 90 days. */
  probability: number
}

export interface GriefPatternInput {
  monthsSinceLoss: number
  /** Share of recent check-ins with mood_score <= 4 (0..1). */
  lowMoodRatio: number
  /** -1..1 sentiment valence from recent check-ins. */
  sentimentValence: number
  /** 1 = engagement flat vs prior period, <1 = declining. */
  engagementTrend: number
  anniversaryNear: boolean
}

export interface GriefPatternResult {
  pgdRisk: boolean
  /** none | monitoring | elevated | high */
  band: string
  indicators: string[]
}

export interface MlProvider {
  analyzeSentiment(texts: string[]): Promise<SentimentResult>
  scoreBehavioralAnomaly(input: AnomalyInput): Promise<AnomalyResult>
  predictFallRisk(features: FallRiskFeatures): Promise<FallRiskResult>
  assessGriefPattern(input: GriefPatternInput): Promise<GriefPatternResult>
}
