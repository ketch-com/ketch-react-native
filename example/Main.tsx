/**
 * Sample React Native Main
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState} from 'react';
import {
  Button,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {RadioList} from './UI';

import {Section} from './src/components/Section/Section';
import {preferenceTabLabels} from './src/labels';
import {useInfo} from './src/dashboard/InfoContext';
import {formatAttState} from './src/dashboard/consentLogging';
import {SAMPLE_CONFIG} from './config';
import {
  useKetchService,
  PreferenceTab,
  requestTrackingAuthorization,
  nativeStorage,
  ATT_LAST_STORAGE_KEY,
} from '@ketch-com/ketch-react-native';
import DefaultPreference from 'react-native-default-preference';

const PREFERENCE_TABS = Object.values(PreferenceTab).map(preferenceTab => ({
  key: preferenceTab as string,
  label: preferenceTabLabels[preferenceTab],
}));

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Main(): React.JSX.Element {
  const ketch = useKetchService();
  const {info} = useInfo();

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

  const handleRequestAtt = async () => {
    const status = (await requestTrackingAuthorization()) ?? 'unknown';
    const prev =
      (await nativeStorage.read(ATT_LAST_STORAGE_KEY)) || 'notDetermined';
    console.log('[KetchSample] ATT requested:', formatAttState(status, prev));
    ketch.load();
  };

  return (
    <SafeAreaView>
      <StatusBar translucent />
      <ScrollView testID="appium-test" style={[styles.container]}>
        <View style={styles.sectionsContainer}>
          <Section title="Info">
            <View style={styles.sectionVerticalContainer}>
              <InfoRow label="Org Code" value={SAMPLE_CONFIG.organizationCode} />
              <InfoRow label="Property" value={SAMPLE_CONFIG.propertyCode} />
              <InfoRow
                label="Environment"
                value={SAMPLE_CONFIG.environmentName}
              />
              <InfoRow label="Language" value={SAMPLE_CONFIG.languageCode} />
              <InfoRow label="Jurisdiction" value={info.jurisdiction} />
              <InfoRow label="Region" value={info.region} />
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
            <View style={styles.sectionVerticalContainer}>
              <View style={styles.sectionHorizontalContainer}>
                <Button title="Reload" onPress={() => ketch.load()} />
                <Button
                  title="Consent"
                  onPress={() => ketch.showConsentExperience()}
                />
                <Button title="Preferences" onPress={showPreferences} />
              </View>
              <View style={styles.sectionHorizontalContainer}>
                <Button
                  title="Privacy Strings"
                  onPress={consoleLogPrivacyDataFromStorage}
                />
                <Button
                  title="Apply CSS"
                  onPress={() =>
                    ketch.setCssOverride?.(
                      '#ketch-banner-button-primary { display: none !important; }',
                    )
                  }
                />
                {Platform.OS === 'ios' && (
                  <Button title="Request ATT" onPress={handleRequestAtt} />
                )}
              </View>
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

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },

  infoLabel: {
    width: 120,
    fontSize: 12,
    color: 'black',
  },

  infoValue: {
    flex: 1,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: 'black',
  },
});

export default Main;
