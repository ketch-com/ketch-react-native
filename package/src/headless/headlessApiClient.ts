import {
  managedIdentityKey,
  withManagedIdentity,
  withResolvedManagedIdentity,
} from '../util/managedIdentity';
import { KetchDataCenter, MobileSdkUrlByDataCenterMap } from '../enums';
import { getDeviceLanguageTag } from '../util/deviceLocale';
import type { Consent } from '../types';
import {
  consentConfigToJson,
  consentUpdateToJson,
  HeadlessException,
  withoutProtocols,
  type ConsentConfig,
  type ConsentUpdate,
  type FullConfigurationRequest,
  type InvokeRightRequest,
  type LocationResponse,
  type PreferenceQRRequest,
  type SubscriptionsRequest,
  type SubscriptionsResponse,
} from './headlessTypes';

export type FetchFn = typeof fetch;

/** Native HTTP client for the web/v3 CDN API. */
export class HeadlessApiClient {
  private readonly baseUrl: string;
  private readonly fetchFn: FetchFn;
  private readonly deviceLanguage: () => string;

  constructor(
    options: {
      dataCenter?: KetchDataCenter;
      baseUrl?: string;
      fetchFn?: FetchFn;
      deviceLanguage?: () => string;
    } = {}
  ) {
    const dataCenter = options.dataCenter ?? KetchDataCenter.US;
    this.baseUrl = options.baseUrl ?? MobileSdkUrlByDataCenterMap[dataCenter];
    this.fetchFn = options.fetchFn ?? fetch;
    this.deviceLanguage = options.deviceLanguage ?? getDeviceLanguageTag;
  }

  /**
   * Merges in the Ketch-managed identifier, resolving it if nothing has yet. Headless
   * calls can run with no provider mounted, so this cannot rely on the provider having
   * populated it. Without `propertyCode` the identity space cannot be looked up, so
   * this falls back to whatever a provider has already resolved.
   */
  private withIdentities(
    identities: Record<string, string> | undefined,
    organizationCode: string,
    propertyCode: string | undefined
  ): Promise<Record<string, string>> {
    if (!propertyCode) {
      return Promise.resolve(withManagedIdentity(identities));
    }
    return withResolvedManagedIdentity(
      identities,
      managedIdentityKey(organizationCode, propertyCode),
      () => this.getFullConfiguration({ organizationCode, propertyCode })
    );
  }

  /** Builds an absolute CDN URL for unit tests and debugging. */
  buildUrl(path: string, query?: Record<string, string>): string {
    // Built by string concatenation, not `new URL`: React Native's URL polyfill
    // appends a trailing slash to every URL (Libraries/Blob/URL.js) and its
    // URLSearchParams.set() throws unconditionally.
    const normalized = path.startsWith('/') ? path : `/${path}`;
    const base = `${this.baseUrl.replace(/\/+$/, '')}${normalized}`;
    const entries = Object.entries(query ?? {});
    if (entries.length === 0) {
      return base;
    }
    const search = entries
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join('&');
    return `${base}${base.includes('?') ? '&' : '?'}${search}`;
  }

  /** GeoIP / jurisdiction hint (`GET /ip`). */
  async getLocation(): Promise<LocationResponse> {
    const response = await this.get(this.buildUrl('/ip'));
    return this.parseJsonResponse<LocationResponse>(response, '/ip');
  }

  /** Minimal config (`GET .../boot.json`). */
  async getBootstrapConfiguration(
    organization: string,
    property: string
  ): Promise<Record<string, unknown>> {
    const response = await this.get(
      this.buildUrl(`/config/${organization}/${property}/boot.json`)
    );
    return this.parseJsonResponse<Record<string, unknown>>(
      response,
      'boot.json'
    );
  }

  /** Full config with optional env / jurisdiction / language and hash query param. */
  async getFullConfiguration(
    request: FullConfigurationRequest
  ): Promise<Record<string, unknown>> {
    // Environment and jurisdiction alone aren't enough to take the long path below — without a
    // language too, the short path silently drops the configured environment. Synthesize one
    // from the device locale so a caller who only set env + jurisdiction still gets the long path.
    const languageCode =
      request.languageCode ||
      (request.environmentCode && request.jurisdictionCode
        ? this.deviceLanguage()
        : undefined);

    let path = `/config/${request.organizationCode}/${request.propertyCode}`;
    const isShortPath = !(
      request.environmentCode &&
      request.jurisdictionCode &&
      languageCode
    );
    if (!isShortPath) {
      path += `/${request.environmentCode}/${request.jurisdictionCode}/${languageCode}`;
    }
    path += '/config.json';

    const query: Record<string, string> = {};
    if (isShortPath) {
      query.language = languageCode || this.deviceLanguage();
      if (request.jurisdictionCode)
        query.jurisdiction = request.jurisdictionCode;
      if (request.regionCode) query.region = request.regionCode;
    }
    if (request.hash) query.hash = request.hash;

    // Belt-and-suspenders: the `language` query param is what the server actually reads.
    const headers = isShortPath
      ? { 'Accept-Language': this.deviceLanguage() }
      : undefined;

    const response = await this.get(this.buildUrl(path, query), headers);
    return this.parseJsonResponse<Record<string, unknown>>(response, path);
  }

