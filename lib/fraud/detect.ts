// lib/fraud/detect.ts
// Pure pattern-matching fraud detector — no Supabase imports, safe for client + server

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

export interface FraudMatch {
  scamType: ScamType
  severity: 'concern' | 'urgent'
  excerpt: string
}

// Phrases that indicate the person is reporting/avoiding a scam (suppress false positives)
const BENIGN_CONTEXT = [
  /i (hung up|blocked|reported|ignored|didn'?t answer)/i,
  /it was a scam/i,
  /i knew it was/i,
  /warned (me|my friend)/i,
  /scam call/i,
  /fraud alert from my bank/i,
]

// Urgency indicators
const URGENCY = /\b(today|right now|immediately|urgent|within (the hour|24 hours)|before (tonight|tomorrow|it'?s too late))\b/i

// Payment method indicators (escalate to urgent when combined with scam pattern + urgency)
const PAYMENT_METHOD = /\b(gift card|google play|itunes|amazon card|wire transfer|bitcoin|crypto|cash courier|money order|zelle|venmo to stranger)\b/i

interface PatternGroup {
  type: ScamType
  patterns: RegExp[]
}

const PATTERN_GROUPS: PatternGroup[] = [
  {
    type: 'gift_card',
    patterns: [
      /\bgift cards?\b/i,
      /\bgoogle play cards?\b/i,
      /\bitunes cards?\b/i,
      /\bamazon gift cards?\b/i,
      /read (me )?the (numbers|code) (on the )?back/i,
      /scratch (off )?the back/i,
      /send (me )?the card numbers?/i,
    ],
  },
  {
    type: 'government_impersonation',
    patterns: [
      /\birs\b/i,
      /social security (is|has been|number has been) (suspended|compromised|stolen)/i,
      /warrant for your arrest/i,
      /medicare (is|will be|has been) cancelled/i,
      /federal (agent|officer|investigator) calling/i,
      /you owe (back )?taxes/i,
      /arrest warrant/i,
    ],
  },
  {
    type: 'grandparent',
    patterns: [
      /\bin jail\b/i,
      /bail money/i,
      /don'?t tell (mom|dad|your (son|daughter|kids|children))/i,
      /keep this (secret|between us|quiet)/i,
      /i'?m in trouble\b/i,
      /car accident.{0,40}(hospital|hurt|money)/i,
      /\bgrandma\b.{0,30}\bsend\b/i,
      /\bgrandpa\b.{0,30}\bsend\b/i,
    ],
  },
  {
    type: 'tech_support',
    patterns: [
      /virus on your computer/i,
      /remote (access|control) (to )?your (computer|device)/i,
      /microsoft (called|support|technician)/i,
      /apple (called|support|technician)/i,
      /your computer (has been|is) (hacked|infected|compromised)/i,
      /download (this )?software (so I can|to let me)/i,
      /anydesk|teamviewer|logmein/i,
    ],
  },
  {
    type: 'lottery_prize',
    patterns: [
      /you'?ve (won|been selected)/i,
      /processing fee (to claim|before we can)/i,
      /claim your prize/i,
      /unclaimed (prize|winnings|lottery)/i,
      /foreign lottery/i,
      /sweepstakes (winner|winnings)/i,
    ],
  },
  {
    type: 'romance',
    patterns: [
      /send (me )?money.{0,40}(love|miss you|be together)/i,
      /plane ticket (so I can|to come)/i,
      /can'?t (video call|show my face|meet in person) (because|right now)/i,
      /military (deployed|overseas).{0,40}(send|money|help)/i,
      /stuck (abroad|overseas|in another country).{0,40}(send|help|wire)/i,
    ],
  },
  {
    type: 'investment_crypto',
    patterns: [
      /\bbitcoin\b.{0,40}(send|invest|transfer)/i,
      /crypto (atm|wallet|transfer)/i,
      /guaranteed (return|profit|investment)/i,
      /double your money/i,
      /invest in (crypto|bitcoin|this opportunity)/i,
    ],
  },
  {
    type: 'charity',
    patterns: [
      /disaster relief (fund|donation) (calling|urgent)/i,
      /veteran(s)? (charity|fund|foundation) (calling|urgent)/i,
      /children'?s (hospital|charity).{0,30}(urgent|today|help)/i,
      /donate (by (phone|wire)|gift card)/i,
    ],
  },
  {
    type: 'large_purchase',
    patterns: [
      /wire (\$[\d,]+|thousands?|hundreds?)/i,
      /send (\$[\d,]+|thousands?|hundreds?) (to|for)/i,
      /cash out (your|the) (retirement|savings|401k)/i,
      /liquidate (your )?(assets|savings|investments)/i,
    ],
  },
]

function isBenignContext(text: string): boolean {
  return BENIGN_CONTEXT.some((re) => re.test(text))
}

function extractExcerpt(text: string, match: RegExpMatchArray): string {
  const start = Math.max(0, (match.index ?? 0) - 40)
  const end = Math.min(text.length, (match.index ?? 0) + (match[0]?.length ?? 0) + 40)
  return text.slice(start, end).trim().slice(0, 200)
}

export function scanForFraudPatterns(text: string): FraudMatch[] {
  if (!text || isBenignContext(text)) return []

  const results: FraudMatch[] = []

  for (const group of PATTERN_GROUPS) {
    for (const pattern of group.patterns) {
      const match = pattern.exec(text)
      if (match) {
        const hasUrgency = URGENCY.test(text)
        const hasPayment = PAYMENT_METHOD.test(text)
        const severity: 'concern' | 'urgent' =
          (hasUrgency && hasPayment) || group.type === 'government_impersonation'
            ? 'urgent'
            : 'concern'

        results.push({
          scamType: group.type,
          severity,
          excerpt: extractExcerpt(text, match),
        })
        break // one match per group is enough
      }
    }
  }

  return results
}