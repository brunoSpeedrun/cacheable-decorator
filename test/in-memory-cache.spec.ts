import { CacheStoreLike, InMemoryCache } from '../lib';

describe('InMemoryCache', () => {
  let cache: CacheStoreLike;

  beforeEach(() => {
    cache = new InMemoryCache();
  });

  test('should set and get a cached value with TTL', async () => {
    await cache.set('key1', 'value1', 1000);
    const value = await cache.get('key1');

    expect(value).toBe('value1');
  });

  test('should return undefined for a non-existent key', async () => {
    const value = await cache.get('nonExistentKey');

    expect(value).toBeUndefined();
  });

  test('should return undefined for an expired key', async () => {
    await cache.set('key2', 'value2', 1000);

    await new Promise((resolve) => setTimeout(resolve, 1100));
    const value = await cache.get('key2');

    expect(value).toBeUndefined();
  });

  test('should return true when setting a value with TTL', async () => {
    const result = await cache.set('key3', 'value3', 5000);

    expect(result).toBe(true);
  });

  test('should return true when setting a value indefinitely', async () => {
    const result = await cache.set('key4', 'value4');

    expect(result).toBe(true);
  });

  test('should keep the value if TTL is not provided', async () => {
    await cache.set('key5', 'value5');
    const value = await cache.get('key5');

    expect(value).toBe('value5');
  });

  test('should not return expired key and delete it', async () => {
    await cache.set('key6', 'value6', 1000);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const value = await cache.get('key6');

    expect(value).toBeUndefined();
    expect(await cache.get('key6')).toBeUndefined();
  });

  test('should not affect other keys when one expires', async () => {
    await cache.set('key7', 'value7', 1000);
    await cache.set('key8', 'value8');
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const value8 = await cache.get('key8');

    expect(value8).toBe('value8');
  });
});
