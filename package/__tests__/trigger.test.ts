import {
  buildTriggerExpression,
  isValidTriggerFunctionName,
} from '../src/util/helpers';
import { TriggerName } from '../src/enums';

// Mirrors ketch-android's TriggerFunctionNameTest so both SDKs reject the same inputs.
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
  it('matches the ketch-tag call shape with empty options', () => {
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
