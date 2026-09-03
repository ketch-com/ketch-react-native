import {
  DEFAULT_MANAGED_IDENTITY_TTL_SECONDS,
  MANAGED_IDENTITY_KEY,
  MANAGED_IDENTITY_MINTED_AT_KEY,
  clearManagedIdentity,
  findManagedIdentity,
  getCachedManagedIdentity,
  resolveManagedIdentityValue,
  setCachedManagedIdentity,
  uuidV4,
  withManagedIdentity,
  type ManagedIdentityStorage,
} from '../src/util/managedIdentity';

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const fakeStorage = (initial: Record<string, string> = {}) => {
  const store: Record<string, string> = { ...initial };
  const storage: ManagedIdentityStorage = {
    read: async (key, defaultValue = '') => store[key] ?? defaultValue,
    write: async (key, value) => {
      store[key] = value;
    },
    remove: async (key) => {
      delete store[key];
    },
  };
  return { store, storage };
};

const descriptor = {
  code: 'swb_android',
  variable: 'swb_android',
  ttlSeconds: 100,
};

afterEach(() => setCachedManagedIdentity(undefined));

describe('uuidV4', () => {
  it('mints a lowercase v4 UUID', () => {
    const value = uuidV4();
    expect(value).toMatch(UUID_V4);
    expect(value).toBe(value.toLowerCase());
  });

  it('does not repeat across many mints', () => {
    const values = new Set(Array.from({ length: 1000 }, () => uuidV4()));
    expect(values.size).toBe(1000);
  });

  it('prefers crypto.getRandomValues over the Math.random fallback', () => {
    const getRandomValues = jest.fn((a: Uint8Array) => a.fill(0x42));
    const globals = globalThis as { crypto?: unknown };
    const original = globals.crypto;
    globals.crypto = { getRandomValues };
    try {
      const value = uuidV4();
      expect(getRandomValues).toHaveBeenCalled();
      // Version nibble pinned to 4 and variant to 0b10, even from fixed bytes.
      expect(value).toBe('42424242-4242-4242-8242-424242424242');
      expect(value).toMatch(UUID_V4);
    } finally {
      globals.crypto = original;
    }
  });
});

describe('findManagedIdentity', () => {
  it('finds a query-string managed identity and its ttl', () => {
    expect(
      findManagedIdentity({
        identities: {
          swb_android: {
            type: 'queryString',
            variable: 'swb_android',
            ttl: 42,
          },
        },
      })
    ).toEqual({ code: 'swb_android', variable: 'swb_android', ttlSeconds: 42 });
  });

  it('falls back to the default ttl when the config omits one', () => {
    expect(
      findManagedIdentity({
        identities: { swb_android: { type: 'queryString' } },
      })
    ).toEqual({
      code: 'swb_android',
      variable: 'swb_android',
      ttlSeconds: DEFAULT_MANAGED_IDENTITY_TTL_SECONDS,
    });
  });

  it('ignores a managed identity still declared as cookie-sourced', () => {
    expect(
      findManagedIdentity({
        identities: {
          swb_android: { type: 'managedCookie', variable: '_swb' },
        },
      })
    ).toBeUndefined();
  });

  it('ignores non-managed identities', () => {
    expect(
      findManagedIdentity({
        identities: { email: { type: 'queryString', variable: 'email' } },
      })
    ).toBeUndefined();
  });

  it('returns undefined for absent or malformed config', () => {
    expect(findManagedIdentity(undefined)).toBeUndefined();
    expect(findManagedIdentity({})).toBeUndefined();
    expect(findManagedIdentity({ identities: null })).toBeUndefined();
    expect(
      findManagedIdentity({ identities: { swb_android: null } })
    ).toBeUndefined();
  });
});

