import {
  type EventName,
  type KetchDataCenter,
  type LogLevel,
  type OnHideExperienceArgument,
  type PreferenceTab,
  type PrivacyProtocol,
  type TriggerName,
  type WillShowExperienceType,
} from '../enums';
import type {
  ConsentConfig,
  ConsentUpdate,
  FullConfigurationRequest,
  InvokeRightRequest,
  PreferenceQRRequest,
  SubscriptionsRequest,
  SubscriptionsResponse,
} from '../headless/headlessTypes';

/**
 * Consent object
 * @field purposes - mapping of purpose codes to the consent value (yes or no)
 * @field vendors - list of TCF vendor codes
 * @field protocols - mapping of privacy protocols to purpose codes
 */
export interface Consent {
  purposes?: Record<string, boolean>;
  vendors?: string[];
  protocols?: Record<string, string>;
}

export type PreferenceBackend = (key: string, value: string) => Promise<void>;

export interface SharedPrefencesInterface extends Record<string, unknown> {
  setItemAsync: (key: string, value: string) => Promise<void>;
  /** Optional: without it, privacy-string accessors fall back to native storage. */
  getItemAsync?: (key: string) => Promise<string | null>;
}

export type CommonExperienceOptions = Pick<
  KetchMobile,
  | 'organizationCode'
  | 'propertyCode'
  | 'identities'
  | 'languageCode'
  | 'regionCode'
  | 'jurisdictionCode'
  | 'environmentName'
  | 'dataCenter'
  | 'logLevel'
  | 'age'
  | 'ageLower'
  | 'ageUpper'
  | 'ketchAtt'
  | 'ketchAttPrev'
  | 'webResourceUrlOverrides'
  | 'ketchMobileSdkUrl'
> & {
  // This is separate because we don't want to add ketch_show to the KetchMobile type
  // which is used for the KetchServiceProvider parameters
  ketch_show?: string;
};

/**
 * Preference experience options
 * @field tab - initial tab to show
 * @field showOverviewTab - should the overview tab be included in the preference experience
 * @field showConsentsTab - should the consents (purposes) tab be included in the preference experience
 * @field showSubscriptionsTab - should the subscriptions tab be included in the preference experience
 * @field showRightsTab - should the rights (requests) tab be included in the preference experience
 */
export type PreferenceExperienceOptions = {
  tab?: PreferenceTab;
  showOverviewTab?: boolean;
  showConsentsTab?: boolean;
  showSubscriptionsTab?: boolean;
  showRightsTab?: boolean;
};

export type AllExperienceOptions = CommonExperienceOptions &
  PreferenceExperienceOptions;

export interface OnMessageEventData {
  event: EventName;
  data: any;
}

export interface KetchMobile {
  /**
   * Ketch organization code
   */
  organizationCode: string;

  /**
   * Ketch property code
   */
  propertyCode: string;

  /**
   * Whether to automatically load the Ketch SDK on mount. Once loaded, Ketch will determine
   * if the banner or modal experience should be shown. Defaults to true. If false, the load()
   * method must be called to trigger Ketch's auto display logic.
   */
  autoLoad?: boolean;

  /**
   * Ketch identity map of identity space names to values
   */
  identities?: Record<string, string>;

  /**
   * ISO 639-1 language code
   */
  languageCode?: string;

  /**
   * ISO 3166 Country code
   */
  regionCode?: string;

  /**
   * Ketch jurisdiction code
   */
  jurisdictionCode?: string;

  /**
   * Ketch environment name
   */
  environmentName?: string;

  /**
   * Ketch data center region
   */
  dataCenter?: KetchDataCenter;

  /**
   * Log level for SDK log messages
   */
  logLevel?: LogLevel;

  /**
   * Exact age of the user.
   * Used for age band resolution to determine the appropriate legal basis for each purpose.
   */
  age?: number;

  /**
   * Lower bound of the user's age range.
   * Used for age band resolution when an exact age is not known.
   */
  ageLower?: number;

  /**
   * Upper bound of the user's age range.
   * Used for age band resolution when an exact age is not known.
   */
  ageUpper?: number;

  /**
   * iOS ATT status for WebView (`ketch_att`). When omitted, resolved automatically on iOS.
   */
  ketchAtt?: string;

  /**
   * Previous iOS ATT status for WebView (`ketch_att_prev`). When omitted, resolved from native storage on iOS.
   */
  ketchAttPrev?: string;

  /**
   * Exact-match WebView resource URL replacements (e.g. UAT tag scripts → local dev server).
   */
  webResourceUrlOverrides?: Record<string, string>;

  /**
   * Override the CDN base URL. Takes precedence over the URL implied by dataCenter,
   * for both the WebView and the headless API.
   */
  ketchMobileSdkUrl?: string;

  /**
   * Force show the consent experience initially
   */
  forceConsentExperience?: boolean;

  /**
   * Force show the preference experience initially
   */
  forcePreferenceExperience?: boolean;

  /**
   * Options for the preference experience when forceShowPreferenceExperience is true
   */
  preferenceExperienceOptions?: PreferenceExperienceOptions;

  /**
   * Pass alternative preference backend. E.g. allows to integrate expo-shared-preferences for Android Expo apps.
   */
  preferenceStorage?: PreferenceBackend | SharedPrefencesInterface;

  /**
   * Environment update listener
   * @param environment The new environment name
   */
  onEnvironmentUpdated?: (environmentName: string) => void;

