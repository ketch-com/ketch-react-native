---
name: ketch-react-native-run-sample
description: Configures the in-repo React Native example for either the released @ketch-com/ketch-react-native npm package or the local file:../package link, starts Metro, builds, launches on android or ios, and streams filtered logs. Use when the user runs /ketch-react-native-run-sample.
---

# ketch-react-native-run-sample

## Instructions

When the user invokes **`/ketch-react-native-run-sample`** (or asks to run the RN example with production / local SDK):

1. `cd` to the `ketch-react-native` repository root.

2. Run the helper script with a **required** platform argument:

**Released package (default)** — rewrites `example/package.json` to use npm. Fetches the **latest version** via `npm view` unless `KETCH_RN_VERSION` is set.

```bash
bash .cursor/skills/ketch-react-native-run-sample/scripts/run-sample-app.sh android
bash .cursor/skills/ketch-react-native-run-sample/scripts/run-sample-app.sh ios
```

**Local package** — uses `file:../package`:

```bash
bash .cursor/skills/ketch-react-native-run-sample/scripts/run-sample-app.sh android local
bash .cursor/skills/ketch-react-native-run-sample/scripts/run-sample-app.sh ios local
```

The script installs dependencies, starts Metro if needed, runs `pod install` on iOS when the dependency changes, launches via `react-native run-*`, and streams logs. Stop with `Ctrl-C`.

## Manual testing basics

**Needs:** Node + yarn (or npm), Metro (started by script), Android emulator + `adb` or iOS Simulator + Xcode/CocoaPods, network for CDN/headless steps.

**Launch:** `bash .cursor/skills/ketch-react-native-run-sample/scripts/run-sample-app.sh ios local` or `... android local` from the `ketch-react-native` repo root.

**In the app:** **SDK Health Dashboard** is the first section in the example scroll view. Provider defaults: org `ethansch061226`, property `website_smart_tag`. Provider uses `autoLoad={false}` — tap **Load** explicitly.

**Smoke flow:** **Load** → dashboard rows update → **Show Consent** → WebView/Experience rows change → (iOS) **Request ATT** then **Reload WebView** → Headless **Fetch Bootstrap**.

## Overrides

```bash
KETCH_RN_VERSION=0.6.9 bash .cursor/skills/ketch-react-native-run-sample/scripts/run-sample-app.sh android
DEVICE_ID=emulator-5554 bash .cursor/skills/ketch-react-native-run-sample/scripts/run-sample-app.sh android local
SIMULATOR_NAME="iPhone 15 Pro" bash .cursor/skills/ketch-react-native-run-sample/scripts/run-sample-app.sh ios local
```

## Other options

```bash
bash .cursor/skills/ketch-react-native-run-sample/scripts/run-sample-app.sh android local --build-only
bash .cursor/skills/ketch-react-native-run-sample/scripts/run-sample-app.sh ios --full-system-logs
bash .cursor/skills/ketch-react-native-run-sample/scripts/run-sample-app.sh android --no-logs
```

## Manual QA checklist (SDK Health Dashboard)

After launch, verify on-screen panels in `example/Main.tsx` (SDK Health Dashboard section):

1. **Connection** — Init/status; org/property/env from editable fields; data center from API Region.
2. **Load** — Tap **Load** → Load row `loading`; status updates; provider callbacks fill privacy rows.
3. **WebView / Experience** — **Show Consent** → visibility/dismiss/WebView rows update via `App.tsx` callbacks.
4. **ATT (iOS)** — **Request ATT** then **Reload WebView**; `ketch_att` row updates.
5. **Headless** — **Fetch Location** / **Fetch Bootstrap** / **Cold Start** show inline results.
6. **Event log** — Timestamped callback trace at bottom of dashboard section.

Provider uses `autoLoad={false}` — **Load** is explicit.

## Notes

- Default remote mode needs **network access** for `npm view` when not pinning with `KETCH_RN_VERSION`.
- **iOS** requires CocoaPods (`pod`) and Xcode; **Android** requires `adb`.
- Example uses `packageManager: yarn@4.2.2`; script prefers **yarn** when available.
