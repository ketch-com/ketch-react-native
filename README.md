# ketch-react-native

This repository contains the Ketch [React Native](https://reactnative.dev/) package in the [`/package`](/package/) folder and an example app in the [`/example`](/example/) folder.

## Prerequisites

- `node` - We use `node v20.11.1` (LTS).
  - It's recommended to use [Node Version Manager (NVM)](https://github.com/nvm-sh/nvm) to manage your Node.js versions.

## Usage (Non-Expo Apps)

For a working example, see the [example](./example/) directory.

1. Install core dependency

```sh
npm install @ketch-com/ketch-react-native --registry=https://npm.pkg.github.com --legacy-peer-deps
```

When running the above command, you may see a `401 Unauthorized` response. This occurs because Github packages require authentication through a personal access token (PAT). See their [Authentication to Github Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-with-a-personal-access-token) document to set this up.

2. Install peer dependencies

```sh
npm install react-native-default-preference react-native-webview
```

3. **(IOS)** Install Pods

```sh
cd ios && pod install
```

4. Use the `<KetchServiceProvider/>` component

```tsx
<KetchServiceProvider
  organizationCode="YOUR_ORGANIZATION_CODE"
  propertyCode="YOUR_PROPERTY_CODE"
  identities={{ YOUR_IDENTIFIER_NAME: "YOUR_IDENTIFIER_VALUE" }}
>
  {/* The rest of your app code here */}
</KetchServiceProvider>
```

Where `YOUR_ORGANIZATION_CODE`, `YOUR_PROPERTY_CODE`, `YOUR_IDENTIFIER_NAME`, and `YOUR_IDENTIFIER_VALUE` are replaced with those configured within the Ketch application.

See our [Getting Started](https://developers.ketch.com/v3.0/docs/ketch-react-native-sdk-getting-started) and [Technical Documentation](https://developers.ketch.com/v3.0/docs/ketch-react-native-sdk-reference) documentation for further usage instructions.

## Headless API (web/v3, pre-WebView)

Use CDN HTTP for ATT-critical flows **before** the WebView loads—location, config, and consent with `protocols`. Contract: [mobile-headless-api.md](https://github.com/ketch-com/ketch-tag/blob/main/docs/design/mobile-headless-api.md).

Pass `dataCenter` on `KetchServiceProvider`. Headless methods use TypeScript `fetch`. `getConsent()` still returns the in-memory cache from the WebView bridge.

On **iOS**, the WebView receives `ketch_att` automatically via native module `KetchAtt` (run `pod install` after upgrading). Override with `ketchAtt` on `KetchServiceProvider`, or read status with `trackingAuthorizationStatusString()` before headless calls.

```tsx
const {
  fetchLocation,
  fetchBootstrapConfiguration,
  fetchFullConfiguration,
  fetchConsent,
  fetchProtocols,
  setConsentOnServer,
} = useKetchService();

await fetchLocation?.();
await fetchBootstrapConfiguration?.();
await fetchFullConfiguration?.({
  organizationCode: 'YOUR_ORG',
  propertyCode: 'YOUR_PROPERTY',
  environmentCode: 'production',
  jurisdictionCode: 'us-ca',
  languageCode: 'en-US',
  hash: hashFromBootstrap,
});
await fetchConsent?.(consentConfig);
await setConsentOnServer?.(consentUpdate);

const {
  invokeRight,
  getProfile,
  putProfile,
  getSubscriptions,
  setSubscriptions,
  fetchSubscriptionsConfiguration,
  preferenceQRUrl,
  webReport,
} = useKetchService();

await invokeRight?.(invokeRightRequest);
await getProfile?.(profileRequest);
await putProfile?.(putProfileRequest);
await getSubscriptions?.(subscriptionsRequest);
await setSubscriptions?.(subscriptionsRequest);
await fetchSubscriptionsConfiguration?.(subConfigRequest);
const qrUrl = preferenceQRUrl?.(preferenceQrRequest);
await webReport?.('mychannel', reportRequest);
```

For a standalone client without the provider, use `KetchHeadless` from `@ketch-com/ketch-react-native` (see `package/src/headless/`).

## Usage (**Expo Apps Only**)

For a working example, see the [example-expo](./example-expo/) directory.

1. Install core dependency

```sh
npm install @ketch-com/ketch-react-native --registry=https://npm.pkg.github.com --legacy-peer-deps
```

When running the above command, you may see a `401 Unauthorized` response. This occurs because Github packages require authentication through a personal access token (PAT). See their [Authentication to Github Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-with-a-personal-access-token) document to set this up.

2. Install peer dependencies

```sh
npx expo install expo-shared-preferences react-native-webview
```

3. (**Android**) Configure SharedPreferences import

Create a separate `SharedPreferences.android.ts` file:

```tsx
// Place this in a separate .android.ts file so it is only imported on Android
import * as SharedPreferences from "expo-shared-preferences";

export default SharedPreferences;
```

Next, import it in the file where you will use `KetchServiceProvider`:

```tsx
// then when setting up KetchServiceProvider
import SharedPrefences from './SharedPreferences';

<KetchServiceProvider
  // ...
  preferenceStorage={SharedPreferences}
>
```

4. Setup a Development Build

To run through Expo on Android, you must use a development build. See the [Expo Documentation](https://docs.expo.dev/develop/development-builds/create-a-build/) for steps to create a development build.

5. **(IOS)** Install Pods

```sh
cd ios && pod install
```

6. Use the `<KetchServiceProvider/>` component

```tsx
<KetchServiceProvider
  organizationCode="YOUR_ORGANIZATION_CODE"
  propertyCode="YOUR_PROPERTY_CODE"
  identities={{ YOUR_IDENTIFIER_NAME: "YOUR_IDENTIFIER_VALUE" }}
>
  {/* The rest of your app code here */}
</KetchServiceProvider>
```

Where `YOUR_ORGANIZATION_CODE`, `YOUR_PROPERTY_CODE`, `YOUR_IDENTIFIER_NAME`, and `YOUR_IDENTIFIER_VALUE` are replaced with those configured within the Ketch application.

See our [Getting Started](https://developers.ketch.com/v3.0/docs/ketch-react-native-sdk-getting-started) and [Technical Documentation](https://developers.ketch.com/v3.0/docs/ketch-react-native-sdk-reference) documentation for further usage instructions.

## Running

See the example app [README](/example/README.md), or the example expo app [README](/example-expo/README.md).

## Contributions

See the package [README](/package/README.md).
