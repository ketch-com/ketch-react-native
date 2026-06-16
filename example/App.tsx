/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {Platform} from 'react-native';

import {
  KetchDataCenter,
  KetchServiceProvider,
  PrivacyProtocol,
  type Consent,
} from '@ketch-com/ketch-react-native';
import Main, {DashboardProvider, useDashboard, formatConsent} from './Main';

/** Flip ENABLED to redirect UAT tag script URLs to local dev servers. */
const DEV_URL_OVERRIDES_ENABLED = true;

const localKetchSdk: Record<string, string> = {
  'https://cdn.ketchjs.com/ketchtag/stable/v2.12/ketch-sdk.js':
    'http://localhost:9000/ketch-sdk.js',
  'https://cdn.uat.ketchjs.com/ketchtag/stable/v2.12/ketch-sdk.js':
    'http://localhost:9000/ketch-sdk.js',
  'ketch-sdk.js': 'http://localhost:9000/ketch-sdk.js',
};

const forSimulator = localKetchSdk;
const forAndroidEmulator = localKetchSdk;

function AppWithCallbacks(): React.JSX.Element {
  const {appendLog, updateDashboard} = useDashboard();

  return (
    <KetchServiceProvider
      organizationCode="ethansch061226"
      propertyCode="website_smart_tag"
      dataCenter={KetchDataCenter.UAT}
      identities={{email: 'test-123-1@gmail.com'}}
      autoLoad={false}
      webResourceUrlOverrides={
        DEV_URL_OVERRIDES_ENABLED
          ? Platform.OS === 'android'
            ? forAndroidEmulator
            : forSimulator
          : undefined
      }
      onEnvironmentUpdated={environment => {
        updateDashboard({environment});
        appendLog(`onEnvironmentUpdated: ${environment}`);
      }}
      onRegionUpdated={region => {
        updateDashboard({region});
        appendLog(`onRegionUpdated: ${region}`);
      }}
      onJurisdictionUpdated={jurisdiction => {
        updateDashboard({jurisdiction});
        appendLog(`onJurisdictionUpdated: ${jurisdiction}`);
      }}
      onIdentitiesUpdated={identities => {
        appendLog(`onIdentitiesUpdated: ${JSON.stringify(identities)}`);
      }}
      onConsentUpdated={(consent: Consent) => {
        const summary = formatConsent(consent);
        updateDashboard({consent: summary});
        appendLog(`onConsentUpdated: ${summary}`);
        console.log('[KetchSample] onConsentUpdated:', summary);
      }}
      onPrivacyProtocolUpdated={(protocol, values) => {
        const text = JSON.stringify(values);
        if (protocol === PrivacyProtocol.USPrivacy) {
          updateDashboard({usPrivacy: text});
        } else if (protocol === PrivacyProtocol.TCF) {
          updateDashboard({tcf: text});
        } else if (protocol === PrivacyProtocol.GPP) {
          updateDashboard({gpp: text});
        }
        appendLog(`onPrivacyProtocolUpdated: ${protocol}`);
      }}
      onHasShownExperience={() => {
        updateDashboard({
          experienceVisibility: 'shown',
          webViewVisible: 'visible',
        });
        appendLog('onHasShownExperience');
      }}
      onHideExperience={reason => {
        updateDashboard({
          experienceVisibility: 'dismissed',
          dismissReason: String(reason),
          webViewVisible: 'hidden',
        });
        appendLog(`onHideExperience: ${reason}`);
      }}
      onError={errorMessage => {
        updateDashboard({
          loadState: 'error',
          initState: 'Error',
          statusText: `Error: ${errorMessage}`,
        });
        appendLog(`error: ${errorMessage}`);
      }}
      onNativeStoragePut={(key, value) => {
        appendLog(`onNativeStoragePut: ${key}=${value}`);
      }}>
      <Main />
    </KetchServiceProvider>
  );
}

function App(): React.JSX.Element {
  return (
    <DashboardProvider>
      <AppWithCallbacks />
    </DashboardProvider>
  );
}

export default App;
