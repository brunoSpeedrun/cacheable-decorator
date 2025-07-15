import { CacheManager, CacheStoreLike } from './cache';
import { copyMethodMetadata } from './utils';

export type CreateCacheProxyContextOptions<TArgs extends any[]> = {
  name?: string;
  skip?: (...args: TArgs) => boolean;
};

export function createCacheProxyContext<
  TArgs extends any[],
  TOptions extends CreateCacheProxyContextOptions<TArgs>
>(
  decoratorName: string,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<(...args: TArgs) => Promise<any>>,
  run: (
    cache: CacheStoreLike,
    outerThis: any,
    original: (...args: TArgs) => Promise<any>,
    args: TArgs,
    maybeOptions?: TOptions
  ) => Promise<any>,
  maybeOptions?: TOptions
) {
  const original = descriptor.value;

  if (typeof original !== 'function') {
    throw new Error(
      `The @${decoratorName} decorator can be only used on functions, but ${propertyKey.toString()} is not a function.`
    );
  }

  descriptor.value = new Proxy(original, {
    apply: async function (_, outerThis, args: TArgs) {
      const cacheManager = CacheManager.getInstance();
      const logger = cacheManager.logger;

      const logLabel = `[${
        outerThis.constructor.name
      }:${propertyKey.toString()}]`;

      if (!cacheManager.isEnabled) {
        logger.info(
          `${logLabel} Cache skipped. Cache Manager is disabled. Call CacheManager.getInstance().enable() to enable cache.`
        );

        return original.apply(outerThis, args);
      }

      if (typeof maybeOptions?.skip === 'function') {
        const shouldSkipCache = maybeOptions.skip.apply(outerThis, args);

        if (shouldSkipCache) {
          logger.info(
            `${logLabel} Cache skipped. Skip method called with ${JSON.stringify(
              args
            )}`
          );

          return original.apply(outerThis, args);
        }
      }

      let cache: CacheStoreLike | undefined;

      if (maybeOptions?.name) {
        cache = cacheManager.getStore(maybeOptions.name);

        if (!cache) {
          logger.warn(
            `${logLabel} Cache skipped. Cache '${maybeOptions?.name}' does not exists in CacheManager.`
          );

          return original.apply(outerThis, args);
        }
      } else {
        cache = cacheManager.getDefaultStore();
      }

      const result = await run(cache, outerThis, original, args, maybeOptions);

      return result;
    },
  });

  copyMethodMetadata(original, descriptor.value);
}
