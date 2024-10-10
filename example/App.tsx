/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';

import {
  KetchServiceProvider,
  LogLevel,
  OnHideExperienceArgument,
} from '@ketch-com/ketch-react-native';
import Main from './Main';

function App(): React.JSX.Element {
  const onEnvironmentUpdated = (data: string) => {
    console.log('onEnvironmentUpdated', JSON.stringify(data));
  };

  const onRegionUpdated = (data: string) => {
    console.log('onRegionUpdated', JSON.stringify(data));
  };

  const onJurisdictionUpdated = (data: string) => {
    console.log('onJurisdictionUpdated', JSON.stringify(data));
  };

  const onIdentitiesUpdated = (data: Record<string, string>) => {
    console.log('onIdentitiesUpdated', JSON.stringify(data));
  };

  const onConsentUpdated = (data: Record<string, any>) => {
    console.log('onConsentUpdated', JSON.stringify(data));
  };

  const onPrivacyProtocolUpdated = (
    key: string,
    array: (string | Record<string, string>)[],
  ) => {
    console.log('onPrivacyProtocolUpdated:key', key);
    console.log('onPrivacyProtocolUpdated:array', array);
  };

  const onHideExperience = (data: OnHideExperienceArgument) => {
    console.log('onHideExperience', JSON.stringify(data));
  };

  const onError = (errorMsg: string) => {
    console.log(errorMsg);
  };

  return (
    <KetchServiceProvider
      organizationCode="ketch_samples"
      propertyCode="react_native_sample_app"
      identities={{email: 'test@ketch.com'}}
      onEnvironmentUpdated={onEnvironmentUpdated}
      onRegionUpdated={onRegionUpdated}
      onJurisdictionUpdated={onJurisdictionUpdated}
      onIdentitiesUpdated={onIdentitiesUpdated}
      onConsentUpdated={onConsentUpdated}
      onPrivacyProtocolUpdated={onPrivacyProtocolUpdated}
      onHideExperience={onHideExperience}
      onError={onError}
      logLevel={LogLevel.TRACE}>
      <Main />
    </KetchServiceProvider>
  );
}

export default App;
