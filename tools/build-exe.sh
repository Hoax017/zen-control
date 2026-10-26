#!/usr/bin/env bash
# Builds one ready-to-run zip per system into dist/: zen-control-<os>.zip
# Each zip holds a single executable (Node bundled by Bun), the web UI, the app database and the TV helper APK.
# Needs: bun (https://bun.sh) and dist/zen-tvhelper.apk (./helper/build.sh).
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f dist/zen-tvhelper.apk ] || ./helper/build.sh
TARGETS=${TARGETS:-"bun-windows-x64 bun-darwin-arm64 bun-darwin-x64 bun-linux-x64 bun-linux-arm64"}
for target in $TARGETS; do
  os=${target#bun-}
  out="dist/zen-control-$os"
  rm -rf "$out" "$out.zip"
  mkdir -p "$out/dist"
  exe="zen-control"; [[ $os == windows-* ]] && exe="zen-control.exe"
  bun build server.js --compile --minify --target="$target" --outfile "$out/$exe"
  cp -R web known-apps.json LICENSE "$out/"
  cp dist/zen-tvhelper.apk dist/zen-tvhelper.version "$out/dist/"
  case "$os" in
    windows-*) printf '@echo off\r\ncd /d "%%~dp0"\r\nzen-control.exe\r\npause\r\n' > "$out/Zen Control.bat" ;;
    darwin-*) printf '#!/bin/bash\ncd "$(dirname "$0")"\nxattr -d com.apple.quarantine zen-control 2>/dev/null\n./zen-control\n' > "$out/Zen Control.command"; chmod +x "$out/Zen Control.command" ;;
  esac
  (cd dist && zip -qr "zen-control-$os.zip" "zen-control-$os")
  rm -rf "$out"
  echo "OK -> dist/zen-control-$os.zip"
done
