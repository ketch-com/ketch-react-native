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
import {
  clearManagedIdentity,
  setCachedManagedIdentity,
} from '../src/util/managedIdentity';

// The real native storage reaches for React Native's Settings module, which does
// not exist under Jest. The headless path uses the default rather than injecting.
jest.mock('../src/util/nativeStorage', () => {
  const values = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      read: async (key: string, fallback = '') => values.get(key) ?? fallback,
      write: async (key: string, value: string) => {
        values.set(key, value);
      },
      remove: async (key: string) => {
        values.delete(key);
      },
      removeValues: async () => 0,
    },
  };
});

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

  it('environment + jurisdiction, no language: long path with synthesized language', async () => {
    const { fetchFn, calls } = mockFetchCapturing();
    const client = new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn,
      deviceLanguage: () => 'fr-CA',
    });
    await client.getFullConfiguration({
      organizationCode: 'org',
      propertyCode: 'prop',
      environmentCode: 'staging',
      jurisdictionCode: 'us-ca',
    });
    expect(calls()[0]![0]).toBe(
      'https://global.ketchcdn.com/web/v3/config/org/prop/staging/us-ca/fr-CA/config.json'
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
      purposes: {},
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
      purposes: {},
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
      purposes: {},
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

/**
 * React Native only partially polyfills the WHATWG URL API: its URL constructor
 * appends a trailing slash to every URL (react-native/Libraries/Blob/URL.js) and
 * URLSearchParams.set() throws (Libraries/Blob/URLSearchParams.js). Node's URL is
 * complete, so a buildUrl that relies on either passes under jest and 404s on device.
 * These tests substitute the React Native semantics to keep that gap covered.
 */
describe('HeadlessApiClient URL building under the React Native URL polyfill', () => {
  const realURL = globalThis.URL;
  const realURLSearchParams = globalThis.URLSearchParams;

  beforeEach(() => {
    class ReactNativeURL {
      _url: string;
      constructor(url: string) {
        this._url = url.endsWith('/') ? url : `${url}/`;
      }
      get searchParams(): never {
        throw new Error('URL.searchParams is not implemented');
      }
      toString(): string {
        return this._url;
      }
    }
    class ReactNativeURLSearchParams {
      set(): never {
        throw new Error('URLSearchParams.set is not implemented');
      }
    }
    // @ts-expect-error substituting a deliberately incomplete polyfill
    globalThis.URL = ReactNativeURL;
    // @ts-expect-error substituting a deliberately incomplete polyfill
    globalThis.URLSearchParams = ReactNativeURLSearchParams;
  });

  afterEach(() => {
    globalThis.URL = realURL;
    globalThis.URLSearchParams = realURLSearchParams;
  });

  it('does not append a trailing slash to a .json path', () => {
    const client = new HeadlessApiClient({ dataCenter: KetchDataCenter.US });
    expect(client.buildUrl('/config/acme/prop/boot.json')).toBe(
      'https://global.ketchcdn.com/web/v3/config/acme/prop/boot.json'
    );
  });

  it('does not append a trailing slash to a POST path', () => {
    const client = new HeadlessApiClient({ dataCenter: KetchDataCenter.US });
    expect(client.buildUrl('/subscriptions/acme/get')).toBe(
      'https://global.ketchcdn.com/web/v3/subscriptions/acme/get'
    );
  });

  it('builds query strings without URLSearchParams.set', () => {
    const client = new HeadlessApiClient({ dataCenter: KetchDataCenter.US });
    expect(
      client.buildUrl('/config/acme/prop/config.json', { hash: '123' })
    ).toBe(
      'https://global.ketchcdn.com/web/v3/config/acme/prop/config.json?hash=123'
    );
  });

  it('percent-encodes query values without URLSearchParams.set', () => {
    const client = new HeadlessApiClient({ dataCenter: KetchDataCenter.US });
    expect(
      client.buildUrl('/qr/org/prop/preferences.png', { path: '/policy.html' })
    ).toBe(
      'https://global.ketchcdn.com/web/v3/qr/org/prop/preferences.png?path=%2Fpolicy.html'
    );
  });

  it('preferenceQRUrl works without URLSearchParams.set', () => {
    const client = new HeadlessApiClient({ dataCenter: KetchDataCenter.US });
    expect(
      client.preferenceQRUrl({
        organizationCode: 'org',
        propertyCode: 'prop',
        environmentCode: 'production',
        imageSize: 256,
      })
    ).toBe(
      'https://global.ketchcdn.com/web/v3/qr/org/prop/preferences.png?env=production&size=256'
    );
  });
});

/**
 * The CDN types purpose values as strings, not booleans: /consent/{org}/get returns
 * "purposes":{"analytics":"false"} and /consent/{org}/update returns
 * "purposes":{"analytics":{"allowed":"false"}}. Consent.purposes is declared
 * Record<string, boolean>, so a cast leaves a truthy "false" in a boolean field and a
 * caller doing `if (consent.purposes[x])` reads a denied purpose as granted.
 */
describe('Consent purpose conversion', () => {
  function clientReturning(body: string) {
    return new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn: mockFetchResponse({ ok: true, body }),
    });
  }

  it('converts bare "false" from /get to boolean false', async () => {
    const client = clientReturning(
      JSON.stringify({ purposes: { analytics_900: 'false' } })
    );
    const consent = await client.getConsent(consentConfig);
    expect(consent.purposes).toEqual({ analytics_900: false });
    expect(typeof consent.purposes?.analytics_900).toBe('boolean');
  });

  it('converts bare "true" from /get to boolean true', async () => {
    const client = clientReturning(
      JSON.stringify({ purposes: { analytics_900: 'true' } })
    );
    await expect(client.getConsent(consentConfig)).resolves.toEqual({
      purposes: { analytics_900: true },
      vendors: undefined,
      protocols: undefined,
    });
  });

  it('converts a mixed map without losing either value', async () => {
    const client = clientReturning(
      JSON.stringify({
        purposes: { analytics_900: 'false', targeted_advertising: 'true' },
      })
    );
    const consent = await client.getConsent(consentConfig);
    expect(consent.purposes).toEqual({
      analytics_900: false,
      targeted_advertising: true,
    });
  });

  it('converts the { allowed } object shape from /update', async () => {
    const client = clientReturning(
      JSON.stringify({
        purposes: {
          analytics_900: {
            allowed: 'false',
            legalBasisCode: 'consent_optout',
          },
        },
      })
    );
    const consent = await client.setConsentOnServer(consentUpdate);
    expect(consent.purposes).toEqual({ analytics_900: false });
  });

  it('treats any value other than "true" as denied', async () => {
    const client = clientReturning(
      JSON.stringify({ purposes: { a: 'TRUE', b: 'yes', c: '1' } })
    );
    const consent = await client.getConsent(consentConfig);
    expect(consent.purposes).toEqual({ a: false, b: false, c: false });
  });

  it('keeps raw JSON booleans', async () => {
    const client = clientReturning(
      JSON.stringify({ purposes: { a: true, b: false } })
    );
    const consent = await client.getConsent(consentConfig);
    expect(consent.purposes).toEqual({ a: true, b: false });
  });

  it('omits unreadable values without discarding the rest of the map', async () => {
    const client = clientReturning(
      JSON.stringify({
        purposes: {
          readable: 'false',
          empty: '',
          nulled: null,
          emptyObject: {},
          noAllowed: { legalBasisCode: 'consent_optin' },
          numeric: 7,
        },
      })
    );
    const consent = await client.getConsent(consentConfig);
    expect(consent.purposes).toEqual({ readable: false });
  });

  it('falls back to empty consent when no purpose is readable', async () => {
    const client = clientReturning(JSON.stringify({ purposes: { a: '' } }));
    await expect(client.getConsent(consentConfig)).resolves.toEqual({
      purposes: {},
    });
  });
});

