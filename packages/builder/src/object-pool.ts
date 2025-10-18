import { ObjectPool, BuilderInstance } from './types';

export class FastObjectPool<T> implements ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: ((obj: T) => void) | undefined;
  private maxSize: number;

  constructor(createFn: () => T, resetFn?: (obj: T) => void, maxSize = 1000) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
  }

  get(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
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
    this.pool = new FastObjectPool(
      builderFn,
      (builder) => this.resetBuilder(builder),
      maxSize
    );
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
}
