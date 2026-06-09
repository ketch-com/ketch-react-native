import { NativeModules, Platform } from 'react-native';

type KetchAttModule = {
  getStatusString: () => Promise<string>;
  requestTrackingAuthorization: () => Promise<string>;
};

const nativeModule = NativeModules.KetchAtt as KetchAttModule | undefined;

/**
 * iOS ATT status as `ketch_att` query value (parity with native iOS SDK).
 * Returns `null` on Android or when the native module is unavailable.
 */
export async function trackingAuthorizationStatusString(): Promise<
  string | null
> {
  if (Platform.OS !== 'ios' || !nativeModule?.getStatusString) {
    return null;
  }
  try {
    return await nativeModule.getStatusString();
  } catch {
    return null;
  }
}

/**
 * Shows the system ATT prompt. Returns the resulting status string, or `null` on non-iOS.
 */
export async function requestTrackingAuthorization(): Promise<string | null> {
  if (Platform.OS !== 'ios' || !nativeModule?.requestTrackingAuthorization) {
    return null;
  }
  try {
    return await nativeModule.requestTrackingAuthorization();
  } catch {
    return null;
  }
}
