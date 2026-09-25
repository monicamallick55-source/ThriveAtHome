import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { member_id, call_frequency, preferred_time } = body.args ?? body

    if (!member_id) {
      return NextResponse.json({ error: "member_id is required" }, { status: 400 })
    }

    let freq = "weekly"
    if (call_frequency) {
      const f = call_frequency.toLowerCase().trim()
      if (f.includes("daily") || f.includes("every day")) freq = "daily"
      else if (f.includes("few") || f.includes("twice") || f.includes("other day")) freq = "few_times_week"
      else if (f.includes("week")) freq = "weekly"
    }

    const { data: member, error: memberErr } = await admin
      .from("members")
      .select("id, preferred_name")
      .eq("id", member_id)
      .single()

    if (memberErr || !member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const { error: updateErr } = await admin
      .from("members")
      .update({ call_frequency_preference: freq, onboarding_call_completed: true })
      .eq("id", member_id)

    if (updateErr) {
      console.error("[update-call-preferences] error:", updateErr)
      return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
    }

    const freqPhrase = freq === "daily" ? "every day" : freq === "few_times_week" ? "a few times a week" : "once a week"

    return NextResponse.json({
      success: true,
      result: "Got it, I will call you " + freqPhrase + (preferred_time ? " in the " + preferred_time : "") + ". You are all set!",
    })
  } catch (error) {
    console.error("[update-call-preferences] error:", error)
    return NextResponse.json({ error: "Update call preferences tool failed" }, { status: 500 })
  }
}
