import { NativeModules, Platform } from 'react-native';

/**
 * Handles different preference backends
 */
const crossPlatformSave = async (key: string, value: string) => {
  // TODO: figure out a better name to detect Expo vs RN runtime
  // N.B. you have to use !!, because NativeModules is a special proxy object
  // eslint-disable-next-line no-extra-boolean-cast
  if (!!NativeModules.RNDefaultPreference) {
    // N.B. you have to use try catch otherwise you'll get an error on parsing stage IIUC
    try {
      const defaultPreference =
        require('react-native-default-preference').default;

      return defaultPreference.set(key, value);
    } catch (e) {}
  }

  if (Platform.OS === 'ios') {
    const rnSettings = require('react-native').Settings;

    return rnSettings.set({ [key]: value });
  } else if (Platform.OS === 'android') {
    // expo-shared-preferences
    // const sharedPreferences;
  }
};

export default crossPlatformSave;
