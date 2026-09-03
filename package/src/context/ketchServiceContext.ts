/* eslint-disable @typescript-eslint/no-unused-vars */
import { createContext } from 'react';
import type { Consent, KetchMobile, KetchService } from '../types';

export const KetchServiceContext = createContext<KetchService>({
  load: () => {},
  showConsentExperience: () => {},
  showPreferenceExperience: () => {},
  dismissExperience: () => {},
  trigger: () => false,
  getConsent: () => ({}) as Consent,
  // @ts-ignore
  updateParameters: (parameters: Partial<KetchMobile>) => {},
  setCssOverride: (_css: string) => {},
  getRegion: () => Promise.resolve(undefined),
  getJurisdiction: () => Promise.resolve(undefined),
  fetchConsent: () => Promise.resolve({}) as Promise<Consent>,
  getIdentities: () => Promise.resolve({}),
  clearIdentities: () => Promise.resolve(),
});
