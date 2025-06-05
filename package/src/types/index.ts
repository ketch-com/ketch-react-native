import {
  type EventName,
  type KetchDataCenter,
  type LogLevel,
  type OnHideExperienceArgument,
  type PreferenceTab,
  type PrivacyProtocol,
} from '../enums';

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
   * Experience has shown listener
   */
  onHasShownExperience?: () => void;
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
}
