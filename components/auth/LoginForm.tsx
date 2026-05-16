'use client'
// Login form — signs in via Supabase password auth and redirects by role.
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError('Incorrect email or password. Please try again.')
        return
      }

      // Look up role to redirect to the correct home page
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Sign-in succeeded but session could not be read. Please refresh.')
        return
      }

      const { data: fm } = await supabase
        .from('family_members')
        .select('role')
        .eq('supabase_auth_id', user.id)
        .maybeSingle()

      const role = fm?.role ?? 'family'

      if (role === 'navigator') {
        router.push('/navigator')
      } else if (role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }

      router.refresh()
    } catch (err) {
      console.error('[LoginForm] Unexpected error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="p-8 max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-semibold mb-2" style={{ color: '#1B3A6B' }}>
          Welcome back
        </h1>
        <p className="text-gray-500 mb-6 text-base">
          Sign in to your ThriveAtHome account.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              placeholder="jane@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              placeholder="Your password"
            />
          </div>

          {error && (
            <p role="alert" className="text-red-600 text-sm bg-red-50 rounded-lg p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold rounded-lg px-4 py-4 text-base transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#1B3A6B', minHeight: '52px' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-sm text-gray-500 text-center">
          New to ThriveAtHome?{' '}
          <Link href="/signup" className="font-medium" style={{ color: '#0D7C8F' }}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
