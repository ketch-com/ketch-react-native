# ketch-react-native

This repository contains the Ketch [React Native](https://reactnative.dev/) package in the [`/package`](/package/) folder and an example app in the [`/example`](/example/) folder.

## Prerequisites

- `node` - We use `node v20.11.1` (LTS).
  - It's recommended to use [Node Version Manager (NVM)](https://github.com/nvm-sh/nvm) to manage your Node.js versions.
- `yarn` - We use `yarn v4.1.1`

## Usage

1. Install package and dependencies

```sh
# using npm
npm install @ketch-com/ketch-react-native react-native-default-preference react-native-webview

# OR using yarn
yarn add @ketch-com/ketch-react-native react-native-default-preference react-native-webview
```

2. Configure static assets

- In the root directory of your app, create or update `react-native.config.js` with the following `assets` line:

  ```javascript
  module.exports = {
    project: {
      ios: {},
      android: {},
    },
    assets: ["./node_modules/@ketch-com/ketch-react-native/src/assets/"], // <== line to add
  };
  ```

- Link assets:

  ```sh
  npx react-native-asset
  ```

3. Install Pods **(IOS)**

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

Where `<YOUR_ORGANIZATION_CODE>`, `<YOUR_PROPERTY_CODE>`, `YOUR_IDENTIFIER_NAME`, and `<YOUR_IDENTIFIER_VALUE>` are replaced with those configured within the Ketch application.

See our [Getting Started](https://developers.ketch.com/v3.0/docs/ketch-react-native-sdk-getting-started) and [Technical Documentation](https://developers.ketch.com/v3.0/docs/ketch-react-native-sdk-reference) documentation for further usage instructions.

## Running

See the example app [README](/example/README.md).

## Contributions

See the package [README](/package/README.md).
