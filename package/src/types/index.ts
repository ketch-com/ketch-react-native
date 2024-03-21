import type { KetchApiRegion, LogLevel } from '../enums';

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
   * Ketch API region
   */
  ketchApiRegion?: KetchApiRegion;

  /**
   * Log level for SDK log messages
   */
  logLevel?: LogLevel;

  /**
   * Force show the consent experience
   */
  forceConsentExperience?: boolean;

  /**
   * Force show the preference experience
   */
  forcePreferenceExperience?: boolean;

  /**
   * Do not display any experiences, forced or otherwise.
   */
  hideExperience?: boolean;

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
   * Privacy string update listener
   * @param privacyStringKey The privacy string that was updated
   * @param privacyStringValue The new value of the updated privacy string
   */
  onPrivacyStringUpdated?: (
    privacyStringKey: string,
    privacyStringValue: string
  ) => void;
}

export enum ShownComponent {
  CONSENT = 'consent',
  PREFERENCES = 'preferences',
}

export interface KetchService {
  shownComponent: ShownComponent | null;
  showConsent: () => void;
  showPreferences: () => void;
  hide: () => void;
  updateParameters: (parameters: Partial<KetchMobile>) => void;
}
