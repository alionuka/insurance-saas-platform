#!/usr/bin/env bash
# Backup the running insurance_saas_db Postgres container to a timestamped SQL file.
#
# Usage:
#   ./scripts/backup-db.sh                          # writes to ./backups/insurance_saas_db_<UTC-timestamp>.sql
#   ./scripts/backup-db.sh /path/to/backups         # writes to that directory instead
#
# Requires:
#   - Docker running with `insurance-saas-platform-db-1` container up
#   - or local Postgres reachable at $DATABASE_URL (override CONTAINER_NAME="")

set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-insurance-saas-platform-db-1}"
DB_NAME="${DB_NAME:-insurance_saas_db}"
DB_USER="${DB_USER:-postgres}"
BACKUP_DIR="${1:-./backups}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date -u +'%Y%m%dT%H%M%SZ')
OUTFILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql"

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "→ Dumping ${DB_NAME} from container ${CONTAINER_NAME}..."
  docker exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists > "${OUTFILE}"
else
  echo "→ Container ${CONTAINER_NAME} not running; falling back to local pg_dump via DATABASE_URL"
  : "${DATABASE_URL:?DATABASE_URL must be set when not using Docker container}"
  pg_dump "${DATABASE_URL}" --clean --if-exists > "${OUTFILE}"
fi

SIZE=$(du -h "${OUTFILE}" | cut -f1)
echo "✓ Backup written → ${OUTFILE} (${SIZE})"
echo ""
echo "Restore with:"
echo "  docker exec -i ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} < ${OUTFILE}"