/**
 * Omitting `context` makes the server record the write as source "unknown".
 * The SubscriptionSource union includes a `headless` value for this caller.
 */
describe('setSubscriptions context', () => {
  const request = {
    organizationCode: 'org',
    propertyCode: 'prop',
    environmentCode: 'production',
    identities: { email: 'a@b.test' },
    topics: { newsletter: { email: { status: 'granted' as const } } },
  };

  function sentBody(calls: [string, RequestInit | undefined][]) {
    return JSON.parse(String(calls[0]?.[1]?.body)) as Record<string, unknown>;
  }

  it('defaults the source to headless', async () => {
    const { fetchFn, calls } = mockFetchCapturing();
    await new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn,
    }).setSubscriptions(request);
    expect(calls()[0]?.[0]).toBe(
      'https://global.ketchcdn.com/web/v3/subscriptions/org/update'
    );
    expect(sentBody(calls()).context).toEqual({ source: 'headless' });
  });

  it('lets an explicit source win', async () => {
    const { fetchFn, calls } = mockFetchCapturing();
    await new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn,
    }).setSubscriptions({
      ...request,
      context: { source: 'preference.subscriptionsTab.manual' },
    });
    expect(sentBody(calls()).context).toEqual({
      source: 'preference.subscriptionsTab.manual',
    });
  });

  it('keeps a caller-supplied configurationId alongside the default source', async () => {
    const { fetchFn, calls } = mockFetchCapturing();
    await new HeadlessApiClient({
      dataCenter: KetchDataCenter.US,
      fetchFn,
    }).setSubscriptions({ ...request, context: { configurationId: 'cfg-1' } });
    expect(sentBody(calls()).context).toEqual({
      source: 'headless',
      configurationId: 'cfg-1',
    });
  });
});

