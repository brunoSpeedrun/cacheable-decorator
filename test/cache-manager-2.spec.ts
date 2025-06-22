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
});
