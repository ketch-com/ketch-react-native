import type {
  EventName,
  KetchDataCenter,
  LogLevel,
  PreferenceTab,
  PrivacyProtocol,
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
>;

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
  preferenceStorage?: PreferenceBackend;

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
}
