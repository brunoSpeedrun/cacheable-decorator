# Cacheable Decorator

A zero dependencies decorator for cache concerns.

When we want to add a caching layer to our applications, we often need to directly handle the caching flow and, consequently, the caching logic becomes intertwined with our business rules. Consider the code snippet below:

```typescript
export class WordpressService {
  constructor(private readonly cache: Keyv) {}

  async findPostBySlug(slug: string) {
    const { data } = await axios.get(
      `https://example.com/wp-json/wp/v2/posts?${slug}`
    );

    if (data.length === 0) {
      throw new Error(`Post ${slug} not found.`);
    }

    const post = data[0];

    const author = await this.findAuthorById(post.author);

    return {
      ...post,
      author,
    };
  }

  findAuthorById(id: number) {
    const cacheKey = `authors:${id}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const author = await axios.get(
      `https://example.com/wp-json/wp/v2/users/${id}`,
      {
        headers: {
          Authorization: 'Bearer <token>',
        },
      }
    );

    await this.cache.set(cacheKey, author);

    return author;
  }
}
```

- Creating a unit test is difficult because you will have to mock the Cache dependency.

- The caching logic may be the same for many cases, which can lead to code duplication.

- If you need to change the cache library, you will need to change not only the `findAuthorById` method, but the tests as well.

Caching is generally considered a cross-cutting concern in software development. This is because caching logic often needs to be implemented across multiple modules or layers of an application.

The `cacheable-decorator` helps you use cache as a cross-cutting concern and reduce the time it takes to add cache to your application.

Now let's look at the same example using `cacheable-decorator`:

## Configuration

First, you can configure `CacheManager` with the following options:

```typescript
export type CacheManagerOptions = {
  /**
   * Enables/Disables the cache globally (default is true).
   * When disabled, the cache flow is ignored.
   * This makes debugging and application development easier.
   */
  enabled?: boolean;

  /**
   * Sets the default ttl. This option can be overridden in @UseCache.
   * The default is null.
   */
  ttlInMilliseconds?: number;

  /**
   * By default, logging is disabled (false).
   * You can pass the value true, which will cause the console to be used as the logger.
   * or define your own logger.
   */
  logger?: boolean | LoggerLike;

  /**
   * A function to be executed before saving the data to the cache.
   * If not specified, a function that always returns true will be used.
   */
  isCacheable?: (value: any) => boolean;
};
```

```typescript
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';

import { CacheManager, isCacheable } from 'cacheable-decorator';

const cacheManager = CacheManager.getInstance();

const FIVE_MINUTES_IN_MILLISECONDS = 60000;

cacheManager.initialize({
  isCacheable,
  enabled: true,
  logger: true,
  ttlInMilliseconds: FIVE_MINUTES_IN_MILLISECONDS,
});

const keyv = new Keyv(new KeyvRedis('redis://localhost:6379'));

cacheManager.addStore('redis', keyv);
```

> `isCacheable` is a function that does not allow storing null, undefined or empty Array values.

> You can define your own cache store by implementing the CacheStoreLike interface.

> Fully compatible with [keyv](https://keyv.org).

```typescript
export interface CacheStoreLike {
  get<T>(key: string): Promise<T | undefined>;

  getMany<T>(keys: string[]): Promise<Array<T | undefined>>;

  set<T>(key: string, value: T, ttl?: number): Promise<boolean>;

  setMany<T>(entries: CacheEntry[]): Promise<boolean[]>;

