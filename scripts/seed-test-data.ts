import { createClient } from "@supabase/supabase-js"
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function ins(table: string, row: Record<string, unknown>) {
  const { error } = await sb.from(table).insert(row)
  if (error) { console.log(`  ⚠ ${table}: ${error.message}`); return null }
  console.log(`  ✅ ${table}`); return true
}

async function main() {
  console.log("🌱 Seeding test data v5\n")
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0,10)
  const in5days  = new Date(Date.now() + 5*86400000).toISOString().slice(0,10)

  const memberId   = "42ffcc14-0878-42fe-a14e-b060f50439aa"  // Jane smith
  const volunteerId = "2a0e008c-730d-4c64-b5d8-448c516c69ab" // Testing V1 (volunteers table)
  const partnerId   = "975262b9-d051-4819-a85c-c6b524ab29b8" // Test Partner (service_partners)

  // Update Jane's birthday for arc tests
  await sb.from("members").update({ date_of_birth: in5days, aria_call_opted_in: true, celebration_opt_out: false }).eq("id", memberId)
  console.log(`  ✅ members: birthday → ${in5days}`)

  // tracked_items
  await ins("tracked_items", { member_id: memberId, item_type: "appointment", category: "medical",
    item_name: "Doctor appt (TC-M011-b)", expiration_or_appointment_date: tomorrow,
    status: "pending", call_reminder: true })

  // navigator_tasks (3)
  for (const t of [
    { task_type: "assign_volunteer",       description: "Assign volunteer (TC-N002-a)", priority: "medium" },
    { task_type: "cancel_booking",         description: "Cancel booking (TC-N002-b)",   priority: "low"    },
    { task_type: "assign_grief_counselor", description: "Grief counselor (TC-N005-a)", priority: "high"   },
  ]) await ins("navigator_tasks", { member_id: memberId, ...t, due_by: tomorrow, completed: false })

  // buddy_assignments — volunteer_id refs volunteers table
  await ins("buddy_assignments", { member_id: memberId, volunteer_id: volunteerId,
    assigned_at: new Date().toISOString(), status: "pending", call_frequency: "weekly", match_score: 85 })

  // service_bookings — partner_id NOT NULL; status must be "confirmed" or "requested"
  await ins("service_bookings", { member_id: memberId, partner_id: partnerId,
    service_type: "transportation", status: "confirmed", scheduled_at: `${tomorrow}T10:00:00Z` })

  // ride_bookings — requested_by is nullable; status must be "requested"
  await ins("ride_bookings", { member_id: memberId,
    pickup_address: "123 Seed St", dropoff_address: "Medical Center",
    pickup_time: `${tomorrow}T09:00:00Z`, status: "requested" })

  // grief_support_requests
  await ins("grief_support_requests", { member_id: memberId, loss_type: "spouse",
    circle_type_requested: "peer_support", availability_preference: "weekday_morning", status: "pending" })

  // crisis_events
  await ins("crisis_events", { member_id: memberId, source: "voice_call", status: "open", escalation_step: 1 })

  // training_modules (check-before-insert)
  const { data: existMod } = await sb.from("training_modules").select("title")
  const have = new Set((existMod??[]).map((r:any) => r.title))
  for (const [i, title] of ["Volunteer Orientation","Elder Care Basics","Crisis Protocol"].entries()) {
    if (have.has(title)) { console.log(`  ✅ training_modules (${title} exists)`); continue }
    await ins("training_modules", { title, role_scope: "volunteer", content_md: `# ${title}\nSeed.`, required: true, sort_order: i+1 })
  }

  // billing_invoices (check-before-insert)
  const { data: existInv } = await sb.from("billing_invoices").select("id").eq("stripe_invoice_id","in_seed_001").maybeSingle()
  if (!existInv) await ins("billing_invoices", { stripe_invoice_id: "in_seed_001", amount: 149, status: "paid", pdf_url: "https://example.com/inv.pdf" })
  else console.log("  ✅ billing_invoices (exists)")

  console.log(`\n🎉 Done | member: ${memberId} | birthday: ${in5days} | due: ${tomorrow}`)
}
main().catch(e => { console.error(e); process.exit(1) })
