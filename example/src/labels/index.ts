import {KetchApiRegion, PreferenceTab} from '../lib/enums';

export const apiRegionLabels: {[apiRegion: string]: string} = {
  [KetchApiRegion.prdUS]: 'Prod - US',
  [KetchApiRegion.prdEU]: 'Prod - EU',
  [KetchApiRegion.uatUS]: 'UAT',
};

export const preferenceTabLabels: {[preferenceTab: string]: string} = {
  [PreferenceTab.OverviewTab]: 'Overview',
  [PreferenceTab.ConsentsTab]: 'Consent',
  [PreferenceTab.SubscriptionsTab]: 'Subscriptions',
  [PreferenceTab.RightsTab]: 'Rights',
};
