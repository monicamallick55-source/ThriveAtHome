#!/usr/bin/env bash
# =============================================================================
# ThriveAtHome — Full Test Suite Runner
# Usage: ./scripts/run-tests.sh [suite]
#
# Suites:
#   all         (default) — env check → DB → API → E2E
#   env         — TC-INF005 env var check only
#   db          — Supabase SQL assertions only
#   api         — FHIR + cron API tests only
#   e2e         — Playwright E2E suite only
#   e2e:quick   — Public routes + feature flags only (fast, no login)
#
# Required env vars:
#   BASE_URL                    (default: https://thrive-at-home-pied.vercel.app)
#   SUPABASE_SERVICE_ROLE_KEY   for DB assertions
#   NEXT_PUBLIC_SUPABASE_URL    for DB assertions
#   CRON_SECRET                 for cron tests
#   FHIR_API_KEY                for FHIR tests
#
# Example:
#   BASE_URL=https://thrive-at-home-pied.vercel.app \
#   CRON_SECRET=... FHIR_API_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
#   NEXT_PUBLIC_SUPABASE_URL=https://qdniskppkfqjmtpkftdt.supabase.co \
#   ./scripts/run-tests.sh
# =============================================================================

set -euo pipefail

SUITE=${1:-all}
BASE_URL=${BASE_URL:-"https://thrive-at-home-pied.vercel.app"}
PASS=0
FAIL=0

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║      ThriveAtHome Test Suite — $(date +%Y-%m-%d)         ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  BASE_URL: $BASE_URL"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

run_step() {
  local name="$1"; shift
  echo "▶ $name"
  if "$@"; then
    echo "  ✅ $name PASSED"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $name FAILED"
    FAIL=$((FAIL + 1))
  fi
  echo ""
}

# ─── ENV CHECK ─────────────────────────────────────────────────────────────
if [[ "$SUITE" == "env" || "$SUITE" == "all" ]]; then
  run_step "TC-INF005 Env Var Check" npx tsx scripts/check-env.ts
fi

# ─── DB ASSERTIONS ─────────────────────────────────────────────────────────
if [[ "$SUITE" == "db" || "$SUITE" == "all" ]]; then
  if [[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" && -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ]]; then
    run_step "Supabase DB Assertions" npx tsx tests/db/run-assertions.ts
  else
    echo "⚠️  Skipping DB assertions — SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL not set"
    echo ""
  fi
fi

# ─── API TESTS ─────────────────────────────────────────────────────────────
if [[ "$SUITE" == "api" || "$SUITE" == "all" ]]; then
  if [[ -n "${FHIR_API_KEY:-}" ]]; then
    run_step "TC-FH001-003 FHIR R4 Tests" \
      env BASE_URL="$BASE_URL" npx tsx tests/api/fhir.test.ts
  else
    echo "⚠️  Skipping FHIR tests — FHIR_API_KEY not set"
    echo ""
  fi

  if [[ -n "${CRON_SECRET:-}" ]]; then
    run_step "TC-V010/INF003/CH003 Cron Tests" \
      env BASE_URL="$BASE_URL" npx tsx tests/api/cron.test.ts
  else
    echo "⚠️  Skipping cron tests — CRON_SECRET not set"
    echo ""
  fi
fi

# ─── E2E PLAYWRIGHT ────────────────────────────────────────────────────────
if [[ "$SUITE" == "e2e" || "$SUITE" == "all" ]]; then
  run_step "Playwright E2E Suite (all specs)" \
    env BASE_URL="$BASE_URL" npx playwright test --reporter=list
fi

if [[ "$SUITE" == "e2e:quick" ]]; then
  run_step "Playwright E2E Quick (public routes + feature flags)" \
    env BASE_URL="$BASE_URL" npx playwright test \
      tests/e2e/public-routes.spec.ts \
      tests/e2e/feature-flags.spec.ts \
      --reporter=list
fi

# ─── SUMMARY ───────────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════╗"
echo "║  Test Run Complete"
echo "║  Passed: $PASS  Failed: $FAIL"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
