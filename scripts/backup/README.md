# Phase 22 — Backup & Disaster Recovery

## Overview

Cyber AI uses a multi-tier backup strategy with encryption, checksums, and automated retention.

## Backup Tiers

| Tier    | Frequency    | Retention | Storage       |
|---------|-------------|-----------|---------------|
| Daily   | Every day   | 30 days   | `/backups/cyberai/daily/`   |
| Weekly  | Every Sunday | 12 weeks  | `/backups/cyberai/weekly/`  |
| Monthly | 1st of month | 12 months | `/backups/cyberai/monthly/` |

## Setup

### 1. Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
BACKUP_ENCRYPTION_KEY=your-strong-encryption-key-minimum-32-chars
BACKUP_DIR=/backups/cyberai
```

### 2. Cron Jobs (add to crontab)

```cron
# Daily backup at 2 AM
0 2 * * * BACKUP_DIR=/backups DATABASE_URL=$DATABASE_URL /scripts/backup/backup.sh daily >> /var/log/backup.log 2>&1

# Weekly backup on Sunday at 3 AM
0 3 * * 0 BACKUP_DIR=/backups DATABASE_URL=$DATABASE_URL /scripts/backup/backup.sh weekly >> /var/log/backup.log 2>&1

# Monthly backup on 1st at 4 AM
0 4 1 * * BACKUP_DIR=/backups DATABASE_URL=$DATABASE_URL /scripts/backup/backup.sh monthly >> /var/log/backup.log 2>&1
```

## Usage

```bash
# Daily backup
./backup.sh daily

# Weekly backup
./backup.sh weekly

# Restore from a backup
BACKUP_ENCRYPTION_KEY=your-key ./backup.sh restore /backups/cyberai/daily/cyberai_daily_2025-01-01.sql.enc
```

## PITR (Point-in-Time Recovery)

For Supabase/Neon/PostgreSQL:
- Enable WAL (Write-Ahead Logging) in your database settings
- Supabase: Enable PITR in Dashboard → Settings → Database
- Neon: Automatic PITR enabled by default (7-day window on Pro plan)

## Disaster Recovery Plan

### RTO (Recovery Time Objective): < 4 hours
### RPO (Recovery Point Objective): < 24 hours (daily backup)

### Steps:
1. Provision new database instance
2. Set `DATABASE_URL` to new instance
3. Run: `./backup.sh restore <latest-backup-file>`
4. Verify data integrity
5. Update DNS/connection strings
6. Validate application health via `/api/healthz`

## Backup Encryption

All backups are encrypted using AES-256-CBC with PBKDF2 key derivation.

**Production recommendation**: Use AWS KMS, Google Cloud KMS, or HashiCorp Vault
instead of a static `BACKUP_ENCRYPTION_KEY`.

## Integrity Verification

Every backup has a SHA-256 checksum file. The restore script automatically
verifies integrity before restoring.

```bash
# Manual verification
sha256sum --check backup-file.sql.enc.sha256
```
