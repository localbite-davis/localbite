#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POSTMAN_DIR="$ROOT_DIR/localbite-backend/postman"
RUNNER_SCRIPT="$POSTMAN_DIR/run_newman_workflow.sh"
BASE_URL="${BASE_URL:-http://localhost:8000}"
WAIT_TIMEOUT="${WAIT_TIMEOUT:-60}"
AUTO_WAIT="${AUTO_WAIT:-1}"

usage() {
  cat <<USAGE
Usage: $(basename "$0") [options] [-- passthrough_to_newman_wrapper]

Runs API integration tests from the Postman collection using Newman.
Defaults to base URL: $BASE_URL

Options:
  --base-url URL      Backend base URL (default: http://localhost:8000)
  --no-wait           Skip backend readiness wait
  --wait-timeout N    Seconds to wait for backend readiness (default: $WAIT_TIMEOUT)
  -h, --help          Show help

Examples:
  ./run_api_tests.sh
  ./run_api_tests.sh --base-url http://127.0.0.1:8000
  ./run_api_tests.sh -- --bail
USAGE
}

# Initialize PASSTHROUGH as empty array
PASSTHROUGH=()

# Parse CLI arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url)
      BASE_URL="$2"
      shift 2
      ;;
    --no-wait)
      AUTO_WAIT=0
      shift
      ;;
    --wait-timeout)
      WAIT_TIMEOUT="$2"
      shift 2
      ;;
    --)
      shift
      PASSTHROUGH=("$@")
      break
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      PASSTHROUGH+=("$1")
      shift
      ;;
  esac
done

# Ensure runner script exists
if [[ ! -x "$RUNNER_SCRIPT" ]]; then
  echo "Runner script missing: $RUNNER_SCRIPT" >&2
  exit 1
fi

# Function to wait for backend readiness
wait_for_backend() {
  local seconds=0
  echo "Waiting for backend at $BASE_URL ..."
  until curl -fsS "$BASE_URL/" >/dev/null 2>&1; do
    if [[ $seconds -ge $WAIT_TIMEOUT ]]; then
      echo "Backend did not become ready within ${WAIT_TIMEOUT}s" >&2
      exit 1
    fi
    sleep 2
    seconds=$((seconds + 2))
  done
  echo "Backend is ready."
}

# Wait if AUTO_WAIT enabled
if [[ "$AUTO_WAIT" == "1" ]]; then
  wait_for_backend
fi

# Run Newman workflow
cd "$POSTMAN_DIR"

if (( ${#PASSTHROUGH[@]} )); then
  exec BASE_URL="$BASE_URL" ./run_newman_workflow.sh --base-url "$BASE_URL" "${PASSTHROUGH[@]}"
else
  exec BASE_URL="$BASE_URL" ./run_newman_workflow.sh --base-url "$BASE_URL"
fi