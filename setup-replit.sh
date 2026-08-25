#!/usr/bin/env bash
# ============================================================================
# Setup script — run this once inside the Replit shell after importing the
# project (or any time after pulling new schema/route changes).
#
# Usage (in the Replit Shell tab):
#   bash setup-replit.sh
#
# What it does, in order:
#   1. Installs dependencies with pnpm
#   2. Checks required environment variables are set
#   3. Pushes the database schema changes
#   4. Does NOT seed any Community/Group data (community was removed)
#   5. Runs the full type-check + build across the whole workspace
#
# If any step fails, fix the reported error and re-run this script — every
# step here is safe to run more than once.
# ============================================================================
set -euo pipefail

echo "── 1/5 — Installing dependencies ─────────────────────────────────────"
pnpm install

echo ""
echo "── 2/5 — Checking environment variables ──────────────────────────────"
missing=()
[ -z "${DATABASE_URL:-}" ] && missing+=("DATABASE_URL")
[ -z "${GROQ_API_KEY:-}" ] && missing+=("GROQ_API_KEY (chat/text tools won't work without it)")
[ -z "${TOGETHER_API_KEY:-}" ] && missing+=("TOGETHER_API_KEY (image generation won't work without it)")
[ -z "${ANTHROPIC_API_KEY:-}" ] && missing+=("ANTHROPIC_API_KEY (website/app generation won't work without it)")
[ -z "${REPLICATE_API_TOKEN:-}" ] && missing+=("REPLICATE_API_TOKEN (video generation won't work without it)")

if [ ${#missing[@]} -gt 0 ]; then
  echo "⚠️  Missing (set these in Replit's Secrets tab, not in a committed .env):"
  for m in "${missing[@]}"; do echo "   - $m"; done
  if [ -z "${DATABASE_URL:-}" ]; then
    echo ""
    echo "DATABASE_URL is required to continue — add a Postgres database in Replit"
    echo "(the Database tab provisions one and sets this automatically), then re-run."
    exit 1
  fi
  echo ""
  echo "Continuing without the missing AI keys — those features will return a"
  echo "clear error until their key is added, everything else will still work."
fi

echo ""
echo "── 3/5 — Pushing schema changes to the database ────────────────────────"
# This project uses drizzle-kit push (diffs the schema against the live DB
# directly) rather than generate+migrate — see lib/db/package.json.
pnpm --filter @workspace/db run push

echo ""
echo "── 4/5 — Community seed skipped (community removed) ──────────────────"
echo "No community/group records are created by setup."

echo ""
echo "── 5/5 — Type-checking and building ───────────────────────────────────"
pnpm run build

echo ""
echo "✅ All done. Start the app with: pnpm --filter @workspace/api-server run dev"
