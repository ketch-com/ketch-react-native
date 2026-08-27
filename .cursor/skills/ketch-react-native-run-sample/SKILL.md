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

**In the app:** one scroll view with three sections — **Info**, **Preference Options**, **Actions**. Config comes from `example/config.ts` (org `ketch_samples`, property `ios`); the Info rows are read-only, so changing org/property means editing that file and reloading. Provider uses `autoLoad={false}` — tap **Reload** explicitly.

**Smoke flow:** **Reload** → banner appears → **Consent** / **Preferences** → **Privacy Strings** (console) → (iOS) **Request ATT**, then **Reload**.

**Where output goes:** the app renders no diagnostics. Every provider callback is a `console.log` prefixed `[KetchSample]`, so keep the script's log stream attached (omit `--no-logs`) or you will see nothing.

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

## Manual QA checklist

Sections and controls as they exist in `example/Main.tsx`:

1. **Info** — Org Code, Property, Environment, Language are static from `config.ts`. Jurisdiction and Region start `Not set` and fill in from the `onJurisdictionUpdated` / `onRegionUpdated` callbacks after a load.
2. **Preference Options** — Allowed Tabs (checkboxes) and Initial Tab (radio) feed `showPreferenceExperience`.
3. **Actions** — **Reload** (`load()`), **Consent** (`showConsentExperience()`), **Preferences**, **Privacy Strings** (dumps `DefaultPreference.getAll()` to console), **Apply CSS** (hides the banner primary button), **Request ATT** (iOS only).

Provider uses `autoLoad={false}` — **Reload** is explicit.

The headless methods (`getRegion`, `getJurisdiction`, `fetchConsent`, `getSubscriptions`, `invokeRight`, the privacy-string getters, `trigger`) have no UI here. Exercising them by hand means adding a temporary panel to `Main.tsx`; render results on screen with their runtime `typeof`, since a string `"false"` and a boolean `false` are indistinguishable in a log line.

## Before you run: the app may not be using your working tree

`local` mode resolves `@ketch-com/ketch-react-native` through the package's `react-native` field, which points at `lib/module/index` — the **built** output. Metro watching `../package` does not change that. So after any edit under `package/src`:

```bash
cd package && npm run prepare
```

`run-sample-app.sh` does not do this for you. And because `file:../package` is materialized as a copy in `example/node_modules` rather than symlinked, a stale copy can persist — `yarn install` (which the script runs) refreshes it from `package/`, so build first, then launch.

Quick check that the app has your code:

```bash
grep -c "export \* from './headless'" package/lib/typescript/src/index.d.ts
```

## Android: JDK

Gradle needs a JDK on `PATH`. Without one the build fails with `Unable to locate a Java Runtime` **and the script still exits 0**, so check the output rather than the exit code. Android Studio ships one:

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

## Notes

- Default remote mode needs **network access** for `npm view` when not pinning with `KETCH_RN_VERSION`.
- **iOS** requires CocoaPods (`pod`) and Xcode; **Android** requires `adb`.
- Example uses `packageManager: yarn@4.2.2`; script prefers **yarn** when available.
