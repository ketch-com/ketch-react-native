export enum KetchDataCenter {
  US = 'US',
  EU = 'EU',
  UAT = 'UAT',
}

export const MobileSdkUrlByRegionMap = {
  [KetchApiRegion.prdUS]: 'https://global.ketchcdn.com/web/v3',
  [KetchApiRegion.prdEU]: 'https://eu.ketchcdn.com/web/v3',
  [KetchApiRegion.uatUS]: 'https://dev.ketchcdn.com/web/v3',
};

export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export enum PreferenceTab {
  OverviewTab = 'overviewTab',
  ConsentsTab = 'consentsTab',
  SubscriptionsTab = 'subscriptionsTab',
  RightsTab = 'rightsTab',
}

export enum PrivacyProtocol {
  USPrivacy = 'usprivacy_updated_data',
  GPP = 'gpp_updated_data',
  TCF = 'tcf_updated_data',
}

export enum EventName {
  consent = 'consent',
  environment = 'environment',
  geoip = 'geoip',
  identities = 'identities',
  jurisdiction = 'jurisdiction',
  regionInfo = 'regionInfo',
  willShowExperience = 'willShowExperience',
  hideExperience = 'hideExperience',
  tapOutside = 'tapOutside',
  updateCCPA = 'updateCCPA',
  updateTCF = 'updateTCF',
  updateGPP = 'updateGPP',
  error = 'error',
}
