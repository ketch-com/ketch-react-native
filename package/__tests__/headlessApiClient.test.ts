import {
  consentConfigToJson,
  consentUpdateToJson,
  HeadlessException,
  MigrationOption,
  withoutProtocols,
} from '../src/headless/headlessTypes';
import {
  HeadlessApiClient,
  type FetchFn,
} from '../src/headless/headlessApiClient';
import { KetchDataCenter, MobileSdkUrlByDataCenterMap } from '../src/enums';

const consentConfig = {
  organizationCode: 'org',
  propertyCode: 'prop',
  environmentCode: 'production',
  jurisdictionCode: 'default',
  identities: { id: '1' },
  purposes: {},
};

const consentUpdate = {
  organizationCode: 'org',
  propertyCode: 'prop',
  environmentCode: 'production',
  identities: { id: '1' },
  jurisdictionCode: 'default',
  migrationOption: MigrationOption.MIGRATE_DEFAULT,
  purposes: {
    analytics: { allowed: 'true', legalBasisCode: 'consent_optin' },
  },
};

function mockFetch(
  impl: () => Promise<{
    ok: boolean;
    status: number;
    text: () => Promise<string>;
  }>
): FetchFn {
  return jest.fn().mockImplementation(impl) as unknown as FetchFn;
}

function mockFetchResponse(options: {
  ok: boolean;
  status?: number;
  body?: string;
}): FetchFn {
  return mockFetch(async () => ({
    ok: options.ok,
    status: options.status ?? (options.ok ? 200 : 500),
    text: async () => options.body ?? '',
  }));
}

function mockFetchNetworkError(error: Error): FetchFn {
  return mockFetch(async () => {
    throw error;
  });
}

describe('HeadlessApiClient URL building', () => {
  it('buildUrl ip', () => {
    const client = new HeadlessApiClient({ dataCenter: KetchDataCenter.US });
    expect(client.buildUrl('/ip')).toBe(
      'https://global.ketchcdn.com/web/v3/ip'
    );
  });

  it('buildUrl bootstrap', () => {
    const client = new HeadlessApiClient({ dataCenter: KetchDataCenter.US });
    expect(client.buildUrl('/config/acme/prop/boot.json')).toBe(
      'https://global.ketchcdn.com/web/v3/config/acme/prop/boot.json'
    );
  });

  it('buildUrl fullConfigurationWithHash', () => {
    const client = new HeadlessApiClient({ dataCenter: KetchDataCenter.US });
    expect(
      client.buildUrl('/config/acme/prop/prod/us-ca/en-US/config.json', {
        hash: '8913461971881236311',
      })
    ).toBe(
      'https://global.ketchcdn.com/web/v3/config/acme/prop/prod/us-ca/en-US/config.json?hash=8913461971881236311'
    );
  });

  it('buildUrl eu data center', () => {
    const client = new HeadlessApiClient({ dataCenter: KetchDataCenter.EU });
    expect(client.buildUrl('/ip')).toBe('https://eu.ketchcdn.com/web/v3/ip');
  });

  it('ketchDataCenter base URLs', () => {
    expect(MobileSdkUrlByDataCenterMap[KetchDataCenter.US]).toBe(
      'https://global.ketchcdn.com/web/v3'
    );
    expect(MobileSdkUrlByDataCenterMap[KetchDataCenter.EU]).toBe(
      'https://eu.ketchcdn.com/web/v3'
    );
    expect(MobileSdkUrlByDataCenterMap[KetchDataCenter.UAT]).toBe(
      'https://dev.ketchcdn.com/web/v3'
    );
  });
});

describe('Headless consent payloads', () => {
  it('setConsent payload omits protocols', () => {
    const update = {
      organizationCode: 'org',
      propertyCode: 'prop',
      environmentCode: 'production',
      identities: { id: '1' },
      jurisdictionCode: 'default',
      migrationOption: MigrationOption.MIGRATE_DEFAULT,
      purposes: {
        analytics: { allowed: 'true', legalBasisCode: 'consent_optin' },
      },
      protocols: { gpp: 'DBABLA~' },
    };
    const json = consentUpdateToJson(withoutProtocols(update));
    expect(json).not.toHaveProperty('protocols');
    expect(json.organizationCode).toBe('org');
  });

  it('buildUrl invokeRight', () => {
    const client = new HeadlessApiClient({ dataCenter: KetchDataCenter.US });
    expect(client.buildUrl('/rights/switchbitcorp/invoke')).toBe(
      'https://global.ketchcdn.com/web/v3/rights/switchbitcorp/invoke'
    );
  });

  it('preferenceQRUrl matches contract fixture', () => {
    const client = new HeadlessApiClient({ dataCenter: KetchDataCenter.US });
    expect(
      client.preferenceQRUrl({
        organizationCode: 'switchbitcorp',
        propertyCode: 'switchbit',
        environmentCode: 'production',
        imageSize: 1024,
        path: '/policy.html',
        backgroundColor: 'white',
        foregroundColor: 'black',
        parameters: { foo: 'bar' },
      })
    ).toBe(
      'https://global.ketchcdn.com/web/v3/qr/switchbitcorp/switchbit/preferences.png?env=production&size=1024&path=%2Fpolicy.html&bgcolor=white&fgcolor=black&foo=bar'
    );
  });

  it('buildUrl subscriptions configuration', () => {
    const client = new HeadlessApiClient({ dataCenter: KetchDataCenter.US });
    expect(
      client.buildUrl('/config/switchbitcorp/foo/en-US/bar/subscriptions.json')
    ).toBe(
      'https://global.ketchcdn.com/web/v3/config/switchbitcorp/foo/en-US/bar/subscriptions.json'
    );
  });

  it('buildUrl profile and subscriptions', () => {
    const client = new HeadlessApiClient({ dataCenter: KetchDataCenter.US });
    expect(client.buildUrl('/profile/acme/get')).toBe(
      'https://global.ketchcdn.com/web/v3/profile/acme/get'
    );
    expect(client.buildUrl('/subscriptions/acme/get')).toBe(
      'https://global.ketchcdn.com/web/v3/subscriptions/acme/get'
    );
    expect(client.buildUrl('/subscriptions/acme/update')).toBe(
      'https://global.ketchcdn.com/web/v3/subscriptions/acme/update'
    );
  });

  it('consentConfig payload omits cachedAt', () => {
    const json = consentConfigToJson({
      organizationCode: 'org',
      propertyCode: 'prop',
      environmentCode: 'production',
      jurisdictionCode: 'default',
      identities: {},
      purposes: {},
    });
    expect(json).not.toHaveProperty('cachedAt');
  });
});

