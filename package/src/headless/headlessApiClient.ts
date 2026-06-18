import { KetchDataCenter, MobileSdkUrlByDataCenterMap } from '../enums';
import type { Consent } from '../types';
import {
  consentConfigToJson,
  consentUpdateToJson,
  HeadlessException,
  withoutProtocols,
  type ConsentConfig,
  type ConsentUpdate,
  type FullConfigurationRequest,
  type GetProfileRequest,
  type GetProfileResponse,
  type InvokeRightRequest,
  type LocationResponse,
  type PreferenceQRRequest,
  type PutProfileRequest,
  type SubscriptionConfigurationRequest,
  type SubscriptionsRequest,
  type SubscriptionsResponse,
  type WebReportRequest,
} from './headlessTypes';

export type FetchFn = typeof fetch;

/** Native HTTP client mirroring ketch-tag KetchWebAPI (web/v3). */
export class HeadlessApiClient {
  private readonly baseUrl: string;
  private readonly fetchFn: FetchFn;

  constructor(
    options: {
      dataCenter?: KetchDataCenter;
      baseUrl?: string;
      fetchFn?: FetchFn;
    } = {}
  ) {
    const dataCenter = options.dataCenter ?? KetchDataCenter.US;
    this.baseUrl = options.baseUrl ?? MobileSdkUrlByDataCenterMap[dataCenter];
    this.fetchFn = options.fetchFn ?? fetch;
  }

  /** Builds an absolute CDN URL for unit tests and debugging. */
  buildUrl(path: string, query?: Record<string, string>): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl.replace(/\/+$/, '')}${normalized}`);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    return url.toString();
  }

  /** GeoIP / jurisdiction hint (`GET /ip`). */
  async fetchLocation(): Promise<LocationResponse> {
    const response = await this.get(this.buildUrl('/ip'));
    return this.parseJsonResponse<LocationResponse>(response, '/ip');
  }

  /** Minimal config (`GET .../boot.json`). */
  async fetchBootstrapConfiguration(
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
  async fetchFullConfiguration(
    request: FullConfigurationRequest
  ): Promise<Record<string, unknown>> {
    let path = `/config/${request.organizationCode}/${request.propertyCode}`;
    if (
      request.environmentCode &&
      request.jurisdictionCode &&
      request.languageCode
    ) {
      path += `/${request.environmentCode}/${request.jurisdictionCode}/${request.languageCode}`;
    }
    path += '/config.json';
    const query = request.hash ? { hash: request.hash } : undefined;
    const response = await this.get(this.buildUrl(path, query));
    return this.parseJsonResponse<Record<string, unknown>>(response, path);
  }

  /** Server consent including `protocols` (`POST .../consent/{org}/get`). */
  async fetchConsent(config: ConsentConfig): Promise<Consent> {
    const path = `/consent/${config.organizationCode}/get`;
    const response = await this.post(path, consentConfigToJson(config));
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

  /** Protocol strings only (same endpoint as fetchConsent). */
  async fetchProtocols(config: ConsentConfig): Promise<Consent> {
    const response = await this.fetchConsent(config);
    if (!response.protocols || Object.keys(response.protocols).length === 0) {
      return {
        purposes: response.purposes,
        vendors: response.vendors,
      };
    }
    return response;
  }

  /** Invokes a data subject right (`POST .../rights/{org}/invoke`). */
  async invokeRight(request: InvokeRightRequest): Promise<void> {
    const path = `/rights/${request.organizationCode}/invoke`;
    await this.postVoid(path, request as unknown as Record<string, unknown>);
  }

  /** Gets profile preferences (`POST .../profile/{org}/get`). */
  async getProfile(request: GetProfileRequest): Promise<GetProfileResponse> {
    const path = `/profile/${request.organizationCode}/get`;
    const response = await this.post(
      path,
      request as unknown as Record<string, unknown>
    );
    return this.parseJsonResponse<GetProfileResponse>(response, path);
  }

  /** Updates profile preferences (`POST .../profile/{org}/put`). */
  async putProfile(request: PutProfileRequest): Promise<void> {
    const path = `/profile/${request.organizationCode}/put`;
    await this.postVoid(path, request as unknown as Record<string, unknown>);
  }

  /** Gets subscription topics/controls (`POST .../subscriptions/{org}/get`). */
  async getSubscriptions(
    request: SubscriptionsRequest
  ): Promise<SubscriptionsResponse> {
    const path = `/subscriptions/${request.organizationCode}/get`;
    const response = await this.post(
      path,
      request as unknown as Record<string, unknown>
    );
    return this.parseJsonResponse<SubscriptionsResponse>(response, path);
  }

  /** Updates subscription topics/controls (`POST .../subscriptions/{org}/update`). */
  async setSubscriptions(request: SubscriptionsRequest): Promise<void> {
    const path = `/subscriptions/${request.organizationCode}/update`;
    await this.postVoid(path, request as unknown as Record<string, unknown>);
  }

  /** Subscriptions tab config (`GET .../subscriptions.json`). */
  async fetchSubscriptionsConfiguration(
    request: SubscriptionConfigurationRequest
  ): Promise<Record<string, unknown>> {
    const path = `/config/${request.organizationCode}/${request.propertyCode}/${request.languageCode}/${request.experienceCode}/subscriptions.json`;
    const response = await this.get(this.buildUrl(path));
    return this.parseJsonResponse<Record<string, unknown>>(response, path);
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

  /** Telemetry upload (`POST /report/{channel}`). */
  async webReport(channel: string, request: WebReportRequest): Promise<void> {
    await this.postVoid(
      `/report/${channel}`,
      request as unknown as Record<string, unknown>
    );
  }

  /** Updates consent; returns server response with computed `protocols`. */
  async setConsentOnServer(update: ConsentUpdate): Promise<Consent> {
    const path = `/consent/${update.organizationCode}/update`;
    const response = await this.post(
      path,
      consentUpdateToJson(withoutProtocols(update))
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

  private async get(url: string): Promise<string> {
    try {
      const response = await this.fetchFn(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
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
  const hasProtocols =
    consent.protocols != null && Object.keys(consent.protocols).length > 0;
  return hasPurposes || hasProtocols;
}

function parseConsent(json: Record<string, unknown>): Consent {
  const purposes =
    json.purposes && typeof json.purposes === 'object'
      ? (json.purposes as Record<string, boolean>)
      : undefined;
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
