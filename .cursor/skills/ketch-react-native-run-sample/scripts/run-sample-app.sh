#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: run-sample-app.sh <android|ios> [local] [--build-only] [--no-logs] [--full-system-logs]

  android|ios          Required. Target platform.
  (no local)           Use the released @ketch-com/ketch-react-native from npm (latest version).
  local                Link the example to file:../package in this repo.

Options:
  --build-only         Build and install without streaming logs afterward.
  --no-logs            Skip post-launch log streaming.
  --full-system-logs   Stream unfiltered logs (Android logcat / iOS process logs).

Environment:
  DEVICE_ID             Android device serial for react-native run-android.
  SIMULATOR_NAME        iOS simulator name for react-native run-ios.
  METRO_PORT            Metro port (default: 8081).
  KETCH_RN_VERSION      Pin remote npm version (no registry lookup).

Starts Metro when not already reachable, installs deps, runs pod install on iOS when needed.
USAGE
}

if [[ $# -lt 1 ]]; then
  usage >&2
  exit 2
fi

PLATFORM="$1"
shift

case "$PLATFORM" in
  android|ios) ;;
  -h|--help)
    usage
    exit 0
    ;;
  *)
    echo "First argument must be android or ios, got: $PLATFORM" >&2
    usage >&2
    exit 2
    ;;
esac

PACKAGE_MODE="remote"
if [[ "${1:-}" == "local" ]]; then
  PACKAGE_MODE="local"
  shift
fi

build_only=0
stream_logs=1
full_system_logs=0
METRO_PORT="${METRO_PORT:-8081}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --build-only)
      build_only=1
      shift
      ;;
    --no-logs)
      stream_logs=0
      shift
      ;;
    --full-system-logs)
      full_system_logs=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1" >&2
    exit 1
  fi
}

require_command python3
require_command node
require_command npm

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
EXAMPLE_DIR="$REPO_ROOT/example"
PACKAGE_JSON="$EXAMPLE_DIR/package.json"
IOS_BUNDLE_ID="org.reactjs.native.example.example"
ANDROID_APP_ID="com.example"

if [[ ! -f "$PACKAGE_JSON" ]]; then
  echo "Example package.json not found: $PACKAGE_JSON" >&2
  exit 1
fi

if [[ "$PLATFORM" == "ios" ]]; then
  require_command xcrun
fi
if [[ "$PLATFORM" == "android" ]]; then
  require_command adb
fi

CONFIGURE_OUTPUT="$(python3 "$SCRIPT_DIR/configure-sample-package.py" "$PACKAGE_MODE" "$PACKAGE_JSON")"
echo "$CONFIGURE_OUTPUT"
DEPENDENCY_CHANGED=0
if echo "$CONFIGURE_OUTPUT" | grep -q "^Updated "; then
  DEPENDENCY_CHANGED=1
fi

install_deps() {
  cd "$EXAMPLE_DIR"
  if grep -q '"packageManager".*yarn' package.json 2>/dev/null && command -v yarn >/dev/null 2>&1; then
    echo "Installing dependencies with yarn..."
    yarn install
  else
    echo "Installing dependencies with npm..."
    npm install
  fi
}

metro_running() {
  curl -sf "http://localhost:${METRO_PORT}/status" >/dev/null 2>&1
}

start_metro() {
  if metro_running; then
    echo "Metro already running on port $METRO_PORT"
    return
  fi

  echo "Starting Metro on port $METRO_PORT..."
  cd "$EXAMPLE_DIR"
  if grep -q '"packageManager".*yarn' package.json 2>/dev/null && command -v yarn >/dev/null 2>&1; then
    yarn start --port "$METRO_PORT" --reset-cache >/dev/null 2>&1 &
  else
    npm run start -- --port "$METRO_PORT" >/dev/null 2>&1 &
  fi
  METRO_PID=$!

  for _ in $(seq 1 30); do
    if metro_running; then
      echo "Metro ready."
      return
    fi
    sleep 1
  done

  echo "Metro failed to start on port $METRO_PORT" >&2
  kill "$METRO_PID" >/dev/null 2>&1 || true
  exit 1
}

