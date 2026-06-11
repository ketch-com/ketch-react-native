/** GeoIP details from `GET /ip` (ketch-types `IPInfo`). */
export interface IPInfo {
  ip?: string;
  hostname?: string;
  continentCode?: string;
  continentName?: string;
  countryCode?: string;
  countryName?: string;
  regionCode?: string;
  regionName?: string;
  city?: string;
  postalCode?: string;
  timezone?: string;
}

/** Response from headless `fetchLocation()`. */
export interface LocationResponse {
  location?: IPInfo;
}

/** Parameters for v3 `getFullConfiguration`. */
export interface FullConfigurationRequest {
  organizationCode: string;
  propertyCode: string;
  environmentCode?: string;
  jurisdictionCode?: string;
  languageCode?: string;
  hash?: string;
}

export interface PurposeLegalBasis {
  legalBasisCode: string;
}

/** Request body for `POST /consent/{org}/get`. */
export interface ConsentConfig {
  organizationCode: string;
  propertyCode: string;
  environmentCode: string;
  jurisdictionCode: string;
  identities: Record<string, string>;
  purposes: Record<string, PurposeLegalBasis>;
}

export enum MigrationOption {
  MIGRATE_DEFAULT = 'MIGRATE_DEFAULT',
  MIGRATE_NEVER = 'MIGRATE_NEVER',
  MIGRATE_FROM_ALLOW = 'MIGRATE_FROM_ALLOW',
  MIGRATE_FROM_DENY = 'MIGRATE_FROM_DENY',
  MIGRATE_ALWAYS = 'MIGRATE_ALWAYS',
}

export interface PurposeAllowedLegalBasis {
  allowed: string;
  legalBasisCode: string;
}

/** Request body for `POST /consent/{org}/update`. */
export interface ConsentUpdate {
  organizationCode: string;
  propertyCode: string;
  environmentCode: string;
  identities: Record<string, string>;
  jurisdictionCode: string;
  migrationOption: MigrationOption;
  purposes: Record<string, PurposeAllowedLegalBasis>;
  vendors?: string[];
  protocols?: Record<string, string>;
}

export class HeadlessException extends Error {
  constructor(
    message: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = 'HeadlessException';
  }
}

export function consentConfigToJson(
  config: ConsentConfig
): Record<string, unknown> {
  return {
    organizationCode: config.organizationCode,
    propertyCode: config.propertyCode,
    environmentCode: config.environmentCode,
    jurisdictionCode: config.jurisdictionCode,
    identities: config.identities,
    purposes: config.purposes,
  };
}

export function consentUpdateToJson(
  update: ConsentUpdate
): Record<string, unknown> {
  return {
    organizationCode: update.organizationCode,
    propertyCode: update.propertyCode,
    environmentCode: update.environmentCode,
    identities: update.identities,
    jurisdictionCode: update.jurisdictionCode,
    migrationOption: update.migrationOption,
    purposes: update.purposes,
    ...(update.vendors != null ? { vendors: update.vendors } : {}),
  };
}

export function withoutProtocols(update: ConsentUpdate): ConsentUpdate {
  const { protocols: _protocols, ...rest } = update;
  return rest;
}

/** ketch-types `DataSubject` */
export interface DataSubject {
  email: string;
  firstName: string;
  lastName: string;
  country?: string;
  stateRegion?: string;
  city?: string;
  description?: string;
  phone?: string;
  postalCode?: string;
  addressLine1?: string;
  addressLine2?: string;
}

/** ketch-types `InvokeRightRequest` */
export interface InvokeRightRequest {
  organizationCode: string;
  propertyCode: string;
  environmentCode: string;
  identities: Record<string, string>;
  jurisdictionCode: string;
  rightCode: string;
  user: DataSubject;
  controllerCode?: string;
  invokedAt?: number;
  recaptchaToken?: string;
  regionCode?: string;
  isAuthenticated?: boolean;
}

export interface ProfilePreferencesIdentity {
  identitySpace: string;
  identityValue: string;
}

export interface ProfilePreferencesAttribute {
  attributeCode: string;
  attributeValue?: string;
  source: string;
}

export interface ProfilePreferencesContext {
  source: string;
  updatedAt?: number;
  configId?: string;
}

/** ketch-types `GetProfileRequest` */
export interface GetProfileRequest {
  organizationCode: string;
  propertyCode: string;
  jurisdictionCode: string;
  languageCode: string;
  identities: ProfilePreferencesIdentity[];
  controllerCode?: string;
  environmentCode?: string;
  accountID?: string;
  regionCode?: string;
}

/** ketch-types `GetProfileResponse` */
export interface GetProfileResponse {
  controllerCode?: string;
  propertyCode?: string;
  environmentCode?: string;
  jurisdictionCode?: string;
  regionCode?: string;
  attributes?: ProfilePreferencesAttribute[];
}

/** ketch-types `PutProfileRequest` */
export interface PutProfileRequest {
  organizationCode: string;
  propertyCode: string;
  jurisdictionCode: string;
  languageCode: string;
  identities: ProfilePreferencesIdentity[];
  context: ProfilePreferencesContext;
  controllerCode?: string;
  environmentCode?: string;
  attributes?: ProfilePreferencesAttribute[];
  accountId?: string;
  regionCode?: string;
}

/** ketch-types `GetSubscriptionsRequest` / `SetSubscriptionsRequest` */
export interface SubscriptionsRequest {
  organizationCode: string;
  controllerCode?: string;
  propertyCode?: string;
  environmentCode?: string;
  identities?: Record<string, string>;
  topics?: Record<string, Record<string, string>>;
  controls?: Record<string, Record<string, string>>;
  collectedAt?: number;
  jurisdictionCode?: string;
  regionCode?: string;
}

export type SubscriptionsResponse = SubscriptionsRequest;

export interface SubscriptionConfigurationRequest {
  organizationCode: string;
  propertyCode: string;
  languageCode: string;
  experienceCode: string;
}

export interface PreferenceQRRequest {
  organizationCode: string;
  propertyCode: string;
  environmentCode?: string;
  imageSize?: number;
  path?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  parameters?: Record<string, string>;
}

export interface WebReportRequest {
  type: string;
  age: number;
  url: string;
  user_agent: string;
  body: Record<string, string>;
}
