import { NativeModules } from 'react-native';
import crossPlatformRead from './crossPlatformRead';
import crossPlatformSave from './crossPlatformSave';

const nativeStorage = {
  read: (key: string, defaultValue = ''): Promise<string> =>
    crossPlatformRead(key).then((v) => v ?? defaultValue),

  write: (key: string, value: string): Promise<unknown> =>
    crossPlatformSave(key, value),

  remove: async (key: string): Promise<void> => {
    if (!!NativeModules.RNDefaultPreference) {
      try {
        const p = require('react-native-default-preference').default;
        await p.clear(key);
        return;
      } catch (_) {}
    }
    require('react-native').Settings.set({ [key]: null });
  },

  /**
   * Removes every stored key that begins with one of the given prefixes.
   * Returns the count removed.
   * NOTE: key enumeration is only available via RNDefaultPreference (Android).
   * On iOS (Settings module) this is a no-op and returns 0.
   */
  removeValues: async (prefixes: string[]): Promise<number> => {
    if (!NativeModules.RNDefaultPreference) return 0;
    try {
      const p = require('react-native-default-preference').default;
      const all: Record<string, string> = await p.getAll();
      const matching = Object.keys(all).filter((k) =>
        prefixes.some((prefix) => k.startsWith(prefix))
      );
      await Promise.all(matching.map((k) => p.clear(k)));
      return matching.length;
    } catch (_) {
      return 0;
    }
  },
};

export default nativeStorage;
