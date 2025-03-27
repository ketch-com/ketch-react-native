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
      organizationCode="ketch_samples"
      propertyCode="react_native"
      identities={{email: 'test@test.com'}}
      autoLoad={false}>
      {/* Main.tsx is the content of your app. */}
      <Main />
    </KetchServiceProvider>
  );
}

export default App;
