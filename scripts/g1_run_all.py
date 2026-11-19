#!/usr/bin/env python3
"""
G1 MASTER RUNNER — runs all phases in order.
Run from: /workspaces/ThriveAtHome
  python3 /path/to/g1_run_all.py

What this writes:
  supabase/migrations/085_call_pipeline.sql   ← APPLY IN SUPABASE SQL EDITOR
  lib/voice/agents.ts                          (12-agent registry)
  lib/voice/verifyRetell.ts                    (signature verification)
  lib/voice/processCallEnded.ts                (core call processing)
  lib/voice/tools/updateCallPreferences.ts     (missing tool)
  app/api/webhooks/retell/route.ts             (rewritten webhook)
  app/api/cron/aria-calls/route.ts             (opt-in gate + Day-21)
  app/api/cron/tracked-item-reminders/route.ts (Grace calls)
  CELEBRATIONS_JOY_PATCH.md                    (manual patch guide for Joy)
"""
import os, subprocess, sys

REPO = "/workspaces/ThriveAtHome"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

scripts = [
    os.path.join(SCRIPT_DIR, "g1_phase1_migration.py"),
    os.path.join(SCRIPT_DIR, "g1_phase2_agents.py"),
    os.path.join(SCRIPT_DIR, "g1_phase5_6_cron.py"),
]

print("=" * 60)
print("G1 Voice Pipeline Fix — Running all phases")
print("=" * 60)

for script in scripts:
    name = os.path.basename(script)
    print(f"\n▶ {name}")
    result = subprocess.run([sys.executable, "-I", script], capture_output=False)
    if result.returncode != 0:
        print(f"  ✗ FAILED with exit code {result.returncode}")
        sys.exit(1)

print()
print("=" * 60)
print("✅ All files written.")
print("=" * 60)
print()
print("REQUIRED NEXT STEPS (in order):")
print()
print("STEP 1 — Apply DB migration:")
print("  Open: https://supabase.com/dashboard/project/qdniskppkfqjmtpkftdt/sql/new")
print("  Paste: supabase/migrations/085_call_pipeline.sql")
print("  Run it. Verify: check_in_calls has columns agent_id, agent_name, direction, processed_at")
print()
print("STEP 2 — Add Retell env vars in Vercel:")
print("  https://vercel.com/dashboard → ThriveAtHome → Settings → Environment Variables")
print("  Add (get values from https://app.retellai.com):")
print("    RETELL_ROSA_AGENT_ID")
print("    RETELL_JOY_AGENT_ID")
print("    RETELL_GRACE_AGENT_ID")
print("    RETELL_HOPE_AGENT_ID")
print("    RETELL_CLAIRE_AGENT_ID")
print("    RETELL_SAM_AGENT_ID")
print("    RETELL_MORGAN_AGENT_ID")
print("    RETELL_NOVA_AGENT_ID")
print("    RETELL_ALEX_AGENT_ID")
print("    RETELL_QUINN_AGENT_ID")
print("    RETELL_JORDAN_AGENT_ID")
print("    RETELL_WEBHOOK_SECRET  (from Retell webhook settings)")
print()
print("STEP 3 — Manual patch for celebrations cron (Joy birthday calls):")
print("  Open: app/api/cron/celebrations/route.ts")
print("  Follow: CELEBRATIONS_JOY_PATCH.md")
print()
print("STEP 4 — Type check:")
print("  cd /workspaces/ThriveAtHome && npx tsc --noEmit")
print()
print("STEP 5 — Commit and deploy:")
print("  git add lib/voice/ app/api/webhooks/retell/ app/api/cron/")
print("  git add supabase/migrations/085_call_pipeline.sql")
print("  git commit -m 'G1: fix voice pipeline — agent registry, webhook security, processCallEnded, opt-in gate'")
print("  git push origin main")
print()
print("STEP 6 — Verify in production:")
print("  curl -X POST https://thrive-at-home-pied.vercel.app/api/webhooks/retell")
print("  → should return 401 (no signature)")
print()
print("  curl https://thrive-at-home-pied.vercel.app/api/webhooks/retell")
print("  → should return {ok: true, service: 'retell-webhook'}")