describe('getIdentityConfiguration', () => {
  it('requests the short path with include=identities', async () => {
    const { fetchFn, calls } = mockFetchCapturing();
    const client = new HeadlessApiClient({ fetchFn });

    await client.getIdentityConfiguration({
      organizationCode: 'org',
      propertyCode: 'prop',
    });

    const [url] = calls()[0]!;
    expect(url).toContain('/config/org/prop/config.json');
    expect(url).toContain('include=identities');
    // The long path ignores include, so it must not be used here.
    expect(url).not.toContain('/config/org/prop/production');
  });

  it('warns when the response carries no identities key', async () => {
    // An unrecognised include value returns 200 with the key absent, which would
    // otherwise be silently read as a property declaring no identities.
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchFn = mockFetchResponse({ ok: true, body: '{"bogus":null}' });
    const client = new HeadlessApiClient({ fetchFn });

    await client.getIdentityConfiguration({
      organizationCode: 'org',
      propertyCode: 'prop',
    });

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('no identities key')
    );
    warn.mockRestore();
  });

  it('stays quiet when identities are present but empty', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchFn = mockFetchResponse({ ok: true, body: '{"identities":{}}' });
    const client = new HeadlessApiClient({ fetchFn });

    await client.getIdentityConfiguration({
      organizationCode: 'org',
      propertyCode: 'prop',
    });

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('managed identity injection into headless requests', () => {
  // Resolutions are memoised per property and other tests in this file drive the
  // same org/property through error paths, so reset on both sides of each test.
  const reset = async () => {
    setCachedManagedIdentity(undefined);
    await clearManagedIdentity();
  };

  beforeEach(reset);
  afterEach(reset);

  /**
   * Serves a config declaring a query-string managed identity, and an empty body for
   * anything else. The client fetches config to learn the identity space, so the
   * request under test is not the first call.
   */
  const mockFetchWithConfig = (declaresIdentity = true) => {
    const calls: [string, RequestInit | undefined][] = [];
    const fetchFn = jest
      .fn()
      .mockImplementation(async (url: string, init?: RequestInit) => {
        calls.push([url, init]);
        const body =
          url.includes('/config/') && declaresIdentity
            ? JSON.stringify({
                identities: {
                  swb_android: { type: 'queryString', variable: 'swb_android' },
                },
              })
            : '{}';
        return { ok: true, status: 200, text: async () => body };
      }) as unknown as FetchFn;
    return { fetchFn, calls: () => calls };
  };

  const identitiesSentTo = (
    calls: [string, RequestInit | undefined][],
    fragment: string
  ) => {
    const call = calls.find(([url]) => url.includes(fragment));
    if (!call) throw new Error(`no request to ${fragment}`);
    return JSON.parse(String(call[1]?.body)).identities;
  };

  const UUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  it('adds the resolved identity to the consent request body', async () => {
    const { fetchFn, calls } = mockFetchWithConfig();
    const client = new HeadlessApiClient({ fetchFn });

    await client.getConsent(consentConfig);

    const identities = identitiesSentTo(calls(), '/consent/org/get');
    expect(identities.id).toBe('1');
    expect(identities.swb_android).toMatch(UUID);
  });

  it('adds the resolved identity to the consent update body', async () => {
    const { fetchFn, calls } = mockFetchWithConfig();
    const client = new HeadlessApiClient({ fetchFn });

    await client.setConsentOnServer(consentUpdate);

    const identities = identitiesSentTo(calls(), '/consent/org/update');
    expect(identities.id).toBe('1');
    expect(identities.swb_android).toMatch(UUID);
  });

  it('adds the resolved identity to an invokeRight body', async () => {
    const { fetchFn, calls } = mockFetchWithConfig();
    const client = new HeadlessApiClient({ fetchFn });

    await client.invokeRight({
      organizationCode: 'org',
      propertyCode: 'prop',
      rightCode: 'gdpr_portability',
      identities: { id: '1' },
    } as unknown as Parameters<HeadlessApiClient['invokeRight']>[0]);

    const identities = identitiesSentTo(calls(), '/rights/org/invoke');
    expect(identities.id).toBe('1');
    expect(identities.swb_android).toMatch(UUID);
  });

  it('adds the resolved identity to a subscriptions body', async () => {
    const { fetchFn, calls } = mockFetchWithConfig();
    const client = new HeadlessApiClient({ fetchFn });

    await client.getSubscriptions({
      organizationCode: 'org',
      propertyCode: 'prop',
      identities: { id: '1' },
    } as Parameters<HeadlessApiClient['getSubscriptions']>[0]);

    const identities = identitiesSentTo(calls(), '/subscriptions/org/get');
    expect(identities.id).toBe('1');
    expect(identities.swb_android).toMatch(UUID);
  });

  it('uses a provider-resolved identity when the request omits propertyCode', async () => {
    // propertyCode is optional only on subscriptions, so the identity space cannot be
    // looked up. Whatever a mounted provider already resolved still applies.
    setCachedManagedIdentity({
      code: 'swb_android',
      variable: 'swb_android',
      value: 'the-uuid',
    });
    const { fetchFn, calls } = mockFetchWithConfig();
    const client = new HeadlessApiClient({ fetchFn });

    await client.getSubscriptions({
      organizationCode: 'org',
      identities: { id: '1' },
    } as Parameters<HeadlessApiClient['getSubscriptions']>[0]);

    const identities = identitiesSentTo(calls(), '/subscriptions/org/get');
    expect(identities.id).toBe('1');
    expect(identities.swb_android).toBe('the-uuid');
  });

  it('leaves identities alone without propertyCode when nothing is resolved', async () => {
    const { fetchFn, calls } = mockFetchWithConfig();
    const client = new HeadlessApiClient({ fetchFn });

    await client.getSubscriptions({
      organizationCode: 'org',
      identities: { id: '1' },
    } as Parameters<HeadlessApiClient['getSubscriptions']>[0]);

    expect(identitiesSentTo(calls(), '/subscriptions/org/get')).toEqual({
      id: '1',
    });
  });

  it('resolves without a provider having mounted', async () => {
    const { fetchFn, calls } = mockFetchWithConfig();
    const client = new HeadlessApiClient({ fetchFn });

    // Nothing primes the cache here, which is the standalone KetchHeadless case.
    await client.getConsent(consentConfig);

    expect(identitiesSentTo(calls(), '/consent/org/get').swb_android).toMatch(
      UUID
    );
  });

  it('fetches config once across repeated calls', async () => {
    const { fetchFn, calls } = mockFetchWithConfig();
    const client = new HeadlessApiClient({ fetchFn });

    await client.getConsent(consentConfig);
    await client.getConsent(consentConfig);

    const configCalls = calls().filter(([url]) => url.includes('/config/'));
    expect(configCalls).toHaveLength(1);
  });

  it('leaves identities untouched when the property declares none', async () => {
    const { fetchFn, calls } = mockFetchWithConfig(false);
    const client = new HeadlessApiClient({ fetchFn });

    await client.getConsent(consentConfig);

    expect(identitiesSentTo(calls(), '/consent/org/get')).toEqual({ id: '1' });
  });
});
