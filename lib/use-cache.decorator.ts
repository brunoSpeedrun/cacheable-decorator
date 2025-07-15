import {
  CacheManager,
  CacheStoreLike,
  CacheKeyGeneratorFactory,
} from './cache';
import { createCacheProxyContext } from './create-cache-proxy-context';
import { UseCacheOptions } from './use-cache-options';
import { copyMethodMetadata } from './utils';

/**
 * Wraps the decorated method in a cache logic.
 */
export function UseCache(): (
  target: any,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<(...args: any) => Promise<any>>
) => void;

/**
 * Wraps the decorated method in a cache logic.
 *
 * @param options Use cache options
 */
export function UseCache<TArgs extends any[]>(
  options: UseCacheOptions<TArgs>
): (
  target: any,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<(...args: TArgs) => Promise<any>>
) => void;

export function UseCache<TArgs extends any[]>(
  maybeOptions?: UseCacheOptions<TArgs>
) {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: TArgs) => Promise<any>>
  ) => {
    const run = async (
      cache: CacheStoreLike,
      outerThis: any,
      original: (...args: TArgs) => Promise<any>,
      args: TArgs,
      maybeOptions?: UseCacheOptions<TArgs>
    ) => {
      const cacheManager = CacheManager.getInstance();
      const logger = cacheManager.logger;

      const logLabel = `[${
        outerThis.constructor.name
      }:${propertyKey.toString()}]`;

      const cacheKeyGenerator = CacheKeyGeneratorFactory.from(
        maybeOptions?.key
      );
      const cacheKey = cacheKeyGenerator.generate(
        outerThis,
        propertyKey.toString(),
        ...args
      );

      const cached = await cache.get(cacheKey);

      if (cached) {
        logger.info(`${logLabel} Cache Hit: ${cacheKey}`);

        return cached;
      }

      logger.info(`${logLabel} Cache Miss: ${cacheKey}`);

      const value = await original.apply(outerThis, args);

      const thisCanCache =
        typeof maybeOptions?.isCacheable === 'function'
          ? maybeOptions.isCacheable.apply(outerThis, [value, ...args])
          : true;
      const canCache = cacheManager.isCacheable(value) && thisCanCache;

      if (!canCache) {
        logger.warn(`${logLabel} Cache not saved. isCacheable returns false`);

        return value;
      }

      const ttl = maybeOptions?.ttl ?? cacheManager.ttlInMilliseconds;

      await cache.set(cacheKey, value, ttl);

      return value;
    };

    createCacheProxyContext(
      UseCache.name,
      propertyKey,
      descriptor,
      run,
      maybeOptions
    );
  };
}
