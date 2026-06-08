import {
  KetchDataCenter,
  MobileSdkUrlByDataCenterMap,
} from '../enums';
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
  type PutProfileRequest,
  type SubscriptionsRequest,
  type SubscriptionsResponse,
} from './headlessTypes';

export type FetchFn = typeof fetch;

/** Native HTTP client mirroring ketch-tag KetchWebAPI (web/v3). */
export class HeadlessApiClient {
  private readonly baseUrl: string;
  private readonly fetchFn: FetchFn;

  constructor(options: {
    dataCenter?: KetchDataCenter;
    baseUrl?: string;
    fetchFn?: FetchFn;
  } = {}) {
    const dataCenter = options.dataCenter ?? KetchDataCenter.US;
    this.baseUrl =
      options.baseUrl ?? MobileSdkUrlByDataCenterMap[dataCenter];
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
    return JSON.parse(response) as LocationResponse;
  }

  /** Minimal config (`GET .../boot.json`). */
  async fetchBootstrapConfiguration(
    organization: string,
    property: string
  ): Promise<Record<string, unknown>> {
    const response = await this.get(
      this.buildUrl(`/config/${organization}/${property}/boot.json`)
    );
    return JSON.parse(response) as Record<string, unknown>;
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
    return JSON.parse(response) as Record<string, unknown>;
  }

  /** Server consent including `protocols` (`POST .../consent/{org}/get`). */
  async fetchConsent(config: ConsentConfig): Promise<Consent> {
    const path = `/consent/${config.organizationCode}/get`;
    try {
      const response = await this.post(path, consentConfigToJson(config));
      if (!response || response === 'null') {
        return emptyConsent();
      }
      const json = JSON.parse(response) as Record<string, unknown>;
      if (json.purposes != null || json.protocols != null) {
        return parseConsent(json);
      }
      return emptyConsent();
    } catch {
      return emptyConsent();
    }
  }

  /** Protocol strings only (same endpoint as fetchConsent). */
  async fetchProtocols(config: ConsentConfig): Promise<Consent> {
    const response = await this.fetchConsent(config);
    if (!response.protocols || Object.keys(response.protocols).length === 0) {
      return {};
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
    return JSON.parse(response) as GetProfileResponse;
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
    return JSON.parse(response) as SubscriptionsResponse;
  }

  /** Updates subscription topics/controls (`POST .../subscriptions/{org}/update`). */
  async setSubscriptions(request: SubscriptionsRequest): Promise<void> {
    const path = `/subscriptions/${request.organizationCode}/update`;
    await this.postVoid(path, request as unknown as Record<string, unknown>);
  }

  /** Updates consent; returns server response with computed `protocols`. */
  async setConsentOnServer(update: ConsentUpdate): Promise<Consent> {
    const path = `/consent/${update.organizationCode}/update`;
    try {
      const response = await this.post(
        path,
        consentUpdateToJson(withoutProtocols(update))
      );
      if (!response || response === 'null') {
        return consentFromUpdate(update);
      }
      const json = JSON.parse(response) as Record<string, unknown>;
      const purposes = json.purposes;
      if (
        purposes &&
        typeof purposes === 'object' &&
        Object.keys(purposes as object).length > 0
      ) {
        return parseConsent(json);
      }
      return consentFromUpdate(update);
    } catch {
      return consentFromUpdate(update);
    }
  }

  private async get(url: string): Promise<string> {
    const response = await this.fetchFn(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new HeadlessException(`HTTP ${response.status} for ${url}`);
    }
    return response.text();
  }

  private async postVoid(
    path: string,
    body: Record<string, unknown>
  ): Promise<void> {
    const url = this.buildUrl(path);
    const response = await this.fetchFn(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new HeadlessException(`HTTP ${response.status} for ${url}`);
    }
  }

  private async post(
    path: string,
    body: Record<string, unknown>
  ): Promise<string> {
    const url = this.buildUrl(path);
    const response = await this.fetchFn(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new HeadlessException(`HTTP ${response.status} for ${url}`);
    }
    return response.text();
  }
}

function emptyConsent(): Consent {
  return { purposes: {} };
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
