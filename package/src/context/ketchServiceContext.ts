/* eslint-disable @typescript-eslint/no-unused-vars */
import { createContext } from 'react';
import type { Consent, KetchMobile, KetchService } from '../types';

export const KetchServiceContext = createContext<KetchService>({
  load: () => {},
  showConsentExperience: () => {},
  showPreferenceExperience: () => {},
  dismissExperience: () => {},
  getConsent: () => ({}) as Consent,
  // @ts-ignore
  updateParameters: (parameters: Partial<KetchMobile>) => {},
});
