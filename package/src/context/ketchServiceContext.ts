import { createContext } from 'react';
import { type KetchService } from '../types';

export const KetchServiceContext = createContext<KetchService>({
  showConsentExperience: () => {},
  showPreferenceExperience: () => {},
  dismissExperience: () => {},
  updateParameters: () => {},
});
