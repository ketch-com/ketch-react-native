import { KetchApiRegion } from '../enums';
import { Platform, NativeModules } from 'react-native';

import type { KetchMobile } from '../types';

const deviceLanguage: string =
  Platform.OS === 'ios'
    ? NativeModules.SettingsManager.settings.AppleLocale ||
      NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
    : NativeModules.I18nManager.localeIdentifier;

export enum Action {
  UPDATE_PARAMETERS = 'updateParameters',
}

export const initialParameters = {
  identities: undefined,
  language: deviceLanguage,
  jurisdiction: 'default',
  region: undefined,
  environment: undefined,
  ketchApiRegion: KetchApiRegion.prdUS,
  logLevel: undefined,
  onEnvironmentUpdated: undefined,
  onRegionUpdated: undefined,
  onJurisdictionUpdated: undefined,
  onIdentitiesUpdated: undefined,
  onConsentUpdated: undefined,
  onError: undefined,
  onPrivacyStringUpdated: undefined,
};

export const reducer = (
  state: KetchMobile,
  { type, payload }: { type: Action; payload: Partial<KetchMobile> }
) => {
  switch (type) {
    case 'updateParameters':
      return { ...state, ...payload };

    default:
      return state;
  }
};
