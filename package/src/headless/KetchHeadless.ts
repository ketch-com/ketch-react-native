import { KetchDataCenter } from '../enums';
import { HeadlessApiClient } from './headlessApiClient';
import { toRegionCode } from './headlessTypes';
import type {
  ConsentConfig,
  ConsentUpdate,
  FullConfigurationRequest,
  InvokeRightRequest,
  LocationResponse,
  PreferenceQRRequest,
  SubscriptionsRequest,
  SubscriptionsResponse,
} from './headlessTypes';
import type { Consent } from '../types';

export interface KetchHeadlessOptions {
  dataCenter?: KetchDataCenter;
  baseUrl?: string;
}

/**
 * Headless web/v3 API entry point for React Native (pre-WebView ATT flows).
 * Uses fetch on both iOS and Android; does not require a WebView.
 */
export class KetchHeadless {
  private readonly client: HeadlessApiClient;
  private cachedLocation: LocationResponse | undefined;

  constructor(options: KetchHeadlessOptions = {}) {
    this.client = new HeadlessApiClient(options);
  }

  buildUrl(path: string, query?: Record<string, string>): string {
    return this.client.buildUrl(path, query);
  }

  /**
   * Region code derived from a GeoIP lookup (`GET /ip`), cached for the lifetime
   * of this instance.
   */
  async getRegion(): Promise<string | undefined> {
    if (!this.cachedLocation) {
      this.cachedLocation = await this.client.getLocation();
    }
    return toRegionCode(this.cachedLocation.location);
  }

  getBootstrapConfiguration(
    organization: string,
    property: string
  ): Promise<Record<string, unknown>> {
    return this.client.getBootstrapConfiguration(organization, property);
  }

  getFullConfiguration(
    request: FullConfigurationRequest
  ): Promise<Record<string, unknown>> {
    return this.client.getFullConfiguration(request);
  }

  getConsent(config: ConsentConfig): Promise<Consent> {
    return this.client.getConsent(config);
  }

  setConsentOnServer(update: ConsentUpdate): Promise<Consent> {
    return this.client.setConsentOnServer(update);
  }

  invokeRight(request: InvokeRightRequest): Promise<void> {
    return this.client.invokeRight(request);
  }

  getSubscriptions(
    request: SubscriptionsRequest
  ): Promise<SubscriptionsResponse> {
    return this.client.getSubscriptions(request);
  }

  setSubscriptions(request: SubscriptionsRequest): Promise<void> {
    return this.client.setSubscriptions(request);
  }

  preferenceQRUrl(request: PreferenceQRRequest): string {
    return this.client.preferenceQRUrl(request);
  }
}
