/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState, useRef} from 'react';
import {
  Button,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Image,
  SafeAreaView,
} from 'react-native';

import {WebView} from 'react-native-webview';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import {RadioList} from './UI';

interface OnMessageEventData {
  event: string;
  data: any;
}

const LANGUAGES = [
  {key: 'en', label: 'EN'},
  {key: 'fr', label: 'FR'},
  {key: 'it', label: 'IT'},
];

const REGIONS = [
  {key: 'uatUS', label: 'uatUS'},
  {key: 'prdUS', label: 'prdUS'},
  {key: 'prdEU', label: 'prdEU'},
];

const TABS = [
  {key: 'overview', label: 'overview'},
  {key: 'rights', label: 'rights'},
  {key: 'consents', label: 'consents'},
  {key: 'subscriptions', label: 'subscriptions'},
];

const KETCH_URL = 'https://dev.ketchcdn.com/web/v3';

// const KETCH_SHOW_CONSENT = 'cd';
// const KETCH_SHOW_PREFERENCE = 'preferences';

// test 1
const orgCode = 'experiencev2';
const propertyName = 'test_experiencev2';

// test 2
// const orgCode = 'experiencev2';
// const propertyName = 'react_native_sample_app';

// test 3
// const orgCode = 'ketch_samples';
// const propertyName = 'react_native_sample_app';

const indexData = Image.resolveAssetSource(require('./index.html'));
function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const webViewRef = useRef();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedRegion, setSelectedRegion] = useState('uatUS');
  const [selectedTabs, setSelectedTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('consents');
  const [showDialog, _] = useState('');

  const [isVisible, setIsVisible] = useState(false);

  console.log('indexData', indexData);
  const indexHtmlWithArgs = `${indexData.uri}&ketch_mobilesdk_url=${KETCH_URL}&ketch_log=trace&orgCode=${orgCode}&propertyName=${propertyName}&ketch_show=${showDialog}`;

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <SafeAreaView>
        <View
          testID="appium-test"
          style={[
            styles.container,
            {
              backgroundColor: isDarkMode ? Colors.black : Colors.white,
            },
          ]}>
          <Text style={styles.title}>Ketch Mobile React Native test App</Text>

          <Text style={styles.sectionTitle}>Consent Options</Text>

          <View style={styles.sectionContainer}>
            <RadioList
              title="Language"
              data={LANGUAGES}
              isCheckbox={false}
              onPressItem={key => setSelectedLanguage(key)}
              getIsChecked={key => selectedLanguage === key}
            />
            <RadioList
              title="Region"
              data={REGIONS}
              isCheckbox={false}
              onPressItem={key => setSelectedRegion(key)}
              getIsChecked={key => selectedRegion === key}
            />
          </View>

          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.sectionContainer}>
            <RadioList
              title="Tabs"
              data={TABS}
              isCheckbox={true}
              onPressItem={(key: string) =>
                setSelectedTabs(state => {
                  if (state.includes(key)) {
                    return state.filter(item => item !== key);
                  }

                  return [...state, key];
                })
              }
              getIsChecked={key => selectedTabs.includes(key)}
            />
            <RadioList
              title="Active tab"
              data={TABS}
              isCheckbox={false}
              onPressItem={key => setActiveTab(key)}
              getIsChecked={key => activeTab === key}
            />
          </View>
          <View style={styles.button}>
            <Button
              title="Show Consent"
              onPress={() => {
                // @ts-ignore TODO: fix type definition here
                // webViewRef.current?.reload();
                // @ts-ignore TODO: fix type definition here
                webViewRef.current?.injectJavaScript("ketch('showConsent')");
                // TODO: remove "setIsVisible" call when "willShowExperience" event is implemented
                // setIsVisible(true);
                // TODO: figure out why "ketch_show" parameter is not working
                // setShowDialog(KETCH_SHOW_CONSENT);
              }}
            />
          </View>
          <Button
            title="Show Preferences"
            onPress={() => {
              // @ts-ignore TODO: fix type definition here
              // webViewRef.current?.reload();
              // @ts-ignore TODO: fix type definition here
              webViewRef.current?.injectJavaScript("ketch('showPreferences')");
              // TODO: remove "setIsVisible" call when "willShowExperience" event is implemented
              // setIsVisible(true);
              // TODO: figure out why "ketch_show" parameter is not working
              // setShowDialog(KETCH_SHOW_PREFERENCE);
            }}
          />
        </View>
      </SafeAreaView>
      <View style={{...styles.popup, height: isVisible ? undefined : 1}}>
        {/* Wrapper View is needed for absolute positioning */}
        <WebView
          ref={webViewRef}
          javaScriptEnabled
          webviewDebuggingEnabled
          enableFileAccess
          domStorageEnabled
          source={{uri: indexHtmlWithArgs}}
          style={styles.popupWebview}
          onMessage={event => {
            const data = JSON.parse(
              event.nativeEvent.data,
            ) as OnMessageEventData;
            console.log('onMessage', data);
            switch (data.event) {
              case 'willShowExperience':
                setIsVisible(true);
                break;
              case 'hideExperience':
              case 'experienceClosed':
              case 'tapOutside':
                setIsVisible(false);
                break;
              default:
                break;
            }
          }}
        />
      </View>
    </>
  );
}

export default App;

const styles = StyleSheet.create({
  popup: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 99999,
  },
  popupWebview: {
    backgroundColor: 'transparent',
  },

  button: {
    marginBottom: 10,
  },
  container: {
    padding: 16,
  },
  title: {fontSize: 24, marginBottom: 40, textAlign: 'center'},
  sectionTitle: {fontSize: 20, marginBottom: 8},
  sectionContainer: {flexDirection: 'row', gap: 8, marginBottom: 20},
});
