import {
  DefaultCacheKeyGenerator,
  StringCacheKeyGenerator,
  FunctionCacheKeyGenerator,
  CacheKeyGeneratorFactory,
} from '../lib';

describe('CacheKeyGeneratorStrategy', () => {
  class MyService {
    myMethod(id: string, name: string) {
      return 'something';
    }

    anotherMethod(value: number) {
      return 'another something';
    }
  }

  const targetInstance = new MyService();

  describe('DefaultCacheKeyGenerator', () => {
    let generator: DefaultCacheKeyGenerator;

    beforeEach(() => {
      generator = new DefaultCacheKeyGenerator();
    });

    it('should generate a key based on target name, method name, and base64 encoded arguments', () => {
      const args = ['123', 'test-name'];
      const expectedArgsAsBase64 = Buffer.from(
        JSON.stringify(args),
        'utf-8',
      ).toString('base64');
      const expectedKey = `my-service:my-method:${expectedArgsAsBase64}`;

      const key = generator.generate(targetInstance, 'myMethod', ...args);

      expect(key).toBe(expectedKey);
    });

    it('should generate a different key for different arguments', () => {
      const args1 = ['123', 'test-name'];
      const args2 = ['456', 'another-name'];

      const key1 = generator.generate(targetInstance, 'myMethod', ...args1);
      const key2 = generator.generate(targetInstance, 'myMethod', ...args2);

      expect(key1).not.toBe(key2);
    });

    it('should generate a different key for different methods', () => {
      const args = ['value'];

      const key1 = generator.generate(targetInstance, 'myMethod', ...args);
      const key2 = generator.generate(targetInstance, 'anotherMethod', ...args);

      expect(key1).not.toBe(key2);
    });

    it('should handle no arguments correctly', () => {
      const expectedArgsAsBase64 = Buffer.from(
        JSON.stringify([]),
        'utf-8',
      ).toString('base64');
      const expectedKey = `my-service:my-method:${expectedArgsAsBase64}`;

      const key = generator.generate(targetInstance, 'myMethod');

      expect(key).toBe(expectedKey);
    });

    it('should handle complex arguments (objects) correctly', () => {
      const complexArgs = [{ id: 1, data: { value: 'test' } }, true];
      const expectedArgsAsBase64 = Buffer.from(
        JSON.stringify(complexArgs),
        'utf-8',
      ).toString('base64');
      const expectedKey = `my-service:my-method:${expectedArgsAsBase64}`;

      const key = generator.generate(
        targetInstance,
        'myMethod',
        ...complexArgs,
      );

      expect(key).toBe(expectedKey);
    });
  });

  describe('StringCacheKeyGenerator', () => {
    const fixedCacheKey = 'my-fixed-cache-key';
    let generator: StringCacheKeyGenerator;

    beforeEach(() => {
      generator = new StringCacheKeyGenerator(fixedCacheKey);
    });

    it('should always return the predefined string cache key', () => {
      const key1 = generator.generate(targetInstance, 'myMethod', 'arg1');
      const key2 = generator.generate(targetInstance, 'anotherMethod', 123);
      const key3 = generator.generate({} as any, 'anyMethod');

      expect(key1).toBe(fixedCacheKey);
      expect(key2).toBe(fixedCacheKey);
      expect(key3).toBe(fixedCacheKey);
    });

    it('should ignore target, method, and args', () => {
      const key = generator.generate(
        { constructor: { name: 'IgnoredTarget' } } as any,
        'ignoredMethod',
        'ignoredArg',
      );
      expect(key).toBe(fixedCacheKey);
    });
  });

  describe('FunctionCacheKeyGenerator', () => {
    it('should generate a key by executing the provided function', () => {
      const mockFn = jest.fn(
        (id: string, name: string) => `custom-key-${id}-${name}`,
      );
      const generator = new FunctionCacheKeyGenerator(mockFn);

      const args = ['abc', 'def'];
      const key = generator.generate(targetInstance, 'myMethod', ...args);

      expect(mockFn).toHaveBeenCalledWith(...args);
      expect(key).toBe('custom-key-abc-def');
    });

    it('should pass all arguments to the provided function', () => {
      const mockFn = jest.fn((...args: any[]) => JSON.stringify(args));
      const generator = new FunctionCacheKeyGenerator(mockFn);

      const args = [1, 'test', { a: 1 }];
      generator.generate(targetInstance, 'someMethod', ...args);

      expect(mockFn).toHaveBeenCalledWith(1, 'test', { a: 1 });
    });

    it('should apply the function with the correct `this` context (target)', () => {
      class TestContext {
        prefix = 'PREFIX';
        generateKey(id: string) {
          return `${this.prefix}-${id}`;
        }
      }

      const testContextInstance = new TestContext();
      const generator = new FunctionCacheKeyGenerator(
        testContextInstance.generateKey.bind(testContextInstance),
      );

      const key = generator.generate(
        testContextInstance,
        'generateKey',
        'item123',
      );

      expect(key).toBe('PREFIX-item123');
    });
  });

  describe('CacheKeyGeneratorStrategy.from', () => {
    it('should return the instance if value is already a CacheKeyGeneratorStrategy', () => {
      const existingStrategy = new DefaultCacheKeyGenerator();
      const result = CacheKeyGeneratorFactory.from(existingStrategy);
      expect(result).toBe(existingStrategy);
    });

    it('should return a StringCacheKeyGenerator if value is a string', () => {
      const keyString = 'my-custom-string-key';
      const result = CacheKeyGeneratorFactory.from(keyString);
      expect(result).toBeInstanceOf(StringCacheKeyGenerator);
      expect(
        (result as StringCacheKeyGenerator).generate({}, 'anyMethod'),
      ).toBe(keyString);
    });

    it('should return a FunctionCacheKeyGenerator if value is a function', () => {
      class TestContext {
        prefix = 'PREFIX';
        generateKey() {
          return `${this.prefix}-key-from-function`;
        }
      }

      const testContextInstance = new TestContext();

      const result = CacheKeyGeneratorFactory.from(
        testContextInstance.generateKey,
      );
      expect(result).toBeInstanceOf(FunctionCacheKeyGenerator);
      expect(result.generate(testContextInstance, 'method')).toBe(
        'PREFIX-key-from-function',
      );
    });

    it('should return a DefaultCacheKeyGenerator if value is undefined', () => {
      const result = CacheKeyGeneratorFactory.from(undefined);
      expect(result).toBeInstanceOf(DefaultCacheKeyGenerator);
    });

    it('should return a DefaultCacheKeyGenerator if value is null', () => {
      const result = CacheKeyGeneratorFactory.from(null as any);
      expect(result).toBeInstanceOf(DefaultCacheKeyGenerator);
    });

    it('should return a DefaultCacheKeyGenerator if no value is provided', () => {
      const result = CacheKeyGeneratorFactory.from();
      expect(result).toBeInstanceOf(DefaultCacheKeyGenerator);
    });

    it('should return a DefaultCacheKeyGenerator if value is an unsupported type (e.g., number)', () => {
      // This scenario should theoretically not happen with TypeScript, but good for robustness
      const result = CacheKeyGeneratorFactory.from(123 as any); // Cast to any to bypass TS error
      expect(result).toBeInstanceOf(DefaultCacheKeyGenerator);
    });
  });
});
