/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {Platform} from 'react-native';

import {
  KetchServiceProvider,
  type Consent,
} from '@ketch-com/ketch-react-native';
import Main from './Main';
import {InfoProvider, useInfo} from './src/dashboard/InfoContext';
import {formatConsent} from './src/dashboard/consentLogging';
import {SAMPLE_CONFIG} from './config';
import {
  DEV_URL_OVERRIDES_ENABLED,
  forAndroidEmulator,
  forSimulator,
} from './devUrlOverrides';

function AppWithCallbacks(): React.JSX.Element {
  const {setJurisdiction, setRegion} = useInfo();

  return (
    <KetchServiceProvider
      organizationCode={SAMPLE_CONFIG.organizationCode}
      propertyCode={SAMPLE_CONFIG.propertyCode}
      environmentName={SAMPLE_CONFIG.environmentName}
      languageCode={SAMPLE_CONFIG.languageCode}
      jurisdictionCode={SAMPLE_CONFIG.jurisdictionCode}
      regionCode={SAMPLE_CONFIG.regionCode}
      identities={SAMPLE_CONFIG.identities}
      dataCenter={SAMPLE_CONFIG.dataCenter}
      autoLoad={false}
      webResourceUrlOverrides={
        DEV_URL_OVERRIDES_ENABLED
          ? Platform.OS === 'android'
            ? forAndroidEmulator
            : forSimulator
          : undefined
      }
      onEnvironmentUpdated={environment => {
        console.log('[KetchSample] onEnvironmentUpdated:', environment);
      }}
      onRegionUpdated={region => {
        console.log('[KetchSample] onRegionUpdated:', region);
        setRegion(region);
      }}
      onJurisdictionUpdated={jurisdiction => {
        console.log('[KetchSample] onJurisdictionUpdated:', jurisdiction);
        setJurisdiction(jurisdiction);
      }}
      onIdentitiesUpdated={identities => {
        console.log(
          '[KetchSample] onIdentitiesUpdated:',
          JSON.stringify(identities),
        );
      }}
      onConsentUpdated={(consent: Consent) => {
        console.log('[KetchSample] onConsentUpdated:', formatConsent(consent));
      }}
      onPrivacyProtocolUpdated={(protocol, values) => {
        console.log(
          '[KetchSample] onPrivacyProtocolUpdated:',
          protocol,
          JSON.stringify(values),
        );
      }}
      onHasShownExperience={() => {
        console.log('[KetchSample] onHasShownExperience');
      }}
      onHideExperience={reason => {
        console.log('[KetchSample] onHideExperience:', reason);
      }}
      onError={errorMessage => {
        console.log('[KetchSample] onError:', errorMessage);
      }}
      onNativeStoragePut={(key, value) => {
        console.log('[KetchSample] onNativeStoragePut:', key, value);
      }}>
      <Main />
    </KetchServiceProvider>
  );
}

function App(): React.JSX.Element {
  return (
    <InfoProvider>
      <AppWithCallbacks />
    </InfoProvider>
  );
}

export default App;
