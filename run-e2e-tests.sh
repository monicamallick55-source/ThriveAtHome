#!/usr/bin/env bash
# ThriveAtHome E2E Test Runner
# Run from project root on your local machine after: git pull origin main
# Requirements: npx, Node 18+, Playwright browsers installed (npx playwright install chromium)

set -e

BASE_URL="${BASE_URL:-https://thrive-at-home-pied.vercel.app}"
SUITE="${1:-all}"

echo "▶ Running against: $BASE_URL"
echo ""

run_suite() {
  local name="$1"
  local file="$2"
  echo "━━━ $name ━━━"
  BASE_URL="$BASE_URL" npx playwright test "$file" --project=chromium --reporter=list --workers=3 2>&1
  echo ""
}

case "$SUITE" in
  member)
    run_suite "Member Workflows (M-01..M-20)" tests/e2e/wf-member.spec.ts
    ;;
  family)
    run_suite "Family Workflows (F-01..F-09)" tests/e2e/wf-family.spec.ts
    ;;
  volunteer)
    run_suite "Volunteer Workflows (V-01..V-10)" tests/e2e/wf-volunteer.spec.ts
    ;;
  navigator)
    run_suite "Navigator Workflows (N-01..N-08)" tests/e2e/wf-navigator.spec.ts
    ;;
  campaigns)
    run_suite "Campaigns & Donations (C-01..C-05)" tests/e2e/wf-campaigns-donations.spec.ts
    ;;
  b2b)
    run_suite "B2B/Enterprise (B-01..B-14)" tests/e2e/wf-b2b-enterprise.spec.ts
    ;;
  portals)
    run_suite "Veteran/Student/Portals" tests/e2e/wf-veteran-student-portals.spec.ts
    ;;
  aria)
    run_suite "Aria/AI Check-in (AR-01..AR-06)" tests/e2e/wf-aria-checkin.spec.ts
    ;;
  all|*)
    run_suite "Member Workflows"      tests/e2e/wf-member.spec.ts
    run_suite "Family Workflows"      tests/e2e/wf-family.spec.ts
    run_suite "Volunteer Workflows"   tests/e2e/wf-volunteer.spec.ts
    run_suite "Navigator Workflows"   tests/e2e/wf-navigator.spec.ts
    run_suite "Campaigns/Donations"   tests/e2e/wf-campaigns-donations.spec.ts
    run_suite "B2B/Enterprise"        tests/e2e/wf-b2b-enterprise.spec.ts
    run_suite "Veteran/Student/Portals" tests/e2e/wf-veteran-student-portals.spec.ts
    run_suite "Aria/AI Check-in"      tests/e2e/wf-aria-checkin.spec.ts
    ;;
esac

echo "▶ Done. Full report: npx playwright show-report"
