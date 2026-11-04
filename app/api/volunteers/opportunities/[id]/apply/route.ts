/**
 * app/api/volunteers/opportunities/[id]/apply/route.ts — G4
 * POST /api/volunteers/opportunities/[id]/apply
 * Enforces training gate before accepting volunteer application.
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkTrainingGate, VolunteerRole } from '@/lib/volunteers/trainingGate'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: opportunityId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get volunteer record
    const { data: volunteer } = await supabase
      .from('volunteers')
      .select('id, volunteer_type')
      .eq('supabase_auth_id', user.id)
      .single()

    if (!volunteer) return NextResponse.json({ error: 'Volunteer profile not found' }, { status: 404 })

    // Map volunteer_type to training role
    const roleMap: Record<string, VolunteerRole> = {
      buddy: 'buddy',
      companion: 'companion',
      driver: 'driver',
    }
    const role: VolunteerRole = roleMap[volunteer.volunteer_type] ?? 'general'

    // Enforce training gate
    const training = await checkTrainingGate(supabase, volunteer.id, role)
    if (!training.cleared) {
      return NextResponse.json({
        error: 'Training required before applying',
        missing_modules: training.missing,
        training_url: '/dashboard/training',
      }, { status: 403 })
    }

    // Get opportunity
    const { data: opportunity } = await supabase
      .from('volunteer_opportunities')
      .select('id, title, status')
      .eq('id', opportunityId)
      .single()

    if (!opportunity) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    if (opportunity.status !== 'open') {
      return NextResponse.json({ error: 'Opportunity is no longer open' }, { status: 409 })
    }

    // Create application
    const { data: application, error } = await supabase
      .from('volunteer_applications')
      .insert({
        volunteer_id: volunteer.id,
        opportunity_id: opportunityId,
        status: 'pending',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ application }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
