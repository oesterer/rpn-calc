#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_DIR="$ROOT_DIR/mac/RPNCalcApp"
DIST_DIR="$ROOT_DIR/dist"
APP_NAME="RPNCalc"
APP_BUNDLE="$DIST_DIR/${APP_NAME}.app"
ICON_SOURCE="$ROOT_DIR/rpn.png"
ICONSET_DIR=""

yellow() { printf '\033[33m%s\033[0m\n' "$1"; }
err() { printf '\033[31m%s\033[0m\n' "$1" >&2; }
cleanup() {
  [[ -n "$ICONSET_DIR" && -d "$ICONSET_DIR" ]] && rm -rf "$ICONSET_DIR"
}
trap cleanup EXIT

if [[ ! -f "$ICON_SOURCE" ]]; then
  err "Icon source $ICON_SOURCE not found."
  exit 1
fi

mkdir -p "$DIST_DIR"

pushd "$PACKAGE_DIR" >/dev/null
yellow "Building Swift package (release)..."
if ! swift build --configuration release; then
  err "swift build failed"
  exit 1
fi
BIN_DIR="$(swift build --configuration release --show-bin-path)"
EXECUTABLE="$BIN_DIR/RPNCalcApp"
if [[ ! -x "$EXECUTABLE" ]]; then
  err "Built executable not found at $EXECUTABLE"
  exit 1
fi
popd >/dev/null

yellow "Preparing app bundle structure..."
rm -rf "$APP_BUNDLE"
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"

APP_VERSION="${APP_VERSION:-}"
if [[ -z "$APP_VERSION" ]]; then
  if VERSION=$(git -C "$ROOT_DIR" describe --tags --dirty --always 2>/dev/null); then
    APP_VERSION="$VERSION"
  else
    APP_VERSION="1.0.0"
  fi
fi

BUNDLE_IDENTIFIER="com.oesterer.rpncalc"

cat > "$APP_BUNDLE/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>${APP_NAME}</string>
  <key>CFBundleDisplayName</key>
  <string>${APP_NAME}</string>
  <key>CFBundleIdentifier</key>
  <string>${BUNDLE_IDENTIFIER}</string>
  <key>CFBundleVersion</key>
  <string>${APP_VERSION}</string>
  <key>CFBundleShortVersionString</key>
  <string>${APP_VERSION}</string>
  <key>CFBundleExecutable</key>
  <string>${APP_NAME}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>LSMinimumSystemVersion</key>
  <string>12.0</string>
  <key>NSPrincipalClass</key>
  <string>NSApplication</string>
  <key>CFBundleIconFile</key>
  <string>${APP_NAME}</string>
</dict>
</plist>
EOF

yellow "Copying executable..."
cp "$EXECUTABLE" "$APP_BUNDLE/Contents/MacOS/${APP_NAME}"
chmod +x "$APP_BUNDLE/Contents/MacOS/${APP_NAME}"

yellow "Generating .icns from $ICON_SOURCE ..."
ICONSET_DIR="$(mktemp -d)"
ICONSET_PATH="$ICONSET_DIR/${APP_NAME}.iconset"
mkdir -p "$ICONSET_PATH"

for size in 16 32 128 256 512; do
  outfile="$ICONSET_PATH/icon_${size}x${size}.png"
  if ! sips -z "$size" "$size" "$ICON_SOURCE" --out "$outfile" >/dev/null; then
    err "Failed to create icon size ${size}x${size}"
    exit 1
  fi

  double=$((size * 2))
  outfile2="$ICONSET_PATH/icon_${size}x${size}@2x.png"
  if ! sips -z "$double" "$double" "$ICON_SOURCE" --out "$outfile2" >/dev/null; then
    err "Failed to create icon size ${double}x${double}"
    exit 1
  fi
done

if ! iconutil -c icns "$ICONSET_PATH" -o "$APP_BUNDLE/Contents/Resources/${APP_NAME}.icns" >/dev/null; then
  err "iconutil failed"
  exit 1
fi

yellow "Mac app bundle created at $APP_BUNDLE"
