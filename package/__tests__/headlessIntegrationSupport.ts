import type { ConsentConfig } from '../src/headless/headlessTypes';

/** Shared sandbox config for live CDN integration tests. */
export const HeadlessIntegrationSupport = {
  orgCode: 'ketch_samples',
  propertyCode: 'react_native_sample_app',
  environmentCode: 'production',

  uniqueEmailIdentity(): Record<string, string> {
    return {
      email: `headless-${Date.now()}@integration.ketch.test`,
    };
  },

  consentConfigFromConfiguration(options: {
    configuration: Record<string, unknown>;
    identities: Record<string, string>;
    organizationCode?: string;
    propertyCode?: string;
    environmentCode?: string;
  }): ConsentConfig {
    const {
      configuration,
      identities,
      organizationCode = HeadlessIntegrationSupport.orgCode,
      propertyCode = HeadlessIntegrationSupport.propertyCode,
      environmentCode = HeadlessIntegrationSupport.environmentCode,
    } = options;

    const jurisdictionMap = configuration.jurisdiction;
    let jurisdiction = 'us';
    if (jurisdictionMap && typeof jurisdictionMap === 'object') {
      const map = jurisdictionMap as Record<string, unknown>;
      jurisdiction = String(
        map.code ?? map.defaultJurisdictionCode ?? jurisdiction
      );
    }

    const purposesList = configuration.purposes;
    const purposes: ConsentConfig['purposes'] = {};
    if (Array.isArray(purposesList)) {
      for (const entry of purposesList) {
        if (entry && typeof entry === 'object') {
          const purpose = entry as Record<string, unknown>;
          const code = purpose.code?.toString();
          const legalBasis = purpose.legalBasisCode?.toString();
          if (code && legalBasis) {
            purposes[code] = { legalBasisCode: legalBasis };
          }
        }
      }
    }

    if (Object.keys(purposes).length === 0) {
      throw new Error('Configuration returned no purposes');
    }

    return {
      organizationCode,
      propertyCode,
      environmentCode,
      jurisdictionCode: jurisdiction,
      identities,
      purposes,
    };
  },
};
