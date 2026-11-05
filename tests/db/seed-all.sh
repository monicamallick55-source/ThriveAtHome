#!/usr/bin/env bash
set -e
DB="${DB_URL:-$DATABASE_URL}"
if [ -z "$DB" ]; then
  echo "ERROR: Set DB_URL or DATABASE_URL to your Supabase connection string"
  echo "  Supabase Dashboard → Settings → Database → Connection string (URI)"
  exit 1
fi
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "▶ Seeding accounts (28 test users)..."
psql "$DB" -f "$SCRIPT_DIR/seed-accounts.sql"
echo "▶ Seeding communities (20 circles)..."
psql "$DB" -f "$SCRIPT_DIR/seed-communities.sql"
echo "✅ All seeds complete. Run: npm run test:e2e:auth && npm run test:e2e:member"
