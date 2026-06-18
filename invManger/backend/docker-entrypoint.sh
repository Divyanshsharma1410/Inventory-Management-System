#!/bin/sh
set -e

echo "⏳ Waiting for the database to be ready..."
# Retry prisma db push until Postgres accepts connections.
ATTEMPTS=0
until npx prisma db push --skip-generate >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge 30 ]; then
    echo "❌ Database not reachable after 30 attempts. Giving up."
    npx prisma db push --skip-generate
    exit 1
  fi
  echo "   ...database not ready yet (attempt $ATTEMPTS), retrying in 2s"
  sleep 2
done

echo "✅ Schema synced. Seeding..."
node prisma/seed.js || echo "⚠️  Seed step reported an issue (continuing)."

echo "🚀 Starting server..."
exec "$@"
