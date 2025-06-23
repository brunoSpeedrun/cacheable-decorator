import { DisabledCacheLogger, isLoggerValid, LoggerLike } from '../logger';
import { CacheStoreLike, isCacheStoreValid } from './cache-like';
import { InMemoryCache } from './in-memory-cache';

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
const CACHE_STORES = Symbol('CACHE_STORES');

const disabledLogger = new DisabledCacheLogger();

export class CacheManager {
  private [ENABLED] = true;
  private [TTL]: number | undefined;
  private [IS_CACHEABLE]: (value: any) => boolean = () => true;
  private [LOGGER]: LoggerLike = disabledLogger;
  private readonly [CACHE_STORES]: Map<string, CacheStoreLike> = new Map();

  get isEnabled() {
    return this[ENABLED];
  }

  get ttlInMilliseconds() {
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

  addStore(name: string, store: CacheStoreLike) {
    if (!name) {
      throw new Error(
        "Invalid cache name. Cache's name must be a string and cannot be null, undefined or blank"
      );
    }

    if (!isCacheStoreValid(store)) {
      throw new Error(
        'Invalid cache store. Cache store should be an object with `get` and `set` methods'
      );
    }

    if (this[CACHE_STORES].has(name)) {
      throw new Error(
        `Invalid cache store name. A cache store with a name ${name} is already registered`
      );
    }

    this[CACHE_STORES].set(name, store);
  }

  getStore(name) {
    return this[CACHE_STORES].get(name);
  }

  stores(): Array<{ name: string; store: CacheStoreLike }> {
    return Array.from(this[CACHE_STORES].entries()).map(([name, store]) => ({
      name,
      store,
    }));
  }

  removeAllStores() {
    this[CACHE_STORES].clear();
  }

  getDefaultStore() {
    if (this[CACHE_STORES].size === 0) {
      this[CACHE_STORES].set('default', new InMemoryCache());
    }

    return this[CACHE_STORES].values().next().value!;
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
