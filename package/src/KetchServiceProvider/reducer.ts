import type { KetchMobile } from '../types';

export enum Action {
  UPDATE_PARAMETERS = 'updateParameters',
  KetchShowConsent = 'ketchShowConsent',
  KetchShowPreference = 'ketchShowPreference',
}

export const reducer = (
  state: KetchMobile,
  { type, payload }: { type: Action; payload: Partial<KetchMobile> }
) => {
  switch (type) {
    case 'updateParameters':
      return { ...state, ...payload };

    case Action.KetchShowConsent:
      return { ...state, ketch_show: 'consent' };

    case Action.KetchShowPreference:
      return { ...state, ketch_show: 'preferences' };

    default:
      return state;
  }
};
