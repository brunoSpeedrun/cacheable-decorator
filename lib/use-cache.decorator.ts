import { CacheManager, CacheLike, CacheKeyGeneratorFactory } from './cache';
import { UseCacheOptions } from './use-cache-options';
import { copyMethodMetadata } from './utils';

/**
 * Wraps the decorated method in a cache logic.
 */
export function UseCache(): (
  target: any,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<(...args: any) => Promise<any>>,
) => void;

/**
 * Wraps the decorated method in a cache logic.
 *
 * @param options Use cache options
 */
export function UseCache<TArgs extends any[]>(
  options: UseCacheOptions<TArgs>,
): (
  target: any,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<(...args: TArgs) => Promise<any>>,
) => void;

export function UseCache<TArgs extends any[]>(
  maybeOptions?: UseCacheOptions<TArgs>,
) {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: TArgs) => Promise<any>>,
  ) => {
    const original = descriptor.value;

    if (typeof original !== 'function') {
      throw new Error(
        `The @UseCase decorator can be only used on functions, but ${propertyKey.toString()} is not a function.`,
      );
    }

    descriptor.value = new Proxy(original, {
      apply: async function (_, outerThis, args: TArgs) {
        const cacheManager = CacheManager.getInstance();

        const logLabel = `[${
          outerThis.constructor.name
        }:${propertyKey.toString()}]`;

        if (cacheManager.isDisabled) {
          cacheManager.logger.info(
            `${logLabel} Cache skipped. Cache Manager is disabled. Call CacheManager.getInstance().enable() to enable cache.`,
          );

          return original.apply(outerThis, args);
        }

        if (typeof maybeOptions?.skip === 'function') {
          const shouldSkipCache = maybeOptions.skip.apply(outerThis, args);

          if (shouldSkipCache) {
            cacheManager.logger.info(
              `${logLabel} Cache skipped. Skip method called with ${JSON.stringify(
                args,
              )}`,
            );

            return original.apply(outerThis, args);
          }
        }

        let cache: CacheLike | undefined;

        if (maybeOptions?.name) {
          cache = cacheManager.getCache(maybeOptions.name);

          if (!cache) {
            cacheManager.logger.warn(
              `${logLabel} Cache skipped. Cache '${maybeOptions?.name}' does not exists in CacheManager.`,
            );

            return original.apply(outerThis, args);
          }
        } else {
          cache = cacheManager.getDefaultCache();
        }

        const cacheKeyGenerator = CacheKeyGeneratorFactory.from(
          maybeOptions?.key,
        );
        const cacheKey = cacheKeyGenerator.generate(
          outerThis,
          propertyKey.toString(),
          ...args,
        );

        const cached = await cache.get(cacheKey);

        if (cached) {
          cacheManager.logger.info(`${logLabel} Cache Hit: ${cacheKey}`);

          return cached;
        }

        cacheManager.logger.info(`${logLabel} Cache Miss: ${cacheKey}`);

        const value = await original.apply(outerThis, args);

        const thisCanCache =
          typeof maybeOptions?.isCacheable === 'function'
            ? maybeOptions.isCacheable.apply(outerThis, [value, ...args])
            : true;
        const canCache = cacheManager.isCacheable(value) && thisCanCache;

        if (!canCache) {
          cacheManager.logger.warn(
            `${logLabel} Cache not saved. isCacheable returns false`,
          );

          return value;
        }

        const ttl = maybeOptions?.ttl ?? cacheManager.ttlInMilliseconds;

        await cache.set(cacheKey, value, ttl);

        return value;
      },
    });

    copyMethodMetadata(original, descriptor.value);
  };
}

console;
