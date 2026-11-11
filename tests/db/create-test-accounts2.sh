#!/bin/bash
SUPABASE_URL="https://qdniskppkfqjmtpkftdt.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc5NjY1NywiZXhwIjoyMDk0MzcyNjU3fQ.93wRuLXqy7B-o3SXLivpm-u88scRmz7OpEoJtsnVT6c"

find_user_id() {
  local EMAIL="$1"
  # Page through users to find by email
  curl -s "${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1000" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "apikey: ${SERVICE_KEY}" | jq -r --arg email "$EMAIL" '.users[] | select(.email == $email) | .id // empty'
}

create_or_update() {
  local EMAIL="$1"
  local ROLE="$2"
  local ID=$(find_user_id "$EMAIL")

  if [ -n "$ID" ]; then
    RESULT=$(curl -s -X PUT "${SUPABASE_URL}/auth/v1/admin/users/${ID}" \
      -H "Authorization: Bearer ${SERVICE_KEY}" \
      -H "apikey: ${SERVICE_KEY}" \
      -H "Content-Type: application/json" \
      -d "{\"app_metadata\": {\"role\": \"${ROLE}\"}}")
    echo "UPDATED: $EMAIL (id: $ID) → $(echo $RESULT | jq -r '.app_metadata.role')"
  else
    RESULT=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
      -H "Authorization: Bearer ${SERVICE_KEY}" \
      -H "apikey: ${SERVICE_KEY}" \
      -H "Content-Type: application/json" \
      -d "{\"email\": \"${EMAIL}\", \"password\": \"TestPass123!\", \"email_confirm\": true, \"app_metadata\": {\"role\": \"${ROLE}\"}}")
    echo "CREATED: $EMAIL → $(echo $RESULT | jq -r '.app_metadata.role // .msg // .error')"
  fi
}

create_or_update "employer@test.com"      "employer"
create_or_update "orgadmin@test.com"      "org_admin"
create_or_update "network@test.com"       "network_admin"
create_or_update "seniorcenter@test.com"  "senior_center_admin"
create_or_update "aaa@test.com"           "aaa_admin"
create_or_update "vsoadmin@test.com"      "vso_admin"
