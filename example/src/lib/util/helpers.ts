import {MobileSdkUrlByRegionMap} from '../enums';
import {CommonExperienceOptions, PreferenceExperienceOptions} from '../types';

export const createOptionsString = (
  options: Partial<PreferenceExperienceOptions>,
) => {
  const ketchApiRegion = options?.ketchApiRegion
    ? `ketchApiRegion: "${options.ketchApiRegion}",`
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

  return `{${ketchApiRegion}${language}${region}${jurisdiction}${environment}${tab}${showOverviewTab}${showConsentsTab}${showSubscriptionsTab}${showRightsTab}}`;
};

export const createUrlParamsString = (
  parameters: Partial<CommonExperienceOptions>,
) => {
  const mobileSdkUrl = parameters.ketchApiRegion
    ? `&ketch_mobilesdk_url=${
        MobileSdkUrlByRegionMap[parameters.ketchApiRegion]
      }`
    : '';

  const language = parameters.languageCode
    ? `&ketch_lang=${parameters.languageCode}`
    : '';

  const region = parameters.regionCode
    ? `&ketch_region=${parameters.regionCode}`
    : '';

  const jurisdiction = parameters.jurisdictionCode
    ? `&ketch_jurisdiction=${parameters.jurisdictionCode}`
    : '';

  const environment = parameters.environmentName
    ? `&ketch_environment=${parameters.environmentName}`
    : '';

  const logLevel = parameters.logLevel
    ? `&ketch_log_level=${parameters.logLevel}`
    : '';

  let result = `${mobileSdkUrl}${language}${region}${jurisdiction}${environment}${logLevel}`;

  if (parameters.identities) {
    const entries = Object.entries(parameters.identities).reduce(
      (acc, [key, value]) => acc + `&${key}=${value}`,
      '',
    );

    result = result + entries;
  }

  console.log('url params', result);

  return result;
};
