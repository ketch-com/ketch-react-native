import { KetchDataCenter } from '../enums';
import { HeadlessApiClient } from './headlessApiClient';
import type {
  ConsentConfig,
  ConsentUpdate,
  FullConfigurationRequest,
  LocationResponse,
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

  constructor(options: KetchHeadlessOptions = {}) {
    this.client = new HeadlessApiClient(options);
  }

  buildUrl(path: string, query?: Record<string, string>): string {
    return this.client.buildUrl(path, query);
  }

  fetchLocation(): Promise<LocationResponse> {
    return this.client.fetchLocation();
  }

  fetchBootstrapConfiguration(
    organization: string,
    property: string
  ): Promise<Record<string, unknown>> {
    return this.client.fetchBootstrapConfiguration(organization, property);
  }

  fetchFullConfiguration(
    request: FullConfigurationRequest
  ): Promise<Record<string, unknown>> {
    return this.client.fetchFullConfiguration(request);
  }

  fetchConsent(config: ConsentConfig): Promise<Consent> {
    return this.client.fetchConsent(config);
  }

  fetchProtocols(config: ConsentConfig): Promise<Consent> {
    return this.client.fetchProtocols(config);
  }

  setConsentOnServer(update: ConsentUpdate): Promise<Consent> {
    return this.client.setConsentOnServer(update);
  }
}
