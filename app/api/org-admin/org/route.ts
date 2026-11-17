import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  return NextResponse.json({
    id: 'org-001',
    name: 'Community Village Network',
    plan_name: 'Village Partner',
    total_members: 48,
    active_members: 41,
    pending_invitations: 3,
  })
}
