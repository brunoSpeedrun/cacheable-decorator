export type CacheManagerOptions = {
  enabled?: boolean;
};

const INSTANCE = Symbol('INSTANCE');
const ENABLED = Symbol('ENABLED');

export class CacheManager {
  private [ENABLED] = true;

  get isEnabled() {
    return this[ENABLED];
  }

  disable() {
    this[ENABLED] = false;
  }

  initialize(options: CacheManagerOptions) {
    throw new Error('Method not implemented.');
  }

  private static [INSTANCE]: CacheManager;

  static getInstance() {
    if (!this[INSTANCE]) {
      this[INSTANCE] = new CacheManager();
    }

    return this[INSTANCE];
  }
}
