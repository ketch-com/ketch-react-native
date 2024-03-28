const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */

const packagePath = path.resolve(__dirname + '/../package/');

const config = {
  resolver: {
    nodeModulesPaths: [packagePath],
  },
  watchFolders: [packagePath],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
