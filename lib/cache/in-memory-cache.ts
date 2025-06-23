import { CacheStoreLike, CacheEntry } from './cache-like';

type CacheItem<T> = {
  value: T;
  expiry?: number;
};

export class InMemoryCache implements CacheStoreLike {
  private readonly cache: Map<string, CacheItem<any>>;
  private readonly maxEntries: number;

  constructor(maxEntries?: number) {
    this.cache = new Map();
    this.maxEntries = maxEntries ?? 2 ** 24 - 1; // Max size for Map is 2^24.
  }

  async get<T>(key: string): Promise<T | undefined> {
    const item = this.cache.get(key);
    if (!item) {
      return undefined;
    }

    if (item.expiry && item.expiry < Date.now()) {
      this.delete(key);
      return undefined;
    }

    return item.value;
  }

  async getMany<T>(keys: string[]): Promise<Array<T | undefined>> {
    const values = await Promise.all(keys.map((key) => this.get<T>(key)));

    return values;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    // Evict first entry when at capacity - only when it's a new key.
    if (
      this.cache.size === this.maxEntries &&
      this.cache.get(key) === undefined
    ) {
      this.cache.delete(this.cache.keys().next().value!);
    }

    const item: CacheItem<T> = { value };

    if (ttl !== undefined) {
      item.expiry = Date.now() + ttl;
    }

    this.cache.set(key, item);

    return true;
  }

  async setMany<T>(entries: CacheEntry[]): Promise<boolean[]> {
    const result = await Promise.all(
      entries.map((entry) => this.set(entry.key, entry.value, entry.ttl))
    );

    return result;
  }

  async delete(key: string | string[]): Promise<boolean> {
    if (Array.isArray(key)) {
      key.forEach((k) => this.cache.delete(k));
    } else {
      this.cache.delete(key);
    }

    return true;
  }
}
