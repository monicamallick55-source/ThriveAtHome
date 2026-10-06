// G7.2 - Retirement Planning Hub calculators

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
  const reductionPct = fraMonths <= 36 ? fraMonths * 0.00556 : 36 * 0.00556 + (fraMonths - 36) * 0.00417
  const atFRA = Math.round(estimatedMonthlyAt62 / (1 - reductionPct))
  const at70 = Math.round(atFRA * (1 + 0.08 * (70 - fraAge)))
  const breakEvenVs62AtFRA = Math.round((estimatedMonthlyAt62 * fraMonths) / (atFRA - estimatedMonthlyAt62))
  const breakEvenVs62At70 = Math.round((estimatedMonthlyAt62 * (70 - 62) * 12) / (at70 - estimatedMonthlyAt62))
  return { at62: estimatedMonthlyAt62, atFRA, at70, fraAge, breakEvenVs62AtFRA, breakEvenVs62At70 }
}

export interface RetirementBudgetResult {
  totalIncome: number
  totalExpenses: number
  monthlySurplus: number
  yearlySurplus: number
}

export function calcRetirementBudget(income: number, ss: number, pension: number, expenses: number): RetirementBudgetResult {
  const totalIncome = income + ss + pension
  const monthlySurplus = totalIncome - expenses
  return { totalIncome, totalExpenses: expenses, monthlySurplus, yearlySurplus: monthlySurplus * 12 }
}

export const MEDICARE_2026 = {
  partB: { standardPremium: 185.00, deductible: 257 },
  partA: { premium: 0, deductible: 1676 },
  partD: { catastrophicThreshold: 8000, latePenaltyPerMonth: 0.01 },
  openEnrollment: { start: 'October 15', end: 'December 7' },
}
