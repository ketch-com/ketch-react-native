import DefaultPreference from 'react-native-default-preference';

/**
 * Save privacy protocol data to local storage
 * @param privacyProtocolArray Array of privacy protocol data
 *   We expect the following structure:
 *    - privacyProtocolArray[0]: the privacy string
 *    - privacyProtocolArray[1]: an object with various protocol data key:value pairs
 */
export const savePrivacyToStorage = async (
  privacyProtocolArray: (string | Record<string, string>)[]
) => {
  try {
    if (privacyProtocolArray.length > 1) {
      const privacyProtocolObject = privacyProtocolArray[1] as Record<
        string,
        any
      >;
      Object.entries(privacyProtocolObject).forEach(async ([key, value]) => {
        await DefaultPreference.set(key, String(value));
      });
    } else {
      console.error('Not enough elements in privacy protocol array');
    }
  } catch (error: any) {
    console.error('Error saving privacy protocol values', error.message);
  }
};
