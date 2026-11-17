import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MOCK_DATA = [{ id: "task-mock-001", member_name: "Jane Doe", task_type: "wellness_check", status: "open", priority: "high", created_at: new Date().toISOString() }, { id: "task-mock-002", member_name: "John Smith", task_type: "service_request", status: "open", priority: "medium", created_at: new Date().toISOString() }]


const MOCK_TASKS = [
  { id: 'task-mock-001', member_name: 'Jane Doe', task_type: 'wellness_check', status: 'open', priority: 'high', created_at: new Date().toISOString() },
  { id: 'task-mock-002', member_name: 'John Smith', task_type: 'service_request', status: 'open', priority: 'medium', created_at: new Date().toISOString() },
]

export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  let query = supabase.from('navigator_tasks')
    .select('id, task_type, description, priority, due_by, member_id, completed, created_at')
    .order('created_at', { ascending: false }).limit(50)
  if (status === 'open' || status === 'pending') query = query.eq('completed', false)
  if (type) query = query.ilike('task_type', `%${type}%`)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (data && data.length > 0) return NextResponse.json(data)
  return NextResponse.json(MOCK_DATA)
}
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json().catch(() => ({}))
  const { data, error } = await supabase.from('navigator_tasks').insert({
    member_id: body.member_id,
    task_type: body.task_type || body.type || 'general',
    description: body.description || body.notes || null,
    priority: body.priority || 'medium',
    completed: false,
    created_at: new Date().toISOString()
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
