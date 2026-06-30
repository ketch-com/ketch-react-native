/**
 * Single source of truth for the sample app's SDK configuration.
 * Edit these values to point the sample at a different org/property/etc.
 * Both the KetchServiceProvider (App.tsx) and the read-only Info panel
 * (Main.tsx) read from here.
 */
import {KetchDataCenter} from '@ketch-com/ketch-react-native';

export const SAMPLE_CONFIG = {
  organizationCode: 'ketch_samples',
  propertyCode: 'ios',
  environmentName: 'production',
  languageCode: 'en',
  jurisdictionCode: undefined as string | undefined,
  regionCode: undefined as string | undefined,
  identities: {email: 'test@example.com'} as Record<string, string>,
  dataCenter: KetchDataCenter.US,
};
