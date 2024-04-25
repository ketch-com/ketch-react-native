/**
 * Doceree POC React Native App
 * https://github.com/ketch-com/ketch-react-native/tree/jboileau99/spike/doceree-demo
 *
 * @format
 */

import React from 'react';

import {KetchServiceProvider} from '@ketch-com/ketch-react-native';
import Main from './src/components/Main';

function App(): React.JSX.Element {
  return (
    <KetchServiceProvider
      organizationCode="doceree_poc"
      propertyCode="website_smart_tag"
      identities={{email: 'test@ketch.com'}}
      forceConsentExperience>
      <Main />
    </KetchServiceProvider>
  );
}

export default App;
