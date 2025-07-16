export type UseCacheEvictOptions<TArgs extends any[]> = {
  name?: string;
  skip?: (...args: TArgs) => boolean;
  keys: string | Array<string> | ((...args: TArgs) => string | Array<string>);
};
