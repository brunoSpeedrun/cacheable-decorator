import { InMemoryCache, CacheEntry } from '../../lib'; // Adjust the path as needed

// Helper function to create a small delay in async tests
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('InMemoryCache', () => {
  let cache: InMemoryCache;

  beforeEach(() => {
    cache = new InMemoryCache();
  });

  it('should set and get a value successfully', async () => {
    const key = 'testKey';
    const value = 'testValue';
    await cache.set(key, value);
    const retrievedValue = await cache.get(key);
    expect(retrievedValue).toBe(value);
  });

  it('should return undefined for a non-existent key', async () => {
    const retrievedValue = await cache.get('nonExistentKey');
    expect(retrievedValue).toBeUndefined();
  });

  it('should delete a single key', async () => {
    const key = 'keyToDelete';
    await cache.set(key, 'value');
    await cache.delete(key);
    const retrievedValue = await cache.get(key);
    expect(retrievedValue).toBeUndefined();
  });

  it('should delete multiple keys', async () => {
    const keys = ['key1', 'key2', 'key3'];
    await cache.set('key1', 'value1');
    await cache.set('key2', 'value2');
    await cache.set('key3', 'value3');

    await cache.delete(keys);

    expect(await cache.get('key1')).toBeUndefined();
    expect(await cache.get('key2')).toBeUndefined();
    expect(await cache.get('key3')).toBeUndefined();
  });

  it('should expire a value after its TTL', async () => {
    const key = 'expiringKey';
    const value = 'expiringValue';
    const ttl = 100; // Short TTL for testing (100ms)

    await cache.set(key, value, ttl);

    // Should be present immediately after setting
    expect(await cache.get(key)).toBe(value);

    // Wait for the TTL duration + a small buffer to ensure expiration
    await delay(ttl + 10); // Add 10ms extra delay to ensure Date.now() inside the class has advanced

    // Should be expired
    expect(await cache.get(key)).toBeUndefined();
  }, 500); // Increase test timeout to allow for the delay

  it('should not return an expired value when getting many', async () => {
    const key1 = 'activeKey';
    const key2 = 'expiredKey';
    const ttl = 100; // Short TTL for testing

    await cache.set(key1, 'activeValue');
    await cache.set(key2, 'expiredValue', ttl);

    // Wait for the TTL duration + a small buffer
    await delay(ttl + 10);

    const [value1, value2] = await cache.getMany<string>([key1, key2]);
    expect(value1).toBe('activeValue');
    expect(value2).toBeUndefined();
  }, 500); // Increase test timeout to allow for the delay

  it('should get multiple values successfully', async () => {
    const entries = [
      { key: 'keyA', value: 1 },
      { key: 'keyB', value: 'hello' },
      { key: 'keyC', value: true },
    ];

    await Promise.all(entries.map((e) => cache.set(e.key, e.value)));

    const retrievedValues = await cache.getMany(entries.map((e) => e.key));
    expect(retrievedValues).toEqual([1, 'hello', true]);
  });

  it('should set multiple values successfully', async () => {
    const entries: CacheEntry[] = [
      { key: 'key1', value: 'value1' },
      { key: 'key2', value: 123 },
      { key: 'key3', value: { a: 1 } },
    ];

    const result = await cache.setMany(entries);
    expect(result.every((r) => r)).toBe(true); // All sets should return true

    expect(await cache.get('key1')).toBe('value1');
    expect(await cache.get('key2')).toBe(123);
    expect(await cache.get('key3')).toEqual({ a: 1 });
  });

  it('should evict the oldest entry when at maxEntries capacity and setting a new key', async () => {
    const maxEntries = 2;
    cache = new InMemoryCache(maxEntries);

    await cache.set('key1', 'value1'); // Oldest
    await cache.set('key2', 'value2'); // Next oldest
    expect(await cache.get('key1')).toBe('value1');
    expect(await cache.get('key2')).toBe('value2');

    await cache.set('key3', 'value3'); // This should evict 'key1'

    expect(await cache.get('key1')).toBeUndefined();
    expect(await cache.get('key2')).toBe('value2');
    expect(await cache.get('key3')).toBe('value3');
  });

  it('should not evict an entry if setting an existing key when at maxEntries capacity', async () => {
    const maxEntries = 2;
    cache = new InMemoryCache(maxEntries);

    await cache.set('key1', 'value1');
    await cache.set('key2', 'value2');
    expect(await cache.get('key1')).toBe('value1');
    expect(await cache.get('key2')).toBe('value2');

    await cache.set('key1', 'newValue1'); // Update existing key

    expect(await cache.get('key1')).toBe('newValue1');
    expect(await cache.get('key2')).toBe('value2');
  });

  it('should handle default maxEntries correctly', async () => {
    // The default maxEntries is 2^24 - 1. We'll test with a small example to confirm basic functionality.
    const largeCache = new InMemoryCache();
    await largeCache.set('someKey', 'someValue');
    expect(await largeCache.get('someKey')).toBe('someValue');
    // We don't attempt to fill 2^24 entries for a unit test.
    // This test simply verifies that the default setup works without errors.
  });
});
