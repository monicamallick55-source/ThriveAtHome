#!/bin/bash
# Sets app_metadata.role for all B2B test accounts in Supabase
SUPABASE_URL="https://qdniskppkfqjmtpkftdt.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc5NjY1NywiZXhwIjoyMDk0MzcyNjU3fQ.93wRuLXqy7B-o3SXLivpm-u88scRmz7OpEoJtsnVT6c"

set_role() {
  local EMAIL="$1"
  local ROLE="$2"
  # Find user by email
  USER_ID=$(curl -s "${SUPABASE_URL}/auth/v1/admin/users?email=${EMAIL}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "apikey: ${SERVICE_KEY}" | jq -r '.users[0].id // empty')
  if [ -z "$USER_ID" ]; then
    echo "SKIP: $EMAIL not found"
    return
  fi
  # Set role in app_metadata
  curl -s -X PUT "${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"app_metadata\": {\"role\": \"${ROLE}\"}}" | jq -r '"SET " + .email + " → " + .app_metadata.role'
}

set_role "employer@test.com"      "employer"
set_role "orgadmin@test.com"      "org_admin"
set_role "network@test.com"       "network_admin"
set_role "seniorcenter@test.com"  "senior_center_admin"
set_role "aaa@test.com"           "aaa_admin"
set_role "vsoadmin@test.com"      "vso_admin"
