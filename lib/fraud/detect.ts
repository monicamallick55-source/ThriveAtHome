// lib/fraud/detect.ts
// G7.1 — Scam & fraud pattern detector
// Scans text for known fraud patterns, returns typed matches.
// Called from: call transcripts, community posts, gift orders, navigator/family manual flags.

export type ScamType =
  | 'gift_card'
  | 'government_impersonation'
  | 'grandparent'
  | 'romance'
  | 'tech_support'
  | 'lottery_prize'
  | 'investment_crypto'
  | 'charity'
  | 'large_purchase'
  | 'other'

export type Severity = 'concern' | 'urgent'

export interface FraudMatch {
  scamType: ScamType
  severity: Severity
  excerpt: string  // ≤200 chars — never the full text
}

// ── False-positive guards ────────────────────────────────────────────────────
// These phrases indicate the speaker is AWARE of / reporting a scam, not being victimised.
const FALSE_POSITIVE_PHRASES = [
  /i (hung up|hung-up|ended the call)/i,
  /i (didn'?t|did not) (fall for|give|send|buy)/i,
  /(talking|reading|heard|saw|warning|warned) about (a |the )?scam/i,
  /scam (call|email|text|alert|warning)/i,
  /that was a scam/i,
  /it'?s a scam/i,
  /don'?t fall for/i,
  /protect (yourself|seniors)/i,
]

function isFalsePositive(text: string): boolean {
  return FALSE_POSITIVE_PHRASES.some((re) => re.test(text))
}

// ── Pattern groups ───────────────────────────────────────────────────────────

interface PatternGroup {
  scamType: ScamType
  // At least one phrase must match for the group to fire
  phrases: Array<RegExp | string>
  // If ALL of these also match, severity = 'urgent'
  urgentBoosts?: RegExp[]
}

const PATTERN_GROUPS: PatternGroup[] = [
  {
    scamType: 'gift_card',
    phrases: [
      /gift\s*card/i,
      /google\s*play\s*card/i,
      /itunes\s*card/i,
      /steam\s*card/i,
      /amazon\s*gift\s*card/i,
      /ebay\s*gift\s*card/i,
      /target\s*gift\s*card/i,
      /read\s*(me\s*)?the\s*(numbers|code|pin)\s*(on|from|off)\s*the\s*(back|card)/i,
      /scratch\s*(off\s*)?the\s*(back|card)/i,
    ],
    urgentBoosts: [
      /today|right now|immediately|hurry|urgent|fast|quickly/i,
      /\$[0-9,]+|hundreds|thousands/i,
    ],
  },
  {
    scamType: 'government_impersonation',
    phrases: [
      /\birs\b/i,
      /social\s*security\s*(suspended|cancelled|frozen|terminated)/i,
      /warrant\s*(for\s*your\s*arrest|issued)/i,
      /medicare\s*(cancelled|suspended|terminated)/i,
      /sheriff'?s?\s*department/i,
      /federal\s*(agent|bureau|officer)/i,
      /department\s*of\s*(treasury|justice|homeland)/i,
      /police\s*(department\s*)?(is\s*)?coming/i,
      /arrest\s*warrant/i,
      /owe\s*(back\s*)?taxes/i,
    ],
    urgentBoosts: [
      /arrest|jail|prison|handcuff/i,
      /today|immediately|right now|24\s*hours/i,
    ],
  },
  {
    scamType: 'grandparent',
    phrases: [
      /in\s*jail/i,
      /bail\s*money/i,
      /don'?t\s*tell\s*(mom|dad|grandma|grandpa|the\s*family|anyone)/i,
      /keep\s*(it\s*)?secret/i,
      /(car\s*accident|crash|trouble|arrested)\b.{0,80}\b(grandson|granddaughter|grandchild|son|daughter)/i,
      /need\s*cash\s*(now|fast|quick)/i,
      /i'?m\s*in\s*(trouble|jail|the\s*hospital)\b/i,
      /please\s*don'?t\s*tell/i,
    ],
    urgentBoosts: [
      /today|right now|immediately|tonight/i,
      /cash|wire|money\s*order/i,
    ],
  },
  {
    scamType: 'tech_support',
    phrases: [
      /virus\s*(on\s*)?your\s*computer/i,
      /remote\s*(access|control|connect)/i,
      /microsoft\s*(called|support|technician)/i,
      /apple\s*(called|support|technician)/i,
      /your\s*computer\s*(is\s*)?(hacked|infected|compromised)/i,
      /install\s*this\s*software/i,
      /teamviewer|anydesk|logmein/i,
      /error\s*(code|message)\s*on\s*your\s*(screen|computer)/i,
      /your\s*account\s*(has\s*been\s*)?(hacked|compromised|breached)/i,
    ],
    urgentBoosts: [
      /immediately|right now|right away|urgent/i,
      /bank\s*account|credit\s*card|password|social\s*security/i,
    ],
  },
  {
    scamType: 'lottery_prize',
    phrases: [
      /you'?ve?\s*won/i,
      /processing\s*fee/i,
      /claim\s*your\s*prize/i,
      /lottery\s*winner/i,
      /sweepstakes\s*(winner|prize)/i,
      /wire\s*(the\s*)?fee/i,
      /prize\s*notification/i,
      /selected\s*(as\s*)?a\s*winner/i,
      /unclaimed\s*(prize|winnings|money)/i,
    ],
    urgentBoosts: [
      /fee|tax|duty|charge/i,
      /wire|transfer|money\s*order|gift\s*card/i,
    ],
  },
  {
    scamType: 'romance',
    phrases: [
      // Romance scams: need multiple signals (love/affection + financial ask)
      /send\s*(me\s*)?(money|funds|cash)/i,
      /plane\s*ticket.*can'?t\s*(come|visit|travel)/i,
      /can'?t\s*video\s*(call|chat).{0,60}(love|miss\s*you|relationship)/i,
      /military\s*(overseas|deployed|stationed).{0,100}(money|send|wire)/i,
      /oil\s*(rig|platform).{0,100}(stuck|stranded|money)/i,
      /i\s*need\s*money.{0,60}(love|relationship|together)/i,
      /gift\s*card.{0,60}(love|sweetheart|darling)/i,
    ],
    urgentBoosts: [
      /emergency|hospital|surgery|sick|accident/i,
      /\$[0-9,]+|hundreds|thousands/i,
    ],
  },
  {
    scamType: 'investment_crypto',
    phrases: [
      /bitcoin\s*(investment|opportunity)/i,
      /crypto\s*atm/i,
      /guaranteed\s*return/i,
      /double\s*your\s*money/i,
      /wire\s*transfer\s*to\b/i,
      /offshore\s*account/i,
      /cryptocurrency\s*(investment|opportunity|profit)/i,
      /forex\s*(investment|trading|opportunity)/i,
      /limited\s*time\s*(investment|opportunity)/i,
    ],
    urgentBoosts: [
      /today|immediately|deadline|expires/i,
      /wire|transfer|send\s*money/i,
    ],
  },
  {
    scamType: 'charity',
    phrases: [
      /charity\s*(donation|contribution)\s*(is\s*)?tax\s*deductible/i,
      /donate\s*(cash|gift\s*card|wire)/i,
      /disaster\s*relief\s*(fund|donation)/i,
      /veterans?\s*(charity|fund|donation)\s*(gift\s*card|wire|cash)/i,
      /children'?s?\s*(charity|fund)\s*(gift\s*card|wire|cash)/i,
    ],
    urgentBoosts: [
      /today|right now|emergency/i,
      /gift\s*card|wire|cash/i,
    ],
  },
]

// ── Core scanner ─────────────────────────────────────────────────────────────

/**
 * Scan text for fraud patterns.
 * Returns one result per matched pattern group (deduplicated by scamType).
 * Never returns more than the first match per type.
 * excerpt is ≤ 200 characters, centred around the match.
 */
export function scanForFraudPatterns(text: string): FraudMatch[] {
  if (!text || text.trim().length < 10) return []
  if (isFalsePositive(text)) return []

  const results: FraudMatch[] = []
  const seenTypes = new Set<ScamType>()

  for (const group of PATTERN_GROUPS) {
    if (seenTypes.has(group.scamType)) continue

    let matchIndex = -1
    let matchLength = 0

    for (const pattern of group.phrases) {
      const re = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern
      const m = re.exec(text)
      if (m) {
        matchIndex = m.index
        matchLength = m[0].length
        break
      }
    }

    if (matchIndex === -1) continue

    // Determine severity: urgent if payment method + urgency both appear
    let severity: Severity = 'concern'
    if (group.urgentBoosts && group.urgentBoosts.length >= 2) {
      const allBoostsMatch = group.urgentBoosts.every((re) => re.test(text))
      if (allBoostsMatch) severity = 'urgent'
    }

    // Build excerpt centred on match (≤200 chars)
    const WINDOW = 90
    const start = Math.max(0, matchIndex - WINDOW)
    const end = Math.min(text.length, matchIndex + matchLength + WINDOW)
    let excerpt = text.slice(start, end).trim()
    if (start > 0) excerpt = '…' + excerpt
    if (end < text.length) excerpt = excerpt + '…'
    if (excerpt.length > 200) excerpt = excerpt.slice(0, 197) + '…'

    results.push({ scamType: group.scamType, severity, excerpt })
    seenTypes.add(group.scamType)
  }

  return results
}

/**
 * Convenience: returns true if any urgent flag found.
 */
export function hasUrgentFraud(text: string): boolean {
  return scanForFraudPatterns(text).some((f) => f.severity === 'urgent')
}
