import { randomUUID } from 'node:crypto';
import { CacheManager, InMemoryCache } from '../lib';

describe('CacheManager', () => {
  beforeEach(() => {
    CacheManager.getInstance().initialize({});
    CacheManager.getInstance().clearCacheStores();
  });

  it('should be singleton', () => {
    const cacheManagerOne = CacheManager.getInstance();
    const cacheManagerTwo = CacheManager.getInstance();

    expect(cacheManagerOne).toBeDefined();
    expect(cacheManagerTwo).toBeDefined();
    expect(cacheManagerOne).toBe(cacheManagerTwo);
  });

  it('should initialize with default options', () => {
    const cacheManager = CacheManager.getInstance();

    expect(cacheManager.isEnabled).toBe(true);
    expect(cacheManager.isDisabled).toBe(false);
    expect(cacheManager.ttlInMilliseconds).toBeUndefined();
  });

  it('should initialize with options', () => {
    const cacheManager = CacheManager.getInstance();

    cacheManager.initialize({ disabled: true, ttlInMilliseconds: 10000 });

    expect(cacheManager.isEnabled).toBe(false);
    expect(cacheManager.isDisabled).toBe(true);
    expect(cacheManager.ttlInMilliseconds).toBe(10000);
  });

  test.each([
    {
      cacheName: null,
      store: null,
      label: 'Cache name is null',
      errorMessage: /Invalid cache name./,
    },
    {
      cacheName: undefined,
      store: null,
      label: 'Cache name is undefined',
      errorMessage: /Invalid cache name./,
    },
    {
      cacheName: '',
      store: null,
      label: 'Cache name is blank',
      errorMessage: /Invalid cache name./,
    },
    {
      cacheName: 'cache-invalid',
      store: null,
      label: 'Cache store is null',
      errorMessage: /Invalid cache./,
    },
    {
      cacheName: 'cache-invalid',
      store: undefined,
      label: 'Cache store is undefined',
      errorMessage: /Invalid cache./,
    },
    {
      cacheName: 'cache-invalid',
      store: { get() {} } as any,
      label: 'Cache store does not have a set method',
      errorMessage: /Invalid cache./,
    },
    {
      cacheName: 'cache-invalid',
      store: { set() {} } as any,
      label: 'Cache store does not have a get method',
      errorMessage: /Invalid cache./,
    },
  ])(
    'should not register cache - $label',
    ({ cacheName, store, errorMessage }) => {
      expect(() =>
        CacheManager.getInstance().register(cacheName as any, store as any),
      ).toThrow(errorMessage);
    },
  );

  it('should not register cache store when already exists registered', () => {
    const inMemoryCacheName = 'in-memory';
    CacheManager.getInstance().register(inMemoryCacheName, new InMemoryCache());

    expect(() =>
      CacheManager.getInstance().register(
        inMemoryCacheName,
        new InMemoryCache(),
      ),
    ).toThrow(
      new RegExp(
        `A cache store with a name ${inMemoryCacheName} is already registered`,
      ),
    );
  });

  it('should register cache store successfully', () => {
    const cacheName = randomUUID();
    const inMemoryCacheStore = new InMemoryCache();

    CacheManager.getInstance().register(cacheName, inMemoryCacheStore);

    expect(CacheManager.getInstance().getCache(cacheName)).toBe(
      inMemoryCacheStore,
    );
  });

  it('should get all cache stores', () => {
    const cacheNames = [randomUUID(), randomUUID()];
    cacheNames.forEach((id) =>
      CacheManager.getInstance().register(id, new InMemoryCache()),
    );

    const stores = CacheManager.getInstance().allCacheStores();

    expect(stores).toBeInstanceOf(Array);
    cacheNames.forEach((id) =>
      expect(stores.some((c) => c.name === id)).toBe(true),
    );
  });

  it('should remove all cache stores', () => {
    const cacheNames = [randomUUID(), randomUUID()];
    cacheNames.forEach((id) =>
      CacheManager.getInstance().register(id, new InMemoryCache()),
    );

    CacheManager.getInstance().clearCacheStores();

    expect(CacheManager.getInstance().allCacheStores().length).toBe(0);
  });

  it('should InMemoryCache be default whe no cache is registered', () => {
    const defaultCache = CacheManager.getInstance().getDefaultCache();

    expect(CacheManager.getInstance().allCacheStores().length).toBe(1);
    expect(defaultCache).toBeDefined();
    expect(defaultCache).toBeInstanceOf(InMemoryCache);
    expect(CacheManager.getInstance().getCache('default')).toBe(defaultCache);
  });

  it('should first registered cache be default cache', () => {
    const myCache = new InMemoryCache();

    CacheManager.getInstance().register('my-cache', myCache);

    const defaultCache = CacheManager.getInstance().getDefaultCache();

    expect(defaultCache).toBeDefined();
    expect(defaultCache).toBeInstanceOf(InMemoryCache);
    expect(CacheManager.getInstance().getCache('my-cache')).toBe(defaultCache);
    expect(CacheManager.getInstance().allCacheStores()[0].store).toBe(myCache);
  });
});
