#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/localbite-backend"
SCRIPT="$BACKEND_DIR/scripts/start_backend_with_redis.sh"

if [[ ! -x "$SCRIPT" ]]; then
  echo "Backend deploy script not found or not executable: $SCRIPT" >&2
  exit 1
fi

if [[ ! -f "$BACKEND_DIR/.env" ]]; then
  cat >&2 <<ERR
Missing backend env file: $BACKEND_DIR/.env
Create it with your Neon DB connection (DATABASE_URL=...).
ERR
  exit 1
fi

echo "Launching Localbite backend with local Redis (pyenv/venv aware)..."
echo "Backend dir: $BACKEND_DIR"

exec "$SCRIPT"
