/**
 * Sample React Native Main
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState} from 'react';
import {
  Button,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInputEndEditingEventData,
  useColorScheme,
  View,
} from 'react-native';

import {RadioList} from './UI';

import {LabeledTextInput} from './src/components/LabeledTextInput/LabeledTextInput';
import {Section} from './src/components/Section/Section';
import {dataCenterLabels, preferenceTabLabels} from './src/labels';
import { useKetchService, KetchDataCenter, PreferenceTab } from '@ketch-com/ketch-react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

// Comput list options
const API_REGIONS = Object.values(KetchDataCenter).map(region => ({
  key: region,
  label: dataCenterLabels[region],
}));

const PREFERENCE_TABS = Object.values(PreferenceTab).map(preferenceTab => ({
  key: preferenceTab as string,
  label: preferenceTabLabels[preferenceTab],
}));

function Main(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const ketch = useKetchService();
  const [selectedRegion, setSelectedRegion] = useState(KetchDataCenter.US);

  // Global options
  const [organization, setOrganization] = useState<string | undefined>(
    undefined,
  );
  const [property, setProperty] = useState<string | undefined>(undefined);
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

      ketch.updateParameters(identities);
      setIdentityName('');
      setIdentityValue('');
    }
  };

  const showConsent = () => {
    ketch.showConsentExperience();

    setTimeout(() => {
      ketch.dismissExperience();
    }, 6000);
  };

  const showPreferences = () => {
    ketch.showPreferenceExperience({
      languageCode: language,
      tab: initialTab,
      showConsentsTab: displayedTabs.includes(PreferenceTab.ConsentsTab),
      showOverviewTab: displayedTabs.includes(PreferenceTab.OverviewTab),
      showSubscriptionsTab: displayedTabs.includes(
        PreferenceTab.SubscriptionsTab,
      ),
      showRightsTab: displayedTabs.includes(PreferenceTab.RightsTab),
    });

    setTimeout(() => {
      ketch.dismissExperience();
    }, 6000);
  };

  const consoleLogPrivacyDataFromStorage = async () => {
    const allKeys = await AsyncStorage.getAllKeys();

    allKeys.forEach(async key => {
      const value = await AsyncStorage.getItem(key);

      console.log(`storage key: ${key}, value: ${value} `);
    });
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
              <View style={styles.sectionHorizontalContainer}>
                <LabeledTextInput
                  label="Organization"
                  value={organization}
                  onChangeText={setOrganization}
                  onEndEditing={(
                    e: NativeSyntheticEvent<TextInputEndEditingEventData>,
                  ) => {
                    ketch.updateParameters({
                      organizationCode: e.nativeEvent.text,
                    });
                  }}
                />
                <LabeledTextInput
                  label="Property"
                  value={property}
                  onChangeText={setProperty}
                  onEndEditing={(
                    e: NativeSyntheticEvent<TextInputEndEditingEventData>,
                  ) => {
                    ketch.updateParameters({
                      propertyCode: e.nativeEvent.text,
                    });
                  }}
                />
                <LabeledTextInput
                  label="Environment"
                  value={environment}
                  onChangeText={setEnvironment}
                  onEndEditing={(
                    e: NativeSyntheticEvent<TextInputEndEditingEventData>,
                  ) => {
                    ketch.updateParameters({
                      environmentName: e.nativeEvent.text,
                    });
                  }}
                />
              </View>
              <View style={styles.sectionHorizontalContainer}>
                <LabeledTextInput
                  label="Language"
                  value={language}
                  onChangeText={setLanguage}
                  onEndEditing={(
                    e: NativeSyntheticEvent<TextInputEndEditingEventData>,
                  ) => {
                    ketch.updateParameters({languageCode: e.nativeEvent.text});
                  }}
                />
                <LabeledTextInput
                  label="Jurisdiction"
                  value={jurisdiction}
                  onChangeText={setJurisdiction}
                  onEndEditing={(
                    e: NativeSyntheticEvent<TextInputEndEditingEventData>,
                  ) => {
                    ketch.updateParameters({
                      jurisdictionCode: e.nativeEvent.text,
                    });
                  }}
                />
                <LabeledTextInput
                  label="Region"
                  value={region}
                  onChangeText={setRegion}
                  onEndEditing={(
                    e: NativeSyntheticEvent<TextInputEndEditingEventData>,
                  ) => {
                    ketch.updateParameters({regionCode: e.nativeEvent.text});
                  }}
                />
              </View>
              {/* Identity adder */}
              <View style={styles.sectionHorizontalContainer}>
                <LabeledTextInput
                  label="Identities"
                  placeholder="Name"
                  value={identityName}
                  onChangeText={setIdentityName}
                />
                <LabeledTextInput
                  value={identityValue}
                  placeholder="Value"
                  onChangeText={setIdentityValue}
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
                onPressItem={key => setSelectedRegion(key as KetchDataCenter)}
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
              <Button title="Consent" onPress={showConsent} />
              <Button title="Preferences" onPress={showPreferences} />
              <Button
                title="Privacy Strings"
                onPress={consoleLogPrivacyDataFromStorage}
              />
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
    overflow: 'scroll',
  },

  title: {fontSize: 24, marginBottom: 40, textAlign: 'center'},

  sectionTitle: {fontSize: 20, marginBottom: 8, color: 'black'},

  sectionVerticalContainer: {
    flexDirection: 'column',
    gap: 8,
  },

  sectionHorizontalContainer: {display: 'flex', flexDirection: 'row', gap: 8},

  sectionsContainer: {
    flexDirection: 'column',
    gap: 24,
  },

  identitiesButtonView: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
  },
});

export default Main;
