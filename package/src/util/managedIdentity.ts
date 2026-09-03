import nativeStorage from './nativeStorage';

/**
 * Storage keys for the Ketch-managed identifier. One value per app, not per property,
 * mirroring web where a single cookie per domain serves every property on it.
 */
export const MANAGED_IDENTITY_KEY = 'ketch_managed_identity';
export const MANAGED_IDENTITY_MINTED_AT_KEY =
  'ketch_managed_identity_minted_at';

/** Reserved prefix for identity space codes Ketch generates. */
export const MANAGED_IDENTITY_CODE_PREFIX = 'swb_';

/** Used when the config declares no TTL. Matches the web tag's cookie default. */
export const DEFAULT_MANAGED_IDENTITY_TTL_SECONDS = 400 * 86400;

/** The subset of native storage this module uses, injectable for tests. */
export type ManagedIdentityStorage = {
  read: (key: string, defaultValue?: string) => Promise<string>;
  write: (key: string, value: string) => Promise<unknown>;
  remove: (key: string) => Promise<void>;
};

/** What the property config says about the managed identity. */
export type ManagedIdentityDescriptor = {
  /** Identity space code, e.g. `swb_android`. */
  code: string;
  /** Query parameter name the tag reads the value from. */
  variable: string;
  ttlSeconds: number;
};

export type ResolvedManagedIdentity = {
  variable: string;
  value: string;
};

let polyfillAttempted = false;
let warnedAboutWeakEntropy = false;

/**
 * Installs `crypto.getRandomValues` by side effect. React Native ships no WebCrypto,
 * so without this the UUID is generated from `Math.random`, whose seeding is not
 * guaranteed to be unique across devices.
 */
const ensureCryptoPolyfill = (): void => {
  if (polyfillAttempted) return;
  polyfillAttempted = true;
  try {
    require('react-native-get-random-values');
  } catch (_) {}
};

const warnWeakEntropy = (reason: string): void => {
  if (warnedAboutWeakEntropy) return;
  warnedAboutWeakEntropy = true;
  console.warn(
    `[Ketch] ${reason} The Ketch-managed identifier falls back to Math.random, ` +
      'which is not a cryptographic source and risks duplicate identifiers.'
  );
};

const getRandomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  ensureCryptoPolyfill();
  const webCrypto = (
    globalThis as {
      crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array };
    }
  ).crypto;
  let getRandomValuesThrew = false;
  if (webCrypto && typeof webCrypto.getRandomValues === 'function') {
    try {
      webCrypto.getRandomValues(bytes);
      return bytes;
    } catch (_) {
      // Present but unusable, e.g. the polyfill is installed while its native
      // module is not linked. Fall through rather than failing identity minting.
      getRandomValuesThrew = true;
    }
  }
  // Two devices whose PRNG happens to seed alike can mint the same identifier, and
  // identifiers key consent records, so this is a degraded path rather than an
  // equivalent one. The two ways of reaching it need different fixes, so say which.
  warnWeakEntropy(
    getRandomValuesThrew
      ? 'crypto.getRandomValues threw, so its native module is likely not linked.'
      : 'react-native-get-random-values is not installed or did not register.'
  );
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
};

/** Generates a lowercase RFC 4122 version 4 UUID, matching the format web mints. */
export const uuidV4 = (): string => {
  const bytes = getRandomBytes(16);
  // RFC 4122 pins the version to 4 in byte 6 and the variant to 0b10 in byte 8.
  /* eslint-disable no-bitwise */
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  /* eslint-enable no-bitwise */

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
};

/**
 * Locates the managed identity in a property config. Returns undefined when the
 * property has none, or when it is still declared as cookie-sourced, in which case
 * the tag mints its own value and the SDK must not supply one.
 */
export const findManagedIdentity = (
  config: Record<string, unknown> | undefined
): ManagedIdentityDescriptor | undefined => {
  const identities = config?.identities;
  if (!identities || typeof identities !== 'object') {
    return undefined;
  }

  for (const [code, entry] of Object.entries(
    identities as Record<string, unknown>
  )) {
    if (!code.startsWith(MANAGED_IDENTITY_CODE_PREFIX)) continue;
    if (!entry || typeof entry !== 'object') continue;

    const { type, variable, ttl } = entry as {
      type?: unknown;
      variable?: unknown;
      ttl?: unknown;
    };
    if (type !== 'queryString') continue;

    return {
      code,
      variable: typeof variable === 'string' && variable ? variable : code,
      ttlSeconds:
        typeof ttl === 'number' && ttl > 0
          ? ttl
          : DEFAULT_MANAGED_IDENTITY_TTL_SECONDS,
    };
  }

  return undefined;
};

/**
 * Returns the stored identifier, minting and persisting one when absent or expired.
 * Expiry is fixed from the mint time rather than sliding, matching the web cookie,
 * which is never rewritten once set.
 */
export const resolveManagedIdentityValue = async (
  descriptor: ManagedIdentityDescriptor,
  options: { storage?: ManagedIdentityStorage; now?: () => number } = {}
): Promise<string> => {
  const storage = options.storage ?? nativeStorage;
  const now = options.now ?? Date.now;

  const stored = await storage.read(MANAGED_IDENTITY_KEY, '');
  if (stored) {
    const mintedAt = Number.parseInt(
      await storage.read(MANAGED_IDENTITY_MINTED_AT_KEY, ''),
      10
    );
    // A value whose age cannot be established is replaced rather than kept forever.
    const expired =
      !Number.isFinite(mintedAt) ||
      now() - mintedAt >= descriptor.ttlSeconds * 1000;
    if (!expired) {
      return stored;
    }
  }

  const minted = uuidV4();
  await storage.write(MANAGED_IDENTITY_KEY, minted);
  await storage.write(MANAGED_IDENTITY_MINTED_AT_KEY, String(now()));
  return minted;
};

let cached: ResolvedManagedIdentity | undefined;

export const getCachedManagedIdentity = ():
  | ResolvedManagedIdentity
  | undefined => cached;

export const setCachedManagedIdentity = (
  identity: ResolvedManagedIdentity | undefined
): void => {
  cached = identity;
};

/**
 * Wipes the stored identifier. The next resolve mints a new one, which starts a new
 * consent record. Does not affect identities supplied by the app.
 */
export const clearManagedIdentity = async (
  storage: ManagedIdentityStorage = nativeStorage
): Promise<void> => {
  cached = undefined;
  await storage.remove(MANAGED_IDENTITY_KEY);
  await storage.remove(MANAGED_IDENTITY_MINTED_AT_KEY);
};

/** Merges the resolved identifier into an identity map. App-supplied entries win. */
export const withManagedIdentity = (
  identities?: Record<string, string>
): Record<string, string> => {
  if (!cached) {
    return identities ?? {};
  }
  return { [cached.variable]: cached.value, ...identities };
};
