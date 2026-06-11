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

(runIntegration ? describe : describe.skip)(
  'Headless CDN integration',
  () => {
    jest.setTimeout(60_000);

    let client: HeadlessApiClient;

    beforeEach(() => {
      client = new HeadlessApiClient({ dataCenter: KetchDataCenter.US });
    });

    it('fetchLocation returns GeoIP from CDN', async () => {
      const location = await client.fetchLocation();
      expect(location.location?.countryCode).toBeTruthy();
    });

    it('fetchBootstrapConfiguration returns sandbox config', async () => {
      const boot = await client.fetchBootstrapConfiguration(
        HeadlessIntegrationSupport.orgCode,
        HeadlessIntegrationSupport.propertyCode
      );
      expect(Object.keys(boot).length).toBeGreaterThan(0);
      const environments = boot.environments;
      expect(Array.isArray(environments) && environments.length > 0).toBe(
        true
      );
    });

    it('headless cold start consent round-trip', async () => {
      const identities = HeadlessIntegrationSupport.uniqueEmailIdentity();

      await client.fetchLocation();

      await client.fetchBootstrapConfiguration(
        HeadlessIntegrationSupport.orgCode,
        HeadlessIntegrationSupport.propertyCode
      );

      const fullConfig = await client.fetchFullConfiguration({
        organizationCode: HeadlessIntegrationSupport.orgCode,
        propertyCode: HeadlessIntegrationSupport.propertyCode,
      });

      const consentConfig =
        HeadlessIntegrationSupport.consentConfigFromConfiguration({
          configuration: fullConfig,
          identities,
        });

      const consent = await client.fetchConsent(consentConfig);
      const hasProtocols =
        consent.protocols != null &&
        Object.keys(consent.protocols).length > 0;
      const hasPurposes =
        consent.purposes != null &&
        Object.keys(consent.purposes).length > 0;
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

      const updated = await client.setConsentOnServer(
        withoutProtocols(update)
      );
      expect(updated.purposes?.[purposeCode || '']).toBeDefined();
    });
  }
);