describe('resolveManagedIdentityValue', () => {
  it('mints and persists when storage is empty', async () => {
    const { store, storage } = fakeStorage();

    const value = await resolveManagedIdentityValue(descriptor, {
      storage,
      now: () => 1_000,
    });

    expect(value).toMatch(UUID_V4);
    expect(store[MANAGED_IDENTITY_KEY]).toBe(value);
    expect(store[MANAGED_IDENTITY_MINTED_AT_KEY]).toBe('1000');
  });

  it('reuses a stored value that is still within its ttl', async () => {
    const { storage } = fakeStorage({
      [MANAGED_IDENTITY_KEY]: 'existing-value',
      [MANAGED_IDENTITY_MINTED_AT_KEY]: '1000',
    });

    const value = await resolveManagedIdentityValue(descriptor, {
      storage,
      now: () => 1_000 + 99_000,
    });

    expect(value).toBe('existing-value');
  });

  it('mints a new value once the ttl has elapsed', async () => {
    const { store, storage } = fakeStorage({
      [MANAGED_IDENTITY_KEY]: 'existing-value',
      [MANAGED_IDENTITY_MINTED_AT_KEY]: '1000',
    });

    const value = await resolveManagedIdentityValue(descriptor, {
      storage,
      now: () => 1_000 + 100_001,
    });

    expect(value).not.toBe('existing-value');
    expect(value).toMatch(UUID_V4);
    expect(store[MANAGED_IDENTITY_MINTED_AT_KEY]).toBe('101001');
  });

  it('treats exactly the ttl boundary as expired', async () => {
    const { storage } = fakeStorage({
      [MANAGED_IDENTITY_KEY]: 'existing-value',
      [MANAGED_IDENTITY_MINTED_AT_KEY]: '1000',
    });

    const value = await resolveManagedIdentityValue(descriptor, {
      storage,
      now: () => 1_000 + 100_000,
    });

    expect(value).not.toBe('existing-value');
  });

  it('replaces a stored value whose mint timestamp is unreadable', async () => {
    const { storage } = fakeStorage({
      [MANAGED_IDENTITY_KEY]: 'existing-value',
      [MANAGED_IDENTITY_MINTED_AT_KEY]: 'not-a-number',
    });

    const value = await resolveManagedIdentityValue(descriptor, {
      storage,
      now: () => 1_000,
    });

    expect(value).not.toBe('existing-value');
  });

  it('is stable across repeated resolves', async () => {
    const { storage } = fakeStorage();
    const now = () => 1_000;

    const first = await resolveManagedIdentityValue(descriptor, {
      storage,
      now,
    });
    const second = await resolveManagedIdentityValue(descriptor, {
      storage,
      now,
    });

    expect(second).toBe(first);
  });
});

describe('clearManagedIdentity', () => {
  it('removes both stored keys and the cache', async () => {
    const { store, storage } = fakeStorage({
      [MANAGED_IDENTITY_KEY]: 'existing-value',
      [MANAGED_IDENTITY_MINTED_AT_KEY]: '1000',
    });
    setCachedManagedIdentity({
      variable: 'swb_android',
      value: 'existing-value',
    });

    await clearManagedIdentity(storage);

    expect(store[MANAGED_IDENTITY_KEY]).toBeUndefined();
    expect(store[MANAGED_IDENTITY_MINTED_AT_KEY]).toBeUndefined();
    expect(getCachedManagedIdentity()).toBeUndefined();
  });

  it('causes the next resolve to mint a different value', async () => {
    const { storage } = fakeStorage();

    const first = await resolveManagedIdentityValue(descriptor, {
      storage,
      now: () => 1_000,
    });
    await clearManagedIdentity(storage);
    const second = await resolveManagedIdentityValue(descriptor, {
      storage,
      now: () => 2_000,
    });

    expect(second).not.toBe(first);
  });
});

describe('withManagedIdentity', () => {
  it('returns the app identities unchanged when nothing is resolved', () => {
    expect(withManagedIdentity({ email: 'a@b.test' })).toEqual({
      email: 'a@b.test',
    });
    expect(withManagedIdentity(undefined)).toEqual({});
  });

  it('adds the resolved identity under its query parameter name', () => {
    setCachedManagedIdentity({ variable: 'swb_android', value: 'the-uuid' });

    expect(withManagedIdentity({ email: 'a@b.test' })).toEqual({
      swb_android: 'the-uuid',
      email: 'a@b.test',
    });
  });

  it('lets an app-supplied value override the managed one', () => {
    setCachedManagedIdentity({ variable: 'swb_android', value: 'the-uuid' });

    expect(withManagedIdentity({ swb_android: 'app-supplied' })).toEqual({
      swb_android: 'app-supplied',
    });
  });
});
