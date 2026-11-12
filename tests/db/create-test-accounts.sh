#!/bin/bash
SUPABASE_URL="https://qdniskppkfqjmtpkftdt.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc5NjY1NywiZXhwIjoyMDk0MzcyNjU3fQ.93wRuLXqy7B-o3SXLivpm-u88scRmz7OpEoJtsnVT6c"

create_or_update() {
  local EMAIL="$1"
  local ROLE="$2"
  # Try to find existing user first
  EXISTING=$(curl -s "${SUPABASE_URL}/auth/v1/admin/users?email=${EMAIL}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "apikey: ${SERVICE_KEY}" | jq -r '.users[0].id // empty')

  if [ -n "$EXISTING" ]; then
    # Update existing user's role
    RESULT=$(curl -s -X PUT "${SUPABASE_URL}/auth/v1/admin/users/${EXISTING}" \
      -H "Authorization: Bearer ${SERVICE_KEY}" \
      -H "apikey: ${SERVICE_KEY}" \
      -H "Content-Type: application/json" \
      -d "{\"app_metadata\": {\"role\": \"${ROLE}\"}}")
    echo "UPDATED: $EMAIL → $(echo $RESULT | jq -r '.app_metadata.role') (id: $EXISTING)"
  else
    # Create new user
    RESULT=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
      -H "Authorization: Bearer ${SERVICE_KEY}" \
      -H "apikey: ${SERVICE_KEY}" \
      -H "Content-Type: application/json" \
      -d "{\"email\": \"${EMAIL}\", \"password\": \"TestPass123!\", \"email_confirm\": true, \"app_metadata\": {\"role\": \"${ROLE}\"}}")
    echo "CREATED: $EMAIL → $(echo $RESULT | jq -r '.app_metadata.role // .error // .msg')"
  fi
}

create_or_update "employer@test.com"      "employer"
create_or_update "orgadmin@test.com"      "org_admin"
create_or_update "network@test.com"       "network_admin"
create_or_update "seniorcenter@test.com"  "senior_center_admin"
create_or_update "aaa@test.com"           "aaa_admin"
create_or_update "vsoadmin@test.com"      "vso_admin"
