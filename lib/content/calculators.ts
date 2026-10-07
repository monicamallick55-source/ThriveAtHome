// G7.2 — Retirement Planning Hub calculators

export interface SSBenefitInput {
  birthYear: number
  estimatedMonthlyAt62: number
}

export interface SSBenefitResult {
  at62: number
  atFRA: number
  at70: number
  fraAge: number
  breakEvenVs62AtFRA: number
  breakEvenVs62At70: number
}

export function calcSSBenefit(input: SSBenefitInput): SSBenefitResult {
  const { birthYear, estimatedMonthlyAt62 } = input
  const fraAge = birthYear >= 1960 ? 67 : birthYear >= 1955 ? 66.5 : 66
  const fraMonths = (fraAge - 62) * 12
  const reductionPct = fraMonths <= 36
    ? fraMonths * 0.00556
    : 36 * 0.00556 + (fraMonths - 36) * 0.00417
  const atFRA = Math.round(estimatedMonthlyAt62 / (1 - reductionPct))
  const at70 = Math.round(atFRA * (1 + 0.08 * (70 - fraAge)))
  const monthlyDiffFRA = atFRA - estimatedMonthlyAt62
  const foregoneFRA = estimatedMonthlyAt62 * fraMonths
  const breakEvenVs62AtFRA = Math.round(foregoneFRA / monthlyDiffFRA)
  const monthsDiff70 = (70 - 62) * 12
  const foregone70 = estimatedMonthlyAt62 * monthsDiff70
  const monthlyDiff70 = at70 - estimatedMonthlyAt62
  const breakEvenVs62At70 = Math.round(foregone70 / monthlyDiff70)
  return { at62: estimatedMonthlyAt62, atFRA, at70, fraAge, breakEvenVs62AtFRA, breakEvenVs62At70 }
}

export interface RetirementBudgetInput {
  monthlyIncome: number
  socialSecurityMonthly: number
  pensionMonthly: number
  housing: number
  food: number
  healthcare: number
  transportation: number
  utilities: number
  entertainment: number
  other: number
}

export interface RetirementBudgetResult {
  totalIncome: number
  totalExpenses: number
  monthlySurplus: number
  yearlySurplus: number
  savingsRunwayYears: number | null
}

export function calcRetirementBudget(input: RetirementBudgetInput): RetirementBudgetResult {
  const totalIncome = input.monthlyIncome + input.socialSecurityMonthly + input.pensionMonthly
  const totalExpenses = input.housing + input.food + input.healthcare +
    input.transportation + input.utilities + input.entertainment + input.other
  const monthlySurplus = totalIncome - totalExpenses
  const yearlySurplus = monthlySurplus * 12
  return { totalIncome, totalExpenses, monthlySurplus, yearlySurplus, savingsRunwayYears: null }
}

export const MEDICARE_2026 = {
  partB: {
    standardPremium: 185.00,
    deductible: 257,
    irmaaThresholds: [
      { income: 106000, individual: 185.00 },
      { income: 133000, individual: 259.00 },
      { income: 167000, individual: 370.00 },
      { income: 200000, individual: 480.90 },
      { income: 500000, individual: 591.90 },
      { income: Infinity, individual: 628.90 },
    ],
  },
  partA: { premium: 0, deductible: 1676, coinsuranceDay61to90: 419 },
  partD: { catastrophicThreshold: 8000, latePenaltyPerMonth: 0.01 },
  openEnrollment: { start: 'October 15', end: 'December 7' },
  initialEnrollmentWindow: '3 months before to 3 months after your 65th birthday month',
}

export function getMedicareDeadlines(birthDate: Date): Array<{ label: string; date: Date; description: string }> {
  const birth65 = new Date(birthDate)
  birth65.setFullYear(birth65.getFullYear() + 65)
  const iepStart = new Date(birth65)
  iepStart.setMonth(iepStart.getMonth() - 3)
  const iepEnd = new Date(birth65)
  iepEnd.setMonth(iepEnd.getMonth() + 4)
  iepEnd.setDate(0)
  return [
    { label: 'IEP Opens', date: iepStart, description: 'Your Initial Enrollment Period opens — you can enroll in Medicare Parts A & B' },
    { label: '65th Birthday', date: birth65, description: 'Your 65th birthday — Medicare coverage can start as early as this month' },
    { label: 'IEP Closes', date: iepEnd, description: 'Initial Enrollment Period closes — late enrollment penalties begin after this date' },
  ]
}
