import { NativeModules, Platform } from 'react-native';

export const AD_IDFV_KEY = 'ketch_idfv';
export const AD_AAID_KEY = 'ketch_aaid';

type KetchAdIdentifiersModule = {
  getIdfv?: () => Promise<string | null>;
  getAaid?: () => Promise<string | null>;
};

const getNativeModule = (): KetchAdIdentifiersModule | undefined =>
  NativeModules.KetchAdIdentifiers;

/**
 * True for the two SDK-resolved ad-identifier keys, which are routed around the
 * ordinary nativeStorage read rather than through it.
 */
export function isAdIdentifierKey(key: string): boolean {
  return key === AD_IDFV_KEY || key === AD_AAID_KEY;
}

/**
 * Resolves an ad-identifier key to its platform value, or null if unavailable,
 * on the wrong platform, or if the native call fails.
 */
export async function resolveAdIdentifier(key: string): Promise<string | null> {
  const nativeModule = getNativeModule();

  if (key === AD_IDFV_KEY) {
    if (Platform.OS !== 'ios' || !nativeModule?.getIdfv) {
      return null;
    }
    try {
      return (await nativeModule.getIdfv()) ?? null;
    } catch {
      return null;
    }
  }
  if (key === AD_AAID_KEY) {
    if (Platform.OS !== 'android' || !nativeModule?.getAaid) {
      return null;
    }
    try {
      return (await nativeModule.getAaid()) ?? null;
    } catch {
      return null;
    }
  }
  return null;
}
