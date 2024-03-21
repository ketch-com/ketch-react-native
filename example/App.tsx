/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import {
  Button,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';

import {RadioList} from './UI';

import {
  multiply,
  KetchApiRegion,
  PreferenceTab,
} from '@ketch-com/ketch-react-native';
import {LabeledTextInput} from './src/components/LabeledTextInput/LabeledTextInput';
import {Section} from './src/components/Section/Section';
import {apiRegionLabels, preferenceTabLabels} from './src/labels';

// Comput list options
const API_REGIONS = Object.values(KetchApiRegion).map(region => ({
  key: region,
  label: apiRegionLabels[region],
}));

const PREFERENCE_TABS = Object.values(PreferenceTab).map(preferenceTab => ({
  key: preferenceTab as string,
  label: preferenceTabLabels[preferenceTab],
}));

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const [selectedRegion, setSelectedRegion] = useState(KetchApiRegion.prdUS);

  // Global options
  const [language, setLanguage] = useState<string | undefined>(undefined);
  const [jurisdiction, setJurisdiction] = useState<string | undefined>(
    undefined,
  );
  const [region, setRegion] = useState<string | undefined>(undefined);
  const [environment, setEnvironment] = useState<string | undefined>(undefined);
  const [identityName, setIdentityName] = useState('');
  const [identityValue, setIdentityValue] = useState('');
  const [identities, setIdentities] = useState({}); // TODO:JB - Default identities

  // Preference options
  const [displayedTabs, setDisplayedTabs] = useState<PreferenceTab[]>([
    PreferenceTab.OverviewTab,
    PreferenceTab.ConsentsTab,
    PreferenceTab.SubscriptionsTab,
    PreferenceTab.RightsTab,
  ]);
  const [initialTab, setInitialTab] = useState<PreferenceTab>(
    PreferenceTab.OverviewTab,
  );

  // Test using our react native package
  const [_, setResult] = useState(0);
  useEffect(() => {
    multiply(2, 4).then(answer => setResult(answer));
  }, []);

  // Reset identities
  const handleResetIdentityPress = () => {
    setIdentities({});
    setIdentityName('');
    setIdentityValue('');
  };

  // Update identities
  const handleAddIdentityPress = () => {
    if (identityName && identityValue) {
      setIdentities({
        ...identities,
        [identityName]: identityValue,
      });
      setIdentityName('');
      setIdentityValue('');
    }
  };

  return (
    <SafeAreaView>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView testID="appium-test" style={[styles.container]}>
        <View style={styles.sectionsContainer}>
          {/* Global options */}
          <Section
            title="Global Options"
            subtitle="Options that apply to both experiences">
            <View style={styles.sectionVerticalContainer}>
              <LabeledTextInput
                label="Language"
                value={language}
                onChangeText={newLanguage => setLanguage(newLanguage)}
              />
              <LabeledTextInput
                label="Jurisdiction"
                value={jurisdiction}
                onChangeText={newJurisdiction =>
                  setJurisdiction(newJurisdiction)
                }
              />
              <LabeledTextInput
                label="Region"
                value={region}
                onChangeText={newRegion => setRegion(newRegion)}
              />
              <LabeledTextInput
                label="Environment"
                value={environment}
                onChangeText={newEnvironment => setEnvironment(newEnvironment)}
              />
              {/* Identity adder */}
              <View style={styles.identitiesInput}>
                <LabeledTextInput
                  label="Identities"
                  placeholder="Name"
                  value={identityName}
                  onChangeText={newIdentityName =>
                    setIdentityName(newIdentityName)
                  }
                />
                <LabeledTextInput
                  value={identityValue}
                  placeholder="Value"
                  onChangeText={newIdentityValue =>
                    setIdentityValue(newIdentityValue)
                  }
                  rightAdornment={
                    <View style={styles.identitiesButtonView}>
                      <Button
                        title="Reset"
                        onPress={handleResetIdentityPress}
                        disabled={!Object.values(identities).length}
                      />
                      <Button
                        title="Add"
                        onPress={handleAddIdentityPress}
                        disabled={!identityName || !identityValue}
                      />
                    </View>
                  }
                />
              </View>
              <RadioList
                title="API Region"
                data={API_REGIONS}
                isCheckbox={false}
                onPressItem={key => setSelectedRegion(key as KetchApiRegion)}
                getIsChecked={key => selectedRegion === key}
                horizontal
              />
            </View>
          </Section>

          {/* Preference Options */}
          <Section
            title="Preference Options"
            subtitle="Options that only apply to the preference experience">
            <View style={styles.sectionVerticalContainer}>
              <RadioList
                title="Allowed Tabs"
                data={PREFERENCE_TABS}
                isCheckbox={true}
                onPressItem={(key: string) => {
                  const tab = key as PreferenceTab;
                  if (displayedTabs.includes(tab)) {
                    setDisplayedTabs(displayedTabs.filter(t => t !== tab));
                  } else {
                    setDisplayedTabs([...displayedTabs, tab]);
                  }
                }}
                getIsChecked={key =>
                  displayedTabs.includes(key as PreferenceTab)
                }
                horizontal
              />
              <RadioList
                title="Initial Tab"
                data={PREFERENCE_TABS}
                isCheckbox={false}
                onPressItem={key => setInitialTab(key as PreferenceTab)}
                getIsChecked={key => initialTab === key}
                horizontal
              />
            </View>
          </Section>

          {/* SDK Actions */}
          <Section title="Actions" subtitle="Trigger some SDK functionality">
            <View style={styles.sectionHorizontalContainer}>
              <Button title="Consent" />
              <View style={styles.separator} />
              <Button title="Preferences" />
              <View style={styles.separator} />
              <Button title="Privacy Strings" />
            </View>
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    // paddingTop: 0,
    overflow: 'scroll',
  },

  title: {fontSize: 24, marginBottom: 40, textAlign: 'center'},

  sectionTitle: {fontSize: 20, marginBottom: 8, color: 'black'},

  sectionVerticalContainer: {
    flexDirection: 'column',
    gap: 8,
  },

  sectionHorizontalContainer: {flexDirection: 'row', gap: 8},

  separator: {height: 8},

  sectionsContainer: {
    flexDirection: 'column',
    gap: 24,
  },

  identitiesInput: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
  },

  identitiesButtonView: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
  },
});

export default App;
