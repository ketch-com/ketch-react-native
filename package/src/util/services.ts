import { Alert } from 'react-native';
import DefaultPreference from 'react-native-default-preference';

export const savePrivacyToStorage = async (
  privacyProtocolObject: Record<string, string>
) => {
  for (const key in privacyProtocolObject) {
    try {
      const value = privacyProtocolObject[key];

      if (value) await DefaultPreference.set(key, value);
    } catch (error: any) {
      Alert.alert('Saving privacy data to storage error', error.message);
    }
  }
};
