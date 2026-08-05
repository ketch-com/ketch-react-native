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

function mockFetchCapturing(): {
  fetchFn: FetchFn;
  calls: () => [string, RequestInit | undefined][];
} {
  const calls: [string, RequestInit | undefined][] = [];
  const fetchFn = jest
    .fn()
    .mockImplementation(async (url: string, init?: RequestInit) => {
      calls.push([url, init]);
      return { ok: true, status: 200, text: async () => '{}' };
    }) as unknown as FetchFn;
  return { fetchFn, calls: () => calls };
}

describe('getFullConfiguration URL building', () => {
  it('all fields present: full static path, hash-only query', async () => {
    const { fetchFn, calls } = mockFetchCapturing();
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn,
      deviceLanguage: () => 'fr-CA',
    });
    await client.getFullConfiguration({
      organizationCode: 'org',
      propertyCode: 'prop',
      environmentCode: 'production',
      jurisdictionCode: 'us-ca',
      languageCode: 'en-US',
      hash: 'abc123',
    });
    expect(calls()[0]![0]).toBe(
      'https://global.ketchcdn.com/web/v3/config/org/prop/production/us-ca/en-US/config.json?hash=abc123'
    );
  });

  it('nothing set: short path defaults language from device', async () => {
    const { fetchFn, calls } = mockFetchCapturing();
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn,
      deviceLanguage: () => 'fr-CA',
    });
    await client.getFullConfiguration({
      organizationCode: 'org',
      propertyCode: 'prop',
    });
    expect(calls()[0]![0]).toBe(
      'https://global.ketchcdn.com/web/v3/config/org/prop/config.json?language=fr-CA'
    );
  });

  it('explicit language wins over device locale', async () => {
    const { fetchFn, calls } = mockFetchCapturing();
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn,
      deviceLanguage: () => 'fr-CA',
    });
    await client.getFullConfiguration({
      organizationCode: 'org',
      propertyCode: 'prop',
      languageCode: 'de-DE',
    });
    expect(calls()[0]![0]).toBe(
      'https://global.ketchcdn.com/web/v3/config/org/prop/config.json?language=de-DE'
    );
  });

  it('jurisdiction only: short path includes jurisdiction and defaulted language', async () => {
    const { fetchFn, calls } = mockFetchCapturing();
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn,
      deviceLanguage: () => 'fr-CA',
    });
    await client.getFullConfiguration({
      organizationCode: 'org',
      propertyCode: 'prop',
      jurisdictionCode: 'us-ca',
    });
    expect(calls()[0]![0]).toBe(
      'https://global.ketchcdn.com/web/v3/config/org/prop/config.json?language=fr-CA&jurisdiction=us-ca'
    );
  });

  it('region only: short path includes region and defaulted language', async () => {
    const { fetchFn, calls } = mockFetchCapturing();
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn,
      deviceLanguage: () => 'fr-CA',
    });
    await client.getFullConfiguration({
      organizationCode: 'org',
      propertyCode: 'prop',
      regionCode: 'US-CA',
    });
    expect(calls()[0]![0]).toBe(
      'https://global.ketchcdn.com/web/v3/config/org/prop/config.json?language=fr-CA&region=US-CA'
    );
  });

  it('blank environment treated as absent, still includes hash', async () => {
    const { fetchFn, calls } = mockFetchCapturing();
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn,
      deviceLanguage: () => 'fr-CA',
    });
    await client.getFullConfiguration({
      organizationCode: 'org',
      propertyCode: 'prop',
      environmentCode: '',
      jurisdictionCode: 'us-ca',
      languageCode: 'en-US',
      hash: 'abc123',
    });
    expect(calls()[0]![0]).toBe(
      'https://global.ketchcdn.com/web/v3/config/org/prop/config.json?language=en-US&jurisdiction=us-ca&hash=abc123'
    );
  });

  it('short path includes Accept-Language header from device locale', async () => {
    const { fetchFn, calls } = mockFetchCapturing();
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn,
      deviceLanguage: () => 'fr-CA',
    });
    await client.getFullConfiguration({
      organizationCode: 'org',
      propertyCode: 'prop',
    });
    expect(calls()[0]![1]?.headers).toMatchObject({
      'Accept-Language': 'fr-CA',
    });
  });
});

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
  it('getConsent propagates HTTP failure', async () => {
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn: mockFetchResponse({ ok: false, status: 500 }),
    });

    await expect(client.getConsent(consentConfig)).rejects.toThrow(
      HeadlessException
    );
    await expect(client.getConsent(consentConfig)).rejects.toThrow('HTTP 500');
  });

  it('setConsentOnServer propagates network failure', async () => {
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn: mockFetchNetworkError(new TypeError('Network request failed')),
    });

    await expect(client.setConsentOnServer(consentUpdate)).rejects.toThrow(
      HeadlessException
    );
  });

  it('getConsent returns empty consent on malformed JSON', async () => {
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn: mockFetchResponse({ ok: true, body: '{not-json' }),
    });

    await expect(client.getConsent(consentConfig)).resolves.toEqual({
      purposes: {},
    });
  });

  it('getConsent returns empty consent on 200 null body', async () => {
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn: mockFetchResponse({ ok: true, body: 'null' }),
    });

    await expect(client.getConsent(consentConfig)).resolves.toEqual({
      purposes: {},
    });
  });

  it('getConsent returns empty consent on 200 blank body', async () => {
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn: mockFetchResponse({ ok: true, body: '' }),
    });

    await expect(client.getConsent(consentConfig)).resolves.toEqual({
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

describe('hasUsableConsentFields (via getConsent)', () => {
  it('returns empty consent when purposes and protocols are empty objects', async () => {
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn: mockFetchResponse({
        ok: true,
        body: JSON.stringify({ purposes: {}, protocols: {} }),
      }),
    });

    await expect(client.getConsent(consentConfig)).resolves.toEqual({
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

    await expect(client.getConsent(consentConfig)).resolves.toEqual({
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

    await expect(client.getConsent(consentConfig)).resolves.toEqual({
      purposes: undefined,
      vendors: undefined,
      protocols: { gpp: 'DBABLA~' },
    });
  });

  it('keeps a vendors-only response', async () => {
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn: mockFetchResponse({
        ok: true,
        body: JSON.stringify({ vendors: ['1'] }),
      }),
    });

    await expect(client.getConsent(consentConfig)).resolves.toEqual({
      purposes: undefined,
      vendors: ['1'],
      protocols: undefined,
    });
  });

  it('returns empty consent when purposes, vendors, and protocols are all absent', async () => {
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn: mockFetchResponse({
        ok: true,
        body: JSON.stringify({ someOtherField: true }),
      }),
    });

    await expect(client.getConsent(consentConfig)).resolves.toEqual({
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
