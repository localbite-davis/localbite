#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/localbite-backend"
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"
REDIS_URL="${REDIS_URL:-redis://localhost:6379/0}"
RELOAD="${RELOAD:-1}"
PYTHON_RUNNER=""

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

init_pyenv_shell() {
  export PYENV_ROOT="${PYENV_ROOT:-$HOME/.pyenv}"
  if command_exists brew; then
    local brew_pyenv_prefix=""
    brew_pyenv_prefix="$(brew --prefix pyenv 2>/dev/null || true)"
    if [[ -n "$brew_pyenv_prefix" ]]; then
      export PATH="$brew_pyenv_prefix/bin:$PATH"
    fi
  fi
  export PATH="$PYENV_ROOT/bin:$PATH"

  if command_exists pyenv; then
    eval "$(pyenv init -)"
    if pyenv commands | grep -qx "virtualenv-init"; then
      eval "$(pyenv virtualenv-init -)"
    fi
  fi
}

start_redis_if_needed() {
  if command_exists redis-cli && redis-cli -u "$REDIS_URL" ping >/dev/null 2>&1; then
    echo "Redis is already running at $REDIS_URL"
    return 0
  fi

  echo "Redis not responding at $REDIS_URL. Attempting to start local Redis..."

  if command_exists brew; then
    if brew services list 2>/dev/null | grep -qE '^redis(@[0-9.]+)?\s'; then
      brew services start redis >/dev/null || true
      sleep 1
    fi
  fi

  if command_exists redis-cli && redis-cli -u "$REDIS_URL" ping >/dev/null 2>&1; then
    echo "Redis started via Homebrew services."
    return 0
  fi

  if command_exists redis-server; then
    redis-server --daemonize yes >/dev/null 2>&1 || true
    sleep 1
  fi

  if command_exists redis-cli && redis-cli -u "$REDIS_URL" ping >/dev/null 2>&1; then
    echo "Redis started via redis-server daemon mode."
    return 0
  fi

  cat >&2 <<ERR
Failed to start Redis automatically.
Run ./setup_backend.sh first (installs Redis), or start Redis manually.
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

  init_pyenv_shell
  if command_exists pyenv && [[ -f "$BACKEND_DIR/.python-version" ]]; then
    PYTHON_RUNNER="pyenv exec"
    echo "Using pyenv local environment: $(cat "$BACKEND_DIR/.python-version")"
    return 0
  fi

  echo "No backend Python environment found. Run ./setup_backend.sh first." >&2
  exit 1
}

if [[ ! -f "$BACKEND_DIR/.env" ]]; then
  cat >&2 <<ERR
Missing backend env file: $BACKEND_DIR/.env
Create it with your Neon DB connection (DATABASE_URL=...).
ERR
  exit 1
fi

start_redis_if_needed
activate_python_env

cd "$BACKEND_DIR"
export REDIS_URL

UVICORN_CMD=(uvicorn main:app --host "$HOST" --port "$PORT")
if [[ "$RELOAD" == "1" ]]; then
  UVICORN_CMD+=(--reload)
fi

echo "Starting Localbite backend..."
echo "Backend dir: $BACKEND_DIR"
echo "URL: http://$HOST:$PORT"
echo "REDIS_URL: $REDIS_URL"

if [[ -n "$PYTHON_RUNNER" ]]; then
  exec $PYTHON_RUNNER "${UVICORN_CMD[@]}"
fi
exec "${UVICORN_CMD[@]}"
