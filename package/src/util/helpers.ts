import { LogLevel, MobileSdkUrlByDataCenterMap } from '../enums';
import type { AllExperienceOptions, CommonExperienceOptions } from '../types';

export const createOptionsString = (options: Partial<AllExperienceOptions>) => {
  const dataCenter = options?.dataCenter
    ? `dataCenter: "${options.dataCenter}",`
    : '';

  const language = options?.languageCode
    ? `language: "${options.languageCode}",`
    : '';

  const region = options?.regionCode ? `region: "${options.regionCode}",` : '';

  const jurisdiction = options?.jurisdictionCode
    ? `jurisdiction: "${options.jurisdictionCode}",`
    : '';

  const environment = options?.environmentName
    ? `environment: "${options.environmentName}",`
    : '';

  const tab = options?.tab ? `tab: "${options.tab}",` : '';

  const showOverviewTab =
    typeof options?.showOverviewTab === 'boolean'
      ? `showOverviewTab: ${options.showOverviewTab},`
      : '';

  const showConsentsTab =
    typeof options?.showConsentsTab === 'boolean'
      ? `showConsentsTab: ${options.showConsentsTab},`
      : '';

  const showSubscriptionsTab =
    typeof options?.showSubscriptionsTab === 'boolean'
      ? `showSubscriptionsTab: ${options.showSubscriptionsTab},`
      : '';

  const showRightsTab =
    typeof options?.showRightsTab === 'boolean'
      ? `showRightsTab: ${options.showRightsTab},`
      : '';

  return `{${dataCenter}${language}${region}${jurisdiction}${environment}${tab}${showOverviewTab}${showConsentsTab}${showSubscriptionsTab}${showRightsTab}}`;
};

export const createUrlParamsObject = (parameters: CommonExperienceOptions) => {
  let result: {
    organizationCode: string;
    propertyCode: string;
    ketch_mobilesdk_url?: string;
    ketch_lang?: string;
    ketch_region?: string;
    ketch_jurisdiction?: string;
    ketch_env?: string;
    ketch_log?: LogLevel;
    ketch_show?: string;
  } = {
    organizationCode: parameters.organizationCode,
    propertyCode: parameters.propertyCode,
  };

  for (const key in parameters) {
    if (key === 'dataCenter' && parameters.dataCenter) {
      result.ketch_mobilesdk_url =
        MobileSdkUrlByDataCenterMap[parameters.dataCenter];
    }

    if (key === 'languageCode' && parameters.languageCode) {
      result.ketch_lang = parameters.languageCode;
    }

    if (key === 'regionCode' && parameters.regionCode) {
      result.ketch_region = parameters.regionCode;
    }

    if (key === 'jurisdictionCode' && parameters.jurisdictionCode) {
      result.ketch_jurisdiction = parameters.jurisdictionCode;
    }

    if (key === 'environmentName' && parameters.environmentName) {
      result.ketch_env = parameters.environmentName;
    }

    if (key === 'logLevel' && parameters.logLevel) {
      result.ketch_log = parameters.logLevel;
    }

    if (key === 'ketch_show' && parameters.ketch_show) {
      result.ketch_show = parameters.ketch_show;
    }

    if (parameters.identities) {
      result = { ...result, ...parameters.identities };
    }
  }

  return result;
};