  /**
   * Region update listener
   * @param region The updated ISO 3166 region code
   */
  onRegionUpdated?: (regionCode: string) => void;

  /**
   * Jurisdiction update listener
   * @param jurisdiction The updated jurisdiction code
   */
  onJurisdictionUpdated?: (jurisdictionCode: string) => void;

  /**
   * Identities update listener
   * @param identities The updated identities object
   */
  onIdentitiesUpdated?: (identities: Record<string, string>) => void;

  /**
   * Consent update listener
   * @param consent The updated consent object
   */
  onConsentUpdated?: (consent: Consent) => void;

  /**
   * Error listener
   * @param errorMessage The error message string
   */
  onError?: (errorMessage: string) => void;

  /**
   * Privacy protcol update listener
   * @param privacyProtocolKey The privacy protocol that was updated
   * @param privacyProtocolArray The new array for the updated privacy protocol
   */
  onPrivacyProtocolUpdated?: (
    privacyProtocolKey: PrivacyProtocol,
    privacyProtocolArray: (string | Record<string, string>)[]
  ) => void;

  /**
   * Experience hide listener
   * @param data The event value
   */
  onHideExperience?: (data: OnHideExperienceArgument) => void;

  /**
   * Experience will show listener. Fires for every experience path, including
   * those started by a rule trigger rather than an explicit show call.
   * @param type Which experience is about to be shown
   */
  onWillShowExperience?: (type: WillShowExperienceType) => void;

  /**
   * Experience has shown listener
   */
  onHasShownExperience?: () => void;

  /**
   * Native storage write requested by the web tag (`nativeStoragePut` event).
   * @param key Storage key to write
   * @param value Storage value to write
   */
  onNativeStoragePut?: (key: string, value: string) => void;
}

export interface KetchService {
  /**
   * Show consent modal
   */
  showConsentExperience: () => void;

  /**
   * Show preferences modal
   */
  showPreferenceExperience: (
    options?: Partial<PreferenceExperienceOptions>
  ) => void;

  /**
   * Hide modal
   */
  dismissExperience: () => void;

  /**
   * Fire an `onFunction` rule trigger. If a backend rule matches, any experience it
   * shows is presented automatically. Queues until the tag has loaded its config.
   * @returns false if functionName is invalid or an experience is already showing
   */
  trigger: (
    triggerName: TriggerName,
    functionName: string,
    options?: Record<string, unknown>
  ) => boolean;

  /**
   * Get current consent data
   */
  getConsent: () => Consent | undefined;

  /**
   * Update service parameters
   */
  updateParameters: (parameters: Partial<KetchMobile>) => void;

  /**
   * Load or reload the Ketch SDK.
   */
  load: () => void;

  /**
   * Set a CSS override to be injected into the webview.
   * Will ignore if string contains any HTML tags or exceeds 1kb.
   */
  setCssOverride?: (css: string) => void;

  /**
   * Region code, preferring a locally set regionCode over a GeoIP lookup.
   * Pre-WebView headless API.
   */
  getRegion: () => Promise<string | undefined>;

  /**
   * Jurisdiction code, preferring a locally set jurisdictionCode over the value
   * resolved by the CDN configuration.
   */
  getJurisdiction: () => Promise<string | undefined>;

  /** Read a value the tag wrote to native storage. */
  getSavedString?: (key: string) => Promise<string>;

  /** Retrieve the IABTCF_TCString value written by the tag. */
  getTCFTCString?: () => Promise<string>;

  /** Retrieve the IABUSPrivacy_String value written by the tag. */
  getUSPrivacyString?: () => Promise<string>;

  /** Retrieve the IABGPP_HDR_GppString value written by the tag. */
  getGPPHDRGppString?: () => Promise<string>;

  /** Minimal config (`GET .../boot.json`). */
  getBootstrapConfiguration?: () => Promise<Record<string, unknown>>;

  /** Full config with optional env / jurisdiction / language and hash query param. */
  getFullConfiguration?: (
    request: FullConfigurationRequest
  ) => Promise<Record<string, unknown>>;

  /** Server consent including `protocols`. Does not read WebView cache — use [getConsent]. */
  fetchConsent: (config: ConsentConfig) => Promise<Consent>;

  /** Updates consent on the CDN; returns server-computed `protocols`. */
  setConsentOnServer?: (update: ConsentUpdate) => Promise<Consent>;

  /** Invokes a data subject right (`POST .../rights/{org}/invoke`). */
  invokeRight?: (request: InvokeRightRequest) => Promise<void>;

  /** Gets subscription topics/controls (`POST .../subscriptions/{org}/get`). */
  getSubscriptions?: (
    request: SubscriptionsRequest
  ) => Promise<SubscriptionsResponse>;

  /** Updates subscription topics/controls (`POST .../subscriptions/{org}/update`). */
  setSubscriptions?: (request: SubscriptionsRequest) => Promise<void>;

  /** Builds preferences QR image URL (no HTTP). */
  preferenceQRUrl?: (request: PreferenceQRRequest) => string;

  /** The identity map the SDK supplies, including the Ketch-managed identifier. */
  getIdentities?: () => Promise<Record<string, string>>;

  /**
   * Wipes the stored Ketch-managed identifier. A new one is minted on the next launch,
   * which starts a new consent record. Identities passed as props are unaffected.
   */
  clearIdentities?: () => Promise<void>;
}
