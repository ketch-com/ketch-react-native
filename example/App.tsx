/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState} from 'react';
import {
  Button,
  SafeAreaView,
  StatusBar,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import {RadioList} from './UI';

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

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedRegion, setSelectedRegion] = useState('uatUS');
  const [selectedTabs, setSelectedTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('consents');

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View
        testID="appium-test"
        style={{
          padding: 16,
          backgroundColor: isDarkMode ? Colors.black : Colors.white,
        }}>
        <Text style={{fontSize: 24, marginBottom: 40, textAlign: 'center'}}>
          Ketch Mobile React Native test App
        </Text>

        <Text style={{fontSize: 20, marginBottom: 8}}>Consent Options</Text>

        <View style={{flexDirection: 'row', gap: 8, marginBottom: 20}}>
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

        <Text style={{fontSize: 20, marginBottom: 8}}>Preferences</Text>

        <View style={{flexDirection: 'row', gap: 8, marginBottom: 20}}>
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
        <Button title="Show Consent" />
        <Button title="Show Preferences" />
      </View>
    </SafeAreaView>
  );
}

export default App;
