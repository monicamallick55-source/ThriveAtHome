/**
 * app/api/home-safety/route.ts — G6.1 Home Safety & Earthquake Preparedness
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: member } = await supabase.from('members').select('id, org_id').eq('supabase_auth_id', user.id).single()
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    const { data: profile } = await supabase.from('home_safety_profiles').select('*').eq('member_id', member.id).single()
    const { data: items } = await supabase.from('home_safety_checklist_items').select('*').eq('member_id', member.id).order('category')
    return NextResponse.json({ profile: profile ?? null, checklist: items ?? [] })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: member } = await supabase.from('members').select('id, org_id').eq('supabase_auth_id', user.id).single()
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    const body = await req.json()
    const { home_type, floors, has_elevator, earthquake_zone, emergency_contact_name, emergency_contact_phone } = body
    const { data: profile, error } = await supabase.from('home_safety_profiles').upsert({
      member_id: member.id, org_id: member.org_id,
      home_type: home_type ?? 'house', floors: floors ?? 1, has_elevator: has_elevator ?? false,
      earthquake_zone: earthquake_zone ?? null, emergency_contact_name: emergency_contact_name ?? null,
      emergency_contact_phone: emergency_contact_phone ?? null,
      enrolled_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { onConflict: 'member_id' }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    const { data: existing } = await supabase.from('home_safety_checklist_items').select('id').eq('member_id', member.id).limit(1)
    if (!existing || existing.length === 0) {
      const defaultItems = [
        { category: 'fall_prevention', title: 'Remove loose rugs and tripping hazards', priority: 'high' },
        { category: 'fall_prevention', title: 'Install grab bars in bathroom', priority: 'high' },
        { category: 'fall_prevention', title: 'Ensure good lighting in all rooms and hallways', priority: 'high' },
        { category: 'fall_prevention', title: 'Keep pathways clear of clutter', priority: 'medium' },
        { category: 'fall_prevention', title: 'Use non-slip mats in shower/tub', priority: 'high' },
        { category: 'emergency_prep', title: 'Create and share emergency contact list', priority: 'high' },
        { category: 'emergency_prep', title: 'Assemble 72-hour emergency supply kit', priority: 'high' },
        { category: 'emergency_prep', title: 'Keep 1-week supply of medications', priority: 'high' },
        { category: 'emergency_prep', title: 'Store 1 gallon of water per person per day (3-day supply)', priority: 'medium' },
        { category: 'emergency_prep', title: 'Know how to turn off gas, water, and electricity', priority: 'medium' },
        { category: 'earthquake', title: 'Secure tall furniture and bookshelves to walls', priority: 'high' },
        { category: 'earthquake', title: 'Store heavy items on lower shelves', priority: 'medium' },
        { category: 'earthquake', title: 'Know "Drop, Cover, Hold On" procedure', priority: 'high' },
        { category: 'earthquake', title: 'Identify safe spots in each room (under sturdy table, against interior wall)', priority: 'medium' },
        { category: 'earthquake', title: 'Have shoes and flashlight by bed', priority: 'medium' },
        { category: 'fire_safety', title: 'Test smoke detectors monthly', priority: 'high' },
        { category: 'fire_safety', title: 'Install carbon monoxide detector', priority: 'high' },
        { category: 'fire_safety', title: 'Create and practice home fire escape plan', priority: 'high' },
        { category: 'fire_safety', title: 'Keep fire extinguisher accessible and charged', priority: 'medium' },
        { category: 'medical', title: 'Keep updated medication list accessible', priority: 'high' },
        { category: 'medical', title: 'Wear or keep medical alert device accessible', priority: 'medium' },
        { category: 'medical', title: 'Share health conditions with emergency contacts', priority: 'high' },
      ]
      await supabase.from('home_safety_checklist_items').insert(defaultItems.map(item => ({ member_id: member.id, org_id: member.org_id, ...item, completed: false, created_at: new Date().toISOString() })))
    }
    return NextResponse.json({ profile, enrolled: true }, { status: 201 })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: member } = await supabase.from('members').select('id').eq('supabase_auth_id', user.id).single()
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    const body = await req.json()
    const { item_id, completed } = body
    if (item_id !== undefined) {
      const { data, error } = await supabase.from('home_safety_checklist_items').update({ completed, completed_at: completed ? new Date().toISOString() : null }).eq('id', item_id).eq('member_id', member.id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ item: data })
    }
    return NextResponse.json({ error: 'item_id is required' }, { status: 400 })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
