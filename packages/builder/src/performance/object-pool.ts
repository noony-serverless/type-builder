import { ObjectPool, BuilderInstance } from '../core/types';

export class FastObjectPool<T> implements ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: ((obj: T) => void) | undefined;
  private maxSize: number;
  private hits: number = 0;
  private misses: number = 0;
  private totalCreated: number = 0;

  constructor(createFn: () => T, resetFn?: (obj: T) => void, maxSize = 1000) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
  }

  get(): T {
    if (this.pool.length > 0) {
      this.hits++;
      return this.pool.pop()!;
    }
    this.misses++;
    this.totalCreated++;
    return this.createFn();
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.pool.length,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      totalCreated: this.totalCreated,
      utilization: this.maxSize > 0 ? this.pool.length / this.maxSize : 0,
    };
  }

  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      if (this.resetFn) {
        this.resetFn(obj);
      }
      this.pool.push(obj);
    }
  }

  clear(): void {
    this.pool.length = 0;
  }

  size(): number {
    return this.pool.length;
  }
}

export class BuilderPool<T> {
  private pool: FastObjectPool<BuilderInstance<T>>;

  constructor(builderFn: () => BuilderInstance<T>, maxSize = 1000) {
    this.pool = new FastObjectPool(builderFn, (builder) => this.resetBuilder(builder), maxSize);
  }

  private resetBuilder(builder: BuilderInstance<T>): void {
    // Reset all properties to undefined
    for (const key in builder) {
      if (key !== 'build' && typeof builder[key] === 'function') {
        delete builder[key];
      }
    }
  }

  get(): BuilderInstance<T> {
    return this.pool.get();
  }

  release(builder: BuilderInstance<T>): void {
    this.pool.release(builder);
  }

  clear(): void {
    this.pool.clear();
  }

  size(): number {
    return this.pool.size();
  }

  getStats() {
    return this.pool.getStats();
  }

  resetStats(): void {
    this.pool.resetStats();
  }
}
