import { InMemoryCache } from '../lib';
import { CacheManager } from '../lib/cache/cache-manager-2';

describe('CacheManager', () => {
  const cacheManager = CacheManager.getInstance();

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
    expect(cacheManager.tllInMilliseconds).toBeFalsy();
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
  });
});
