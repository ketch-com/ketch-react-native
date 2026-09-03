import {
  createUrlParamsObject,
  getWebViewConfigKey,
  normalizeKetchMobileSdkUrl,
  toHideExperienceArgument,
  toWillShowExperienceType,
} from '../src/util/helpers';
import {
  KetchDataCenter,
  LogLevel,
  OnHideExperienceArgument,
  WillShowExperienceType,
} from '../src/enums';
import {
  jurisdictionCodeFromConfig,
  toRegionCode,
} from '../src/headless/headlessTypes';

describe('createUrlParamsObject', () => {
  it('includes ketch_att when ketchAtt is set', () => {
    const params = createUrlParamsObject({
      organizationCode: 'acme',
      propertyCode: 'prop',
      dataCenter: KetchDataCenter.US,
      ketchAtt: 'denied',
    });

    expect(params.ketch_att).toBe('denied');
    expect(params.organizationCode).toBe('acme');
  });

  it('maps data center and log level', () => {
    const params = createUrlParamsObject({
      organizationCode: 'acme',
      propertyCode: 'prop',
      dataCenter: KetchDataCenter.US,
      logLevel: LogLevel.ERROR,
    });

    expect(params.ketch_mobilesdk_url).toContain('web/v3');
    expect(params.ketch_log).toBe(LogLevel.ERROR);
  });

  it('ketchMobileSdkUrl overrides the data center URL', () => {
    const params = createUrlParamsObject({
      organizationCode: 'acme',
      propertyCode: 'prop',
      dataCenter: KetchDataCenter.US,
      ketchMobileSdkUrl: 'https://example.test/web/v3',
    });

    expect(params.ketch_mobilesdk_url).toBe('https://example.test/web/v3');
  });

  it('ignores invalid ketchMobileSdkUrl and keeps data center URL', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const params = createUrlParamsObject({
      organizationCode: 'acme',
      propertyCode: 'prop',
      dataCenter: KetchDataCenter.US,
      ketchMobileSdkUrl: 'https://evil.test/x</script><script>',
    });

    expect(params.ketch_mobilesdk_url).toBe(
      'https://global.ketchcdn.com/web/v3'
    );
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('maps UAT data center to dev CDN', () => {
    const params = createUrlParamsObject({
      organizationCode: 'acme',
      propertyCode: 'prop',
      dataCenter: KetchDataCenter.UAT,
    });

    expect(params.ketch_mobilesdk_url).toBe('https://dev.ketchcdn.com/web/v3');
  });

  it('changes web view config key when data center changes', () => {
    const base = {
      organizationCode: 'acme',
      propertyCode: 'prop',
    };
    const usKey = getWebViewConfigKey({
      ...base,
      dataCenter: KetchDataCenter.US,
    });
    const uatKey = getWebViewConfigKey({
      ...base,
      dataCenter: KetchDataCenter.UAT,
    });

    expect(usKey).not.toBe(uatKey);
  });
});

describe('normalizeKetchMobileSdkUrl without a working URL global', () => {
  // React Native's URL polyfill throws "URL.protocol is not implemented", which
  // silently rejected every ketchMobileSdkUrl on device. Node's URL works, so the
  // tests below stand in for the device by removing it.
  const RealURL = globalThis.URL;

  beforeEach(() => {
    // @ts-expect-error deliberately removing the global for this test
    delete globalThis.URL;
  });

  afterEach(() => {
    globalThis.URL = RealURL;
  });

  it('still accepts https and local http', () => {
    expect(
      normalizeKetchMobileSdkUrl('https://global.ketchcdn.com/web/v3')
    ).toBe('https://global.ketchcdn.com/web/v3');
    expect(normalizeKetchMobileSdkUrl('http://localhost:8787/web/v3')).toBe(
      'http://localhost:8787/web/v3'
    );
    expect(normalizeKetchMobileSdkUrl('http://127.0.0.1:8787/web/v3')).toBe(
      'http://127.0.0.1:8787/web/v3'
    );
  });

  it('still rejects non-https remote hosts', () => {
    expect(
      normalizeKetchMobileSdkUrl('http://evil.test/web/v3')
    ).toBeUndefined();
    expect(
      normalizeKetchMobileSdkUrl('ftp://global.ketchcdn.com')
    ).toBeUndefined();
    expect(normalizeKetchMobileSdkUrl('not a url')).toBeUndefined();
  });
});

describe('normalizeKetchMobileSdkUrl', () => {
  it('accepts https and local http', () => {
    expect(
      normalizeKetchMobileSdkUrl('https://global.ketchcdn.com/web/v3')
    ).toBe('https://global.ketchcdn.com/web/v3');
    expect(normalizeKetchMobileSdkUrl('http://localhost:9000/web/v3')).toBe(
      'http://localhost:9000/web/v3'
    );
  });

  it('rejects non-https remote and script breakout', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(
      normalizeKetchMobileSdkUrl('http://example.test/web/v3')
    ).toBeUndefined();
    expect(normalizeKetchMobileSdkUrl('https://x/</script>')).toBeUndefined();
    expect(normalizeKetchMobileSdkUrl('not a url')).toBeUndefined();
    warn.mockRestore();
  });
});

