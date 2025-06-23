import {
  CacheKeyGeneratorStrategy,
  CacheManager,
  CacheStoreLike,
  InMemoryCache,
  LoggerLike,
  UseCache,
} from '../lib';

describe('UseCache', () => {
  const cacheManager = CacheManager.getInstance();

  const setDefaultCacheMock = () => {
    const inMemoryCache: jest.Mocked<CacheStoreLike> = {
      get: jest.fn(),
      set: jest.fn(),
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

  describe('Skip Cache', () => {
    it('should skip cache when CacheManager is disabled', async () => {
      const loggerMock = createLoggerMock();

      cacheManager.initialize({
        enabled: false,
        logger: loggerMock,
      });

      const id = 1;
      const returnValue = { id, user: `User ${id}` };

      class Service {
        @UseCache()
        async findById(id: number) {
          return returnValue;
        }
      }
      const service = new Service();

      const result = await service.findById(1);

      expect(loggerMock.info).toHaveBeenCalledTimes(1);
      expect(result).toBe(returnValue);
    });

    it('should skip cache when skip option returns true', async () => {
      const loggerMock = createLoggerMock();

      cacheManager.initialize({ logger: loggerMock });
      const defaultCache = cacheManager.getDefaultStore();

      const id = 1;
      const returnValue = { id, user: `User ${id}` };

      const cacheGetSpy = jest.spyOn(defaultCache, 'get');
      const cacheSetSpy = jest.spyOn(defaultCache, 'set');

      class Service {
        @UseCache({ skip: (id) => id <= 0 })
        async findById(id: number) {
          return returnValue;
        }
      }
      const service = new Service();

      const result = await service.findById(0);

      expect(loggerMock.info).toHaveBeenCalledTimes(1);
      expect(cacheGetSpy).not.toHaveBeenCalled();
      expect(cacheSetSpy).not.toHaveBeenCalled();
      expect(result).toBe(returnValue);
    });

    it('should skip cache when cache is not found by name', async () => {
      const loggerMock = createLoggerMock();

      cacheManager.initialize({
        enabled: true,
        logger: loggerMock,
      });

      const id = 1;
      const returnValue = { id, user: `User ${id}` };

      class Service {
        @UseCache({ name: 'invalid-cache' })
        async findById(id: number) {
          return returnValue;
        }
      }
      const service = new Service();

      const result = await service.findById(1);

      expect(loggerMock.warn).toHaveBeenCalledTimes(1);
      expect(result).toBe(returnValue);
    });
  });

  it('should use first registered cache when cache name is not supplied', async () => {
    const loggerMock = createLoggerMock();

    cacheManager.initialize({ logger: loggerMock });
    const defaultCache = setDefaultCacheMock();

    const id = 1;
    const returnValue = { id, user: `User ${id}` };
    const cachedValue = { id, user: `User ${id} from cache` };

    const cacheGetSpy = jest
      .spyOn(defaultCache, 'get')
      .mockResolvedValueOnce(cachedValue);

    class Service {
      @UseCache()
      async findById(id: number) {
        return returnValue;
      }
    }
    const service = new Service();

    const result = await service.findById(1);

    expect(loggerMock.warn).not.toHaveBeenCalled();
    expect(cacheGetSpy).toHaveBeenCalledTimes(1);
    expect(result).toBe(cachedValue);
  });

  it('should use InMemoryCache when no one cache is registered', async () => {
    const loggerMock = createLoggerMock();

    cacheManager.initialize({ logger: loggerMock });
    const defaultCache = cacheManager.getDefaultStore();

    const id = 1;
    const returnValue = { id, user: `User ${id}` };
    const cachedValue = { id, user: `User ${id} from cache` };

    const cacheGetSpy = jest
      .spyOn(defaultCache, 'get')
      .mockResolvedValueOnce(cachedValue);

    class Service {
      @UseCache()
      async findById(id: number) {
        return returnValue;
      }
    }
    const service = new Service();

    const result = await service.findById(1);

    expect(loggerMock.warn).not.toHaveBeenCalled();
    expect(cacheGetSpy).toHaveBeenCalledTimes(1);
    expect(result).toBe(cachedValue);
    expect(defaultCache).toBeInstanceOf(InMemoryCache);
    expect(cacheManager.getStore('default')).toBe(defaultCache);
  });

  describe('CacheKeyGenerator', () => {
    it('should return from cache using DefaultCacheKeyGenerator', async () => {
      const loggerMock = createLoggerMock();

      cacheManager.initialize({ logger: loggerMock });
      const defaultCache = cacheManager.getDefaultStore();

      const id = 1;
      const cachedValue = { id, user: `User ${id} from cache` };
      const expectedArgsAsBase64 = Buffer.from(
        JSON.stringify([id]),
        'utf-8'
      ).toString('base64');
      const cacheKey = `service:find-by-id:${expectedArgsAsBase64}`;

      await defaultCache.set(cacheKey, cachedValue);

      const cacheGetSpy = jest
        .spyOn(defaultCache, 'get')
        .mockResolvedValueOnce(cachedValue);

      class Service {
        @UseCache()
        async findById(id: number) {
          return { id, user: `User ${id}` };
        }
      }
      const service = new Service();

      const result = await service.findById(1);

      expect(loggerMock.info).toHaveBeenCalled();
      expect(cacheGetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetSpy).toHaveBeenCalledWith(cacheKey);
      expect(result).toBe(cachedValue);
    });

    it('should return from cache using StringCacheKeyGenerator', async () => {
      const loggerMock = createLoggerMock();

      cacheManager.initialize({ logger: loggerMock });
      const defaultCache = cacheManager.getDefaultStore();

      const cachedValue = [{ id: 1, user: `User from cache` }];
      const cacheKey = `users`;

      await defaultCache.set(cacheKey, cachedValue);

      const cacheGetSpy = jest
        .spyOn(defaultCache, 'get')
        .mockResolvedValueOnce(cachedValue);

      class Service {
        @UseCache({ key: 'users' })
        async findMany() {
          return [];
        }
      }
      const service = new Service();

      const result = await service.findMany();

      expect(loggerMock.info).toHaveBeenCalled();
      expect(cacheGetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetSpy).toHaveBeenCalledWith(cacheKey);
      expect(result).toBe(cachedValue);
    });

    it('should return from cache using FunctionCacheKeyGenerator', async () => {
      const loggerMock = createLoggerMock();

      cacheManager.initialize({ logger: loggerMock });
      const defaultCache = cacheManager.getDefaultStore();

      const id = 1;
      const cachedValue = { id, user: `User ${id} from cache` };
      const cacheKey = `users:1`;

      await defaultCache.set(cacheKey, cachedValue);

      const cacheGetSpy = jest
        .spyOn(defaultCache, 'get')
        .mockResolvedValueOnce(cachedValue);

      class Service {
        prefix = 'users';

        @UseCache({
          key: function (this: Service, id: number) {
            return `${this.prefix}:${id}`;
          },
        })
        async findById(id: number) {
          return {};
        }
      }
      const service = new Service();

      const result = await service.findById(id);

      expect(loggerMock.info).toHaveBeenCalled();
      expect(cacheGetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetSpy).toHaveBeenCalledWith(cacheKey);
      expect(result).toBe(cachedValue);
    });

    it('should return from cache using custom CacheKeyGenerator', async () => {
      const loggerMock = createLoggerMock();

      cacheManager.initialize({ logger: loggerMock });
      const defaultCache = cacheManager.getDefaultStore();

      class MyCacheKeyGenerator extends CacheKeyGeneratorStrategy {
        generate(target: Object, method: string, onlyActive: boolean): string {
          return onlyActive ? `users:only-active` : `users:all`;
        }
      }

      const cachedValue = [{ id: 1, user: `Active user from cache` }];
      const cacheKey = `users:only-active`;

      await defaultCache.set(cacheKey, cachedValue);

      const cacheGetSpy = jest
        .spyOn(defaultCache, 'get')
        .mockResolvedValueOnce(cachedValue);

      class Service {
        prefix = 'users';

        @UseCache({
          key: new MyCacheKeyGenerator(),
        })
        async findMany(onlyActive: true) {
          return [];
        }
      }
      const service = new Service();

      const onlyActive = true;
      const result = await service.findMany(onlyActive);

      expect(loggerMock.info).toHaveBeenCalled();
      expect(cacheGetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetSpy).toHaveBeenCalledWith(cacheKey);
      expect(result).toBe(cachedValue);
    });
  });

  describe('Save in cache', () => {
    it('should set in cache when cacheKey is not found', async () => {
      const loggerMock = createLoggerMock();

      cacheManager.initialize({ logger: loggerMock });
      const defaultCache = cacheManager.getDefaultStore();

      const cacheGetSpy = jest.spyOn(defaultCache, 'get');
      const cacheSetSpy = jest.spyOn(defaultCache, 'set');

      const id = 1;
      const serviceValue = { id, user: `User ${id}` };
      const ttl = 300000;

      class Service {
        @UseCache({ ttl, key: (id) => `users:${id}` })
        async findById(id: number) {
          return serviceValue;
        }
      }
      const service = new Service();

      const result = await service.findById(1);

      expect(loggerMock.info).toHaveBeenCalled();
      expect(cacheGetSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).toHaveBeenCalledWith('users:1', serviceValue, ttl);
      expect(result).toBe(serviceValue);
      expect(await defaultCache.get('users:1')).toBe(serviceValue);
    });

    it('should not set in cache when isCacheable returns false', async () => {
      const loggerMock = createLoggerMock();

      cacheManager.initialize({ logger: loggerMock });
      const defaultCache = cacheManager.getDefaultStore();

      const cacheGetSpy = jest.spyOn(defaultCache, 'get');
      const cacheSetSpy = jest.spyOn(defaultCache, 'set');

      const id = 1;
      const serviceValue = { id, user: `User ${id}`, canCache: false };

      class Service {
        @UseCache({
          key: (id) => `users:${id}`,
          isCacheable: (value) => value.canCache,
        })
        async findById(id: number) {
          return serviceValue;
        }
      }
      const service = new Service();

      const result = await service.findById(1);

      expect(loggerMock.warn).toHaveBeenCalled();
      expect(cacheGetSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).not.toHaveBeenCalled();
      expect(result).toBe(serviceValue);
      expect(await defaultCache.get('users:1')).not.toBeDefined();
    });

    it('should not set in cache when isCacheable from CacheManager returns false', async () => {
      const loggerMock = createLoggerMock();

      cacheManager.initialize({
        logger: loggerMock,
        isCacheable: (value) => value != null && value != undefined,
      });
      const defaultCache = cacheManager.getDefaultStore();

      const cacheGetSpy = jest.spyOn(defaultCache, 'get');
      const cacheSetSpy = jest.spyOn(defaultCache, 'set');

      class Service {
        @UseCache()
        async findById(id: number) {
          return null;
        }
      }
      const service = new Service();

      await service.findById(1);

      expect(loggerMock.warn).toHaveBeenCalled();
      expect(cacheGetSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).not.toHaveBeenCalled();
      expect(defaultCache['store'].size).toBe(0);
    });
  });

  it('should copy all property metadata', () => {
    function Decorator1() {
      return (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
      ) => {
        Reflect.defineMetadata('decorator-1', 'decorator:1', descriptor.value);
      };
    }
    function Decorator2() {
      return (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
      ) => {
        Reflect.defineMetadata('decorator-2', 'decorator:2', descriptor.value);
      };
    }

    class CopyDecoratorMetadataTest {
      @UseCache()
      @Decorator1()
      @Decorator2()
      async action() {}
    }

    const metadataTest = new CopyDecoratorMetadataTest();
    const metadataKeys = Reflect.getMetadataKeys(metadataTest.action);

    expect(metadataKeys).toContain('decorator-1');
    expect(metadataKeys).toContain('decorator-2');
  });
});
