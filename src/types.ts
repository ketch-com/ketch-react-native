import type { KetchApiRegion } from './constants';

export interface KetchMobile {
  organization: string | undefined;
  identities?: Record<string, string>;
  language?: string;
  region?: string;
  jurisdiction?: string;
  environment?: string;
  ketchApiRegion?: KetchApiRegion;
  logLevel?: string;
  onEnvironmentUpdated?: (environment: string) => void;
  onRegionUpdated?: (region: string) => void;
  onJurisdictionUpdated?: (jurisdiction: string) => void;
  onIdentitiesUpdated?: (identities: Record<string, string>) => void;
  onConsentUpdated?: () => void;
  onError?: () => void;
  onPrivacyStringUpdated?: (
    privacyStringKey: string,
    privacyStringValue: string
  ) => void;

  // ?
  orgPropertyNameCode: string;
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
