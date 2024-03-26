import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const savePrivacyToStorage = async (
  privacyProtocolObject: Record<string, string>
) => {
  for (const key in privacyProtocolObject) {
    try {
      const value = privacyProtocolObject[key];

      await AsyncStorage.setItem(key, value || '');
    } catch (error: any) {
      Alert.alert('Saving privacy data to storage error', error.message);
    }
  }
};
