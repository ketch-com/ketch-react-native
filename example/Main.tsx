/**
 * Sample React Native Main
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import {
  Button,
  Keyboard,
  NativeSyntheticEvent,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInputEndEditingEventData,
  View,
} from 'react-native';

import {RadioList} from './UI';

import {LabeledTextInput} from './src/components/LabeledTextInput/LabeledTextInput';
import {Section} from './src/components/Section/Section';
import {dataCenterLabels, preferenceTabLabels} from './src/labels';
import {
  useDashboard,
  truncate,
} from './src/dashboard/DashboardContext';
import {
  formatAttState,
  formatConsent,
} from './src/dashboard/consentLogging';
import {
  useKetchService,
  KetchDataCenter,
  PreferenceTab,
  requestTrackingAuthorization,
  trackingAuthorizationStatusString,
  nativeStorage,
  ATT_LAST_STORAGE_KEY,
} from '@ketch-com/ketch-react-native';
import DefaultPreference from 'react-native-default-preference';

// Compute list options
const API_REGIONS = Object.values(KetchDataCenter).map(region => ({
  key: region,
  label: dataCenterLabels[region],
}));

const PREFERENCE_TABS = Object.values(PreferenceTab).map(preferenceTab => ({
  key: preferenceTab as string,
  label: preferenceTabLabels[preferenceTab],
}));

function DashboardRow({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <View style={styles.dashboardRow}>
      <Text style={styles.dashboardLabel}>{label}:</Text>
      <Text style={styles.dashboardValue}>{value}</Text>
    </View>
  );
}

function Main(): React.JSX.Element {
  const ketch = useKetchService();
  const {dashboard, appendLog, setStatus, updateDashboard} = useDashboard();
  const [selectedRegion, setSelectedRegion] = useState(KetchDataCenter.UAT);

  // Global options
  const [organization, setOrganization] = useState<string | undefined>(
    'ethansch061226',
  );
  const [property, setProperty] = useState<string | undefined>(
    'website_smart_tag',
  );
  const [language, setLanguage] = useState<string | undefined>('en');
  const [jurisdiction, setJurisdiction] = useState<string | undefined>(
    undefined,
  );
  const [region, setRegion] = useState<string | undefined>(undefined);
  const [environment, setEnvironment] = useState<string | undefined>('production');
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
  const [attStatus, setAttStatus] = useState('N/A');

  const refreshAttState = async (logEvent = false) => {
    if (Platform.OS !== 'ios') {
      return;
    }
    const status = (await trackingAuthorizationStatusString()) ?? 'unknown';
    const prev =
      (await nativeStorage.read(ATT_LAST_STORAGE_KEY)) || 'notDetermined';
    setAttStatus(status);
    updateDashboard({attStatus: status, ketchAtt: status, ketchAttPrev: prev});
    if (logEvent) {
      const message = formatAttState(status, prev);
      appendLog(`ATT: ${message}`);
      console.log('[KetchSample] ATT:', message);
    }
  };

  useEffect(() => {
    refreshAttState().catch(() => {});
  }, [updateDashboard]);

  const handleRequestAtt = async () => {
    const status = await requestTrackingAuthorization();
    const value = status ?? 'unknown';
    setAttStatus(value);
    const prev =
      (await nativeStorage.read(ATT_LAST_STORAGE_KEY)) || 'notDetermined';
    updateDashboard({attStatus: value, ketchAtt: value, ketchAttPrev: prev});
    const message = formatAttState(value, prev);
    appendLog(`ATT requested: ${message}`);
    console.log('[KetchSample] ATT requested:', message);
    ketch.load();
  };

  const handleReloadWebView = async () => {
    await refreshAttState(true);
    ketch.load();
    appendLog('WebView reload requested');
  };

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
          <Section title="SDK Health Dashboard">
            <View style={styles.sectionVerticalContainer}>
              <Text style={styles.dashboardSubtitle}>Connection</Text>
              <DashboardRow label="Init" value={dashboard.initState} />
              <DashboardRow label="Status" value={dashboard.statusText} />
              <DashboardRow
                label="Org / Property / Env"
                value={`${organization ?? ''} / ${property ?? ''} / ${environment ?? 'production'}`}
              />
              <DashboardRow
                label="Data center"
                value={dataCenterLabels[selectedRegion]}
              />
              <Text style={styles.dashboardSubtitle}>WebView / Experience</Text>
              <DashboardRow label="Load" value={dashboard.loadState} />
              <DashboardRow label="Visibility" value={dashboard.experienceVisibility} />
              <DashboardRow label="Dismiss" value={dashboard.dismissReason} />
              <DashboardRow label="WebView" value={dashboard.webViewVisible} />
              {Platform.OS === 'ios' && (
                <>
                  <DashboardRow label="ketch_att" value={dashboard.ketchAtt} />
                  <DashboardRow
                    label="ketch_att_prev"
                    value={dashboard.ketchAttPrev}
                  />
                </>
              )}
              {Platform.OS === 'ios' && (
                <>
                  <Text style={styles.dashboardSubtitle}>ATT (iOS)</Text>
                  <DashboardRow label="Native ATT" value={dashboard.attStatus} />
                </>
              )}
              <Text style={styles.dashboardSubtitle}>Privacy / Consent State</Text>
              <DashboardRow label="Environment" value={dashboard.environment} />
              <DashboardRow label="Jurisdiction" value={dashboard.jurisdiction} />
              <DashboardRow label="Region" value={dashboard.region} />
              <DashboardRow label="Consent" value={truncate(dashboard.consent)} />
              <DashboardRow label="US Privacy" value={truncate(dashboard.usPrivacy)} />
              <DashboardRow label="TCF" value={truncate(dashboard.tcf)} />
              <DashboardRow label="GPP" value={truncate(dashboard.gpp)} />
              <Text style={styles.dashboardSubtitle}>Event Log</Text>
              <Text style={styles.eventLog}>
                {dashboard.eventLog.length === 0
                  ? 'Waiting for events...'
                  : dashboard.eventLog.join('\n')}
              </Text>
            </View>
          </Section>

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

          {Platform.OS === 'ios' && (
            <Section title="App Tracking Transparency">
              <View style={styles.sectionVerticalContainer}>
                <Text style={styles.attStatus}>ATT: {attStatus}</Text>
                <View style={styles.sectionHorizontalContainer}>
                  <Button title="Request ATT" onPress={handleRequestAtt} />
                  <Button title="Reload WebView" onPress={handleReloadWebView} />
                </View>
              </View>
            </Section>
          )}

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
                    onPress={() => {
                      const consent = ketch.getConsent();
                      const summary = consent
                        ? formatConsent(consent)
                        : 'no consent cached';
                      appendLog(`getConsent: ${summary}`);
                      console.log('[KetchSample] getConsent:', summary);
                    }}
                  />
                  <Button
                    title="Log Protocols"
                    onPress={consoleLogPrivacyDataFromStorage}
                  />
                  <Button
                    title="Load"
                    onPress={() => {
                      updateDashboard({loadState: 'loading'});
                      setStatus('Load called');
                      ketch.load();
                    }}
                  />
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

  attStatus: {color: 'black', marginBottom: 8},

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

  dashboardSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
    marginTop: 8,
  },

  dashboardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },

  dashboardLabel: {
    width: 120,
    fontSize: 12,
    color: 'black',
  },

  dashboardValue: {
    flex: 1,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: 'black',
  },

  eventLog: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: 'black',
    minHeight: 80,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
});

export default Main;
