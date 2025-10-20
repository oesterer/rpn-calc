#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_APP="$ROOT_DIR/dist/RPNCalc.app"
TARGET_DIR="${INSTALL_TARGET:-/Applications}"
APP_NAME="RPNCalc.app"

err() { printf '\033[31m%s\033[0m\n' "$1" >&2; }
yellow() { printf '\033[33m%s\033[0m\n' "$1"; }

target="$TARGET_DIR/$APP_NAME"

if [[ ! -d "$DIST_APP" ]]; then
  err "Built app not found at $DIST_APP. Run scripts/build_mac_app.sh first."
  exit 1
fi

yellow "Installing $APP_NAME to $TARGET_DIR"
mkdir -p "$TARGET_DIR"
rsync -a --delete "$DIST_APP/" "$target/"

yellow "Installation complete: $target"
