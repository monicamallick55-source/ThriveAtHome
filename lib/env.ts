// Utility to safely access environment variables with clear error messages.

/** Throws a clear error if an environment variable is missing or empty. */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    throw new Error(
      `\n\n❌ Missing environment variable: ${name}\n` +
      `   Add it to .env.local\n` +
      `   See .env.local.example for where to find it\n`
    )
  }
  return value
}

/** Like requireEnv but also enforces server-only access (throws if called in browser). */
export function requireServerEnv(name: string): string {
  if (typeof window !== 'undefined') {
    throw new Error(
      `[Security] "${name}" is server-only but was accessed in the browser. ` +
      `Move this call to a Server Component, API Route, or Edge Function.`
    )
  }
  return requireEnv(name)
}

/**
 * Returns an env var's value, or null when it is missing, empty, or a placeholder
 * such as "[SENSITIVE]" (anything starting with "["). Use for every provider key so a
 * placeholder is never treated as a real credential.
 */
export function envKey(name: string): string | null {
  const value = process.env[name]?.trim()
  if (!value || value.startsWith('[')) return null
  return value
}
