import {
  consentConfigToJson,
  consentUpdateToJson,
  MigrationOption,
  withoutProtocols,
} from '../src/headless/headlessTypes';
import { HeadlessApiClient } from '../src/headless/headlessApiClient';
import { KetchDataCenter, MobileSdkUrlByDataCenterMap } from '../src/enums';

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
