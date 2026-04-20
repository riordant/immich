#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${ENV_FILE:-.env}"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
else
  echo "Error: env file not found: $ENV_FILE" >&2
  exit 1
fi

: "${IMMICH_URL:?IMMICH_URL must be set in .env}"
: "${HOST_USERDATA_ROOT:?HOST_USERDATA_ROOT must be set in .env}"
: "${CONTAINER_USERDATA_ROOT:?CONTAINER_USERDATA_ROOT must be set in .env}"
: "${API_KEY:?API_KEY must be set in .env}"set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <user_id>" >&2
  exit 1
fi

USER_ID="$1"

echo "get library IDs.."
LIBRARIES_JSON="$(curl -fsS \
  -X GET "${IMMICH_URL}/api/libraries" \
  -H "Accept: application/json" \
  -H "x-api-key: ${API_KEY}"
)"
echo "done.."

MATCH_COUNT="$(echo "$LIBRARIES_JSON" | jq --arg uid "$USER_ID" '[.[] | select(.ownerId == $uid)] | length')"

if [ "$MATCH_COUNT" -eq 0 ]; then
  echo "No library found for user ID: $USER_ID" >&2
  exit 1
fi

if [ "$MATCH_COUNT" -gt 1 ]; then
  echo "More than one library found for user ID: $USER_ID" >&2
  echo "Matching libraries:" >&2
  echo "$LIBRARIES_JSON" | jq --arg uid "$USER_ID" '[.[] | select(.ownerId == $uid)]'
  exit 1
fi

LIBRARY_ID="$(echo "$LIBRARIES_JSON" | jq -r --arg uid "$USER_ID" '.[] | select(.ownerId == $uid) | .id')"

if [ -z "$LIBRARY_ID" ] || [ "$LIBRARY_ID" = "null" ]; then
  echo "Failed to resolve library ID for user ID: $USER_ID" >&2
  exit 1
fi

echo "Resolved library ID: $LIBRARY_ID" >&2

curl -fsS \
  -X POST "${IMMICH_URL}/api/libraries/${LIBRARY_ID}/scan" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"refreshAllFiles":false,"refreshModifiedFiles":false}' \
| jq .


