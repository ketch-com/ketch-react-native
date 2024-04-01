import { createContext } from 'react';
import type { Consent, KetchService } from '../types';

export const KetchServiceContext = createContext<KetchService>({
  showConsentExperience: () => {},
  showPreferenceExperience: () => {},
  dismissExperience: () => {},
  getConsent: () => ({}) as Consent,
  updateParameters: () => {},
});
