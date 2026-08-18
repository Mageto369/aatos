#!/bin/bash
# AATOS Database Backup Script
# Usage: ./backup.sh [retention_days]
# Requires: pg_dump, aws-cli (for S3 upload)

set -euo pipefail

RETENTION_DAYS="${1:-7}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/aatos}"
DATABASE_URL="${DATABASE_URL:-}"
S3_BUCKET="${S3_BUCKET:-}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="aatos_backup_${TIMESTAMP}.sql.gz"

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL not set"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "Starting backup at $(date)"

# Extract connection details from DATABASE_URL
# Format: postgresql://user:pass@host:port/dbname
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\(.*\)/\1/p')
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

# Run pg_dump
PGPASSWORD="$DB_PASS" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  | gzip > "$BACKUP_DIR/$BACKUP_FILE"

BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo "Backup completed: $BACKUP_FILE ($BACKUP_SIZE)"

# Upload to S3 if configured
if [ -n "$S3_BUCKET" ]; then
  aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$S3_BUCKET/backups/"
  echo "Backup uploaded to S3: s3://$S3_BUCKET/backups/$BACKUP_FILE"
fi

# Clean up old backups
find "$BACKUP_DIR" -name "aatos_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "Cleaned up backups older than $RETENTION_DAYS days"

echo "Backup process completed at $(date)"
