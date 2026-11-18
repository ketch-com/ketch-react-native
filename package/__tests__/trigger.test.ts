import {
  buildNamedTriggerExpression,
  buildTriggerExpression,
  isValidTriggerFunctionName,
  isValidTriggerName,
  resolveTriggerExpression,
} from '../src/util/helpers';
import { PreferenceTab, TriggerName } from '../src/enums';
import type { KetchService, PreferenceExperienceOptions } from '../src/types';

// Keeps the accepted and rejected inputs aligned across the mobile SDKs.
describe('isValidTriggerFunctionName', () => {
  it('accepts valid names', () => {
    expect(isValidTriggerFunctionName('managePrivacy')).toBe(true);
    expect(isValidTriggerFunctionName('manage_privacy')).toBe(true);
    expect(isValidTriggerFunctionName('manage-privacy')).toBe(true);
    expect(isValidTriggerFunctionName('manage.privacy.v2')).toBe(true);
    expect(isValidTriggerFunctionName('123')).toBe(true);
  });

  it('rejects blank and empty', () => {
    expect(isValidTriggerFunctionName('')).toBe(false);
    expect(isValidTriggerFunctionName('   ')).toBe(false);
  });

  it('rejects quote injection', () => {
    // Would otherwise break out of the quoted JS literal in buildTriggerExpression
    expect(isValidTriggerFunctionName('foo"); alert("xss')).toBe(false);
    expect(isValidTriggerFunctionName("foo'); alert('xss")).toBe(false);
    expect(isValidTriggerFunctionName('foo"')).toBe(false);
    expect(isValidTriggerFunctionName("foo'")).toBe(false);
  });

  it('rejects backslash and control characters', () => {
    expect(isValidTriggerFunctionName('foo\\bar')).toBe(false);
    expect(isValidTriggerFunctionName('foo\nbar')).toBe(false);
    expect(isValidTriggerFunctionName('foo\tbar')).toBe(false);
  });

  it('rejects whitespace and other special characters', () => {
    expect(isValidTriggerFunctionName('foo bar')).toBe(false);
    expect(isValidTriggerFunctionName('foo/bar')).toBe(false);
    expect(isValidTriggerFunctionName('foo|bar')).toBe(false);
  });
});

describe('buildTriggerExpression', () => {
  it('emits the tag call shape with empty options', () => {
    expect(buildTriggerExpression(TriggerName.Custom, 'managePrivacy')).toBe(
      'ketch("trigger", "custom", "managePrivacy", {}); true;'
    );
  });

  it('serializes options as JSON', () => {
    expect(
      buildTriggerExpression(TriggerName.Custom, 'fn', { a: 1, b: 'x' })
    ).toBe('ketch("trigger", "custom", "fn", {"a":1,"b":"x"}); true;');
  });

  it('falls back to empty options when serialization fails', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;

    expect(buildTriggerExpression(TriggerName.Custom, 'fn', cyclic)).toBe(
      'ketch("trigger", "custom", "fn", {}); true;'
    );
  });

  it('always terminates with a truthy expression for injectJavaScript', () => {
    expect(buildTriggerExpression(TriggerName.Custom, 'fn')).toMatch(
      /; true;$/
    );
  });
});

describe('isValidTriggerName', () => {
  it('accepts names that start with a letter', () => {
    expect(isValidTriggerName('dnsOpened')).toBe(true);
    expect(isValidTriggerName('preferences_opened-v2')).toBe(true);
  });

  it('rejects empty, leading non-letters, and special characters', () => {
    expect(isValidTriggerName('')).toBe(false);
    expect(isValidTriggerName('1opened')).toBe(false);
    expect(isValidTriggerName('_opened')).toBe(false);
    expect(isValidTriggerName('dns.opened')).toBe(false);
    expect(isValidTriggerName('dns opened')).toBe(false);
    expect(isValidTriggerName('dns"); alert("x')).toBe(false);
  });
});

describe('buildNamedTriggerExpression', () => {
  it('emits the tag call shape with empty options', () => {
    expect(buildNamedTriggerExpression(TriggerName.DnsOpened)).toBe(
      'ketch("trigger", "dnsOpened", {}); true;'
    );
  });

  it('serializes options as JSON', () => {
    expect(
      buildNamedTriggerExpression(TriggerName.PreferencesOpened, {
        tab: 'subscriptionsTab',
      })
    ).toBe(
      'ketch("trigger", "preferencesOpened", {"tab":"subscriptionsTab"}); true;'
    );
  });

  it('escapes quotes, backslashes and line terminators in the name and options', () => {
    const expression = buildNamedTriggerExpression('a"b\\c', {
      text: 'x"); alert("y\u2028\u2029',
    });

    expect(expression).toBe(
      'ketch("trigger", "a\\"b\\\\c", {"text":"x\\"); alert(\\"y\\u2028\\u2029"}); true;'
    );
    // The call arguments round-trip to the original values
    const args = expression.slice('ketch('.length, -'); true;'.length);
    expect(JSON.parse(`[${args}]`)).toEqual([
      'trigger',
      'a"b\\c',
      { text: 'x"); alert("y\u2028\u2029' },
    ]);
  });

  it('falls back to empty options when serialization fails', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;

    expect(buildNamedTriggerExpression('dnsOpened', cyclic)).toBe(
      'ketch("trigger", "dnsOpened", {}); true;'
    );
  });
});

