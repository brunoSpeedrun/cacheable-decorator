import { DisabledCacheLogger } from '../../lib'; // Adjust the import path as needed

describe('DisabledCacheLogger', () => {
  let disabledCacheLogger: DisabledCacheLogger;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    disabledCacheLogger = new DisabledCacheLogger();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should do nothing when info is called', () => {
    disabledCacheLogger.info('Test info message', { key: 'value' });
    expect(consoleInfoSpy).not.toHaveBeenCalled();
  });

  it('should do nothing when warn is called', () => {
    disabledCacheLogger.warn('Test warn message');
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should do nothing when error is called', () => {
    disabledCacheLogger.error('Test error message', new Error('test'));
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
