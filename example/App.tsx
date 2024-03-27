/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';

import {KetchServiceProvider} from './src/lib/KetchServiceProvider';
import Main from './Main';
import {LogLevel} from './src/lib/enums';

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
    object: Record<string, any>,
  ) => {
    console.log('onPrivacyProtocolUpdated:key', JSON.stringify(key));
    console.log('onPrivacyProtocolUpdated:object', JSON.stringify(object));
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
      onError={onError}
      logLevel={LogLevel.TRACE}>
      <Main />
    </KetchServiceProvider>
  );
}

export default App;
