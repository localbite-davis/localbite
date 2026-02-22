#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"
REDIS_URL="${REDIS_URL:-redis://localhost:6379/0}"
RELOAD="${RELOAD:-1}"
PYTHON_RUNNER=""

start_redis_if_needed() {
  if command -v redis-cli >/dev/null 2>&1; then
    if redis-cli -u "$REDIS_URL" ping >/dev/null 2>&1; then
      echo "Redis is already running at $REDIS_URL"
      return 0
    fi
  fi

  echo "Redis not responding at $REDIS_URL. Attempting to start local Redis..."

  if command -v brew >/dev/null 2>&1 && brew services list 2>/dev/null | grep -qE '^redis(@[0-9.]+)?\s'; then
    echo "Trying: brew services start redis"
    brew services start redis >/dev/null || true
    sleep 1
  fi

  if command -v redis-cli >/dev/null 2>&1 && redis-cli -u "$REDIS_URL" ping >/dev/null 2>&1; then
    echo "Redis started via Homebrew services."
    return 0
  fi

  if command -v redis-server >/dev/null 2>&1; then
    echo "Trying: redis-server --daemonize yes"
    redis-server --daemonize yes >/dev/null 2>&1 || true
    sleep 1
  fi

  if command -v redis-cli >/dev/null 2>&1 && redis-cli -u "$REDIS_URL" ping >/dev/null 2>&1; then
    echo "Redis started via redis-server daemon mode."
    return 0
  fi

  cat >&2 <<ERR
Failed to start Redis automatically.
Please start Redis manually and rerun this script.
Examples:
  redis-server
  brew services start redis
ERR
  exit 1
}

activate_python_env() {
  if [[ -f "$BACKEND_DIR/venv/bin/activate" ]]; then
    # shellcheck disable=SC1091
    source "$BACKEND_DIR/venv/bin/activate"
    PYTHON_RUNNER=""
    echo "Activated virtualenv: $BACKEND_DIR/venv"
    return 0
  fi

  if command -v pyenv >/dev/null 2>&1; then
    if [[ -f "$BACKEND_DIR/.python-version" ]]; then
      local pyenv_name
      pyenv_name="$(cat "$BACKEND_DIR/.python-version")"
      PYTHON_RUNNER="pyenv exec"
      echo "Using pyenv local environment: $pyenv_name"
      return 0
    fi
  fi

  echo "No local venv found; using system Python environment."
}

start_backend() {
  cd "$BACKEND_DIR"
  export REDIS_URL

  local uvicorn_cmd=(uvicorn main:app --host "$HOST" --port "$PORT")
  if [[ "$RELOAD" == "1" ]]; then
    uvicorn_cmd+=(--reload)
  fi

  echo "Starting backend at http://$HOST:$PORT (REDIS_URL=$REDIS_URL)"
  if [[ -n "$PYTHON_RUNNER" ]]; then
    exec $PYTHON_RUNNER "${uvicorn_cmd[@]}"
  fi
  exec "${uvicorn_cmd[@]}"
}

start_redis_if_needed
activate_python_env
start_backend