describe('resolveTriggerExpression', () => {
  it('keeps the custom output unchanged', () => {
    expect(
      resolveTriggerExpression(TriggerName.Custom, 'managePrivacy', { a: 1 })
    ).toEqual({
      ok: true,
      expression: 'ketch("trigger", "custom", "managePrivacy", {"a":1}); true;',
      label: 'managePrivacy',
    });
  });

  it('rejects custom function names the validator rejects', () => {
    expect(resolveTriggerExpression(TriggerName.Custom, '').ok).toBe(false);
    expect(resolveTriggerExpression(TriggerName.Custom, 'foo"').ok).toBe(false);
    // An object coerces to "[object Object]", which fails the pattern
    expect(resolveTriggerExpression(TriggerName.Custom, {}).ok).toBe(false);
  });

  it('coerces a non-string custom function name to a string', () => {
    expect(
      resolveTriggerExpression(TriggerName.Custom, 123 as unknown as string)
    ).toEqual({
      ok: true,
      expression: 'ketch("trigger", "custom", "123", {}); true;',
      label: '123',
    });
    expect(resolveTriggerExpression(TriggerName.Custom)).toEqual({
      ok: true,
      expression: 'ketch("trigger", "custom", "undefined", {}); true;',
      label: 'undefined',
    });
  });

  it('builds a named trigger with options', () => {
    expect(
      resolveTriggerExpression(TriggerName.DnsOpened, { tab: 'rightsTab' })
    ).toEqual({
      ok: true,
      expression: 'ketch("trigger", "dnsOpened", {"tab":"rightsTab"}); true;',
      label: 'dnsOpened',
    });
  });

  it('accepts names the enum does not list', () => {
    expect(resolveTriggerExpression('someFutureTrigger')).toEqual({
      ok: true,
      expression: 'ketch("trigger", "someFutureTrigger", {}); true;',
      label: 'someFutureTrigger',
    });
  });

  it('treats null options as empty', () => {
    const resolved = resolveTriggerExpression(
      TriggerName.PrivacyPrefUnknown,
      null
    );
    expect(resolved.ok && resolved.expression).toBe(
      'ketch("trigger", "privacyPrefUnknown", {}); true;'
    );
  });

  it('rejects a function name for non-custom triggers', () => {
    expect(
      resolveTriggerExpression(TriggerName.PreferencesOpened, 'managePrivacy')
        .ok
    ).toBe(false);
  });

  it('rejects non-object options', () => {
    expect(resolveTriggerExpression(TriggerName.DnsOpened, 5).ok).toBe(false);
    expect(resolveTriggerExpression(TriggerName.DnsOpened, []).ok).toBe(false);
  });

  it('rejects invalid names', () => {
    expect(resolveTriggerExpression('').ok).toBe(false);
    expect(resolveTriggerExpression('dns"); alert("x').ok).toBe(false);
    expect(resolveTriggerExpression(undefined).ok).toBe(false);
  });
});

describe('KetchService.trigger signatures', () => {
  // Stub that applies the same argument rules as the provider
  const trigger: KetchService['trigger'] = (
    name: string,
    functionNameOrOptions?: string | Record<string, unknown>,
    options?: Record<string, unknown>
  ) => resolveTriggerExpression(name, functionNameOrOptions, options).ok;

  it('accepts the custom and named call forms', () => {
    const preferenceOptions: PreferenceExperienceOptions = {
      tab: PreferenceTab.RightsTab,
    };

    expect(trigger(TriggerName.Custom, 'managePrivacy')).toBe(true);
    expect(trigger(TriggerName.Custom, 'managePrivacy', { a: 1 })).toBe(true);
    expect(trigger(TriggerName.DnsOpened)).toBe(true);
    expect(trigger('preferencesOpened', preferenceOptions)).toBe(true);
    expect(trigger('someFutureTrigger', { a: 1 })).toBe(true);
  });

  it('rejects a function name outside custom at runtime', () => {
    expect(trigger(TriggerName.DnsOpened, 'managePrivacy')).toBe(false);
  });

  it('accepts a TriggerName-typed value with a function name', () => {
    const n: TriggerName = TriggerName.Custom;
    expect(trigger(n, 'managePrivacy')).toBe(true);

    // A parameter keeps the full TriggerName type, unlike the narrowed const above
    const fire = (name: TriggerName) => trigger(name, 'managePrivacy');
    expect(fire(TriggerName.Custom)).toBe(true);
  });

  it('requires a function name for TriggerName.Custom at compile time', () => {
    // @ts-expect-error the enum member only matches the function-name overload
    expect(trigger(TriggerName.Custom)).toBe(true);
    // @ts-expect-error the literal is held to the same rule as the enum member
    expect(trigger('custom')).toBe(true);
  });
});
