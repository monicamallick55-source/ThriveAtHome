import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
const VALID_TYPES = ["welcome","invitation","weekly_check_in","care_alert","gift_received","celebration"]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
  try {
    const { templateId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: self } = await supabase.from("org_admins").select("org_id, role").eq("user_id", user.id).single()
    if (self.role === "viewer") return NextResponse.json({ error: "Viewers cannot edit templates" }, { status: 403 })
    const body = await req.json()
    const { subject, body_html, from_name, reply_to } = body
    const isTypeKey = VALID_TYPES.includes(templateId)
    if (isTypeKey) {
      const { data, error } = await supabase.from("org_email_templates").upsert({ org_id: self.org_id, type: templateId, subject, body_html, from_name: from_name ?? null, reply_to: reply_to ?? null, updated_at: new Date().toISOString(), updated_by: user.id }, { onConflict: "org_id,type" }).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ template: data })
    }
    const { data, error } = await supabase.from("org_email_templates").update({ subject, body_html, from_name: from_name ?? null, reply_to: reply_to ?? null, updated_at: new Date().toISOString(), updated_by: user.id }).eq("id", templateId).eq("org_id", self.org_id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ template: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
