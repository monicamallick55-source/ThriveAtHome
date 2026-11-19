// Signup page — Phase 5. Delegates to SignupForm client component.
import type { Metadata } from 'next'
import { SignupForm } from '@/components/auth/SignupForm'

export const metadata: Metadata = { title: 'Create Account — ThriveAtHome' }

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const params = await searchParams
  return <SignupForm referralCode={params.ref} />
}
