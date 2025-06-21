import { JsonCacheLogger } from '../../lib'; // Adjust the import path as needed

describe('JsonCacheLogger', () => {
  let logger: JsonCacheLogger;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  const currentPid = process.pid;

  beforeEach(() => {
    logger = new JsonCacheLogger();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('info', () => {
    it('should log info messages as a JSON string with pid and message', () => {
      const message = 'Test info message';
      const expectedLog = JSON.stringify({ pid: currentPid, message });

      logger.info(message);

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy).toHaveBeenCalledWith(expectedLog);
    });

    it('should log info messages with additional parameters as a JSON string', () => {
      const message = 'Info with params';
      const param1 = { key: 'value' };
      const param2 = 123;
      const expectedLog = JSON.stringify({
        pid: currentPid,
        message,
        0: param1, // Note: ...params spreads into indexed properties
        1: param2,
      });

      logger.info(message, param1, param2);

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy).toHaveBeenCalledWith(expectedLog);
    });

    it('should handle no additional parameters correctly for info', () => {
      const message = 'No params info';
      const expectedLog = JSON.stringify({ pid: currentPid, message });

      logger.info(message);

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy).toHaveBeenCalledWith(expectedLog);
    });
  });

  describe('warn', () => {
    it('should log warning messages as a JSON string with pid and message', () => {
      const message = 'Test warn message';
      const expectedLog = JSON.stringify({ pid: currentPid, message });

      logger.warn(message);

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expectedLog);
    });

    it('should log warning messages with additional parameters as a JSON string', () => {
      const message = 'Warn with params';
      const param1 = 'warning_code';
      const param2 = true;
      const expectedLog = JSON.stringify({
        pid: currentPid,
        message,
        0: param1,
        1: param2,
      });

      logger.warn(message, param1, param2);

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expectedLog);
    });
  });

  describe('error', () => {
    it('should log error messages as a JSON string with pid and message', () => {
      const message = 'Test error message';
      const expectedLog = JSON.stringify({ pid: currentPid, message });

      logger.error(message);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expectedLog);
    });

    it('should log error messages with additional parameters as a JSON string', () => {
      const message = 'Error with details';
      const errorObj = new Error('Something went wrong');
      const stackTrace = 'at someFunc (file.ts:10:5)';
      const expectedLog = JSON.stringify({
        pid: currentPid,
        message,
        0: errorObj,
        1: stackTrace,
      });

      logger.error(message, errorObj, stackTrace);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expectedLog);
    });
  });
});
