import { Platform, NativeModules } from 'react-native';

/** Raw device locale identifier (e.g. "en_US" on Android, "en-US"/"en_US" on iOS). */
export function getDeviceLanguage(): string {
  return Platform.OS === 'ios'
    ? NativeModules.SettingsManager?.settings?.AppleLocale ||
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
        'en'
    : NativeModules.I18nManager?.localeIdentifier || 'en';
}

/** Matches ketch-tag's `formatLanguage` ("fr-CA"), tolerant of the "fr_CA" form. */
export function formatLanguageTag(raw: string): string {
  if (!raw) return 'en';
  const [root, dialect] = raw.split(/[-_]/);
  return dialect
    ? `${root!.toLowerCase()}-${dialect.toUpperCase()}`
    : root!.toLowerCase();
}

export function getDeviceLanguageTag(): string {
  return formatLanguageTag(getDeviceLanguage());
}
