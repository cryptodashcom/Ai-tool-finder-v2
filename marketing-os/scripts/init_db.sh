#!/usr/bin/env bash
# Run once to initialize the Marketing OS Postgres schema.
# Usage: ./scripts/init_db.sh
# Reads connection settings from .env if present.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="$SCRIPT_DIR/../schemas/postgres_schema.sql"

# Source .env if it exists
if [ -f "$SCRIPT_DIR/../.env" ]; then
  export $(grep -v '^#' "$SCRIPT_DIR/../.env" | xargs)
fi

PGHOST="${POSTGRES_HOST:-localhost}"
PGPORT="${POSTGRES_PORT:-5432}"
PGUSER="${POSTGRES_USER:-marketing_os}"
PGDATABASE="${POSTGRES_DB:-marketing_os}"

echo "Initializing Marketing OS schema on $PGHOST:$PGPORT/$PGDATABASE..."
PGPASSWORD="${POSTGRES_PASSWORD:-}" psql \
  -h "$PGHOST" \
  -p "$PGPORT" \
  -U "$PGUSER" \
  -d "$PGDATABASE" \
  -f "$SCHEMA_FILE"

echo "Schema initialized successfully."
