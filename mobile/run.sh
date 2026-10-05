#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
APP="${1:-mundoria}"

case "$APP" in
  mundoria|mundoria_pro) ;;
  *)
    echo "Usage: mobile/run.sh mundoria|mundoria_pro" >&2
    exit 1
    ;;
esac

ENV_FILE="$ROOT/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

read_env() {
  grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'"
}

URL=$(read_env NEXT_PUBLIC_SUPABASE_URL)
KEY=$(read_env NEXT_PUBLIC_SUPABASE_ANON_KEY)
STRIPE=$(read_env NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || true)
ONESIGNAL=$(read_env NEXT_PUBLIC_ONESIGNAL_APP_ID || true)

if [ -z "$URL" ] || [ -z "$KEY" ]; then
  echo "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required in .env.local" >&2
  exit 1
fi

if [ -n "${FLUTTER:-}" ]; then
  FLUTTER_BIN="$FLUTTER"
elif [ -x "$HOME/flutter/bin/flutter" ]; then
  FLUTTER_BIN="$HOME/flutter/bin/flutter"
else
  FLUTTER_BIN="flutter"
fi

cd "$ROOT/mobile/apps/$APP"
API_BASE="${API_BASE:-http://127.0.0.1:3000}"
exec "$FLUTTER_BIN" run \
  --dart-define=SUPABASE_URL="$URL" \
  --dart-define=SUPABASE_ANON_KEY="$KEY" \
  --dart-define=API_BASE="$API_BASE" \
  --dart-define=STRIPE_PUBLISHABLE_KEY="$STRIPE" \
  --dart-define=ONESIGNAL_APP_ID="$ONESIGNAL"
