// VITA / TCE free tax-prep — client-safe eligibility rules and checklists.
// Phase 99 (M24). No external API — IRS locator link + guided intake.

export const IRS_VITA_LOCATOR_URL =
  'https://irs.treasury.gov/freetaxprep/'
export const AARP_TAX_AIDE_LOCATOR_URL =
  'https://www.aarp.org/money/taxes/aarp_taxaide/'
export const GET_YOUR_REFUND_URL = 'https://www.getyourrefund.org/'

/** VITA income ceiling (roughly indexed each year — IRS sets it). */
export const VITA_INCOME_CEILING = 67000

export interface IncomeBand {
  value: string
  label: string
}

export const INCOME_BANDS: IncomeBand[] = [
  { value: 'under_20k', label: 'Under $20,000' },
  { value: '20k_40k', label: '$20,000 – $40,000' },
  { value: '40k_67k', label: '$40,000 – $67,000' },
  { value: 'over_67k', label: 'Over $67,000' },
  { value: 'prefer_not', label: 'Prefer not to say' },
]

export interface FilingSituation {
  value: string
  label: string
}

export const FILING_SITUATIONS: FilingSituation[] = [
  { value: 'simple_return', label: 'Simple return — Social Security, pension, a little interest' },
  { value: 'has_investments', label: 'Has investment income (dividends, capital gains)' },
  { value: 'self_employed', label: 'Some self-employment or gig income' },
  { value: 'rental_income', label: 'Has rental income' },
  { value: 'first_time', label: 'First time filing in a while / needs prior-year returns' },
  { value: 'irs_notice', label: 'Received an IRS notice or letter' },
  { value: 'not_sure', label: 'Not sure — needs help figuring it out' },
]

export interface EligibilityResult {
  eligible: boolean
  program: 'vita' | 'tce' | 'either' | 'paid_referral'
  headline: string
  detail: string
}

/**
 * Rough triage: TCE (Tax Counseling for the Elderly) prioritises taxpayers 60+
 * regardless of income for pension/retirement questions; VITA is income-tested
 * (~$67k). Complex situations (rental, meaningful self-employment) are usually
 * out of scope and get a paid-preparer referral instead.
 */
export function checkEligibility(input: {
  age: number | null
  incomeBand: string
  situation: string
}): EligibilityResult {
  const outOfScope = ['rental_income'].includes(input.situation)
  const likelyOutOfScope = input.situation === 'self_employed'
  const lowIncome = ['under_20k', '20k_40k', '40k_67k'].includes(input.incomeBand)
  const is60plus = input.age !== null && input.age >= 60

  if (outOfScope) {
    return {
      eligible: false,
      program: 'paid_referral',
      headline: 'This return is usually outside free tax-prep scope',
      detail:
        'Rental income and more complex returns are generally not handled by VITA/TCE volunteers. Your navigator can introduce you to a vetted tax professional, some of whom offer sliding-scale fees.',
    }
  }

  if (is60plus) {
    return {
      eligible: true,
      program: lowIncome ? 'either' : 'tce',
      headline: 'You likely qualify for free tax help',
      detail:
        'AARP Tax-Aide (TCE) helps taxpayers 60 and older with retirement, pension, and Social Security questions at no cost.' +
        (lowIncome ? ' You may also use a VITA site.' : '') +
        (likelyOutOfScope
          ? ' If your self-employment income is more than a small amount, a volunteer will let you know if it is in scope.'
          : ''),
    }
  }

  if (lowIncome) {
    return {
      eligible: true,
      program: 'vita',
      headline: 'You likely qualify for free tax help through VITA',
      detail:
        'VITA offers free, IRS-certified tax preparation for households earning roughly $67,000 or less.' +
        (likelyOutOfScope
          ? ' Bring your self-employment records — a volunteer will confirm if it is in scope.'
          : ''),
    }
  }

  return {
    eligible: false,
    program: 'paid_referral',
    headline: 'You may be above the free tax-prep income limit',
    detail:
      'VITA generally serves households under about $67,000. Your navigator can still help you find low-cost options or introduce you to a vetted tax professional.',
  }
}

/** "What to bring" checklist — shown on the tax-help page and in the request confirmation. */
export const WHAT_TO_BRING: { group: string; items: string[] }[] = [
  {
    group: 'Identification',
    items: [
      'Photo ID for you (and your spouse, if filing jointly)',
      'Social Security cards or ITIN letters for everyone on the return',
      'A copy of last year’s tax return, if you have it',
    ],
  },
  {
    group: 'Income',
    items: [
      'SSA-1099 (Social Security benefits)',
      '1099-R (pension, IRA, or annuity income)',
      'W-2 forms (if still working)',
      '1099-INT / 1099-DIV (bank interest, dividends)',
      '1099-NEC / 1099-K or records of any self-employment income',
    ],
  },
  {
    group: 'Deductions & credits',
    items: [
      'Property-tax and mortgage-interest statements (1098)',
      'Records of medical expenses and charitable donations',
      '1095-A if you had Marketplace health insurance',
    ],
  },
  {
    group: 'For your refund',
    items: ['A blank check or bank account and routing number for direct deposit'],
  },
]
