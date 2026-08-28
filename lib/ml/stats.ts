// Small statistics helpers shared across the M23 ML modules.

/** Arithmetic mean of a non-empty numeric array. Returns null for empty input. */
export function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((s, v) => s + v, 0) / values.length
}

/** Population standard deviation. Returns null for fewer than 2 values. */
export function stddev(values: number[]): number | null {
  if (values.length < 2) return null
  const m = mean(values)!
  const variance = values.reduce((s, v) => s + (v - m) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

/** Round to n decimal places (returns null passthrough). */
export function round(n: number | null, places = 2): number | null {
  if (n === null || !isFinite(n)) return null
  const f = 10 ** places
  return Math.round(n * f) / f
}

/** Clamp to [0, 1]. */
export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}
