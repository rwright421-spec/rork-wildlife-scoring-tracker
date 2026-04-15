import { sanitizeTextInput, validatePointValue } from '@/utils/sanitize';

describe('sanitizeTextInput', () => {
  it('trims leading whitespace', () => {
    expect(sanitizeTextInput('  hello', 30)).toBe('hello');
  });

  it('trims trailing whitespace', () => {
    expect(sanitizeTextInput('hello   ', 30)).toBe('hello');
  });

  it('trims both leading and trailing whitespace', () => {
    expect(sanitizeTextInput('  hello world  ', 30)).toBe('hello world');
  });

  it('enforces max length', () => {
    expect(sanitizeTextInput('abcdefghij', 5)).toBe('abcde');
  });

  it('enforces max length after trimming', () => {
    expect(sanitizeTextInput('  abcdefghij  ', 5)).toBe('abcde');
  });

  it('returns empty string for blank input', () => {
    expect(sanitizeTextInput('', 30)).toBe('');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(sanitizeTextInput('   ', 30)).toBe('');
  });

  it('preserves internal whitespace', () => {
    expect(sanitizeTextInput('hello  world', 30)).toBe('hello  world');
  });

  it('returns the full string when under max length', () => {
    expect(sanitizeTextInput('short', 30)).toBe('short');
  });

  it('handles max length of 0', () => {
    expect(sanitizeTextInput('hello', 0)).toBe('');
  });
});

describe('validatePointValue', () => {
  it('accepts valid integer within range', () => {
    expect(validatePointValue(10)).toBe(10);
  });

  it('accepts minimum value (1)', () => {
    expect(validatePointValue(1)).toBe(1);
  });

  it('accepts maximum value (1000)', () => {
    expect(validatePointValue(1000)).toBe(1000);
  });

  it('rejects zero', () => {
    expect(validatePointValue(0)).toBeNull();
  });

  it('rejects negative values', () => {
    expect(validatePointValue(-5)).toBeNull();
  });

  it('rejects values above 1000', () => {
    expect(validatePointValue(1001)).toBeNull();
  });

  it('rejects floating point values', () => {
    expect(validatePointValue(2.5)).toBeNull();
  });
});
