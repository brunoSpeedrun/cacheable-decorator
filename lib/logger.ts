export interface LoggerLike {
  info(message: string, ...params: any[]): void;
  warn(message: string, ...params: any[]): void;
  error(message: string, ...params: any[]): void;
}

export class DisabledCacheLogger implements LoggerLike {
  info(message: string, ...params: any[]): void {}
  warn(message: string, ...params: any[]): void {}
  error(message: string, ...params: any[]): void {}
}

export const isLoggerValid = (logger: any) =>
  ['info', 'warn', 'error'].every(
    (method) => typeof logger?.[method] === 'function'
  );