describe('toRegionCode', () => {
  it('combines country and region', () => {
    expect(toRegionCode({ countryCode: 'US', regionCode: 'CA' })).toBe('US-CA');
  });

  it('falls back to country alone when there is no subdivision', () => {
    expect(toRegionCode({ countryCode: 'FR' })).toBe('FR');
    expect(toRegionCode({ countryCode: 'FR', regionCode: '  ' })).toBe('FR');
  });

  it('falls back to region alone when there is no country', () => {
    expect(toRegionCode({ regionCode: 'CA' })).toBe('CA');
  });

  it('returns undefined when neither is present', () => {
    expect(toRegionCode({})).toBeUndefined();
    expect(toRegionCode(undefined)).toBeUndefined();
  });
});

describe('jurisdictionCodeFromConfig', () => {
  it('prefers the specific code over the default', () => {
    expect(
      jurisdictionCodeFromConfig({
        jurisdiction: { code: 'us_ca', defaultJurisdictionCode: 'default' },
      })
    ).toBe('us_ca');
  });

  it('falls back to the default code', () => {
    expect(
      jurisdictionCodeFromConfig({
        jurisdiction: { defaultJurisdictionCode: 'default' },
      })
    ).toBe('default');
  });

  it('returns undefined when jurisdiction is absent', () => {
    expect(jurisdictionCodeFromConfig({})).toBeUndefined();
  });
});

describe('toHideExperienceArgument', () => {
  it('passes through recognized reasons', () => {
    expect(toHideExperienceArgument('setConsent')).toBe(
      OnHideExperienceArgument.setConsent
    );
    expect(toHideExperienceArgument('setSubscriptions')).toBe(
      OnHideExperienceArgument.setSubscriptions
    );
  });

  it('falls back to none for unrecognized, undefined, and null', () => {
    expect(toHideExperienceArgument('somethingNew')).toBe(
      OnHideExperienceArgument.none
    );
    expect(toHideExperienceArgument(undefined)).toBe(
      OnHideExperienceArgument.none
    );
    expect(toHideExperienceArgument(null)).toBe(OnHideExperienceArgument.none);
  });
});

describe('toWillShowExperienceType', () => {
  it('passes through recognized types', () => {
    expect(toWillShowExperienceType('experiences.consent')).toBe(
      WillShowExperienceType.ConsentExperience
    );
    expect(toWillShowExperienceType('experiences.preference')).toBe(
      WillShowExperienceType.PreferenceExperience
    );
  });

  it('falls back to None for unrecognized and undefined', () => {
    expect(toWillShowExperienceType('experiences.other')).toBe(
      WillShowExperienceType.None
    );
    expect(toWillShowExperienceType(undefined)).toBe(
      WillShowExperienceType.None
    );
  });
});
