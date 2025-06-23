export type CacheEntry = {
  /**
   * Key to set.
   */
  key: string;
  /**
   * Value to set.
   */
  value: any;
  /**
   * Time to live in milliseconds.
   */
  ttl?: number;
};

export interface CacheStoreLike {
  get<T>(key: string): Promise<T | undefined>;

  getMany<T>(keys: string[]): Promise<Array<T | undefined>>;

  set<T>(key: string, value: T, ttl?: number): Promise<boolean>;

  setMany<T>(entries: CacheEntry[]): Promise<boolean[]>;

  delete(key: string | string[]): Promise<boolean>;
}

export const isCacheStoreValid = (store: any) =>
  ['get', 'getMany', 'set', 'setMany', 'delete'].every(
    (method) => typeof store?.[method] === 'function'
  );
