// Stub ML provider — transparent, deterministic heuristics that stand in for the
// trained models (sentiment NLP, Isolation Forest, XGBoost, PGD assessment).
// No randomness: the same input always produces the same output, so tests and
// the navigator UI are stable. Replaced in M23 activation by RealMlProvider.
import type {
  MlProvider,
  SentimentResult,
  AnomalyInput,
  AnomalyResult,
  FallRiskFeatures,
  FallRiskResult,
  GriefPatternInput,
  GriefPatternResult,
} from '../interfaces/MlProvider'

const NEGATIVE_WORDS = [
  'sad', 'lonely', 'alone', 'tired', 'hopeless', 'worthless', 'empty', 'afraid',
  'scared', 'worried', 'anxious', 'pain', 'hurts', 'cry', 'crying', 'miss', 'lost',
  'nobody', 'useless', 'burden', 'dark', 'struggle', 'struggling', 'hard', 'awful',
]
const POSITIVE_WORDS = [
  'happy', 'good', 'great', 'wonderful', 'love', 'enjoyed', 'grateful', 'thankful',
  'excited', 'looking forward', 'better', 'fun', 'laughed', 'lovely', 'proud',
  'hopeful', 'calm', 'peaceful', 'blessed',
]
const LONELINESS_WORDS = [
  'lonely', 'alone', 'nobody', 'no one', 'by myself', "haven't seen", 'no visitors',
  'isolated', 'quiet house', 'empty house', 'miss having', 'wish someone',
]
const GRIEF_WORDS = [
  'miss him', 'miss her', 'miss them', 'passed away', 'since he died', 'since she died',
  'the funeral', 'widow', 'widower', "he's gone", "she's gone", 'grief', 'grieving',
  'anniversary of', 'without him', 'without her',
]

function density(haystack: string, needles: string[]): number {
  if (!haystack) return 0
  const text = haystack.toLowerCase()
  let hits = 0
  for (const n of needles) {
    let idx = text.indexOf(n)
    while (idx !== -1) {
      hits++
      idx = text.indexOf(n, idx + n.length)
    }
  }
  const words = Math.max(text.split(/\s+/).length, 1)
  // Normalise: ~1 hit per 40 words saturates toward 1.
  return Math.min(1, (hits / words) * 40)
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

/** Standard logistic. */
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z))
}

export class StubMlProvider implements MlProvider {
  async analyzeSentiment(texts: string[]): Promise<SentimentResult> {
    const joined = (texts ?? []).filter(Boolean).join(' \n ')
    console.log(`[STUB][ML] analyzeSentiment over ${texts?.length ?? 0} text(s), ${joined.length} chars`)
    if (!joined.trim()) {
      return { valence: 0, loneliness: 0, grief: 0, labels: ['no_text'] }
    }
    const neg = density(joined, NEGATIVE_WORDS)
    const pos = density(joined, POSITIVE_WORDS)
    const loneliness = density(joined, LONELINESS_WORDS)
    const grief = density(joined, GRIEF_WORDS)
    const valence = Math.max(-1, Math.min(1, pos - neg))
    const labels: string[] = []
    if (valence <= -0.25) labels.push('negative_affect')
    else if (valence >= 0.25) labels.push('positive_affect')
    else labels.push('neutral_affect')
    if (loneliness >= 0.3) labels.push('loneliness_language')
    if (grief >= 0.3) labels.push('grief_language')
    return { valence, loneliness, grief, labels }
  }

  async scoreBehavioralAnomaly(input: AnomalyInput): Promise<AnomalyResult> {
    // Isolation-Forest stand-in: multivariate deviation from the member's own
    // rolling baseline. Per-feature |z| is capped at 3 and averaged; features
    // with |z| >= 2 are reported as drivers.
    const names = Object.keys(input.baseline)
    const scored: { name: string; z: number }[] = []
    for (const name of names) {
      const cur = input.current[name]
      const base = input.baseline[name]
      if (cur === undefined || !base || !isFinite(base.std) || base.std <= 0) continue
      const z = Math.abs((cur - base.mean) / base.std)
      scored.push({ name, z: Math.min(z, 3) })
    }
    console.log(`[STUB][ML] scoreBehavioralAnomaly over ${scored.length} feature(s)`)
    if (scored.length === 0) return { score: 0, drivers: [] }
    // Isolation Forest is sensitive to a single strongly-anomalous dimension, so a
    // sharp decline in one feature (e.g. a mood crash) must not be diluted by
    // averaging it against stable features. Blend the mean deviation with the
    // single largest deviation, weighting the peak.
    const avg = scored.reduce((s, f) => s + f.z, 0) / scored.length
    const peak = scored.reduce((m, f) => Math.max(m, f.z), 0)
    const blended = 0.55 * avg + 0.45 * peak
    // Normalise against 2.5 (not the |z| cap of 3): a coherent shift of ~1.5 SD
    // across several correlated wellness features is jointly improbable and a
    // real Isolation Forest would score it as strongly anomalous.
    const score = clamp01(blended / 2.5)
    const drivers = scored
      .filter((f) => f.z >= 2)
      .sort((a, b) => b.z - a.z)
      .map((f) => f.name)
    return { score, drivers }
  }

  async predictFallRisk(features: FallRiskFeatures): Promise<FallRiskResult> {
    // XGBoost stand-in: fixed-weight logistic model over engineered features.
    // Weights reflect published fall-risk literature ordering (prior falls and
    // psychoactive medications dominate).
    const w: Record<string, number> = {
      prior_falls: 1.4,
      psychoactive_meds: 1.0,
      bp_meds: 0.5,
      mobility_device: 0.8,
      low_activity: 0.9,
      gait_instability: 0.7,
      age_over_80: 0.6,
      lives_alone: 0.3,
      recent_wellness_drift: 0.6,
      vision_flag: 0.4,
    }
    let z = -2.2 // intercept — baseline low prevalence
    const parts: string[] = []
    for (const [k, weight] of Object.entries(w)) {
      const x = features[k] ?? 0
      if (x > 0) {
        z += weight * x
        parts.push(k)
      }
    }
    console.log(`[STUB][ML] predictFallRisk features=[${parts.join(',')}] z=${z.toFixed(2)}`)
    return { probability: clamp01(sigmoid(z)) }
  }

  async assessGriefPattern(input: GriefPatternInput): Promise<GriefPatternResult> {
    // Prolonged Grief Disorder (PGD) screening heuristic, aligned with DSM-5-TR
    // timing: persistent, impairing grief >= 12 months after the loss.
    const indicators: string[] = []
    if (input.monthsSinceLoss >= 12) indicators.push('>=12 months since loss')
    if (input.lowMoodRatio >= 0.6) indicators.push('sustained low mood in check-ins')
    if (input.sentimentValence <= -0.25) indicators.push('persistent negative sentiment')
    if (input.engagementTrend < 0.7) indicators.push('declining social engagement')
    if (input.anniversaryNear) indicators.push('near loss anniversary')

    console.log(`[STUB][ML] assessGriefPattern months=${input.monthsSinceLoss} indicators=${indicators.length}`)

    const persistent =
      input.lowMoodRatio >= 0.6 || input.sentimentValence <= -0.25 || input.engagementTrend < 0.7
    let band = 'none'
    if (input.monthsSinceLoss >= 12 && persistent && indicators.length >= 3) band = 'high'
    else if (input.monthsSinceLoss >= 12 && persistent) band = 'elevated'
    else if (persistent || input.anniversaryNear) band = 'monitoring'

    return { pgdRisk: band === 'elevated' || band === 'high', band, indicators }
  }
}
