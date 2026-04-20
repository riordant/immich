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

curl -fsS \
  -X GET "${IMMICH_URL}/api/admin/users" \
  -H "Accept: application/json" \
  -H "x-api-key: ${API_KEY}" \
| jq .


