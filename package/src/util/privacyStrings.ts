import nativeStorage from './nativeStorage';

/**
 * Storage keys the ketch tag writes IAB privacy strings to. Names match the IAB
 * specifications and the keys used by the Android and iOS SDKs.
 */
export const IAB_TCF_TC_STRING = 'IABTCF_TCString';
export const IAB_US_PRIVACY_STRING = 'IABUSPrivacy_String';
export const IAB_GPP_HDR_GPP_STRING = 'IABGPP_HDR_GppString';

/**
 * Read a value the tag wrote to native storage.
 * Async, unlike the synchronous Android equivalent, because native storage access
 * on React Native is asynchronous.
 */
export const getSavedString = (key: string): Promise<string> =>
  nativeStorage.read(key);

/** Retrieve the IABTCF_TCString value written by the tag. */
export const getTCFTCString = (): Promise<string> =>
  getSavedString(IAB_TCF_TC_STRING);

/** Retrieve the IABUSPrivacy_String value written by the tag. */
export const getUSPrivacyString = (): Promise<string> =>
  getSavedString(IAB_US_PRIVACY_STRING);

/** Retrieve the IABGPP_HDR_GppString value written by the tag. */
export const getGPPHDRGppString = (): Promise<string> =>
  getSavedString(IAB_GPP_HDR_GPP_STRING);
