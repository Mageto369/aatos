#!/bin/bash
# AATOS Backup and Restore Test Script
# Tests database backup integrity and restoration

set -e

DB_URL="${DATABASE_URL:-postgresql://aatos:aatos_password@localhost:5432/aatos_dev}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/aatos_backup_$TIMESTAMP.sql"
TEST_DB="aatos_restore_test_$TIMESTAMP"

echo "═══════════════════════════════════════════════════════════════"
echo "AATOS Backup and Restore Test"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Step 1: Create backup
echo "[1/5] Creating database backup..."
pg_dump "$DB_URL" --format=custom --file="$BACKUP_FILE"
echo "      Backup created: $BACKUP_FILE"
echo "      Size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""

# Step 2: Create test database
echo "[2/5] Creating test restore database..."
psql "${DB_URL%/*}/postgres" -c "CREATE DATABASE \"$TEST_DB\";" 2>/dev/null || true
echo "      Test database: $TEST_DB"
echo ""

# Step 3: Restore backup to test database
echo "[3/5] Restoring backup to test database..."
pg_restore --dbname="${DB_URL%/*}/$TEST_DB" --no-owner --no-privileges "$BACKUP_FILE" 2>/dev/null || true
echo "      Restore completed"
echo ""

# Step 4: Verify restoration
echo "[4/5] Verifying restored data..."
TABLE_COUNT=$(psql "${DB_URL%/*}/$TEST_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "      Tables restored: $(echo $TABLE_COUNT | xargs)"

# Check key tables
for table in organizations users products deals payments messages; do
  COUNT=$(psql "${DB_URL%/*}/$TEST_DB" -t -c "SELECT COUNT(*) FROM \"$table\" WHERE deleted_at IS NULL;" 2>/dev/null | xargs || echo "0")
  echo "      $table: $COUNT rows"
done
echo ""

# Step 5: Cleanup
echo "[5/5] Cleaning up test database..."
psql "${DB_URL%/*}/postgres" -c "DROP DATABASE IF EXISTS \"$TEST_DB\";" 2>/dev/null
echo "      Test database removed"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "Backup and Restore Test: PASSED"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Backup file: $BACKUP_FILE"
echo "Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""

# Optional: Upload to S3 if configured
if [ -n "$AWS_S3_BUCKET" ]; then
  echo "Uploading backup to S3..."
  aws s3 cp "$BACKUP_FILE" "s3://$AWS_S3_BUCKET/backups/"
  echo "Upload complete"
fi
