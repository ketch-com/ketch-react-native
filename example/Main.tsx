/**
 * Sample React Native Main
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState} from 'react';
import {
  Button,
  Keyboard,
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
import {
  useKetchService,
  KetchDataCenter,
  PreferenceTab,
} from '@ketch-com/ketch-react-native';
import DefaultPreference from 'react-native-default-preference';

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
    'ketch_samples',
  );
  const [property, setProperty] = useState<string | undefined>(
    'react_native_sample_app',
  );
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
    ketch.updateParameters({identities: {}});
  };

  // Update identities
  const handleAddIdentityPress = () => {
    if (identityName && identityValue) {
      setIdentities({
        ...identities,
        [identityName]: identityValue,
      });

      // Create map with new identities
      const newIdentities = {[identityName]: identityValue};

      // Pass new identities to Ketch
      ketch.updateParameters({identities: newIdentities});

      // Reset input fields
      setIdentityName('');
      setIdentityValue('');
    }
  };

  const showConsent = () => {
    ketch.showConsentExperience();
  };

  const showPreferences = () => {
    ketch.showPreferenceExperience({
      tab: initialTab,
      showConsentsTab: displayedTabs.includes(PreferenceTab.ConsentsTab),
      showOverviewTab: displayedTabs.includes(PreferenceTab.OverviewTab),
      showSubscriptionsTab: displayedTabs.includes(
        PreferenceTab.SubscriptionsTab,
      ),
      showRightsTab: displayedTabs.includes(PreferenceTab.RightsTab),
    });
  };

  const consoleLogPrivacyDataFromStorage = async () => {
    const privacyData = await DefaultPreference.getAll();

    console.log('privacy data from storage: ', privacyData);
  };

  return (
    <SafeAreaView>
      <StatusBar translucent />
      <ScrollView testID="appium-test" style={[styles.container]}>
        <View
          style={styles.sectionsContainer}
          onTouchStart={() => Keyboard.dismiss()}>
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
                />
                <View>
                  <View style={styles.identitiesButtonView}>
                    <Button title="Reset" onPress={handleResetIdentityPress} />
                    <Button
                      title="Add"
                      onPress={handleAddIdentityPress}
                      disabled={!identityName || !identityValue}
                    />
                  </View>
                </View>
              </View>
              <RadioList
                title="API Region"
                data={API_REGIONS}
                isCheckbox={false}
                numColumns={3}
                columnWidth={100}
                onPressItem={key => {
                  setSelectedRegion(key as KetchDataCenter);
                  ketch.updateParameters({dataCenter: key as KetchDataCenter});
                }}
                getIsChecked={key => selectedRegion === key}
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
                columnWidth={125}
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
              />
              <RadioList
                title="Initial Tab"
                data={PREFERENCE_TABS}
                isCheckbox={false}
                columnWidth={125}
                onPressItem={key => setInitialTab(key as PreferenceTab)}
                getIsChecked={key => initialTab === key}
              />
            </View>
          </Section>

          {/* SDK Actions */}
          <Section title="Actions" subtitle="Trigger some SDK functionality">
            <>
              <View style={styles.sectionVerticalContainer}>
                <View style={styles.sectionHorizontalContainer}>
                  <Button title="Show Consent" onPress={showConsent} />
                  <Button title="Show Preferences" onPress={showPreferences} />
                </View>
                <View style={styles.sectionHorizontalContainer}>
                  <Button
                    title="Log Consent"
                    onPress={() => console.log(ketch.getConsent())}
                  />
                  <Button
                    title="Log Protocols"
                    onPress={consoleLogPrivacyDataFromStorage}
                  />
                  <Button title="Load" onPress={ketch.load} />
                  <Button
                    title="Apply CSS"
                    onPress={() =>
                      ketch.setCssOverride?.(
                        '#ketch-banner-button-primary { display: none !important; }',
                      )
                    }
                  />
                </View>
              </View>
            </>
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

  sectionHorizontalContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    gap: 8,
  },

  sectionsContainer: {
    flexDirection: 'column',
    gap: 24,
  },

  identitiesButtonView: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    gap: 8,
    paddingTop: 20,
  },
});

export default Main;
