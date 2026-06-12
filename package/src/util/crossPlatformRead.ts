import { NativeModules } from 'react-native';

/**
 * Reads a value from the same preference backend used by crossPlatformSave.
 */
const crossPlatformRead = async (key: string): Promise<string | null> => {
  // eslint-disable-next-line no-extra-boolean-cast
  if (!!NativeModules.RNDefaultPreference) {
    try {
      const defaultPreference =
        require('react-native-default-preference').default;

      const value = await defaultPreference.get(key);
      return value ?? null;
    } catch (e) {}
  }

  const rnSettings = require('react-native').Settings;
  const value = rnSettings.get(key);
  return typeof value === 'string' ? value : null;
};

export default crossPlatformRead;
