import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export interface Companion {
  id: string
  full_name: string
  bio: string | null
  hourly_rate: number
  service_types: string[]
  languages: string[]
  city: string | null
  state: string | null
  rating_average: number | null
  total_sessions: number
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('companions')
    .select('id, full_name, bio, hourly_rate, service_types, languages, city, state, rating_average, total_sessions')
    .eq('is_active', true)
    .order('rating_average', { ascending: false, nullsFirst: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ companions: data ?? [] })
}
