// Login page — Phase 5. Delegates to LoginForm client component.
import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = { title: 'Sign In — ThriveAtHome' }

export default function LoginPage() {
  return <LoginForm />
}
