import {
  buildNativeResolveReply,
  mergeIdentities,
  parseNativeResolveMessage,
  withIdentityValue,
} from '../src/util/nativeIdentity';

describe('parseNativeResolveMessage', () => {
  it('extracts requestId and key from a well-formed message', () => {
    expect(
      parseNativeResolveMessage({
        event: 'nativeResolve',
        requestId: '123-1',
        key: 'swb_myapp',
      })
    ).toEqual({ requestId: '123-1', key: 'swb_myapp' });
  });

  it('trims whitespace from the key', () => {
    expect(
      parseNativeResolveMessage({ requestId: '1', key: '  swb_myapp  ' })
    ).toEqual({ requestId: '1', key: 'swb_myapp' });
  });

  it.each([
    ['non-object', 'not an object'],
    ['null', null],
    ['missing requestId', { key: 'swb_myapp' }],
    ['non-string requestId', { requestId: 1, key: 'swb_myapp' }],
    ['empty requestId', { requestId: '', key: 'swb_myapp' }],
    ['missing key', { requestId: '1' }],
    ['non-string key', { requestId: '1', key: 42 }],
    ['blank key', { requestId: '1', key: '   ' }],
  ])('returns undefined for %s', (_label, raw) => {
    expect(parseNativeResolveMessage(raw)).toBeUndefined();
  });
});

describe('buildNativeResolveReply', () => {
  it('injects the value as a quoted string', () => {
    expect(buildNativeResolveReply('req-1', 'the-uuid')).toBe(
      'window.ketchNativeResolve("req-1", "the-uuid"); true;'
    );
  });

  it('injects a literal undefined when there is no value', () => {
    expect(buildNativeResolveReply('req-1', undefined)).toBe(
      'window.ketchNativeResolve("req-1", undefined); true;'
    );
  });

  it('escapes quotes in requestId and value', () => {
    expect(buildNativeResolveReply('req"1', 'va"lue')).toBe(
      'window.ketchNativeResolve("req\\"1", "va\\"lue"); true;'
    );
  });
});

describe('withIdentityValue', () => {
  it('adds a new key/value pair', () => {
    expect(withIdentityValue({}, 'swb_a', 'the-uuid')).toEqual({
      swb_a: 'the-uuid',
    });
  });

  it('overwrites an existing value for the same key', () => {
    expect(withIdentityValue({ swb_a: 'stale' }, 'swb_a', 'fresh')).toEqual({
      swb_a: 'fresh',
    });
  });

  it('leaves existing entries untouched for other keys', () => {
    expect(
      withIdentityValue({ swb_a: 'the-uuid' }, 'swb_b', 'other-uuid')
    ).toEqual({ swb_a: 'the-uuid', swb_b: 'other-uuid' });
  });

  it.each([
    ['undefined', undefined],
    ['empty string', ''],
  ])('leaves the map unchanged for a %s value', (_label, value) => {
    expect(withIdentityValue({ swb_a: 'kept' }, 'swb_b', value)).toEqual({
      swb_a: 'kept',
    });
  });
});

describe('mergeIdentities', () => {
  it('merges resolved identities over param identities', () => {
    expect(
      mergeIdentities({ email: 'a@b.test' }, { swb_a: 'the-uuid' })
    ).toEqual({ email: 'a@b.test', swb_a: 'the-uuid' });
  });

  it('lets a resolved value win over the same key from params', () => {
    expect(mergeIdentities({ swb_a: 'stale' }, { swb_a: 'fresh' })).toEqual({
      swb_a: 'fresh',
    });
  });

  it('handles no param identities', () => {
    expect(mergeIdentities(undefined, { swb_a: 'the-uuid' })).toEqual({
      swb_a: 'the-uuid',
    });
  });

  it('handles no resolved identities', () => {
    expect(mergeIdentities({ email: 'a@b.test' }, {})).toEqual({
      email: 'a@b.test',
    });
  });
});
