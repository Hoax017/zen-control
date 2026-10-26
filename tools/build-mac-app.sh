#!/usr/bin/env bash
# Builds "Zen Control.app" (one universal binary for Apple Silicon and Intel) and dist/ZenControl.dmg.
# Runs on macOS. Uses the darwin binaries from tools/build-exe.sh, or BIN_ARM64 / BIN_X64 if set.
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION=${ZEN_VERSION:-1.0.0}
ARM=${BIN_ARM64:-}
X64=${BIN_X64:-}
if [ -z "$ARM" ] || [ -z "$X64" ]; then
  mkdir -p dist/bin
  bun build server.js --compile --minify --target=bun-darwin-arm64 --outfile dist/bin/zen-control-arm64
  bun build server.js --compile --minify --target=bun-darwin-x64 --outfile dist/bin/zen-control-x64
  ARM=dist/bin/zen-control-arm64; X64=dist/bin/zen-control-x64
fi
[ -f dist/zen-tvhelper.apk ] || ./helper/build.sh  # needs the Android SDK; CI passes the signed helper instead

STAGE=dist/mac
APP="$STAGE/Zen Control.app"
rm -rf "$STAGE" dist/ZenControl.dmg
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources/dist"
lipo -create "$ARM" "$X64" -output "$APP/Contents/MacOS/zen-control"
chmod +x "$APP/Contents/MacOS/zen-control"
cp -R web known-apps.json LICENSE "$APP/Contents/Resources/"
cp dist/zen-tvhelper.apk dist/zen-tvhelper.version "$APP/Contents/Resources/dist/"
cp mac/ZenControl.icns "$APP/Contents/Resources/"
cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>Zen Control</string>
  <key>CFBundleDisplayName</key><string>Zen Control</string>
  <key>CFBundleIdentifier</key><string>io.github.hoax017.zencontrol</string>
  <key>CFBundleExecutable</key><string>zen-control</string>
  <key>CFBundleIconFile</key><string>ZenControl</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>$VERSION</string>
  <key>CFBundleVersion</key><string>$VERSION</string>
  <key>LSMinimumSystemVersion</key><string>11.0</string>
  <!-- No Dock icon: the app is a small server, its window is the browser page. -->
  <key>LSUIElement</key><true/>
  <key>NSHumanReadableCopyright</key><string>MIT — Hoax017</string>
</dict>
</plist>
PLIST
# Ad-hoc signature: required to run on Apple Silicon (not a notarized Developer ID signature).
codesign --force --deep --sign - "$APP"
ln -s /Applications "$STAGE/Applications"
hdiutil create -quiet -volname "Zen Control" -srcfolder "$STAGE" -ov -format UDZO dist/ZenControl.dmg
echo "OK -> dist/ZenControl.dmg"
