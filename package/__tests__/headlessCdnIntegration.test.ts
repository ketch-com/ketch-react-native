/**
 * Live CDN headless tests — require network.
 *
 * Run: `KETCH_INTEGRATION_TESTS=1 npm run test:integration`
 */
import { HeadlessApiClient } from '../src/headless/headlessApiClient';
import {
  MigrationOption,
  withoutProtocols,
  type ConsentUpdate,
} from '../src/headless/headlessTypes';
import { KetchDataCenter } from '../src/enums';
import { HeadlessIntegrationSupport } from './headlessIntegrationSupport';

const runIntegration = process.env.KETCH_INTEGRATION_TESTS === '1';

(runIntegration ? describe : describe.skip)('Headless CDN integration', () => {
  jest.setTimeout(60_000);

  let client: HeadlessApiClient;

  beforeEach(() => {
    client = new HeadlessApiClient({ dataCenter: KetchDataCenter.US });
  });

  it('getLocation returns GeoIP from CDN', async () => {
    const location = await client.getLocation();
    expect(location.location?.countryCode).toBeTruthy();
  });

  it('getBootstrapConfiguration returns sandbox config', async () => {
    const boot = await client.getBootstrapConfiguration(
      HeadlessIntegrationSupport.orgCode,
      HeadlessIntegrationSupport.propertyCode
    );
    expect(Object.keys(boot).length).toBeGreaterThan(0);
    const environments = boot.environments;
    expect(Array.isArray(environments) && environments.length > 0).toBe(true);
  });

  it('headless cold start consent round-trip', async () => {
    const identities = HeadlessIntegrationSupport.uniqueEmailIdentity();

    await client.getLocation();

    await client.getBootstrapConfiguration(
      HeadlessIntegrationSupport.orgCode,
      HeadlessIntegrationSupport.propertyCode
    );

    const fullConfig = await client.getFullConfiguration({
      organizationCode: HeadlessIntegrationSupport.orgCode,
      propertyCode: HeadlessIntegrationSupport.propertyCode,
    });

    const consentConfig =
      HeadlessIntegrationSupport.consentConfigFromConfiguration({
        configuration: fullConfig,
        identities,
      });

    const consent = await client.getConsent(consentConfig);
    const hasProtocols =
      consent.protocols != null && Object.keys(consent.protocols).length > 0;
    const hasPurposes =
      consent.purposes != null && Object.keys(consent.purposes).length > 0;
    expect(hasProtocols || hasPurposes).toBe(true);

    const purposeCode = Object.keys(consentConfig.purposes)[0];
    const legalBasis = consentConfig.purposes[purposeCode || ''];

    const update: ConsentUpdate = {
      organizationCode: HeadlessIntegrationSupport.orgCode,
      propertyCode: HeadlessIntegrationSupport.propertyCode,
      environmentCode: HeadlessIntegrationSupport.environmentCode,
      identities,
      jurisdictionCode: consentConfig.jurisdictionCode,
      migrationOption: MigrationOption.MIGRATE_DEFAULT,
      purposes: {
        [purposeCode || '']: {
          allowed: 'true',
          legalBasisCode: legalBasis?.legalBasisCode || '',
        },
      },
    };

    const updated = await client.setConsentOnServer(withoutProtocols(update));
    // toBeDefined() would also pass for the string 'true'; assert the boolean.
    expect(updated.purposes?.[purposeCode || '']).toBe(true);
    expect(typeof updated.purposes?.[purposeCode || '']).toBe('boolean');
  });

  /**
   * Denial is the direction that inverts: the CDN answers with the string 'false'
   * from /update (inside an { allowed } object) and bare 'false' from /get, both of
   * which are truthy. Uses its own identity and writes once — `collectedAt` is
   * second-resolution, so two writes in the same second race on the tie-break.
   */
  it('a denied purpose reads back as boolean false on both endpoints', async () => {
    const identities = HeadlessIntegrationSupport.uniqueEmailIdentity();

    const fullConfig = await client.getFullConfiguration({
      organizationCode: HeadlessIntegrationSupport.orgCode,
      propertyCode: HeadlessIntegrationSupport.propertyCode,
    });

    const consentConfig =
      HeadlessIntegrationSupport.consentConfigFromConfiguration({
        configuration: fullConfig,
        identities,
      });

    const purposeCode = Object.keys(consentConfig.purposes)[0] || '';
    const legalBasis = consentConfig.purposes[purposeCode];

    const denied = await client.setConsentOnServer(
      withoutProtocols({
        organizationCode: HeadlessIntegrationSupport.orgCode,
        propertyCode: HeadlessIntegrationSupport.propertyCode,
        environmentCode: HeadlessIntegrationSupport.environmentCode,
        identities,
        jurisdictionCode: consentConfig.jurisdictionCode,
        migrationOption: MigrationOption.MIGRATE_DEFAULT,
        purposes: {
          [purposeCode]: {
            allowed: 'false',
            legalBasisCode: legalBasis?.legalBasisCode || '',
          },
        },
      })
    );
    expect(denied.purposes?.[purposeCode]).toBe(false);

    const reread = await client.getConsent(consentConfig);
    expect(reread.purposes?.[purposeCode]).toBe(false);
    expect(typeof reread.purposes?.[purposeCode]).toBe('boolean');
  });

});
