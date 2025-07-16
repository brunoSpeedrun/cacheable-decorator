import { CacheStoreLike, CacheManager } from '../cache';
import { createCacheProxyContext } from '../create-cache-proxy-context';
import { UseCacheEvictOptions } from './use-cache-evict-options';

/**
 * Wraps the decorated method in a cache logic.
 *
 * @param options Use cache options
 */
export function UseCacheEvict<TArgs extends any[]>(
  options: UseCacheEvictOptions<TArgs>
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
      options?: UseCacheEvictOptions<TArgs>
    ) => {
      const cacheManager = CacheManager.getInstance();
      const logger = cacheManager.logger;

      const logLabel = `[${
        outerThis.constructor.name
      }:${propertyKey.toString()}]`;

      const value = await original.apply(outerThis, args);

      if (!options?.keys) {
        logger.warn(`${logLabel} keys must be supplied on UseCacheEvict.`);

        return value;
      }

      const keyOrArrayOfKeys =
        typeof options.keys === 'function'
          ? options.keys.apply(outerThis, args)
          : options.keys;

      const keys = Array.isArray(keyOrArrayOfKeys)
        ? keyOrArrayOfKeys
        : [keyOrArrayOfKeys];

      await cache.delete(keys.map((k) => k.toString()));

      return value;
    };

    createCacheProxyContext(
      UseCacheEvict.name,
      propertyKey,
      descriptor,
      run,
      options
    );
  };
}
