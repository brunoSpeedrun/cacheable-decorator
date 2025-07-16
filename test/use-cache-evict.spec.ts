import {
  CacheManager,
  CacheStoreLike,
  LoggerLike,
  UseCacheEvict,
} from '../lib';

describe('UseCacheEvict', () => {
  const cacheManager = CacheManager.getInstance();

  const setDefaultCacheMock = () => {
    const inMemoryCache: jest.Mocked<CacheStoreLike> = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      getMany: jest.fn(),
      setMany: jest.fn(),
    };
    CacheManager.getInstance().addStore('default', inMemoryCache);

    return inMemoryCache;
  };

  const createLoggerMock = (): jest.Mocked<LoggerLike> => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    cacheManager.initialize({});
    cacheManager.removeAllStores();
  });

  it('should not evict cache when keys property are not supplied', async () => {
    const loggerMock = createLoggerMock();

    cacheManager.initialize({ logger: loggerMock });

    const defaultCache = setDefaultCacheMock();

    const options: any = {};

    class UserService {
      @UseCacheEvict(options)
      async updateUser(user: any) {}
    }
    await new UserService().updateUser({});

    expect(loggerMock.warn).toHaveBeenCalledTimes(1);
    expect(defaultCache.delete).not.toHaveBeenCalled();
  });

  it('should evict a single cache key', async () => {
    const loggerMock = createLoggerMock();

    cacheManager.initialize({ logger: loggerMock });

    const defaultCache = cacheManager.getDefaultStore();
    const cacheDeleteSpy = jest.spyOn(defaultCache, 'delete');

    const userId = 1;
    const cacheKey = 'users';

    await defaultCache.set(cacheKey, [{ id: userId }]);

    class UserService {
      @UseCacheEvict({ keys: 'users' })
      async updateUser(user: any) {}
    }
    await new UserService().updateUser({});

    expect(loggerMock.warn).not.toHaveBeenCalled();
    expect(cacheDeleteSpy).toHaveBeenCalledTimes(1);
  });
  it('should evict a single cache key', async () => {
    const loggerMock = createLoggerMock();

    cacheManager.initialize({ logger: loggerMock });

    const defaultCache = cacheManager.getDefaultStore();
    const cacheDeleteSpy = jest.spyOn(defaultCache, 'delete');

    const userId = 1;
    const cacheKey = 'users';

    await defaultCache.set(cacheKey, [{ id: userId }]);

    class UserService {
      @UseCacheEvict({ keys: 'users' })
      async updateUser(user: any) {}
    }
    await new UserService().updateUser({});

    expect(loggerMock.warn).not.toHaveBeenCalled();
    expect(cacheDeleteSpy).toHaveBeenCalledTimes(1);
    expect(defaultCache['cache'].size).toBe(0);
  });

  it('should evict a single cache key using function', async () => {
    const loggerMock = createLoggerMock();

    cacheManager.initialize({ logger: loggerMock });

    const defaultCache = cacheManager.getDefaultStore();
    const cacheDeleteSpy = jest.spyOn(defaultCache, 'delete');

    const userId = 1;
    const cacheKey = `users:${userId}`;

    await defaultCache.set(cacheKey, { id: userId });

    class UserService {
      @UseCacheEvict({ keys: (user) => `users:${user.id}` })
      async updateUser(user: any) {}
    }
    await new UserService().updateUser({ id: userId });

    expect(loggerMock.warn).not.toHaveBeenCalled();
    expect(cacheDeleteSpy).toHaveBeenCalledTimes(1);
    expect(defaultCache['cache'].size).toBe(0);
  });

  it('should evict a list of cache keys', async () => {
    const loggerMock = createLoggerMock();

    cacheManager.initialize({ logger: loggerMock });

    const defaultCache = cacheManager.getDefaultStore();
    const cacheDeleteSpy = jest.spyOn(defaultCache, 'delete');

    const userId = 1;
    const userCacheKey = `users:${userId}`;
    const userAddressCacheKey = `${userCacheKey}:addresses`;
    const userContactCacheKey = `${userCacheKey}:contacts`;

    await Promise.all([
      defaultCache.set(userCacheKey, { id: userId }),
      defaultCache.set(userAddressCacheKey, [{ zipCode: '00000000' }]),
      defaultCache.set(userContactCacheKey, [{ phoneNumber: '99999999999' }]),
    ]);

    class UserService {
      @UseCacheEvict({
        keys: (user) => [
          userCacheKey,
          userAddressCacheKey,
          userContactCacheKey,
        ],
      })
      async updateUser(user: any) {}
    }
    await new UserService().updateUser({ id: userId });

    expect(loggerMock.warn).not.toHaveBeenCalled();
    expect(cacheDeleteSpy).toHaveBeenCalledTimes(1);
    expect(defaultCache['cache'].size).toBe(0);
  });
});
