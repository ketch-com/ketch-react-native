/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';

import {KetchServiceProvider} from '@ketch-com/ketch-react-native';
import Main from './Main';

function App(): React.JSX.Element {
  return (
    <KetchServiceProvider
      onConsentUpdated={c => {
        console.log('Consent updated:', c);
      }}
      onHideExperience={e => {
        console.log('Hide experience:', e);
      }}
      onIdentitiesUpdated={i => {
        console.log('Identities udpated:', i);
      }}
      onPrivacyProtocolUpdated={(s, a) => {
        console.log('Privacy protocol updated:', s, a);
      }}
      organizationCode="ketch_samples"
      propertyCode="react_native_sample_app"
      jurisdictionCode="gdpr"
      identities={{email: 'test-aug-6-1@test.com'}}>
      {/* Main.tsx is the content of your app. */}
      <Main />
    </KetchServiceProvider>
  );
}

export default App;
