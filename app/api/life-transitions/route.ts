/**
 * app/api/life-transitions/route.ts — Life Transitions API
 * TC-LT004
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const PATHWAYS = [
  { id: 'retirement', name: 'Retirement', icon: '🏖️' },
  { id: 'widow', name: 'Widowhood / Loss of Spouse', icon: '🕊️' },
  { id: 'diagnosis', name: 'Health Diagnosis', icon: '🏥' },
  { id: 'moving', name: 'Moving / Downsizing', icon: '📦' },
  { id: 'caregiving', name: 'Becoming a Caregiver', icon: '🤝' },
  { id: 'divorce', name: 'Divorce / Separation', icon: '💔' },
  { id: 'loss', name: 'Loss of Independence', icon: '🏠' },
  { id: 'financial', name: 'Financial Change', icon: '💼' },
  { id: 'independence', name: 'Maintaining Independence', icon: '🌟' },
]

export async function GET(_req: NextRequest) {
  return NextResponse.json({ pathways: PATHWAYS })
}
