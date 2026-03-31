#!/usr/bin/env bash

set -euo pipefail

log() {
  printf '[android-smoke] %s\n' "$*"
}

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    printf 'Missing required env var: %s\n' "$name" >&2
    exit 1
  fi
}

require_cmd() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    printf 'Required command not found: %s\n' "$name" >&2
    exit 1
  fi
}

require_cmd adb
require_cmd curl
require_cmd node
require_cmd rg

require_var VITE_SUPABASE_URL
require_var VITE_SUPABASE_ANON_KEY
require_var ANDROID_SMOKE_TEST_EMAIL
require_var ANDROID_SMOKE_TEST_PASSWORD

SERIAL="${ANDROID_EMULATOR_SERIAL:-}"
if [[ -z "$SERIAL" ]]; then
  SERIAL="$(adb devices | awk '/emulator-[0-9]+[[:space:]]+device$/ { print $1; exit }')"
fi

if [[ -z "$SERIAL" ]]; then
  printf 'No Android emulator detected. Set ANDROID_EMULATOR_SERIAL or start an emulator.\n' >&2
  exit 1
fi

ARTIFACTS_DIR="${ANDROID_SMOKE_ARTIFACTS_DIR:-/tmp/android-smoke-artifacts}"
mkdir -p "$ARTIFACTS_DIR"
LOGCAT_FILE="$ARTIFACTS_DIR/logcat.txt"

cleanup() {
  if [[ -n "${LOGCAT_PID:-}" ]]; then
    kill "$LOGCAT_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

log "Using emulator $SERIAL"
log "Authenticating test account against Supabase"

AUTH_RESPONSE="$(
  curl -sS -X POST "${VITE_SUPABASE_URL%/}/auth/v1/token?grant_type=password" \
    -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${ANDROID_SMOKE_TEST_EMAIL}\",\"password\":\"${ANDROID_SMOKE_TEST_PASSWORD}\"}"
)"

TOKENS_JSON="$(
  printf '%s' "$AUTH_RESPONSE" | node -e "
let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  const payload = JSON.parse(input);
  if (!payload.access_token || !payload.refresh_token) {
    console.error('Supabase auth failed:', JSON.stringify(payload));
    process.exit(1);
  }
  process.stdout.write(JSON.stringify({
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
  }));
});
"
)"

ACCESS_TOKEN="$(
  printf '%s' "$TOKENS_JSON" | node -e "let i='';process.stdin.on('data',c=>i+=c).on('end',()=>process.stdout.write(JSON.parse(i).accessToken));"
)"
REFRESH_TOKEN="$(
  printf '%s' "$TOKENS_JSON" | node -e "let i='';process.stdin.on('data',c=>i+=c).on('end',()=>process.stdout.write(JSON.parse(i).refreshToken));"
)"

log "Building and syncing Capacitor Android app"
VITE_SMOKE_TEST_MODE=true npm run build
npx cap sync android
npx cap run android --target "$SERIAL"

log "Starting logcat capture"
adb -s "$SERIAL" logcat -c
adb -s "$SERIAL" logcat >"$LOGCAT_FILE" 2>&1 &
LOGCAT_PID=$!

sleep 4

log "Launching app and injecting Supabase session through deep link"
adb -s "$SERIAL" shell monkey -p com.rythm.app -c android.intent.category.LAUNCHER 1 >/dev/null
sleep 3
adb -s "$SERIAL" shell am start -W \
  -a android.intent.action.VIEW \
  -d "capacitor://localhost/#access_token=${ACCESS_TOKEN}&refresh_token=${REFRESH_TOKEN}" \
  com.rythm.app >/dev/null
sleep 4

log "Exercising critical paths: summary, log, settings, paywall"
adb -s "$SERIAL" shell am start -W -a android.intent.action.VIEW -d "capacitor://localhost/summary" com.rythm.app >/dev/null
sleep 2
adb -s "$SERIAL" shell am start -W -a android.intent.action.VIEW -d "capacitor://localhost/log" com.rythm.app >/dev/null
sleep 2
adb -s "$SERIAL" shell am start -W -a android.intent.action.VIEW -d "capacitor://localhost/settings" com.rythm.app >/dev/null
sleep 2
adb -s "$SERIAL" shell input keyevent KEYCODE_BACK
sleep 2
adb -s "$SERIAL" shell am start -W -a android.intent.action.VIEW -d "capacitor://localhost/pro" com.rythm.app >/dev/null
sleep 2

log "Triggering foreground cycle to exercise update-check appStateChange hook"
adb -s "$SERIAL" shell input keyevent KEYCODE_HOME
sleep 2
adb -s "$SERIAL" shell monkey -p com.rythm.app -c android.intent.category.LAUNCHER 1 >/dev/null
sleep 3

log "Asserting app still foreground after back flow"
FOCUS_LINE="$(adb -s "$SERIAL" shell dumpsys window | rg -m 1 'mCurrentFocus|mFocusedApp' || true)"
if [[ "$FOCUS_LINE" != *"com.rythm.app"* ]]; then
  printf 'App is not foreground after smoke actions. Focus line: %s\n' "$FOCUS_LINE" >&2
  exit 1
fi

sleep 2

log "Checking for smoke instrumentation markers"
rg -n "\\[smoke\\] appUrlOpen token payload detected" "$LOGCAT_FILE" >/dev/null
rg -n "\\[smoke\\] android backButton listener invoked" "$LOGCAT_FILE" >/dev/null
rg -n "\\[smoke\\] android appStateChange active" "$LOGCAT_FILE" >/dev/null
rg -n "\\[smoke\\] checkForAndroidUpdate invoked" "$LOGCAT_FILE" >/dev/null

log "Checking for fatal crashes/ANRs"
if rg -n "FATAL EXCEPTION|ANR in|Process com\\.rythm\\.app has died|NoSuchMethodError|IllegalStateException|NullPointerException" "$LOGCAT_FILE" >/dev/null; then
  printf 'Detected fatal Android errors in logcat. See %s\n' "$LOGCAT_FILE" >&2
  exit 1
fi

log "Smoke test passed. Logcat saved to $LOGCAT_FILE"
