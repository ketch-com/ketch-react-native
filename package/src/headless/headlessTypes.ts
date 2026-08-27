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

/** Response from headless `getLocation()`. */
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
  regionCode?: string;
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
  const rest = { ...update };
  delete rest.protocols;
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

/** Subscription opt state. Anything the server cannot read is recorded as `denied`. */
export type SubscriptionStatus = 'granted' | 'denied';

/**
 * Breadth of a subscription control. Sent as an integer; `Property` additionally
 * requires `propertyCode` on the request.
 *
 * Only the numeric values are part of the wire contract. The server uses a
 * different name for `2`, so do not rename these to "match" it.
 */
export enum ControlImpact {
  Unknown = 0,
  Global = 1,
  Local = 2,
  Property = 3,
}

/** Per-contact-method setting for one topic. */
export interface SubscriptionTopicContactMethodSetting {
  status?: SubscriptionStatus;
}

/** Contact method code (`email`, `sms`, …) to its setting. */
export type SubscriptionTopicSetting = Record<
  string,
  SubscriptionTopicContactMethodSetting
>;

export interface SubscriptionControlSetting {
  status?: SubscriptionStatus;
  impact?: ControlImpact;
}

/** Attribution recorded against a write. Omitting it records the source as `unknown`. */
export type SubscriptionSource =
  | 'preference.subscriptionsTab.manual'
  | 'preference.subscriptionsTab.unsubscribeAll'
  | 'progressive.subscription'
  | 'consentGate.subscription'
  | 'router.setSubscriptions'
  | 'auditLog.subscribeAll'
  | 'auditLog.unsubscribeAll'
  | 'auditLog.default'
  | 'auditLog.manual'
  | 'headless'
  | 'unknown';

export interface SubscriptionContext {
  configurationId?: string;
  source?: SubscriptionSource;
}

/** Collection metadata, returned only when the caller asks for subscription info. */
export interface SubscriptionInfo {
  collectedAt?: number;
  source?: string;
  issuedAt?: number;
}

/**
 * Request body for `POST /subscriptions/{org}/get` and `/update`.
 *
 * `organizationCode` is the path segment, not a body field; it is required here
 * because the URL cannot be built without it.
 */
export interface SubscriptionsRequest {
  organizationCode: string;
  controllerCode?: string;
  propertyCode?: string;
  environmentCode?: string;
  identities?: Record<string, string>;
  topics?: Record<string, SubscriptionTopicSetting>;
  controls?: Record<string, SubscriptionControlSetting>;
  context?: SubscriptionContext;
  collectedAt?: number;
  jurisdictionCode?: string;
  regionCode?: string;
}

/**
 * Response body for `POST /subscriptions/{org}/get`. Every field is optional and
 * `organizationCode` is absent entirely, so this cannot alias the request type.
 */
export interface SubscriptionsResponse {
  controllerCode?: string;
  propertyCode?: string;
  environmentCode?: string;
  identities?: Record<string, string>;
  topics?: Record<string, SubscriptionTopicSetting>;
  controls?: Record<string, SubscriptionControlSetting>;
  properties?: Record<string, unknown>;
  collectedAt?: number;
  jurisdictionCode?: string;
  regionCode?: string;
  topicInfo?: Record<string, SubscriptionInfo>;
  controlInfo?: Record<string, SubscriptionInfo>;
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

/** Combined ISO region code, e.g. "US-CA", or "US" when no subdivision is known. */
export const toRegionCode = (info?: IPInfo): string | undefined => {
  const country = info?.countryCode?.trim() || undefined;
  const region = info?.regionCode?.trim() || undefined;
  if (!country) return region;
  return region ? `${country}-${region}` : country;
};

/** Resolved jurisdiction code: the CDN's specific jurisdiction if set, else its default. */
export const jurisdictionCodeFromConfig = (
  config: Record<string, unknown>
): string | undefined => {
  const jurisdiction = config.jurisdiction as
    | { code?: string; defaultJurisdictionCode?: string }
    | undefined;
  return jurisdiction?.code ?? jurisdiction?.defaultJurisdictionCode;
};
