const INSTANCE = Symbol('INSTANCE');

export class CacheManager {
  private static [INSTANCE]: CacheManager;

  static getInstance() {
    if (!this[INSTANCE]) {
      this[INSTANCE] = new CacheManager();
    }

    return this[INSTANCE];
  }
}
