import {
  CacheStoreLike,
  CacheManager,
  CacheKeyGeneratorFactory,
} from '../cache';
import { createCacheProxyContext } from '../create-cache-proxy-context';

import { UseCachePutOptions } from './use-cache-put-options';

/**
 * Wraps the decorated method in a cache logic.
 */
export function UseCachePut(): (
  target: any,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<(...args: any) => Promise<any>>
) => void;

/**
 * Wraps the decorated method in a cache logic.
 *
 * @param options Use cache options
 */
export function UseCachePut<TArgs extends any[]>(
  options: UseCachePutOptions<TArgs>
): (
  target: any,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<(...args: TArgs) => Promise<any>>
) => void;

export function UseCachePut<TArgs extends any[]>(
  maybeOptions?: UseCachePutOptions<TArgs>
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
      maybeOptions?: UseCachePutOptions<TArgs>
    ) => {
      const cacheManager = CacheManager.getInstance();
      const logger = cacheManager.logger;

      const logLabel = `[${
        outerThis.constructor.name
      }:${propertyKey.toString()}]`;

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

      const cacheKeyGenerator = CacheKeyGeneratorFactory.from(
        maybeOptions?.key
      );

      const cacheKey = cacheKeyGenerator.generate(
        outerThis,
        propertyKey.toString(),
        ...args
      );
      const ttl = maybeOptions?.ttl ?? cacheManager.ttlInMilliseconds;

      await cache.set(cacheKey, value, ttl);

      return value;
    };

    createCacheProxyContext(
      UseCachePut.name,
      propertyKey,
      descriptor,
      run,
      maybeOptions
    );
  };
}
