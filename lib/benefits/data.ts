export interface BenefitProgram {
  id: string
  name: string
  category: 'health' | 'food' | 'housing' | 'income' | 'veteran' | 'utility' | 'social'
  summary: string
  estimatedValue: string
  applyUrl: string
  eligibility: {
    maxIncomeTier?: 'low' | 'medium' | 'any'
    veteranOnly?: boolean
    minAge?: number
    needsDisability?: boolean
    stateSpecific?: boolean
  }
}

export const BENEFIT_PROGRAMS: BenefitProgram[] = [
  {
    id: 'medicare-extra-help',
    name: 'Medicare Extra Help (Low Income Subsidy)',
    category: 'health',
    summary: 'Helps pay for Medicare Part D prescription drug costs including premiums, deductibles, and copays.',
    estimatedValue: 'Up to $5,900/year in savings',
    applyUrl: 'https://www.ssa.gov/benefits/medicare/prescriptionhelp.html',
    eligibility: { maxIncomeTier: 'low' },
  },
  {
    id: 'medicare-savings',
    name: 'Medicare Savings Programs',
    category: 'health',
    summary: 'State programs that help pay Medicare Part A and B premiums, deductibles, and copays. Four levels of help available.',
    estimatedValue: 'Up to $2,000/year in premium savings',
    applyUrl: 'https://www.medicare.gov/basics/costs/help/medicare-savings-programs',
    eligibility: { maxIncomeTier: 'low', stateSpecific: true },
  },
  {
    id: 'medicaid',
    name: 'Medicaid',
    category: 'health',
    summary: 'Joint federal-state health coverage for people with low income. May cover costs Medicare does not, including long-term care.',
    estimatedValue: 'Comprehensive health coverage',
    applyUrl: 'https://www.medicaid.gov/about-us/beneficiary-resources/index.html',
    eligibility: { maxIncomeTier: 'low', stateSpecific: true },
  },
  {
    id: 'snap',
    name: 'SNAP (Food Stamps)',
    category: 'food',
    summary: 'Supplemental Nutrition Assistance Program provides monthly benefits loaded onto an EBT card for groceries.',
    estimatedValue: 'Average $100–$200/month',
    applyUrl: 'https://www.fns.usda.gov/snap/recipient/eligibility',
    eligibility: { maxIncomeTier: 'low' },
  },
  {
    id: 'senior-farmers-market',
    name: 'Senior Farmers Market Nutrition Program',
    category: 'food',
    summary: 'Provides coupons for use at farmers markets, roadside stands, and community-supported agriculture programs.',
    estimatedValue: 'Up to $50/season in fresh produce',
    applyUrl: 'https://www.fns.usda.gov/sfmnp/senior-farmers-market-nutrition-program',
    eligibility: { maxIncomeTier: 'low', minAge: 60 },
  },
  {
    id: 'meals-on-wheels',
    name: 'Meals on Wheels',
    category: 'food',
    summary: 'Home-delivered nutritious meals for older adults who have difficulty preparing food or leaving home.',
    estimatedValue: 'Daily meal delivery (often free or reduced cost)',
    applyUrl: 'https://www.mealsonwheelsamerica.org/find-a-meal',
    eligibility: { minAge: 60 },
  },
  {
    id: 'ssi',
    name: 'Supplemental Security Income (SSI)',
    category: 'income',
    summary: 'Monthly cash payments for adults 65+ with limited income and resources, or those with a disability.',
    estimatedValue: 'Up to $943/month (2024)',
    applyUrl: 'https://www.ssa.gov/benefits/ssi/',
    eligibility: { maxIncomeTier: 'low' },
  },
  {
    id: 'liheap',
    name: 'LIHEAP (Energy Assistance)',
    category: 'utility',
    summary: 'Low Income Home Energy Assistance Program helps with home heating and cooling bills.',
    estimatedValue: 'Up to $2,000/year in energy costs',
    applyUrl: 'https://www.acf.hhs.gov/ocs/programs/liheap',
    eligibility: { maxIncomeTier: 'medium', stateSpecific: true },
  },
  {
    id: 'lifeline',
    name: 'Lifeline Phone/Internet Assistance',
    category: 'utility',
    summary: 'Federal program reducing monthly telephone or broadband internet service bills for eligible households.',
    estimatedValue: 'Up to $30/month off phone or internet bill',
    applyUrl: 'https://www.lifelinesupport.org/',
    eligibility: { maxIncomeTier: 'medium' },
  },
  {
    id: 'section-8',
    name: 'Section 8 Housing Choice Voucher',
    category: 'housing',
    summary: 'Helps low-income individuals and families afford safe, decent housing in the private market.',
    estimatedValue: 'Significant housing cost reduction',
    applyUrl: 'https://www.hud.gov/topics/housing_choice_voucher_program_section_8',
    eligibility: { maxIncomeTier: 'low', stateSpecific: true },
  },
  {
    id: 'va-aid-attendance',
    name: 'VA Aid & Attendance',
    category: 'veteran',
    summary: 'Pension benefit for veterans and surviving spouses who need help with daily activities or are housebound.',
    estimatedValue: 'Up to $2,800/month (veteran with dependent)',
    applyUrl: 'https://www.va.gov/pension/aid-attendance-housebound/',
    eligibility: { veteranOnly: true, needsDisability: true },
  },
  {
    id: 'va-pension',
    name: 'VA Pension',
    category: 'veteran',
    summary: 'Monthly income supplement for wartime veterans with limited income who are 65 or older or permanently disabled.',
    estimatedValue: 'Up to $1,562/month (2024)',
    applyUrl: 'https://www.va.gov/pension/veterans-pension/',
    eligibility: { veteranOnly: true, maxIncomeTier: 'low', minAge: 65 },
  },
  {
    id: 'va-caregiver-support',
    name: 'VA Caregiver Support Program',
    category: 'veteran',
    summary: 'Resources and financial support for family caregivers of eligible veterans, including respite care.',
    estimatedValue: 'Monthly stipend + healthcare for caregiver',
    applyUrl: 'https://www.caregiver.va.gov/',
    eligibility: { veteranOnly: true },
  },
  {
    id: 'scsep',
    name: 'Senior Community Service Employment Program',
    category: 'income',
    summary: 'Paid part-time training opportunities for low-income adults 55+ to develop job skills and find employment.',
    estimatedValue: 'Paid training at minimum wage',
    applyUrl: 'https://www.dol.gov/agencies/eta/seniors',
    eligibility: { maxIncomeTier: 'medium', minAge: 55 },
  },
  {
    id: 'benefits-checkup',
    name: 'BenefitsCheckUp (NCOA)',
    category: 'social',
    summary: 'A free service from the National Council on Aging to help find federal, state, and local benefits you may qualify for.',
    estimatedValue: 'Find additional benefits tailored to your state',
    applyUrl: 'https://www.benefitscheckup.org/',
    eligibility: {},
  },
  {
    id: 'aaa-services',
    name: 'Area Agency on Aging Services',
    category: 'social',
    summary: 'Local agencies providing transportation, home care, legal assistance, and social programs for adults 60+.',
    estimatedValue: 'Free or low-cost local services',
    applyUrl: 'https://eldercare.acl.gov/',
    eligibility: { minAge: 60 },
  },
]

export interface BenefitsAnswers {
  income: 'under20k' | '20k-40k' | '40k-60k' | 'over60k'
  age: '60-64' | '65-69' | '70-74' | '75plus'
  isVeteran: boolean
  hasDisability: boolean
}

export function filterBenefits(answers: BenefitsAnswers): BenefitProgram[] {
  const incomeTier: 'low' | 'medium' | 'high' =
    answers.income === 'under20k' ? 'low'
      : answers.income === '20k-40k' ? 'medium'
      : 'high'

  const ageNum = answers.age === '60-64' ? 62
    : answers.age === '65-69' ? 67
    : answers.age === '70-74' ? 72
    : 77

  return BENEFIT_PROGRAMS.filter(b => {
    const e = b.eligibility
    if (e.veteranOnly && !answers.isVeteran) return false
    if (e.needsDisability && !answers.hasDisability) return false
    if (e.minAge && ageNum < e.minAge) return false
    if (e.maxIncomeTier === 'low' && incomeTier !== 'low') return false
    if (e.maxIncomeTier === 'medium' && incomeTier === 'high') return false
    return true
  })
}
