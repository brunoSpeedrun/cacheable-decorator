import {
  CacheManager,
  CacheStoreLike,
  isCacheable,
  LoggerLike,
  UseCachePut,
} from '../lib';

describe('UseCachePut', () => {
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

  it('should decorate method with @UseCachePut', async () => {
    class UserService {
      @UseCachePut()
      async updateUser(user: any) {
        return user;
      }
    }
    const service = new UserService();

    const input = { id: 1, name: 'User 1' };
    const result = await service.updateUser(input);

    expect(result).toBe(input);
  });

  it('should save in cache', async () => {
    const defaultCache = cacheManager.getDefaultStore();

    class UserService {
      @UseCachePut({ key: (user: any) => `users:${user.id}` })
      async updateUser(user: any) {
        return user;
      }
    }
    const service = new UserService();

    const input = { id: 1, name: 'User 1' };
    const result = await service.updateUser(input);

    expect(result).toBe(input);
    expect(defaultCache['cache'].size).toBe(1);
    expect(await defaultCache.get('users:1')).toBe(result);
  });

  it('should not set in cache when isCacheable returns false', async () => {
    const loggerMock = createLoggerMock();

    cacheManager.initialize({ logger: loggerMock });
    const defaultCache = cacheManager.getDefaultStore();

    class UserService {
      @UseCachePut({ key: (user: any) => `users:${user.id}`, isCacheable })
      async updateUser(user: any) {
        return null;
      }
    }
    const service = new UserService();

    const input = { id: 1, name: 'User 1' };
    const result = await service.updateUser(input);

    expect(loggerMock.warn).toHaveBeenCalled();
    expect(result).toBe(null);
    expect(await defaultCache.get('users:1')).not.toBeDefined();
    expect(defaultCache['cache'].size).toBe(0);
  });
});
