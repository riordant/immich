#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-${SCRIPT_DIR}/.env}"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
else
  echo "Error: env file not found: $ENV_FILE" >&2
  exit 1
fi

usage() {
  cat <<'EOF'
Populate Immich video descriptions from the original filename using the public API.

By default, this script only updates videos whose description is currently empty.
Use --overwrite to reset existing descriptions back to the filename-derived title.

Requirements:
  - curl
  - jq
  - an Immich API key with Asset Read and Asset Update permissions

Environment:
  ENV_FILE         Optional override for the env file path
                   Default: scripts/.env
  IMMICH_URL       Immich server URL, without /api
                   Examples:
                     http://localhost:2283
                     https://photos.example.com
  API_KEY_USER     API key used for x-api-key authentication

Usage:
  ./scripts/backfill-video-descriptions.sh --all
  ./scripts/backfill-video-descriptions.sh --filename "School Play 2014.mp4"

Options:
  --all                  Process all video assets
  --filename NAME        Process all exact filename matches for a single video name
  --overwrite            Replace existing descriptions instead of skipping them
  --dry-run              Show what would change without writing updates
  --page-size N          Search page size (default: 250, max 1000)
  --base-url URL         Override IMMICH_URL
  --api-key-user KEY     Override API_KEY_USER
  -h, --help             Show this help text

Notes:
  - Single-file mode uses an exact filename check client-side, even though the search API
    performs partial matching. This avoids accidental updates to similarly named files.
  - If multiple videos share the same exact filename, all exact matches are updated.
EOF
}

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

