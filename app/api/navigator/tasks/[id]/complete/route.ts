import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

mkdir -p "app/api/navigator/tasks/[id]/complete"
cat > "app/api/navigator/tasks/[id]/complete/route.ts" << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['navigator', 'admin', 'super_admin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('navigator_tasks')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('navigator_id', user.id)

  return NextResponse.json({ ok: !error, task_id: params.id, status: 'completed' })
}
