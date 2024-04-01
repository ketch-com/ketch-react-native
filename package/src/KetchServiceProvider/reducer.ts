import type { KetchMobile } from '../types';

export enum Action {
  UPDATE_PARAMETERS = 'updateParameters',
}

export const reducer = (
  state: KetchMobile,
  { type, payload }: { type: Action; payload: Partial<KetchMobile> }
) => {
  console.log('updating in reduce', type);
  console.log('updating in reduce', payload);
  switch (type) {
    case 'updateParameters':
      return { ...state, ...payload };

    default:
      return state;
  }
};