  delete(key: string | string[]): Promise<boolean>;
}
```

## @UseCache

The **@UseCache** decorator accepts the following options:

```typescript
export type UseCacheOptions<TArgs extends any[]> = {
  name?: string;
  skip?: (...args: TArgs) => boolean;
  key?: string | ((...args: TArgs) => string) | CacheKeyGeneratorStrategy;
  ttl?: number;
  isCacheable?: (value: any, ...args: TArgs) => boolean;
};
```

- **name** - The name of the cache to use. If no name is provided, the first cache store added using `cacheManager.addStore` will be used. If no cache store has been added, an `InMemoryCache` will be used.

- **skip** - A function to check whether the cache flow should be skipped for this call.

> If you need to access the this context, you must define it as a function. Ex:

```typescript
  @UseCache({
    skip: function (this: WordpressService, id: number) {
      return true;
    },
  })
  findAuthorById(id: number) {
    return axios.get(`https://example.com/wp-json/wp/v2/users/${id}`, {
      headers: {
        Authorization: 'Bearer <token>',
      },
    });
  }
```

- **key** - The key that will be used to cache the method's response. If not specified, the default key is: `class-name:method-name:args-as-base64`.

In the example above, if the method is called with the value `1` the key to be generated is:

> wordpress-service:find-author-by-id:MQ==

You can also provide an object that implements the following abstract class:

```typescript
export abstract class CacheKeyGeneratorStrategy {
  abstract generate(target: Object, method: string, ...args: any[]): string;
}
```

- **ttl** - The TTL to be used. If not specified, the one defined in `CacheManager` will be used.

- **isCacheable** - A function that checks if the method's return is cacheable. (A boolean AND is done with the method defined in `cacheManager.initialize`).

Now let's look at our `WordpressService` class with the `@UseCache` decorator:

```typescript
export class WordpressService {
  async findPostBySlug(slug: string) {
    const { data } = await axios.get(
      `https://example.com/wp-json/wp/v2/posts?${slug}`
    );

    if (data.length === 0) {
      throw new Error(`Post ${slug} not found.`);
    }

    const post = data[0];

    const author = await this.findAuthorById(post.author);

    return {
      ...post,
      author,
    };
  }

  @UseCache({ key: (id) => `users:${id}` })
  findAuthorById(id: number) {
    return axios.get(`https://example.com/wp-json/wp/v2/users/${id}`, {
      headers: {
        Authorization: 'Bearer <token>',
      },
    });
  }
}
```

## @UseCachePut

You can use the **@UseCachePut** decorator to update the cache after a method executes.

```typescript
export class UserService {
  constructor(private readonly userRepository: IUserRepository);

  @UseCachePut({ key: (_, userId: number) => `users:${userId}` })
  async changeUserEmail(newEmail: string, userId: number) {
    const user = await this.userRepository.findByIdOrFail(id);

    user.changeEmail(newEmail);

    await this.userRepository.save(user);

    return user;
  }
}
```

After configuring our method with **@UseCachePut** and executing it, the method's return will be saved in the provided cache key.

```typescript
const newEmail = 'tony.stark@mail.com';
const userId: 1341;

await userService.changeUserEmail(newEmail, userId);
```

You can use the same options as the **@UseCache** decorator.

```typescript
export type UseCachePutOptions<TArgs extends any[]> = {
  name?: string;
  skip?: (...args: TArgs) => boolean;
  key?: string | ((...args: TArgs) => string) | CacheKeyGeneratorStrategy;
  ttl?: number;
  isCacheable?: (value: any, ...args: TArgs) => boolean;
};
```

## @UseCacheEvict

Sometimes we want to clear the cache after an operation. The code snippet below shows how we can clear the cache after a user updates.

```typescript
export class UserService {
  constructor(private readonly userRepository: IUserRepository);

  @UseCacheEvict({ key: (_, userId: number) => `users:${userId}:addresses` })
  async addAddress(newAddress: UserAddress, userId: number) {
    const user = await this.userRepository.findByIdOrFail(id);

    user.addAddress(newAddress);

    await this.userRepository.save(user);
  }
}
```

> The `keys` option is required, and can return a string array containing the cache keys to be deleted.

```typescript
export type UseCacheEvictOptions<TArgs extends any[]> = {
  name?: string;
  skip?: (...args: TArgs) => boolean;
  keys: string | Array<string> | ((...args: TArgs) => string | Array<string>);
};
```

## <> with :heart: and [VSCode](https://code.visualstudio.com)
