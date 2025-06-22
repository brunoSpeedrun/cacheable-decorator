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
});
