import { CacheStoreLike } from './cache-like';

export class InMemoryCache implements CacheStoreLike {
  private readonly store: Map<string, { value: any; expiresAt?: number }>;

  constructor() {
    this.store = new Map();
  }

  async get<T = any>(key: string): Promise<T | undefined> {
    const cached = this.store.get(key);
    if (cached) {
      if (cached.expiresAt === undefined || Date.now() < cached.expiresAt) {
        return cached.value;
      }
      this.store.delete(key);
    }
    return undefined;
  }

  async set<T = any>(key: string, value: T, ttl?: number): Promise<boolean> {
    const expiresAt = ttl ? Date.now() + ttl : undefined;
    this.store.set(key, { value, expiresAt });

    return true;
  }
}
