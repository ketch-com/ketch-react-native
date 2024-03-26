/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';

// import {multiply} from '@ketch-com/ketch-react-native';
import {KetchServiceProvider} from './src/lib/KetchServiceProvider';
import Main from './Main';
import {LogLevel} from './src/lib/enums';

function App(): React.JSX.Element {
  // Test using our react native package
  // const [_, setResult] = useState(0);
  // useEffect(() => {
  //   multiply(2, 4).then((answer: number) => setResult(answer));
  // }, []);

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

  const onPrivacyStringUpdated = (key: string, object: Record<string, any>) => {
    console.log('onPrivacyStringUpdated:key', JSON.stringify(key));
    console.log('onPrivacyStringUpdated:object', JSON.stringify(object));
  };

  return (
    <KetchServiceProvider
      organizationCode="experiencev2"
      propertyCode="react_native_sample_app"
      identities={{email: 'test@ketch.com'}}
      onEnvironmentUpdated={onEnvironmentUpdated}
      onRegionUpdated={onRegionUpdated}
      onJurisdictionUpdated={onJurisdictionUpdated}
      onIdentitiesUpdated={onIdentitiesUpdated}
      onConsentUpdated={onConsentUpdated}
      onPrivacyStringUpdated={onPrivacyStringUpdated}
      logLevel={LogLevel.TRACE}>
      <Main />
    </KetchServiceProvider>
  );
}

export default App;
