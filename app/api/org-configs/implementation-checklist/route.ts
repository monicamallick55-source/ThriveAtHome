import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET() {
  return NextResponse.json([
    { id: 'step-1', title: 'Set up org profile', status: 'pending', order: 1 },
    { id: 'step-2', title: 'Configure member access', status: 'pending', order: 2 },
    { id: 'step-3', title: 'Invite team members', status: 'pending', order: 3 },
  ])
}
