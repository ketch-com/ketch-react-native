/**
 * Validates and extracts a `nativeResolve` request. Unlike every other bridge event,
 * this one arrives as a flat `{event, requestId, key}` object rather than wrapped in
 * `{event, data}`, so it is parsed from the raw message rather than `data.data`.
 */
export const parseNativeResolveMessage = (
  raw: unknown
): { requestId: string; key: string } | undefined => {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const { requestId, key } = raw as Record<string, unknown>;
  if (typeof requestId !== 'string' || !requestId) {
    return undefined;
  }
  if (typeof key !== 'string' || !key.trim()) {
    return undefined;
  }
  return { requestId, key: key.trim() };
};

/**
 * Builds the JS injected to answer a `nativeResolve` request. `window.ketchNativeResolve`
 * is registered by the tag itself and matches replies by `requestId`; an unrecognized or
 * late `requestId` is a safe no-op on its side.
 */
export const buildNativeResolveReply = (
  requestId: string,
  value: string | undefined
): string =>
  `window.ketchNativeResolve(${JSON.stringify(requestId)}, ${
    value === undefined ? 'undefined' : JSON.stringify(value)
  }); true;`;

/**
 * Records a resolved identity value in the in-memory session map. A falsy value leaves
 * the map unchanged, since "nothing found yet" shouldn't be recorded as an identity.
 */
export const withIdentityValue = (
  existing: Record<string, string>,
  key: string,
  value: string | undefined
): Record<string, string> => (value ? { ...existing, [key]: value } : existing);

/**
 * Merges app-supplied identities with everything the SDK has resolved this session.
 * Resolved values win on collision, since they reflect the tag's current state.
 */
export const mergeIdentities = (
  paramIdentities: Record<string, string> | undefined,
  resolvedIdentities: Record<string, string>
): Record<string, string> => ({ ...paramIdentities, ...resolvedIdentities });
