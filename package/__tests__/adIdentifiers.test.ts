import { NativeModules, Platform } from 'react-native';
import {
  isAdIdentifierKey,
  resolveAdIdentifier,
} from '../src/util/adIdentifiers';

describe('isAdIdentifierKey', () => {
  it.each(['ketch_idfv', 'ketch_aaid'])('is true for %s', (key) => {
    expect(isAdIdentifierKey(key)).toBe(true);
  });

  it('is false for an ordinary storage key', () => {
    expect(isAdIdentifierKey('swb_myapp')).toBe(false);
  });
});

describe('resolveAdIdentifier', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
    delete (NativeModules as Record<string, unknown>).KetchAdIdentifiers;
  });

  it('resolves ketch_idfv from the native module on iOS', async () => {
    Platform.OS = 'ios';
    const getIdfv = jest.fn().mockResolvedValue('the-idfv');
    NativeModules.KetchAdIdentifiers = { getIdfv };

    await expect(resolveAdIdentifier('ketch_idfv')).resolves.toBe('the-idfv');
    expect(getIdfv).toHaveBeenCalledTimes(1);
  });

  it('never calls getIdfv for ketch_idfv on Android, returns null', async () => {
    Platform.OS = 'android';
    const getIdfv = jest.fn().mockResolvedValue('the-idfv');
    NativeModules.KetchAdIdentifiers = { getIdfv };

    await expect(resolveAdIdentifier('ketch_idfv')).resolves.toBeNull();
    expect(getIdfv).not.toHaveBeenCalled();
  });

  it('resolves ketch_aaid from the native module on Android', async () => {
    Platform.OS = 'android';
    const getAaid = jest.fn().mockResolvedValue('the-aaid');
    NativeModules.KetchAdIdentifiers = { getAaid };

    await expect(resolveAdIdentifier('ketch_aaid')).resolves.toBe('the-aaid');
    expect(getAaid).toHaveBeenCalledTimes(1);
  });

  it('never calls getAaid for ketch_aaid on iOS, returns null', async () => {
    Platform.OS = 'ios';
    const getAaid = jest.fn().mockResolvedValue('the-aaid');
    NativeModules.KetchAdIdentifiers = { getAaid };

    await expect(resolveAdIdentifier('ketch_aaid')).resolves.toBeNull();
    expect(getAaid).not.toHaveBeenCalled();
  });

  it('returns null when the native method rejects, for ketch_idfv', async () => {
    Platform.OS = 'ios';
    NativeModules.KetchAdIdentifiers = {
      getIdfv: jest.fn().mockRejectedValue(new Error('native failure')),
    };

    await expect(resolveAdIdentifier('ketch_idfv')).resolves.toBeNull();
  });

  it('returns null when the native method rejects, for ketch_aaid', async () => {
    Platform.OS = 'android';
    NativeModules.KetchAdIdentifiers = {
      getAaid: jest.fn().mockRejectedValue(new Error('native failure')),
    };

    await expect(resolveAdIdentifier('ketch_aaid')).resolves.toBeNull();
  });

  it('returns null when the native module is absent entirely', async () => {
    Platform.OS = 'ios';

    await expect(resolveAdIdentifier('ketch_idfv')).resolves.toBeNull();
  });

  it('returns null for an ordinary key regardless of platform', async () => {
    Platform.OS = 'ios';
    await expect(resolveAdIdentifier('swb_myapp')).resolves.toBeNull();

    Platform.OS = 'android';
    await expect(resolveAdIdentifier('swb_myapp')).resolves.toBeNull();
  });
});