metro_pid=""
log_pid=""
cleanup() {
  if [[ -n "$log_pid" ]] && kill -0 "$log_pid" >/dev/null 2>&1; then
    kill "$log_pid" >/dev/null 2>&1 || true
  fi
  if [[ -n "${metro_pid:-}" ]] && kill -0 "$metro_pid" >/dev/null 2>&1; then
    kill "$metro_pid" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

install_deps

if [[ "$PLATFORM" == "ios" ]]; then
  if [[ "$DEPENDENCY_CHANGED" -eq 1 ]] || [[ ! -d "$EXAMPLE_DIR/ios/Pods" ]]; then
    echo "Running pod install..."
    cd "$EXAMPLE_DIR/ios"
    pod install
  fi
fi

start_metro
if [[ -n "${METRO_PID:-}" ]]; then
  metro_pid="$METRO_PID"
fi

cd "$EXAMPLE_DIR"

RN_ARGS=()
if [[ "$PLATFORM" == "android" && -n "${DEVICE_ID:-}" ]]; then
  RN_ARGS+=(--deviceId "$DEVICE_ID")
fi
if [[ "$PLATFORM" == "ios" && -n "${SIMULATOR_NAME:-}" ]]; then
  RN_ARGS+=(--simulator "$SIMULATOR_NAME")
fi

if [[ "$PACKAGE_MODE" == "local" ]]; then
  echo "Running example using local @ketch-com/ketch-react-native at $REPO_ROOT/package"
else
  echo "Running example using remote @ketch-com/ketch-react-native from npm (KETCH_RN_VERSION or latest)"
fi

if [[ "$build_only" -eq 1 ]]; then
  RN_ARGS+=(--no-packager)
elif metro_running; then
  RN_ARGS+=(--no-packager --port "$METRO_PORT")
fi

echo "Building and launching on $PLATFORM..."
if [[ "$PLATFORM" == "android" ]]; then
  npx react-native run-android ${RN_ARGS+"${RN_ARGS[@]}"}
else
  npx react-native run-ios ${RN_ARGS+"${RN_ARGS[@]}"}
fi

if [[ "$build_only" -eq 1 ]]; then
  echo "Build/install/launch complete (--build-only)."
  exit 0
fi

if [[ "$stream_logs" -eq 0 ]]; then
  echo "Skipping log stream (--no-logs)."
  exit 0
fi

if [[ "$PLATFORM" == "android" ]]; then
  device="${DEVICE_ID:-$(adb devices | awk 'NR > 1 && $2 == "device" { print $1; exit }')}"
  if [[ -z "$device" ]]; then
    echo "No adb device for log streaming." >&2
    exit 0
  fi
  adb -s "$device" logcat -c >/dev/null 2>&1 || true
  if [[ "$full_system_logs" -eq 1 ]]; then
    echo "Streaming logcat (full). Press Ctrl-C to stop."
    adb -s "$device" logcat -v brief
  else
    echo "Streaming logcat (ReactNativeJS + Ketch). Press Ctrl-C to stop."
    adb -s "$device" logcat -v brief ReactNativeJS:V ReactNative:V "$ANDROID_APP_ID":V "*:S"
  fi
else
  booted_id="$(xcrun simctl list devices booted | awk -F '[()]' '/Booted/ { print $2; exit }')"
  if [[ -z "$booted_id" ]]; then
    echo "No booted iOS simulator for log streaming." >&2
    exit 0
  fi
  if [[ "$full_system_logs" -eq 1 ]]; then
    predicate='process == "example"'
    echo "Streaming unified logs for process example (full). Press Ctrl-C to stop."
  else
    predicate='process == "example" AND (eventMessage CONTAINS "Ketch" OR eventMessage CONTAINS "ketch")'
    echo "Streaming unified logs filtered to Ketch messages. Press Ctrl-C to stop."
  fi
  xcrun simctl spawn "$booted_id" log stream \
    --level debug \
    --style compact \
    --predicate "$predicate"
fi
