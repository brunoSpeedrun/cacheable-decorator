import { toKebabCase } from '../utils';

export abstract class CacheKeyGeneratorStrategy {
  abstract generate(target: Object, method: string, ...args: any[]): string;
}

export class DefaultCacheKeyGenerator extends CacheKeyGeneratorStrategy {
  generate(target: Object, method: string, ...args: any[]): string {
    const argsAsBase64 = Buffer.from(JSON.stringify(args), 'utf-8').toString(
      'base64',
    );

    return `${toKebabCase(
      `${target.constructor.name}:${method}`,
    )}:${argsAsBase64}`;
  }
}

export class StringCacheKeyGenerator extends CacheKeyGeneratorStrategy {
  constructor(private readonly cacheKey: string) {
    super();
  }

  generate(target: Object, method: string, ...args: any[]): string {
    return this.cacheKey;
  }
}

export class FunctionCacheKeyGenerator extends CacheKeyGeneratorStrategy {
  constructor(private readonly fn: (...args: any[]) => string) {
    super();
  }

  generate(target: Object, method: string, ...args: any[]): string {
    return this.fn.apply(target, args);
  }
}

const DEFAULT_CACHE_KEY_GENERATOR = Symbol('DEFAULT_CACHE_KEY_GENERATOR');

export class CacheKeyGeneratorFactory {
  static readonly [DEFAULT_CACHE_KEY_GENERATOR] =
    new DefaultCacheKeyGenerator();

  static from(
    value?: string | ((...args: any[]) => string) | CacheKeyGeneratorStrategy,
  ): CacheKeyGeneratorStrategy {
    if (value instanceof CacheKeyGeneratorStrategy) {
      return value;
    }

    if (typeof value === 'string') {
      return new StringCacheKeyGenerator(value);
    }

    if (typeof value === 'function') {
      return new FunctionCacheKeyGenerator(value);
    }

    return this[DEFAULT_CACHE_KEY_GENERATOR];
  }
}
