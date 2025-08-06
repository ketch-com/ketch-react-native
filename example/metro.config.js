const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

const packagePath = path.resolve(__dirname + '/../package/');

const config = {
  resolver: {
    nodeModulesPaths: [packagePath],
  },
  watchFolders: [packagePath],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
