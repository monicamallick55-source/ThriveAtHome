'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_HOME, ROLE_LABEL } from '@/lib/roles'
import type { UserRole } from '@/lib/auth'

export default function SelectRolePage() {
  const router = useRouter()
  const [roles, setRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/resolve-landing')
      .then(r => r.json())
      .then(data => {
        if (data.multi && Array.isArray(data.roles)) setRoles(data.roles)
        else if (data.path) router.replace(data.path)
      })
      .finally(() => setLoading(false))
  }, [router])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading…</p>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-sm text-center">
        <h1 className="text-xl font-semibold text-[#1B3A6B] mb-2">Choose your view</h1>
        <p className="text-gray-500 text-sm mb-6">You have access to multiple areas. Where would you like to go?</p>
        <div className="flex flex-col gap-3">
          {roles.map(role => (
            <button
              key={role}
              onClick={() => router.push(ROLE_HOME[role] ?? '/dashboard')}
              className="w-full py-3 px-4 rounded-lg border border-[#1B3A6B] text-[#1B3A6B] font-medium hover:bg-[#1B3A6B] hover:text-white transition-colors"
            >
              {ROLE_LABEL[role] ?? role}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
