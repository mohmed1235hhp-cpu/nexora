#!/usr/bin/env bash
# Generate production secrets (do NOT commit output).
# Usage: ./scripts/generate-secrets.sh > .env.secrets && chmod 600 .env.secrets
set -euo pipefail
echo "# Generated $(date -u +%FT%TZ) — DO NOT COMMIT"
echo "MASTER_ENCRYPTION_KEY=$(openssl rand -base64 32)"
echo "SESSION_SECRET=$(openssl rand -base64 48)"
echo "JWT_SECRET=$(openssl rand -base64 48)"
