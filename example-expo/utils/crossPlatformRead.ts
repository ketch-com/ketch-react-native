import examplePrivacyKeys from '@/constants/examplePrivacyKeys';
import { Settings } from 'react-native';

/**
 * Because neither Settings nor Expo Shared Preferences have a getAll method, we
 * provide a few example keys here that were saved in onPrivacyProtocolUpdated.
 * You can update the keys manually to include the ones you're interested.
 */
const crossPlatfromReadIos = () => {
  return examplePrivacyKeys.reduce((result: any, key) => {
    result[key] = Settings.get(key);
    return result;
  }, {})
};

export default crossPlatfromReadIos;
