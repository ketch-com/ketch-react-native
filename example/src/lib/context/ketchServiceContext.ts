import {createContext} from 'react';
import {KetchService} from '../types';

export const KetchServiceContext = createContext<KetchService>({
  showConsentExperience: () => {},
  showPreferenceExperience: () => {},
  dismissExperience: () => {},
  updateParameters: () => {},
});
