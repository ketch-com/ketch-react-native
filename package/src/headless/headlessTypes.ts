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

export function consentConfigToJson(config: ConsentConfig): Record<string, unknown> {
  return {
    organizationCode: config.organizationCode,
    propertyCode: config.propertyCode,
    environmentCode: config.environmentCode,
    jurisdictionCode: config.jurisdictionCode,
    identities: config.identities,
    purposes: config.purposes,
  };
}

export function consentUpdateToJson(update: ConsentUpdate): Record<string, unknown> {
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
