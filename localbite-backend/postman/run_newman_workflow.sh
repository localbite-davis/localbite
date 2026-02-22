#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COLLECTION_FILE="$SCRIPT_DIR/localbite-dispatch-workflow.postman_collection.json"
ENV_FILE="$SCRIPT_DIR/localbite-local.postman_environment.json"
REPORT_DIR="$SCRIPT_DIR/reports"

BASE_URL="${BASE_URL:-}"
FOLDER="${FOLDER:-}"
DELAY_MS="${DELAY_MS:-250}"
REQUEST_TIMEOUT_MS="${REQUEST_TIMEOUT_MS:-30000}"
RUN_TIMEOUT_MS="${RUN_TIMEOUT_MS:-600000}"
USE_BAIL="${USE_BAIL:-0}"
EXPORT_ENV="${EXPORT_ENV:-1}"

usage() {
  cat <<USAGE
Usage: $(basename "$0") [options]

Runs the Localbite Postman collection via Newman.

Options:
  --base-url URL       Override baseUrl environment variable (e.g. http://localhost:8000)
  --folder NAME        Run only a specific folder/request group (if collection uses folders)
  --delay-ms N         Delay between requests in ms (default: $DELAY_MS)
  --bail               Stop on first failure
  --no-export-env      Do not export final environment snapshot to reports/
  -h, --help           Show help

Environment overrides:
  BASE_URL, FOLDER, DELAY_MS, REQUEST_TIMEOUT_MS, RUN_TIMEOUT_MS, USE_BAIL=1
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url)
      BASE_URL="$2"
      shift 2
      ;;
    --folder)
      FOLDER="$2"
      shift 2
      ;;
    --delay-ms)
      DELAY_MS="$2"
      shift 2
      ;;
    --bail)
      USE_BAIL=1
      shift
      ;;
    --no-export-env)
      EXPORT_ENV=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ ! -f "$COLLECTION_FILE" ]]; then
  echo "Collection file not found: $COLLECTION_FILE" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Environment file not found: $ENV_FILE" >&2
  exit 1
fi

mkdir -p "$REPORT_DIR"
RUN_TS="$(date +%Y%m%d-%H%M%S)"
JSON_REPORT="$REPORT_DIR/newman-report-$RUN_TS.json"
ENV_EXPORT="$REPORT_DIR/postman-env-after-run-$RUN_TS.json"

if command -v newman >/dev/null 2>&1; then
  RUNNER=(newman)
elif command -v npx >/dev/null 2>&1; then
  RUNNER=(npx --yes newman)
else
  echo "Neither 'newman' nor 'npx' is available. Install Node.js and Newman." >&2
  echo "Example: npm i -g newman" >&2
  exit 1
fi

CMD=("${RUNNER[@]}" run "$COLLECTION_FILE" -e "$ENV_FILE")
CMD+=(--delay-request "$DELAY_MS")
CMD+=(--timeout-request "$REQUEST_TIMEOUT_MS" --timeout "$RUN_TIMEOUT_MS")
CMD+=(--reporters cli,json --reporter-json-export "$JSON_REPORT")

if [[ -n "$BASE_URL" ]]; then
  CMD+=(--env-var "baseUrl=$BASE_URL")
fi

if [[ -n "$FOLDER" ]]; then
  CMD+=(--folder "$FOLDER")
fi

if [[ "$USE_BAIL" == "1" ]]; then
  CMD+=(--bail)
fi

if [[ "$EXPORT_ENV" == "1" ]]; then
  CMD+=(--export-environment "$ENV_EXPORT")
fi

echo "Running Newman workflow..."
echo "Collection: $COLLECTION_FILE"
echo "Environment: $ENV_FILE"
[[ -n "$BASE_URL" ]] && echo "baseUrl override: $BASE_URL"
[[ -n "$FOLDER" ]] && echo "Folder: $FOLDER"
echo "Report: $JSON_REPORT"
[[ "$EXPORT_ENV" == "1" ]] && echo "Environment export: $ENV_EXPORT"

"${CMD[@]}"
