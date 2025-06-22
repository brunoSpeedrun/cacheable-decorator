import { CacheStoreLike, isCacheStoreValid } from './cache-like';
import { InMemoryCache } from './in-memory-cache';
import {
  DisabledCacheLogger,
  isLoggerValid,
  JsonCacheLogger,
  LoggerLike,
} from '../logger';

const INSTANCE = Symbol('INSTANCE');
const DEFAULT_OPTIONS = Symbol('INSTANCE');
const CACHE_STORES = Symbol('CACHE_STORES');
const LOGGER = Symbol('LOGGER');

export type CacheManagerDefaultOptions = {
  disabled?: boolean;
  ttlInMilliseconds?: number;
  logger?: boolean | LoggerLike;
  isCacheable?: (value: any) => boolean;
};

export class CacheManager {
  private [DEFAULT_OPTIONS]: CacheManagerDefaultOptions;
  private readonly [CACHE_STORES]: Map<string, CacheStoreLike>;
  private [LOGGER]: LoggerLike;

  constructor() {
    this[DEFAULT_OPTIONS] = {};
    this[CACHE_STORES] = new Map();
    this[LOGGER] = new JsonCacheLogger();
  }

  initialize(options: CacheManagerDefaultOptions) {
    this[DEFAULT_OPTIONS] = { ...options };
    this.setLogger(this[DEFAULT_OPTIONS].logger);
  }

  register(cacheName: string, store: CacheStoreLike): any {
    if (!cacheName) {
      throw new Error(
        "Invalid cache name. Cache's name must be a string and cannot be null, undefined or blank"
      );
    }

    if (!isCacheStoreValid(store)) {
      throw new Error(
        'Invalid cache store. Cache store should be an object with `get` and `set` methods'
      );
    }

    if (this[CACHE_STORES].has(cacheName)) {
      throw new Error(
        `Invalid cache store name. A cache store with a name ${cacheName} is already registered`
      );
    }

    this[CACHE_STORES].set(cacheName, store);
  }

  getCache(cacheName: string) {
    return this[CACHE_STORES].get(cacheName);
  }

  getDefaultCache() {
    if (this[CACHE_STORES].size === 0) {
      this[CACHE_STORES].set('default', new InMemoryCache());
    }

    return this[CACHE_STORES].values().next().value!;
  }

  isCacheable(value: any) {
    return (this[DEFAULT_OPTIONS].isCacheable ?? (() => true))(value);
  }

  allCacheStores(): Array<{ name: string; store: CacheStoreLike }> {
    return Array.from(this[CACHE_STORES].entries()).map(([name, store]) => ({
      name,
      store,
    }));
  }

  clearCacheStores() {
    this[CACHE_STORES].clear();
  }

  get isEnabled() {
    return !this.isDisabled;
  }

  get isDisabled() {
    return !!this[DEFAULT_OPTIONS]?.disabled;
  }

  get ttlInMilliseconds() {
    return this[DEFAULT_OPTIONS]?.ttlInMilliseconds;
  }

  get logger() {
    return this[LOGGER];
  }

  private setLogger(logger?: boolean | LoggerLike) {
    if (logger === false) {
      this[LOGGER] = new DisabledCacheLogger();
      return;
    }

    if (logger === true) {
      this[LOGGER] = new JsonCacheLogger();
      return;
    }

    if (logger == null) {
      return;
    }

    if (isLoggerValid(logger)) {
      this[LOGGER] = logger as LoggerLike;
    } else {
      this[LOGGER] = new DisabledCacheLogger();
      new JsonCacheLogger().warn(
        `Invalid logger. Logger should be an object with 'info', 'warn' and 'error' methods`
      );
    }
  }

  enable() {
    this[DEFAULT_OPTIONS].disabled = false;
  }

  disable() {
    this[DEFAULT_OPTIONS].disabled = true;
  }

  private static [INSTANCE]: CacheManager;

  static getInstance() {
    if (!this[INSTANCE]) {
      this[INSTANCE] = new CacheManager();
    }

    return this[INSTANCE];
  }
}
