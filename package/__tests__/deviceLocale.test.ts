import { formatLanguageTag } from '../src/util/deviceLocale';

describe('formatLanguageTag', () => {
  it('underscore separator becomes hyphen with uppercase dialect', () => {
    expect(formatLanguageTag('en_US')).toBe('en-US');
  });

  it('lowercase dialect is uppercased', () => {
    expect(formatLanguageTag('fr-ca')).toBe('fr-CA');
  });

  it('root only is lowercased', () => {
    expect(formatLanguageTag('EN')).toBe('en');
  });

  it('blank falls back to english', () => {
    expect(formatLanguageTag('')).toBe('en');
  });
});
