import examplePrivacyKeys from '@/constants/examplePrivacyKeys';
import * as SharedPref from 'expo-shared-preferences';

const crossPlatfromReadAndroid = () => {
  return examplePrivacyKeys.reduce((result, key) => {
    return result.then(async (prevResult: any) => {
      prevResult[key] = await SharedPref.getItemAsync(key);
      return prevResult;
    })
  }, Promise.resolve({}))
};

export default crossPlatfromReadAndroid;
