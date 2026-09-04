import {
  LogLevel,
  MobileSdkUrlByDataCenterMap,
  OnHideExperienceArgument,
  type TriggerName,
  WillShowExperienceType,
} from '../enums';
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

/** Query parameters the WebView bootstrap recognises by name. */
type ReservedUrlParams = {
  organizationCode: string;
  propertyCode: string;
  ketch_mobilesdk_url?: string;
  ketch_lang?: string;
  ketch_region?: string;
  ketch_jurisdiction?: string;
  ketch_env?: string;
  ketch_log?: LogLevel;
  ketch_show?: string;
  ketch_age?: string;
  ketch_age_lower?: string;
  ketch_age_upper?: string;
  ketch_att?: string;
  ketch_att_prev?: string;
  webResourceUrlOverrides?: Record<string, string>;
};

/**
 * Reserved parameters plus one entry per identity, whose space code becomes the
 * parameter name verbatim. Both share a namespace, so a space code is readable
 * here but not known in advance.
 */
export type WebViewUrlParams = ReservedUrlParams & {
  [identitySpaceCode: string]: unknown;
};

export const createUrlParamsObject = (
  parameters: CommonExperienceOptions
): WebViewUrlParams => {
  const reserved: ReservedUrlParams = {
    organizationCode: parameters.organizationCode,
    propertyCode: parameters.propertyCode,
  };

  for (const key in parameters) {
    if (key === 'dataCenter' && parameters.dataCenter) {
      reserved.ketch_mobilesdk_url =
        MobileSdkUrlByDataCenterMap[parameters.dataCenter];
    }

    if (key === 'languageCode' && parameters.languageCode) {
      reserved.ketch_lang = parameters.languageCode;
    }

    if (key === 'regionCode' && parameters.regionCode) {
      reserved.ketch_region = parameters.regionCode;
    }

    if (key === 'jurisdictionCode' && parameters.jurisdictionCode) {
      reserved.ketch_jurisdiction = parameters.jurisdictionCode;
    }

    if (key === 'environmentName' && parameters.environmentName) {
      reserved.ketch_env = parameters.environmentName;
    }

    if (key === 'logLevel' && parameters.logLevel) {
      reserved.ketch_log = parameters.logLevel;
    }

    if (key === 'ketch_show' && parameters.ketch_show) {
      reserved.ketch_show = parameters.ketch_show;
    }

    if (key === 'age' && parameters.age !== undefined) {
      const val = parameters.age;
      if (Number.isFinite(val) && val >= 0) {
        reserved.ketch_age = String(Math.floor(val));
      }
    }

    if (key === 'ageLower' && parameters.ageLower !== undefined) {
      const val = parameters.ageLower;
      if (Number.isFinite(val) && val >= 0) {
        reserved.ketch_age_lower = String(Math.floor(val));
      }
    }

    if (key === 'ageUpper' && parameters.ageUpper !== undefined) {
      const val = parameters.ageUpper;
      if (Number.isFinite(val) && val >= 0) {
        reserved.ketch_age_upper = String(Math.floor(val));
      }
    }

    if (key === 'ketchAtt' && parameters.ketchAtt) {
      reserved.ketch_att = parameters.ketchAtt;
    }

    if (key === 'ketchAttPrev' && parameters.ketchAttPrev) {
      reserved.ketch_att_prev = parameters.ketchAttPrev;
    }

    if (
      key === 'webResourceUrlOverrides' &&
      parameters.webResourceUrlOverrides &&
      Object.keys(parameters.webResourceUrlOverrides).length > 0
    ) {
      reserved.webResourceUrlOverrides = parameters.webResourceUrlOverrides;
    }
  }

  // Applied after the loop so it wins regardless of key iteration order.
  const mobileSdkUrl = normalizeKetchMobileSdkUrl(parameters.ketchMobileSdkUrl);
  if (mobileSdkUrl) {
    reserved.ketch_mobilesdk_url = mobileSdkUrl;
  }

  // Identities are applied first so a space code that collides with a reserved
  // parameter loses to it, rather than the winner depending on key order.
  return { ...parameters.identities, ...reserved };
};

/**
 * Accepts an HTTPS CDN base (or http://localhost / 127.0.0.1 for local mirrors).
 * Rejects values that cannot be parsed as a URL or that contain characters which
 * break out of the inline bootstrap `<script>` when embedded in HTML.
 */
export const normalizeKetchMobileSdkUrl = (
  url: string | undefined
): string | undefined => {
  if (url == null || url === '') {
    return undefined;
  }
  if (/[<>\s]/.test(url)) {
    console.warn(
      '[Ketch] ketchMobileSdkUrl rejected: must not contain whitespace or < >'
    );
    return undefined;
  }
  const match = /^(https?):\/\/([^/:?#]+)(?::(\d+))?(?:[/?#]|$)/i.exec(url);
  if (!match) {
    console.warn('[Ketch] ketchMobileSdkUrl rejected: not a valid URL');
    return undefined;
  }

  const protocol = match[1]!.toLowerCase();
  const host = match[2]!.toLowerCase();
  const isLocalHttp =
    protocol === 'http' && (host === 'localhost' || host === '127.0.0.1');
  if (protocol !== 'https' && !isLocalHttp) {
    console.warn(
      '[Ketch] ketchMobileSdkUrl rejected: use https:// (or http://localhost for local mirrors)'
    );
    return undefined;
  }

  return url;
};

/** Stable key for WebView remounts when init HTML would change. */
export const getWebViewConfigKey = (parameters: CommonExperienceOptions) =>
  JSON.stringify(createUrlParamsObject(parameters));

/**
 * Accepts a non-blank name of letters, digits, '_', '-', or '.'. The name is
 * interpolated into a quoted JS literal, so this is the only guard against
 * breaking out of it.
 */
const TRIGGER_FUNCTION_NAME_REGEX = /^[A-Za-z0-9_.-]+$/;

export const isValidTriggerFunctionName = (functionName: string): boolean =>
  TRIGGER_FUNCTION_NAME_REGEX.test(functionName);

/**
 * Builds the JS injected for a trigger call. The trailing `; true;` is required by
 * injectJavaScript on iOS. Non-serializable options are dropped to `{}` rather than
 * failing the call, matching the iOS SDK.
 */
export const buildTriggerExpression = (
  triggerName: TriggerName,
  functionName: string,
  options: Record<string, unknown> = {}
): string => {
  let optionsJson = '{}';
  try {
    optionsJson = JSON.stringify(options ?? {});
  } catch {
    optionsJson = '{}';
  }
  return `ketch("trigger", "${triggerName}", "${functionName}", ${optionsJson}); true;`;
};

/** Maps a hideExperience reason from the WebView, falling back to `none` when unrecognized. */
export const toHideExperienceArgument = (
  value: unknown
): OnHideExperienceArgument =>
  Object.values(OnHideExperienceArgument).includes(
    value as OnHideExperienceArgument
  )
    ? (value as OnHideExperienceArgument)
    : OnHideExperienceArgument.none;

/** Maps a willShowExperience type from the WebView, falling back to `None` when unrecognized. */
export const toWillShowExperienceType = (
  value: unknown
): WillShowExperienceType =>
  Object.values(WillShowExperienceType).includes(
    value as WillShowExperienceType
  )
    ? (value as WillShowExperienceType)
    : WillShowExperienceType.None;
