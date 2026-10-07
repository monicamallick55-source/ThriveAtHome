// Essential-document categories for the Document Vault. Phase 101 (M24).
// Client-safe. Used by the upload form, the grouped list, and the "essential
// documents" checklist that nudges families to store the important things.

export interface DocCategory {
  value: string
  label: string
  emoji: string
  /** Shown in the "essential documents" checklist. */
  essential: boolean
  hint: string
  /** Expiry tends to matter for these. */
  tracksExpiry: boolean
}

export const DOC_CATEGORIES: DocCategory[] = [
  { value: 'advance_directive', label: 'Advance directive / living will', emoji: '🕊️', essential: true, tracksExpiry: false,
    hint: 'Your wishes for medical care if you cannot speak for yourself.' },
  { value: 'healthcare_proxy', label: 'Healthcare proxy / medical POA', emoji: '🩺', essential: true, tracksExpiry: false,
    hint: 'Names the person who can make health decisions for you.' },
  { value: 'financial_poa', label: 'Financial power of attorney', emoji: '📝', essential: true, tracksExpiry: false,
    hint: 'Names the person who can handle money and property matters.' },
  { value: 'will_trust', label: 'Will or living trust', emoji: '📜', essential: true, tracksExpiry: false,
    hint: 'How your estate should be handled.' },
  { value: 'insurance_card', label: 'Insurance card', emoji: '💳', essential: true, tracksExpiry: true,
    hint: 'Medicare, Medicaid, or private health insurance cards.' },
  { value: 'id_document', label: 'ID document', emoji: '🪪', essential: true, tracksExpiry: true,
    hint: "Driver's license, state ID, or passport." },
  { value: 'medication_list', label: 'Medication list', emoji: '💊', essential: true, tracksExpiry: false,
    hint: 'Current medications, doses, and prescribing doctors.' },
  { value: 'estate_document', label: 'Other estate / legal document', emoji: '⚖️', essential: false, tracksExpiry: false,
    hint: 'Deeds, titles, beneficiary forms.' },
  { value: 'financial_statement', label: 'Financial statement', emoji: '🏦', essential: false, tracksExpiry: false,
    hint: 'Bank, retirement, or investment account summaries.' },
  { value: 'tax_document', label: 'Tax document', emoji: '🧾', essential: false, tracksExpiry: false,
    hint: 'Prior-year returns, W-2s, 1099s.' },
  { value: 'benefits_letter', label: 'Benefits award letter', emoji: '✉️', essential: false, tracksExpiry: true,
    hint: 'Social Security, VA, or other benefit determination letters.' },
  { value: 'other', label: 'Other', emoji: '📎', essential: false, tracksExpiry: false, hint: '' },
]

export function docCategory(value: string | null | undefined): DocCategory {
  return DOC_CATEGORIES.find((c: any) => c.value === value) ?? DOC_CATEGORIES[DOC_CATEGORIES.length - 1]
}

export const ESSENTIAL_DOC_CATEGORIES = DOC_CATEGORIES.filter((c: any) => c.essential)

/** Days-until-expiry buckets for the vault warnings. */
export function expiryStatus(expiresOn: string | null): 'none' | 'expired' | 'soon' | 'ok' {
  if (!expiresOn) return 'none'
  const days = Math.floor((new Date(expiresOn + 'T00:00:00Z').getTime() - Date.now()) / 86_400_000)
  if (days < 0) return 'expired'
  if (days <= 60) return 'soon'
  return 'ok'
}
