import { CacheKeyGeneratorStrategy } from '../cache';

export type UseCachePutOptions<TArgs extends any[]> = {
  name?: string;
  skip?: (...args: TArgs) => boolean;
  key?: string | ((...args: TArgs) => string) | CacheKeyGeneratorStrategy;
  ttl?: number;
  isCacheable?: (value: any, ...args: TArgs) => boolean;
};
