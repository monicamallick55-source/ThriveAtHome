#!/usr/bin/env bash
# Starts `next dev` for test scripts with every real provider forced to its stub.
# Next.js never overrides env vars that are already set, so exporting them empty here
# wins over .env.local (which may hold real production keys). RETELL_API_KEY gets a
# throwaway test key so signature checks can be exercised; agent ids are fake.
# Usage: bash scripts/dev-stub-server.sh [port]   (default 3055)
set -euo pipefail
PORT="${1:-3055}"

for v in RETELL_WEBHOOK_SECRET ANTHROPIC_API_KEY TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN TWILIO_PHONE_NUMBER TWILIO_INBOUND_NUMBER \
         SENDGRID_API_KEY STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET SEARCHAPI_API_KEY APIFY_API_TOKEN \
         GOOGLE_SEARCH_API_KEY ALEXA_SKILL_ID ARTIFACT_UPRISING_API_KEY CERNER_CLIENT_ID EPIC_CLIENT_ID \
         FHIR_BASE_URL FITBIT_CLIENT_ID GARMIN_CONSUMER_KEY GOOGLE_ACTIONS_PROJECT_ID INSTACART_API_KEY \
         LYFT_HEALTHCARE_API_KEY ML_INFERENCE_URL; do
  export "$v="
done

export RETELL_API_KEY=test_retell_key_g13
export RETELL_AGENT_ID=agent_test_aria
for a in ROSA JOY GRACE HOPE CLAIRE SAM MORGAN NOVA ALEX QUINN JORDAN; do
  export "RETELL_${a}_AGENT_ID=agent_test_$(echo "$a" | tr '[:upper:]' '[:lower:]')"
done

exec npx next dev -p "$PORT"