  /** Server consent including `protocols` (`POST .../consent/{org}/get`). */
  async getConsent(config: ConsentConfig): Promise<Consent> {
    const path = `/consent/${config.organizationCode}/get`;
    const response = await this.post(
      path,
      consentConfigToJson({
        ...config,
        identities: await this.withIdentities(
          config.identities,
          config.organizationCode,
          config.propertyCode
        ),
      })
    );
    if (!response || response === 'null') {
      return emptyConsent();
    }
    const json = safeParseConsentJson(response);
    if (!json) {
      return emptyConsent();
    }
    const consent = parseConsent(json);
    return hasUsableConsentFields(consent) ? consent : emptyConsent();
  }

  /** Invokes a data subject right (`POST .../rights/{org}/invoke`). */
  async invokeRight(request: InvokeRightRequest): Promise<void> {
    const path = `/rights/${request.organizationCode}/invoke`;
    const body: InvokeRightRequest = {
      ...request,
      identities: await this.withIdentities(
        request.identities,
        request.organizationCode,
        request.propertyCode
      ),
    };
    await this.postVoid(path, body as unknown as Record<string, unknown>);
  }

  /** Gets subscription topics/controls (`POST .../subscriptions/{org}/get`). */
  async getSubscriptions(
    request: SubscriptionsRequest
  ): Promise<SubscriptionsResponse> {
    const path = `/subscriptions/${request.organizationCode}/get`;
    const body: SubscriptionsRequest = {
      ...request,
      identities: await this.withIdentities(
        request.identities,
        request.organizationCode,
        request.propertyCode
      ),
    };
    const response = await this.post(
      path,
      body as unknown as Record<string, unknown>
    );
    return this.parseJsonResponse<SubscriptionsResponse>(response, path);
  }

  /** Updates subscription topics/controls (`POST .../subscriptions/{org}/update`). */
  async setSubscriptions(request: SubscriptionsRequest): Promise<void> {
    const path = `/subscriptions/${request.organizationCode}/update`;
    // Without a context.source the server attributes the write to "unknown".
    const body: SubscriptionsRequest = {
      ...request,
      identities: await this.withIdentities(
        request.identities,
        request.organizationCode,
        request.propertyCode
      ),
      context: { source: 'headless', ...request.context },
    };
    await this.postVoid(path, body as unknown as Record<string, unknown>);
  }

  /** Builds preferences QR image URL (no HTTP). */
  preferenceQRUrl(request: PreferenceQRRequest): string {
    const query: Record<string, string> = {};
    if (request.environmentCode) {
      query.env = request.environmentCode;
    }
    if (request.imageSize != null) {
      query.size = String(request.imageSize);
    }
    if (request.path) {
      query.path = request.path;
    }
    if (request.backgroundColor) {
      query.bgcolor = request.backgroundColor;
    }
    if (request.foregroundColor) {
      query.fgcolor = request.foregroundColor;
    }
    if (request.parameters) {
      Object.assign(query, request.parameters);
    }
    return this.buildUrl(
      `/qr/${request.organizationCode}/${request.propertyCode}/preferences.png`,
      Object.keys(query).length > 0 ? query : undefined
    );
  }

  /** Updates consent; returns server response with computed `protocols`. */
  async setConsentOnServer(update: ConsentUpdate): Promise<Consent> {
    const path = `/consent/${update.organizationCode}/update`;
    const response = await this.post(
      path,
      consentUpdateToJson({
        ...withoutProtocols(update),
        identities: await this.withIdentities(
          update.identities,
          update.organizationCode,
          update.propertyCode
        ),
      })
    );
    if (!response || response === 'null') {
      return consentFromUpdate(update);
    }
    const json = safeParseConsentJson(response);
    if (!json) {
      return consentFromUpdate(update);
    }
    const consent = parseConsent(json);
    return hasUsableConsentFields(consent)
      ? consent
      : consentFromUpdate(update);
  }

