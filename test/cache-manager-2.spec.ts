import { CacheManager } from '../lib/cache/cache-manager-2';

describe('CacheManager', () => {
  it('should be singleton', () => {
    const cacheManagerOne = CacheManager.getInstance();
    const cacheManagerTwo = CacheManager.getInstance();

    expect(cacheManagerOne).toBeDefined();
    expect(cacheManagerTwo).toBeDefined();
    expect(cacheManagerOne).toBe(cacheManagerTwo);
  });
});
