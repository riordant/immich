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

if [ "$#" -lt 3 ] || [ "$#" -gt 4 ]; then
  echo "Usage: $0 <email> <name> <password> [library_name]" >&2
  exit 1
fi

EMAIL="$1"
NAME="$2"
PASSWORD="$3"
LIBRARY_NAME="${4:-$NAME library}"

# 1) Create user
USER_PAYLOAD="$(jq -n \
  --arg email "$EMAIL" \
  --arg name "$NAME" \
  --arg password "$PASSWORD" \
  '{
    email: $email,
    name: $name,
    password: $password,
    shouldChangePassword: false,
    notify: false
  }'
)"

USER_RESPONSE="$(curl -fsS \
  -X POST "${IMMICH_URL}/api/admin/users" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d "$USER_PAYLOAD"
)"

echo "Created user:"
echo "$USER_RESPONSE" | jq .

USER_ID="$(echo "$USER_RESPONSE" | jq -r '.id')"

if [ -z "$USER_ID" ] || [ "$USER_ID" = "null" ]; then
  echo "Failed to extract user ID from response" >&2
  exit 1
fi

# 2) Create host folders
USER_ROOT="${HOST_USERDATA_ROOT}/${USER_ID}"
PHOTO_DIR="${USER_ROOT}/photo"
VIDEO_DIR="${USER_ROOT}/video"

mkdir -p "$PHOTO_DIR" "$VIDEO_DIR"

# Adjust if you later want stricter ownership/group handling.
chmod 755 "$USER_ROOT" "$PHOTO_DIR" "$VIDEO_DIR"

echo
echo "Created host folders:"
echo "  $USER_ROOT"
echo "  $PHOTO_DIR"
echo "  $VIDEO_DIR"

# 3) Create external library
PHOTO_IMPORT_PATH="${CONTAINER_USERDATA_ROOT}/${USER_ID}/photo"
VIDEO_IMPORT_PATH="${CONTAINER_USERDATA_ROOT}/${USER_ID}/video"

LIBRARY_PAYLOAD="$(jq -n \
  --arg ownerId "$USER_ID" \
  --arg name "$LIBRARY_NAME" \
  --arg photo "$PHOTO_IMPORT_PATH" \
  --arg video "$VIDEO_IMPORT_PATH" \
  '{
    ownerId: $ownerId,
    name: $name,
    importPaths: [$photo, $video]
  }'
)"

LIBRARY_RESPONSE="$(curl -fsS \
  -X POST "${IMMICH_URL}/api/libraries" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d "$LIBRARY_PAYLOAD"
)"

echo
echo "Created external library:"
echo "$LIBRARY_RESPONSE" | jq .

echo
echo "Done."
echo "User ID: $USER_ID"
echo "Container-visible import paths:"
echo "  $PHOTO_IMPORT_PATH"
echo "  $VIDEO_IMPORT_PATH"
echo "Populate those folders on the host, then run the scan script with this user ID."

