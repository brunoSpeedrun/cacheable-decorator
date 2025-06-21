export interface LoggerLike {
  info(message: string, ...params: any[]): void;
  warn(message: string, ...params: any[]): void;
  error(message: string, ...params: any[]): void;
}

export class JsonCacheLogger implements LoggerLike {
  info(message: string, ...params: any[]): void {
    console.info(JSON.stringify({ pid: process.pid, message, ...params }));
  }

  warn(message: string, ...params: any[]): void {
    console.warn(JSON.stringify({ pid: process.pid, message, ...params }));
  }

  error(message: string, ...params: any[]): void {
    console.error(JSON.stringify({ pid: process.pid, message, ...params }));
  }
}

export class DisabledCacheLogger implements LoggerLike {
  info(message: string, ...params: any[]): void {}
  warn(message: string, ...params: any[]): void {}
  error(message: string, ...params: any[]): void {}
}

export const isLoggerValid = (logger: any) =>
  ['info', 'warn', 'error'].every(
    (method) => typeof logger?.[method] === 'function',
  );
