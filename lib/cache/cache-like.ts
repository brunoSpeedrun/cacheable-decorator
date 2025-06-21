export interface CacheLike {
  /**
   * Get the value of a Key
   * @param {string} key cache key
   */
  get<T = any>(key: string): Promise<T | undefined>;
  /**
   * Set an item to the store
   * @param {string} key the key to use.
   * @param {T} value the value of the key
   * @param {number} [ttl] time to live in milliseconds
   * @returns {boolean} if it sets then it will return a true. On failure will return false.
   */
  set<T = any>(key: string, value: T, ttl?: number): Promise<boolean>;
}

export const isCacheValid = (store: any) =>
  typeof store?.get === 'function' && typeof store?.set === 'function';
