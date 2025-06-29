import { CacheManager, InMemoryCache } from '../../lib';

describe('CacheManager', () => {
  const cacheManager = CacheManager.getInstance();

  beforeEach(() => cacheManager.removeAllStores());

  it('should be singleton', () => {
    const cacheManagerOne = CacheManager.getInstance();
    const cacheManagerTwo = CacheManager.getInstance();

    expect(cacheManagerOne).toBeDefined();
    expect(cacheManagerTwo).toBeDefined();
    expect(cacheManagerOne).toBe(cacheManagerTwo);
  });

  it('should be enabled by default', () => {
    expect(cacheManager.isEnabled).toBe(true);
  });

  it('should disable CacheManager', () => {
    cacheManager.disable();

    expect(cacheManager.isEnabled).toBe(false);
  });

  it('should enable CacheManager', () => {
    cacheManager.disable();
    cacheManager.enable();

    expect(cacheManager.isEnabled).toBe(true);
  });

  it('should initialize with default values', () => {
    cacheManager.initialize({});

    expect(cacheManager.isEnabled).toBe(true);
    expect(cacheManager.ttlInMilliseconds).toBeFalsy();
    expect(cacheManager.isCacheable({})).toBe(true);
    expect(cacheManager.logger).toBeTruthy();
  });

  describe('Store', () => {
    test.each([
      {
        storeName: null,
        store: null,
        label: 'store name is null',
        errorMessage: /Invalid cache name./,
      },
      {
        storeName: undefined,
        store: null,
        label: 'store name is undefined',
        errorMessage: /Invalid cache name./,
      },
      {
        storeName: '',
        store: null,
        label: 'store name is blank',
        errorMessage: /Invalid cache name./,
      },
      {
        storeName: 'cache-invalid',
        store: null,
        label: 'store store is null',
        errorMessage: /Invalid cache./,
      },
      {
        storeName: 'cache-invalid',
        store: undefined,
        label: 'store store is undefined',
        errorMessage: /Invalid cache./,
      },
      {
        storeName: 'cache-invalid',
        store: { get() {} } as any,
        label: 'store store does not have a set method',
        errorMessage: /Invalid cache./,
      },
      {
        storeName: 'cache-invalid',
        store: { set() {} } as any,
        label: 'store store does not have a get method',
        errorMessage: /Invalid cache./,
      },
    ])(
      'should not register when $label',
      ({ storeName, store, errorMessage }) => {
        expect(() =>
          cacheManager.addStore(storeName as any, store as any)
        ).toThrow(errorMessage);
      }
    );

    it('should not register cache store when already exists registered', () => {
      const inMemoryCacheName = 'in-memory';
      cacheManager.addStore(inMemoryCacheName, new InMemoryCache());

      expect(() =>
        cacheManager.addStore(inMemoryCacheName, new InMemoryCache())
      ).toThrow(
        new RegExp(
          `A cache store with a name ${inMemoryCacheName} is already registered`
        )
      );
    });

    it('should register cache store successfully', () => {
      const cacheName = Date.now().toString();
      const inMemoryCacheStore = new InMemoryCache();

      cacheManager.addStore(cacheName, inMemoryCacheStore);

      expect(cacheManager.getStore(cacheName)).toBe(inMemoryCacheStore);
    });

    it('should get all cache stores', () => {
      const storeNames = [Date.now().toString(), Date.now().toString() + 1];
      storeNames.forEach((id) =>
        cacheManager.addStore(id, new InMemoryCache())
      );

      const stores = cacheManager.stores();

      expect(stores).toBeInstanceOf(Array);
      storeNames.forEach((id) =>
        expect(stores.some((c) => c.name === id)).toBe(true)
      );
    });

    it('should remove all cache stores', () => {
      const storeNames = [Date.now().toString(), Date.now().toString() + 1];
      storeNames.forEach((id) =>
        cacheManager.addStore(id, new InMemoryCache())
      );

      cacheManager.removeAllStores();

      expect(cacheManager.stores().length).toBe(0);
    });

    it('should InMemoryCache be default store when no cache is registered', () => {
      const defaultCache = cacheManager.getDefaultStore();

      expect(cacheManager.stores().length).toBe(1);
      expect(defaultCache).toBeDefined();
      expect(defaultCache).toBeInstanceOf(InMemoryCache);
      expect(cacheManager.getStore('default')).toBe(defaultCache);
    });

    it('should first registered cache be default cache', () => {
      const myCache = new InMemoryCache();

      cacheManager.addStore('my-cache', myCache);

      const defaultCache = cacheManager.getDefaultStore();

      expect(defaultCache).toBeDefined();
      expect(defaultCache).toBeInstanceOf(InMemoryCache);
      expect(cacheManager.getStore('my-cache')).toBe(defaultCache);
      expect(cacheManager.stores()[0].store).toBe(myCache);
    });
  });
});