describe('HeadlessApiClient consent', () => {
  it('fetchConsent propagates HTTP failure', async () => {
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn: mockFetchResponse({ ok: false, status: 500 }),
    });

    await expect(client.fetchConsent(consentConfig)).rejects.toThrow(
      HeadlessException
    );
    await expect(client.fetchConsent(consentConfig)).rejects.toThrow(
      'HTTP 500'
    );
  });

  it('setConsentOnServer propagates network failure', async () => {
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn: mockFetchNetworkError(new TypeError('Network request failed')),
    });

    await expect(client.setConsentOnServer(consentUpdate)).rejects.toThrow(
      TypeError
    );
  });

  it('fetchConsent returns empty consent on 200 null body', async () => {
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn: mockFetchResponse({ ok: true, body: 'null' }),
    });

    await expect(client.fetchConsent(consentConfig)).resolves.toEqual({
      purposes: {},
    });
  });

  it('fetchConsent returns empty consent on 200 blank body', async () => {
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn: mockFetchResponse({ ok: true, body: '' }),
    });

    await expect(client.fetchConsent(consentConfig)).resolves.toEqual({
      purposes: {},
    });
  });

  it('setConsentOnServer accepts protocols-only response', async () => {
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn: mockFetchResponse({
        ok: true,
        body: JSON.stringify({ protocols: { gpp: 'DBABLA~' } }),
      }),
    });

    await expect(client.setConsentOnServer(consentUpdate)).resolves.toEqual({
      purposes: undefined,
      vendors: undefined,
      protocols: { gpp: 'DBABLA~' },
    });
  });
});

describe('fetchProtocols', () => {
  it('preserves purposes when protocols are missing', async () => {
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn: mockFetchResponse({
        ok: true,
        body: JSON.stringify({
          purposes: { analytics: true, marketing: false },
        }),
      }),
    });

    await expect(client.fetchProtocols(consentConfig)).resolves.toEqual({
      purposes: { analytics: true, marketing: false },
      vendors: undefined,
    });
  });
});

describe('hasUsableConsentFields (via fetchConsent)', () => {
  it('returns empty consent when purposes and protocols are empty objects', async () => {
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn: mockFetchResponse({
        ok: true,
        body: JSON.stringify({ purposes: {}, protocols: {} }),
      }),
    });

    await expect(client.fetchConsent(consentConfig)).resolves.toEqual({
      purposes: {},
    });
  });

  it('accepts purposes-only response', async () => {
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn: mockFetchResponse({
        ok: true,
        body: JSON.stringify({ purposes: { analytics: true } }),
      }),
    });

    await expect(client.fetchConsent(consentConfig)).resolves.toEqual({
      purposes: { analytics: true },
      vendors: undefined,
      protocols: undefined,
    });
  });

  it('accepts protocols-only response', async () => {
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn: mockFetchResponse({
        ok: true,
        body: JSON.stringify({ protocols: { gpp: 'DBABLA~' } }),
      }),
    });

    await expect(client.fetchConsent(consentConfig)).resolves.toEqual({
      purposes: undefined,
      vendors: undefined,
      protocols: { gpp: 'DBABLA~' },
    });
  });

  it('returns empty consent when neither purposes nor protocols are present', async () => {
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn: mockFetchResponse({
        ok: true,
        body: JSON.stringify({ vendors: ['1'] }),
      }),
    });

    await expect(client.fetchConsent(consentConfig)).resolves.toEqual({
      purposes: {},
    });
  });

  it('setConsentOnServer falls back when response has empty purposes and protocols', async () => {
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn: mockFetchResponse({
        ok: true,
        body: JSON.stringify({ purposes: {}, protocols: {} }),
      }),
    });

    await expect(client.setConsentOnServer(consentUpdate)).resolves.toEqual({
      purposes: { analytics: true },
      vendors: undefined,
      protocols: {},
    });
  });
});
