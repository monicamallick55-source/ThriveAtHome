import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const { provider_id, service_id, date, time } = body as { provider_id?: string; service_id?: string; date?: string; time?: string }
    if (!provider_id || !service_id) {
      return NextResponse.json({ error: 'provider_id and service_id are required' }, { status: 400 })
    }
    return NextResponse.json({ id: 'booking_'+Date.now(), provider_id, service_id, date, time, status: 'confirmed', created_at: new Date().toISOString() }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
