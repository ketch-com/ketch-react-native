const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */

const packagePath = '/Users/justin/Source/ketch-com/ketch-react-native';

const config = {
  resolver: {
    nodeModulesPaths: [packagePath],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
