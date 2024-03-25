import {KetchDataCenter, PreferenceTab} from '../lib/enums';

export const dataCenterLabels: {[apiRegion: string]: string} = {
  [KetchDataCenter.US]: 'Prod - US',
  [KetchDataCenter.EU]: 'Prod - EU',
  [KetchDataCenter.UAT]: 'UAT',
};

export const preferenceTabLabels: {[preferenceTab: string]: string} = {
  [PreferenceTab.OverviewTab]: 'Overview',
  [PreferenceTab.ConsentsTab]: 'Consent',
  [PreferenceTab.SubscriptionsTab]: 'Subscriptions',
  [PreferenceTab.RightsTab]: 'Rights',
};
