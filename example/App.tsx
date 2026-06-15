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
  PrivacyProtocol,
  type Consent,
} from '@ketch-com/ketch-react-native';
import Main from './Main';
import {DashboardProvider, useDashboard} from './src/dashboard/DashboardContext';
import {
  DEV_URL_OVERRIDES_ENABLED,
  forAndroidEmulator,
  forSimulator,
} from './devUrlOverrides';

function AppWithCallbacks(): React.JSX.Element {
  const {appendLog, updateDashboard} = useDashboard();

  return (
    <KetchServiceProvider
      organizationCode="ethansch061226"
      propertyCode="website_smart_tag"
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
        updateDashboard({consent: JSON.stringify(consent)});
        appendLog('onConsentUpdated');
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
