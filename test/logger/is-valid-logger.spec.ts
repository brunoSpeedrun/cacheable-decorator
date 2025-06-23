import { isLoggerValid, DisabledCacheLogger, LoggerLike } from '../../lib';

describe('isLoggerValid', () => {
  it('should return true for a valid logger (DisabledCacheLogger)', () => {
    const logger = new DisabledCacheLogger();
    expect(isLoggerValid(logger)).toBe(true);
  });

  it('should return true for a custom object implementing LoggerLike', () => {
    const customLogger: LoggerLike = {
      info: () => {},
      warn: () => {},
      error: () => {},
    };
    expect(isLoggerValid(customLogger)).toBe(true);
  });

  it('should return false if info method is missing', () => {
    const invalidLogger = {
      warn: () => {},
      error: () => {},
    };
    expect(isLoggerValid(invalidLogger)).toBe(false);
  });

  it('should return false if warn method is missing', () => {
    const invalidLogger = {
      info: () => {},
      error: () => {},
    };
    expect(isLoggerValid(invalidLogger)).toBe(false);
  });

  it('should return false if error method is missing', () => {
    const invalidLogger = {
      info: () => {},
      warn: () => {},
    };
    expect(isLoggerValid(invalidLogger)).toBe(false);
  });

  it('should return false if any method is not a function', () => {
    const invalidLogger = {
      info: 'not a function',
      warn: () => {},
      error: () => {},
    };
    expect(isLoggerValid(invalidLogger)).toBe(false);
  });

  it('should return false for null or undefined', () => {
    expect(isLoggerValid(null)).toBe(false);
    expect(isLoggerValid(undefined)).toBe(false);
  });

  it('should return false for an empty object', () => {
    expect(isLoggerValid({})).toBe(false);
  });

  it('should return false for other data types', () => {
    expect(isLoggerValid(123)).toBe(false);
    expect(isLoggerValid('string')).toBe(false);
    expect(isLoggerValid([])).toBe(false);
  });
});
