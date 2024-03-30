# ketch-react-native

Ketch React Native Library

## Installation

```sh
yarn add ketch-react-native
```
1. (Yarn users) Install peer dependencies:
```sh
yarn add react-native-default-preference react-native-webview
````

1. Make sure your `react-native.config.js` contains the following:
 ```javascript
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./node_modules/@ketch-com/ketch-react-native/src/assets/'], // <== this line to be added
};
 ```

1. Link the static assets with `npx react-native-asset`.

1. Install Pods `npx pod-install`

## Usage

See our [Getting Started](https://developers.ketch.com/v3.0/docs/ketch-react-native-sdk-getting-started) and [Technical Documentation](https://developers.ketch.com/v3.0/docs/ketch-react-native-sdk-reference) documentation for usage instructions.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