log() {
  printf '%s\n' "$*" >&2
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

strip_extension() {
  local filename="$1"

  if [[ "$filename" != *.* ]]; then
    printf '%s\n' "$filename"
    return
  fi

  # Preserve dotfiles without a real extension, e.g. ".bashrc".
  if [[ "$filename" == .* && "${filename#*.}" != *.* ]]; then
    printf '%s\n' "$filename"
    return
  fi

  printf '%s\n' "${filename%.*}"
}

normalize_api_base_url() {
  local input="${1%/}"

  if [[ -z "$input" ]]; then
    die "IMMICH_URL is required in the env file, or pass --base-url."
  fi

  if [[ "$input" == */api ]]; then
    printf '%s\n' "$input"
  else
    printf '%s/api\n' "$input"
  fi
}

api_request() {
  local method="$1"
  local path="$2"
  local body="${3:-}"

  if [[ -n "$body" ]]; then
    curl \
      --silent \
      --show-error \
      --fail \
      --location \
      --request "$method" \
      --header "Accept: application/json" \
      --header "Content-Type: application/json" \
      --header "x-api-key: $API_KEY_USER" \
      --data "$body" \
      "$API_BASE_URL$path"
  else
    curl \
      --silent \
      --show-error \
      --fail \
      --location \
      --request "$method" \
      --header "Accept: application/json" \
      --header "x-api-key: $API_KEY_USER" \
      "$API_BASE_URL$path"
  fi
}

build_search_body() {
  local page="$1"

  if [[ -n "$FILENAME_FILTER" ]]; then
    jq -cn \
      --argjson page "$page" \
      --argjson size "$PAGE_SIZE" \
      --arg type "VIDEO" \
      --arg originalFileName "$FILENAME_FILTER" \
      '{page: $page, size: $size, type: $type, withExif: true, originalFileName: $originalFileName}'
  else
    jq -cn \
      --argjson page "$page" \
      --argjson size "$PAGE_SIZE" \
      --arg type "VIDEO" \
      '{page: $page, size: $size, type: $type, withExif: true}'
  fi
}

update_description() {
  local asset_id="$1"
  local description="$2"
  local payload
  payload="$(jq -cn --arg description "$description" '{description: $description}')"
  api_request PUT "/assets/$asset_id" "$payload" >/dev/null
}

process_asset() {
  local asset_json="$1"
  local asset_id
  local original_file_name
  local current_description
  local target_description

  asset_id="$(jq -r '.id' <<<"$asset_json")"
  original_file_name="$(jq -r '.originalFileName' <<<"$asset_json")"

  if [[ -n "$FILENAME_FILTER" && "$original_file_name" != "$FILENAME_FILTER" ]]; then
    return
  fi

  MATCHED_COUNT=$((MATCHED_COUNT + 1))

  current_description="$(jq -r '.exifInfo.description // ""' <<<"$asset_json")"
  current_description="$(trim "$current_description")"
  target_description="$(strip_extension "$original_file_name")"

  if [[ -z "$target_description" ]]; then
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    log "Skipping $asset_id ($original_file_name): derived title is empty"
    return
  fi

  if [[ "$current_description" == "$target_description" ]]; then
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    return
  fi

  if [[ "$OVERWRITE" -eq 0 && -n "$current_description" ]]; then
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    return
  fi

  if [[ "$DRY_RUN" -eq 1 ]]; then
    printf 'DRY RUN: would update %s (%s) -> %s\n' "$asset_id" "$original_file_name" "$target_description"
  else
    update_description "$asset_id" "$target_description"
    printf 'Updated %s (%s) -> %s\n' "$asset_id" "$original_file_name" "$target_description"
  fi

  UPDATED_COUNT=$((UPDATED_COUNT + 1))
}

MODE=""
FILENAME_FILTER=""
OVERWRITE=0
DRY_RUN=0
PAGE_SIZE=250
API_KEY_USER="${API_KEY_USER:-}"
RAW_BASE_URL="${IMMICH_URL:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --all)
      MODE="all"
      shift
      ;;
    --filename)
      [[ $# -ge 2 ]] || die "--filename requires a value"
      MODE="filename"
      FILENAME_FILTER="$2"
      shift 2
      ;;
    --overwrite)
      OVERWRITE=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --page-size)
      [[ $# -ge 2 ]] || die "--page-size requires a value"
      PAGE_SIZE="$2"
      shift 2
      ;;
    --base-url)
      [[ $# -ge 2 ]] || die "--base-url requires a value"
      RAW_BASE_URL="$2"
      shift 2
      ;;
    --api-key-user)
      [[ $# -ge 2 ]] || die "--api-key-user requires a value"
      API_KEY_USER="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
done

require_command curl
require_command jq

[[ -n "$RAW_BASE_URL" ]] || die "IMMICH_URL must be set in ${ENV_FILE} or passed with --base-url."
[[ -n "$API_KEY_USER" ]] || die "API_KEY_USER must be set in ${ENV_FILE} or passed with --api-key-user."
[[ -n "$MODE" ]] || die "Choose exactly one mode: --all or --filename."
[[ "$PAGE_SIZE" =~ ^[0-9]+$ ]] || die "--page-size must be a positive integer."
(( PAGE_SIZE >= 1 && PAGE_SIZE <= 1000 )) || die "--page-size must be between 1 and 1000."
if [[ "$MODE" == "filename" ]]; then
  [[ -n "$FILENAME_FILTER" ]] || die "--filename cannot be empty."
fi

API_BASE_URL="$(normalize_api_base_url "$RAW_BASE_URL")"

MATCHED_COUNT=0
UPDATED_COUNT=0
SKIPPED_COUNT=0
PAGE_COUNT=0
PAGE=1

log "Using API base URL: $API_BASE_URL"
if [[ "$DRY_RUN" -eq 1 ]]; then
  log "Dry run enabled; no changes will be written."
fi
if [[ "$OVERWRITE" -eq 1 ]]; then
  log "Overwrite enabled; existing descriptions will be replaced."
else
  log "Only videos with empty descriptions will be updated."
fi

while :; do
  SEARCH_BODY="$(build_search_body "$PAGE")"
  RESPONSE="$(api_request POST "/search/metadata" "$SEARCH_BODY")"
  PAGE_ITEM_COUNT="$(jq '.assets.items | length' <<<"$RESPONSE")"

  if [[ "$PAGE_ITEM_COUNT" -eq 0 ]]; then
    break
  fi

  PAGE_COUNT=$((PAGE_COUNT + 1))

  while IFS= read -r asset_json; do
    process_asset "$asset_json"
  done < <(jq -c '.assets.items[]' <<<"$RESPONSE")

  NEXT_PAGE="$(jq -r '.assets.nextPage // empty' <<<"$RESPONSE")"
  if [[ -z "$NEXT_PAGE" ]]; then
    break
  fi

  PAGE="$NEXT_PAGE"
done

if [[ "$MODE" == "filename" && "$MATCHED_COUNT" -eq 0 ]]; then
  die "No exact video matches found for filename: $FILENAME_FILTER"
fi

printf '\nSummary\n'
printf '  Mode: %s\n' "$MODE"
if [[ -n "$FILENAME_FILTER" ]]; then
  printf '  Filename: %s\n' "$FILENAME_FILTER"
fi
printf '  Pages scanned: %s\n' "$PAGE_COUNT"
printf '  Matching videos: %s\n' "$MATCHED_COUNT"
if [[ "$DRY_RUN" -eq 1 ]]; then
  printf '  Would update: %s\n' "$UPDATED_COUNT"
else
  printf '  Updated: %s\n' "$UPDATED_COUNT"
fi
printf '  Skipped: %s\n' "$SKIPPED_COUNT"
