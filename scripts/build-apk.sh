#!/usr/bin/env bash
set -euo pipefail

# Build script for Vende Fácil Pro Android APK
# The generated APK is a wrapper that loads the published web app.
# Requirements: Android SDK, JDK 17+, and the Capacitor Android platform added.
# Usage:
#   bash scripts/build-apk.sh         # debug build
#   bash scripts/build-apk.sh --release # release build (recommended for distribution)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE_MODE=false
APK_OUTPUT_NAME="vende-facil-pro-release.apk"
DEBUG_APK_NAME="vende-facil-pro-debug.apk"

if [[ "${1:-}" == "--release" ]]; then
  RELEASE_MODE=true
fi

echo "🤖 Preparing Vende Fácil Pro Android wrapper..."
cd "$ROOT_DIR"

# Ensure the Android platform exists
if [[ ! -d "$ROOT_DIR/android" ]]; then
  echo "📦 Adding Android platform via Capacitor..."
  bunx cap add android
fi

echo "🔄 Syncing Capacitor configuration..."
bunx cap sync android

echo "🏗️ Building Android APK..."
cd "$ROOT_DIR/android"

if [[ "$RELEASE_MODE" == true ]]; then
  ./gradlew assembleRelease
  SOURCE_APK="app/build/outputs/apk/release/app-release-unsigned.apk"
  TARGET_APK="$ROOT_DIR/$APK_OUTPUT_NAME"

  # Fallback for already-signed release builds
  if [[ ! -f "$SOURCE_APK" ]]; then
    SOURCE_APK="app/build/outputs/apk/release/app-release.apk"
  fi
else
  ./gradlew assembleDebug
  SOURCE_APK="app/build/outputs/apk/debug/app-debug.apk"
  TARGET_APK="$ROOT_DIR/$DEBUG_APK_NAME"
fi

if [[ ! -f "$SOURCE_APK" ]]; then
  echo "❌ APK not found at $SOURCE_APK"
  exit 1
fi

cp "$SOURCE_APK" "$TARGET_APK"
echo "✅ APK ready: $TARGET_APK"
echo ""
echo "💡 Tip: Upload this file to Google Drive and share the public link with buyers."