  private parseJsonResponse<T>(body: string, context: string): T {
    const trimmed = body?.trim();
    if (!trimmed || trimmed === 'null') {
      throw new HeadlessException(`Empty response for ${context}`);
    }
    try {
      return JSON.parse(trimmed) as T;
    } catch (error) {
      throw new HeadlessException(`Invalid JSON for ${context}`, error);
    }
  }

  private async get(
    url: string,
    headers?: Record<string, string>
  ): Promise<string> {
    try {
      const response = await this.fetchFn(url, {
        method: 'GET',
        headers: { Accept: 'application/json', ...headers },
      });
      if (!response.ok) {
        throw new HeadlessException(`HTTP ${response.status} for ${url}`);
      }
      return response.text();
    } catch (error) {
      if (error instanceof HeadlessException) {
        throw error;
      }
      throw new HeadlessException(`Request failed for ${url}`, error);
    }
  }

  private async postVoid(
    path: string,
    body: Record<string, unknown>
  ): Promise<void> {
    const url = this.buildUrl(path);
    try {
      const response = await this.fetchFn(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new HeadlessException(`HTTP ${response.status} for ${url}`);
      }
    } catch (error) {
      if (error instanceof HeadlessException) {
        throw error;
      }
      throw new HeadlessException(`Request failed for ${url}`, error);
    }
  }

  private async post(
    path: string,
    body: Record<string, unknown>
  ): Promise<string> {
    const url = this.buildUrl(path);
    try {
      const response = await this.fetchFn(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new HeadlessException(`HTTP ${response.status} for ${url}`);
      }
      return response.text();
    } catch (error) {
      if (error instanceof HeadlessException) {
        throw error;
      }
      throw new HeadlessException(`Request failed for ${url}`, error);
    }
  }
}

function safeParseConsentJson(
  response: string
): Record<string, unknown> | null {
  const trimmed = response?.trim();
  if (!trimmed || trimmed === 'null') {
    return null;
  }
  try {
    const json = JSON.parse(trimmed);
    return typeof json === 'object' && json !== null
      ? (json as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function emptyConsent(): Consent {
  return { purposes: {} };
}

function hasUsableConsentFields(consent: Consent): boolean {
  const hasPurposes =
    consent.purposes != null && Object.keys(consent.purposes).length > 0;
  const hasVendors = consent.vendors != null && consent.vendors.length > 0;
  const hasProtocols =
    consent.protocols != null && Object.keys(consent.protocols).length > 0;
  return hasPurposes || hasVendors || hasProtocols;
}

/**
 * Converts one CDN purpose value to a boolean, or undefined when unreadable.
 *
 * The CDN sends three shapes: a bare string ("true"/"false") from /consent/{org}/get,
 * an { allowed } object from /consent/{org}/update, and occasionally a JSON boolean.
 */
function purposeAllowed(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    // '' carries no decision; the web tag skips it rather than treating it as a denial.
    return value === '' ? undefined : value === 'true';
  }
  if (value != null && typeof value === 'object') {
    const allowed = (value as { allowed?: unknown }).allowed;
    if (typeof allowed === 'boolean') {
      return allowed;
    }
    if (typeof allowed === 'string') {
      return allowed === '' ? undefined : allowed === 'true';
    }
  }
  return undefined;
}

/** Converts a purpose map, dropping only the entries it cannot read. */
function parsePurposes(value: unknown): Record<string, boolean> {
  const purposes: Record<string, boolean> = {};
  if (value == null || typeof value !== 'object') {
    return purposes;
  }
  for (const [code, raw] of Object.entries(value as Record<string, unknown>)) {
    const allowed = purposeAllowed(raw);
    if (allowed !== undefined) {
      purposes[code] = allowed;
    }
  }
  return purposes;
}

function parseConsent(json: Record<string, unknown>): Consent {
  // Default to {}, matching emptyConsent() — a vendors-only response would otherwise leave
  // purposes undefined, which breaks a caller doing Object.keys(consent.purposes).
  const purposes = parsePurposes(json.purposes);
  const vendors = Array.isArray(json.vendors)
    ? (json.vendors as string[])
    : undefined;
  const protocols =
    json.protocols && typeof json.protocols === 'object'
      ? (json.protocols as Record<string, string>)
      : undefined;
  return { purposes, vendors, protocols };
}

function consentFromUpdate(update: ConsentUpdate): Consent {
  const purposes = Object.fromEntries(
    Object.entries(update.purposes).map(([key, value]) => [
      key,
      value.allowed.toLowerCase() === 'true',
    ])
  );
  return {
    purposes,
    vendors: update.vendors,
    protocols: {},
  };
}
