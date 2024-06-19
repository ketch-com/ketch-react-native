import { NativeModules } from 'react-native';

/**
 * Does the best job it can to save to available preference backend.
 * For Expo Android apps you have to do a few extra steps, see README.
 */
const crossPlatformSave = async (key: string, value: string) => {
  // N.B. you have to use !!, because NativeModules is a special proxy object
  // eslint-disable-next-line no-extra-boolean-cast
  if (!!NativeModules.RNDefaultPreference) {
    // N.B. you have to use try catch otherwise you'll get an error on parsing stage in Expo app
    try {
      const defaultPreference =
        require('react-native-default-preference').default;

      return defaultPreference.set(key, value);
    } catch (e) {}
  }

  // ios expo
  const rnSettings = require('react-native').Settings;

  return rnSettings.set({ [key]: value });
};

export default crossPlatformSave;
