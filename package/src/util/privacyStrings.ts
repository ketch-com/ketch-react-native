import nativeStorage from './nativeStorage';

/**
 * Storage keys the ketch tag writes IAB privacy strings to. Names match the IAB
 * specifications and the keys used by the Android and iOS SDKs.
 */
export const IAB_TCF_TC_STRING = 'IABTCF_TCString';
export const IAB_US_PRIVACY_STRING = 'IABUSPrivacy_String';
export const IAB_GPP_HDR_GPP_STRING = 'IABGPP_HDR_GppString';

/** Reads a single key from whichever backend the tag actually wrote it to. */
export type PreferenceReader = (key: string) => Promise<string>;

/**
 * Read a value the tag wrote to storage. Defaults to native storage, but accepts
 * a custom reader so callers whose provider is configured with a `preferenceStorage`
 * backend can read from the same place the tag wrote to, instead of always falling
 * back to native storage.
 * Async, unlike the synchronous Android equivalent, because native storage access
 * on React Native is asynchronous.
 */
export const getSavedString = (
  key: string,
  read: PreferenceReader = nativeStorage.read
): Promise<string> => read(key);

/** Retrieve the IABTCF_TCString value written by the tag. */
export const getTCFTCString = (read?: PreferenceReader): Promise<string> =>
  getSavedString(IAB_TCF_TC_STRING, read);

/** Retrieve the IABUSPrivacy_String value written by the tag. */
export const getUSPrivacyString = (read?: PreferenceReader): Promise<string> =>
  getSavedString(IAB_US_PRIVACY_STRING, read);

/** Retrieve the IABGPP_HDR_GppString value written by the tag. */
export const getGPPHDRGppString = (read?: PreferenceReader): Promise<string> =>
  getSavedString(IAB_GPP_HDR_GPP_STRING, read);
