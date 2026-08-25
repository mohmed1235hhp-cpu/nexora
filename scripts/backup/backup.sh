#!/usr/bin/env bash
# ============================================================
# Phase 22 — Database Backup Script
# Cyber AI Platform — Automated Backup System
# ============================================================
# Usage:
#   ./backup.sh daily    → daily backup (keep 30)
#   ./backup.sh weekly   → weekly backup (keep 12)
#   ./backup.sh monthly  → monthly backup (keep 12)
#   ./backup.sh restore <backup-file>  → restore from backup
# ============================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups/cyberai}"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
TYPE="${1:-daily}"
DB_URL="${DATABASE_URL:?DATABASE_URL environment variable required}"

# Encryption key (must be set in production — use KMS in real deployments)
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"

mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/weekly" "$BACKUP_DIR/monthly"

# ─── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log_info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ─── Create Backup ─────────────────────────────────────────────────────────────
do_backup() {
  local kind="$1"
  local dest_dir="$BACKUP_DIR/$kind"
  local filename="cyberai_${kind}_${DATE}.sql"
  local filepath="$dest_dir/$filename"

  log_info "Starting $kind backup..."

  # pg_dump with custom format (compressed, resumable)
  pg_dump "$DB_URL" \
    --format=custom \
    --compress=9 \
    --no-password \
    --verbose \
    --file="$filepath"

  # Encrypt if key provided
  if [ -n "$ENCRYPTION_KEY" ]; then
    openssl enc -aes-256-cbc -salt -pbkdf2 \
      -k "$ENCRYPTION_KEY" \
      -in "$filepath" \
      -out "${filepath}.enc"
    rm "$filepath"
    filepath="${filepath}.enc"
    log_info "Backup encrypted: $filepath"
  fi

  # Checksum for integrity verification
  sha256sum "$filepath" > "${filepath}.sha256"
  log_info "Checksum created: ${filepath}.sha256"

  # Retention policy
  case "$kind" in
    daily)   keep=30  ;;
    weekly)  keep=12  ;;
    monthly) keep=12  ;;
    *)       keep=30  ;;
  esac

  # Remove old backups beyond retention period
  local count
  count=$(ls -1 "$dest_dir" | grep -c "\.sql\|\.enc" 2>/dev/null || echo "0")
  if [ "$count" -gt "$keep" ]; then
    ls -1t "$dest_dir" | grep -E "\.sql$|\.enc$" | tail -n +"$((keep + 1))" | while read -r old; do
      rm -f "$dest_dir/$old" "$dest_dir/$old.sha256"
      log_warn "Removed old backup: $old"
    done
  fi

  log_info "✓ $kind backup completed: $filepath"
  echo "$filepath"
}

# ─── Restore ──────────────────────────────────────────────────────────────────
do_restore() {
  local backup_file="${2:?Backup file required: ./backup.sh restore <file>}"

  if [ ! -f "$backup_file" ]; then
    log_error "Backup file not found: $backup_file"
    exit 1
  fi

  # Verify checksum
  if [ -f "${backup_file}.sha256" ]; then
    log_info "Verifying backup integrity..."
    sha256sum --check "${backup_file}.sha256" || {
      log_error "Checksum verification FAILED — backup may be corrupted!"
      exit 1
    }
    log_info "Checksum verified ✓"
  else
    log_warn "No checksum file found — skipping integrity check"
  fi

  # Decrypt if encrypted
  local restore_file="$backup_file"
  if [[ "$backup_file" == *.enc ]]; then
    if [ -z "$ENCRYPTION_KEY" ]; then
      log_error "BACKUP_ENCRYPTION_KEY required to decrypt backup"
      exit 1
    fi
    restore_file="${backup_file%.enc}"
    openssl enc -d -aes-256-cbc -pbkdf2 \
      -k "$ENCRYPTION_KEY" \
      -in "$backup_file" \
      -out "$restore_file"
    log_info "Backup decrypted"
  fi

  log_warn "⚠️  This will OVERWRITE the current database. Press Ctrl+C to cancel."
  sleep 5

  pg_restore "$DB_URL" \
    --format=custom \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    "$restore_file"

  [ "$restore_file" != "$backup_file" ] && rm -f "$restore_file"

  log_info "✓ Restore completed successfully"
}

# ─── Main ─────────────────────────────────────────────────────────────────────
case "$TYPE" in
  daily|weekly|monthly)
    do_backup "$TYPE"
    ;;
  restore)
    do_restore "$@"
    ;;
  *)
    echo "Usage: $0 {daily|weekly|monthly|restore <file>}"
    exit 1
    ;;
esac
