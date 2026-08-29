# RPN Calculator Suite

This repository contains a set of Reverse Polish Notation (RPN) calculators that share the same command vocabulary across multiple user interfaces:

- **Terminal CLI** (`rpn_calc.py`) – an interactive shell app that supports immediate operator keys and stack manipulation commands.
- **Web UI** (`web/`) – a browser-based calculator with buttons and keyboard shortcuts, styled for desktop use.
- **macOS App** (`mac/RPNCalcApp/`) – a SwiftUI application packaged as a native `.app`, featuring keyboard capture and a help sheet.
- **iOS App** (`mobile/`) – an Expo/React Native application with a touch-first keypad, scientific panel, dark mode, help sheet, and EAS build profiles.

All implementations operate on a shared feature set:

- Push numbers onto the stack by typing them and pressing Enter (CLI & mac) or clicking Enter (web).
- Immediate execution of arithmetic operators (`+`, `-`, `*`, `/`) when pressed.
- Stack commands: `dup`, `drop`, `swap`, `clear`/`clr`.
- Mathematical operations: `pow`, `sq`, `sqrt`, `sin`, `cos`, `tan`, `log`, `ln`, `inv`, `neg`.
- Constants: `pi`, `e`.
- `help` (CLI/mac) displays the command reference; `quit` exits the CLI.
- Stack display always shows the five most recent entries with the newest at the bottom.

## Repository Layout

```
rpn-calc/
├─ README.md                # Project overview (this file)
├─ rpn_calc.py              # Terminal calculator
├─ web/
│  ├─ index.html            # Browser UI entry point
│  ├─ style.css             # Browser styles
│  └─ app.js                # Browser logic
├─ mac/
│  └─ RPNCalcApp/           # SwiftUI macOS app (Swift Package Manager project)
├─ mobile/                       # Expo iOS app (TypeScript/React Native)
├─ scripts/
│  ├─ build_mac_app.sh      # Build and package the macOS .app bundle
│  └─ install_mac_app.sh    # Install the packaged app into /Applications
└─ rpn.png                  # App icon source used for macOS packaging
```

## Terminal Calculator

### Run

```bash
python3 rpn_calc.py
```

### Highlights

- Immediate operator execution (`+-*/`) without pressing Enter if the stack has operands.
- Blank input re-renders the stack.
- `help` prints the full command list.
- Handles invalid input and stack underflows gracefully.

## Browser Calculator

### Serve Locally

Any static file server works. For example:

```bash
python3 -m http.server --directory web
```

Then navigate to <http://localhost:8000> and interact via keyboard or mouse.

### Features

- Buttons for digits, stack ops, math ops, and constants.
- Keyboard support mirrors the CLI behavior (operators execute immediately; digits populate the entry field).
- Status banner reports operation results or errors.

## macOS App

### Build

Requires Xcode command-line tools (Swift 5.7+). From the repo root:

```bash
scripts/build_mac_app.sh
```

- Produces `dist/RPNCalc.app`.
- Generates the application icon from `rpn.png` automatically.
- Embeds an `Info.plist` with bundle metadata and version (derived from `git describe` when available).

### Install

```bash
scripts/install_mac_app.sh
```

- Copies the built app into `/Applications` (override the destination via `INSTALL_TARGET=/path`).

### Run

Launch `RPNCalc` from Spotlight or Finder. Keyboard shortcuts mirror the CLI (digits, operators, `pi`, `e`, `h` for help). A help sheet is available via the `help` button or pressing `h`.

## iOS App (Expo)

Requires Node.js 22.13 or newer. From the repository root:

```bash
cd mobile
npm install
npm run ios
```

The app uses Expo SDK 57 and generates its iOS project on demand. The bundle identifier is `com.oesterer.rpncalc`. The 1024×1024 application icon is configured through `mobile/assets/icon.png`; Expo/EAS generates the required iOS icon sizes.

To validate the project:

```bash
npm run typecheck
npm run doctor
```

For an installable simulator build or an App Store build:

```bash
npx eas-cli@latest build --platform ios --profile preview
npx eas-cli@latest build --platform ios --profile production
```

The first EAS command will ask you to sign in and associate the local app with an Expo project. A production device/App Store build also requires an Apple Developer account and signing credentials.

## Development Notes

- The CLI and web calculator remain dependency-light; the mobile app uses Expo and React Native packages managed in `mobile/package.json`.
- Web calculator JavaScript is bundled as plain ES modules; no build step.
- Swift package uses SwiftUI and AppKit; ensure your Xcode toolchain matches the macOS SDK.
- `.gitignore` excludes `dist/` and SwiftPM build directories.

## License

MIT License. See `LICENSE` if present, or add one as needed.
