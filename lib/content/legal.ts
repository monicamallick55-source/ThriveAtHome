// G7.3 - Legal Planning Hub

export interface LegalDocument {
  key: string
  title: string
  description: string
  priority: 'essential' | 'important' | 'recommended'
  vaultCategory: string
  guideUrl: string
}

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    key: 'will',
    title: 'Last Will & Testament',
    description: 'Directs how your assets are distributed and names guardians for dependents.',
    priority: 'essential',
    vaultCategory: 'legal',
    guideUrl: '/resources/legal-planning#will',
  },
  {
    key: 'advance_directive',
    title: 'Advance Directive / Living Will',
    description: 'Documents your wishes for medical treatment if you cannot speak for yourself.',
    priority: 'essential',
    vaultCategory: 'medical',
    guideUrl: '/resources/legal-planning#advance-directive',
  },
  {
    key: 'healthcare_poa',
    title: 'Healthcare Power of Attorney',
    description: 'Names someone to make medical decisions on your behalf.',
    priority: 'essential',
    vaultCategory: 'legal',
    guideUrl: '/resources/legal-planning#healthcare-poa',
  },
  {
    key: 'financial_poa',
    title: 'Financial Power of Attorney',
    description: 'Names someone to manage your finances if you become incapacitated.',
    priority: 'essential',
    vaultCategory: 'legal',
    guideUrl: '/resources/legal-planning#financial-poa',
  },
  {
    key: 'trust',
    title: 'Revocable Living Trust',
    description: 'Avoids probate and provides more control over asset distribution.',
    priority: 'important',
    vaultCategory: 'legal',
    guideUrl: '/resources/legal-planning#trust',
  },
  {
    key: 'beneficiary_forms',
    title: 'Beneficiary Designations',
    description: 'Updated beneficiary forms for retirement accounts, life insurance, and bank accounts.',
    priority: 'essential',
    vaultCategory: 'financial',
    guideUrl: '/resources/legal-planning#beneficiaries',
  },
]

export const LEGAL_GUIDES = [
  {
    slug: 'advance-directive',
    title: 'How to Create an Advance Directive',
    summary: 'Step-by-step guide to documenting your end-of-life medical wishes, including state-specific forms.',
  },
  {
    slug: 'power-of-attorney',
    title: 'Understanding Power of Attorney',
    summary: 'The difference between healthcare and financial POA, when each takes effect, and how to choose your agent.',
  },
  {
    slug: 'medicare-vs-medicaid',
    title: 'Medicare vs. Medicaid: What Seniors Need to Know',
    summary: 'Clear explanation of eligibility, coverage differences, and how to qualify for both programs.',
  },
  {
    slug: 'estate-basics',
    title: 'Estate Planning Basics for Seniors',
    summary: 'Wills, trusts, probate, and the steps to protect your estate for the people you love.',
  },
]
