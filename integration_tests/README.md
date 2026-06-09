# Ketch React Native — Integration & E2E Testing

React Native does not have a device integration test harness today (unlike Flutter `integration_tests/`). This guide mirrors the Flutter structure and documents manual + planned automated flows.

**Central ATT guide:** [mobile-att-testing.md](../../ketch-tag/docs/design/mobile-att-testing.md#ketch-react-native)

**Headless guide:** [mobile-headless-api-testing.md](../../ketch-tag/docs/design/mobile-headless-api-testing.md#ketch-react-native)

## Test layers

| Layer | Command / location | What it validates |
| ----- | ------------------ | ----------------- |
| **Unit** | `cd package && npm test -- helpers.test` | `ketchAtt` → `ketch_att` URL param |
| **CDN host** | `KETCH_INTEGRATION_TESTS=1 npm run test:integration` | Headless CDN round-trip — **no ATT** |
| **Manual WebView** | Example app + Safari Web Inspector | `ketch_att` on document URL |
| **Device E2E** | Manual (Maestro skeleton below) | ATT prompt → reload → consent + UI |

## Prerequisites

- Node 18+
- Xcode + iOS simulator (for ATT)
- `pod install` in `package/example/ios` after native module changes
- `NSUserTrackingUsageDescription` in example app `Info.plist`

## Manual E2E flow (ATT)

From `package/example/`:

```bash
yarn install
cd ios && pod install && cd ..
yarn ios
```

1. Launch on iOS simulator
2. Load WebView; Safari Web Inspector → Console:
   ```javascript
   new URLSearchParams(location.search).get('ketch_att')
   ```
3. Tap **Request ATT** → Deny → reload/remount WebView
4. Verify `ketch_att=denied`
5. Follow [golden path](../../ketch-tag/docs/design/mobile-att-testing.md#cross-stack-att-e2e-golden-path) for consent opt-out + lanyard UI (requires ATT-configured org)

## Maestro skeleton (optional)

Planned device automation: [`example/e2e/att-webview.yaml`](../example/e2e/att-webview.yaml).

```bash
# When Maestro is installed:
maestro test example/e2e/att-webview.yaml
```

Until Maestro/Detox is wired in CI, ATT E2E remains **manual**.

## Headless quick-start (no emulator)

```bash
cd package
KETCH_INTEGRATION_TESTS=1 npm run test:integration
```

## Related docs

- Transport + bridge: [mobile-att-webview.md](../../ketch-tag/docs/design/mobile-att-webview.md)
- Android (ATT N/A): [mobile-att-testing.md](../../ketch-tag/docs/design/mobile-att-testing.md#ketch-android)
