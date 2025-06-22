import { DisabledCacheLogger, isLoggerValid, LoggerLike } from '../logger';

export type CacheManagerOptions = {
  enabled?: boolean;
  ttlInMilliseconds?: number;
  logger?: boolean | LoggerLike;
  isCacheable?: (value: any) => boolean;
};

const INSTANCE = Symbol('INSTANCE');
const ENABLED = Symbol('ENABLED');
const TTL = Symbol('TTL');
const IS_CACHEABLE = Symbol('IS_CACHEABLE');
const LOGGER = Symbol('LOGGER');

const disabledLogger = new DisabledCacheLogger();

export class CacheManager {
  private [ENABLED] = true;
  private [TTL]: number | undefined;
  private [IS_CACHEABLE]: (value: any) => boolean = () => true;
  private [LOGGER]: LoggerLike = disabledLogger;

  get isEnabled() {
    return this[ENABLED];
  }

  get tllInMilliseconds() {
    return this[TTL];
  }

  get logger() {
    return this[LOGGER];
  }

  enable() {
    this[ENABLED] = true;
  }

  disable() {
    this[ENABLED] = false;
  }

  isCacheable(value: any) {
    return this[IS_CACHEABLE](value);
  }

  initialize(options: CacheManagerOptions) {
    this[ENABLED] = options?.enabled ?? true;
    this[TTL] = options?.ttlInMilliseconds;
    this[IS_CACHEABLE] = options?.isCacheable || (() => true);
    this.setLogger(options?.logger);
  }

  private setLogger(logger?: boolean | LoggerLike) {
    if (logger === false) {
      this[LOGGER] = disabledLogger;
      return;
    }

    if (logger === true) {
      this[LOGGER] = console;
      return;
    }

    if (logger == null) {
      return;
    }

    if (isLoggerValid(logger)) {
      this[LOGGER] = logger as LoggerLike;
    } else {
      this[LOGGER] = disabledLogger;

      console.warn(
        `Invalid logger. Logger should be an object with 'info', 'warn' and 'error' methods`
      );
    }
  }

  private static [INSTANCE]: CacheManager;

  static getInstance() {
    if (!this[INSTANCE]) {
      this[INSTANCE] = new CacheManager();
    }

    return this[INSTANCE];
  }
}
