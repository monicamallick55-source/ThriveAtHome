// Phone number helpers for matching inbound callers to stored records.
// Stored numbers are free text (e.g. "(415) 555-0100", "415-555-0100", "+14155550100"),
// so lookups compare against every common US format of the same number.

/** Normalise to E.164. US 10-digit numbers get +1. Returns null when there are too few digits. */
export function toE164(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (digits.length >= 8 && digits.length <= 15) return `+${digits}`
  return null
}

/** All stored-format variants of a number, for an `.in('phone', variants)` lookup. */
export function phoneVariants(raw: string | null | undefined): string[] {
  const e164 = toE164(raw)
  if (!e164) return []
  const variants = new Set<string>([e164, e164.slice(1)])
  if (e164.startsWith('+1') && e164.length === 12) {
    const d = e164.slice(2)
    const [a, b, c] = [d.slice(0, 3), d.slice(3, 6), d.slice(6)]
    for (const v of [
      d, `1${d}`,
      `(${a}) ${b}-${c}`, `(${a})${b}-${c}`, `${a}-${b}-${c}`, `${a}.${b}.${c}`, `${a} ${b} ${c}`,
      `+1 (${a}) ${b}-${c}`, `+1 ${a}-${b}-${c}`, `+1 ${a} ${b} ${c}`, `1-${a}-${b}-${c}`,
    ]) variants.add(v)
  }
  return [...variants]
}
