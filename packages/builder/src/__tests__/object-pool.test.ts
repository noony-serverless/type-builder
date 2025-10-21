/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FastObjectPool, BuilderPool } from '../performance/object-pool';
import { BuilderInstance } from '../core/types';

describe('FastObjectPool', () => {
  describe('constructor', () => {
    it('should create pool with default maxSize', () => {
      const createFn = () => ({ value: 0 });
      const pool = new FastObjectPool(createFn);

      expect(pool.size()).toBe(0);
      const stats = pool.getStats();
      expect(stats.maxSize).toBe(1000); // default maxSize
    });

    it('should create pool with custom maxSize', () => {
      const createFn = () => ({ value: 0 });
      const pool = new FastObjectPool(createFn, undefined, 50);

      const stats = pool.getStats();
      expect(stats.maxSize).toBe(50);
    });

    it('should create pool with reset function', () => {
      const createFn = () => ({ value: 0 });
      const resetFn = vi.fn((obj: { value: number }) => {
        obj.value = 0;
      });
      const pool = new FastObjectPool(createFn, resetFn, 10);

      const obj = pool.get();
      obj.value = 42;
      pool.release(obj);

      expect(resetFn).toHaveBeenCalledWith(obj);
      expect(resetFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('get', () => {
    it('should create new object when pool is empty', () => {
      let counter = 0;
      const createFn = () => ({ id: ++counter });
      const pool = new FastObjectPool(createFn);

      const obj = pool.get();
      expect(obj.id).toBe(1);

      const stats = pool.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.hits).toBe(0);
      expect(stats.totalCreated).toBe(1);
    });

    it('should reuse object from pool when available', () => {
      let counter = 0;
      const createFn = () => ({ id: ++counter });
      const pool = new FastObjectPool(createFn);

      const obj1 = pool.get();
      pool.release(obj1);
      const obj2 = pool.get();

      expect(obj1).toBe(obj2);
      expect(obj2.id).toBe(1); // Same object

      const stats = pool.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.totalCreated).toBe(1);
    });

    it('should increment hits counter when reusing objects', () => {
      const createFn = () => ({});
      const pool = new FastObjectPool(createFn);

      const obj = pool.get();
      pool.release(obj);
      pool.get();
      pool.get(); // This should be a miss

      const stats = pool.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(2);
    });
  });

  describe('release', () => {
    it('should add object back to pool', () => {
      const createFn = () => ({});
      const pool = new FastObjectPool(createFn);

      const obj = pool.get();
      expect(pool.size()).toBe(0);

      pool.release(obj);
      expect(pool.size()).toBe(1);
    });

    it('should not exceed maxSize', () => {
      const createFn = () => ({});
      const pool = new FastObjectPool(createFn, undefined, 2);

      const obj1 = pool.get();
      const obj2 = pool.get();
      const obj3 = pool.get();

      pool.release(obj1);
      pool.release(obj2);
      pool.release(obj3); // Should not be added (exceeds maxSize)

      expect(pool.size()).toBe(2);
    });

    it('should call resetFn when releasing object', () => {
      const createFn = () => ({ value: 0 });
      const resetFn = vi.fn((obj: { value: number }) => {
        obj.value = 0;
      });
      const pool = new FastObjectPool(createFn, resetFn);

      const obj = pool.get();
      obj.value = 100;
      pool.release(obj);

      expect(resetFn).toHaveBeenCalledWith(obj);
      expect(obj.value).toBe(0);
    });

    it('should not call resetFn when pool is at maxSize', () => {
      const createFn = () => ({ value: 0 });
      const resetFn = vi.fn();
      const pool = new FastObjectPool(createFn, resetFn, 1);

      const obj1 = pool.get();
      const obj2 = pool.get();

      pool.release(obj1);
      resetFn.mockClear();

      pool.release(obj2); // Should not call resetFn (pool at maxSize)
      expect(resetFn).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const createFn = () => ({});
      const pool = new FastObjectPool(createFn, undefined, 10);

      // Create 3 objects
      const obj1 = pool.get();
      const obj2 = pool.get();
      const obj3 = pool.get();

      // Release 2
      pool.release(obj1);
      pool.release(obj2);

      // Get 1 (hit)
      pool.get();

      const stats = pool.getStats();
      expect(stats.size).toBe(1); // 2 released - 1 got = 1
      expect(stats.maxSize).toBe(10);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(3);
      expect(stats.hitRate).toBe(0.25); // 1 hit / 4 total gets
      expect(stats.totalCreated).toBe(3);
      expect(stats.utilization).toBe(0.1); // 1 / 10
    });

    it('should return 0 hitRate when no gets have been called', () => {
      const createFn = () => ({});
      const pool = new FastObjectPool(createFn);

      const stats = pool.getStats();
      expect(stats.hitRate).toBe(0);
    });

    it('should return 0 utilization when maxSize is 0', () => {
      const createFn = () => ({});
      const pool = new FastObjectPool(createFn, undefined, 0);

      const stats = pool.getStats();
      expect(stats.utilization).toBe(0);
    });
  });

  describe('resetStats', () => {
    it('should reset hits and misses counters', () => {
      const createFn = () => ({});
      const pool = new FastObjectPool(createFn);

      pool.get();
      const obj = pool.get();
      pool.release(obj);
      pool.get();

      let stats = pool.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(2);

      pool.resetStats();

      stats = pool.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('clear', () => {
    it('should remove all objects from pool', () => {
      const createFn = () => ({});
      const pool = new FastObjectPool(createFn);

      const obj1 = pool.get();
      const obj2 = pool.get();
      pool.release(obj1);
      pool.release(obj2);

      expect(pool.size()).toBe(2);

      pool.clear();

      expect(pool.size()).toBe(0);
    });
  });

  describe('size', () => {
    it('should return current pool size', () => {
      const createFn = () => ({});
      const pool = new FastObjectPool(createFn);

      expect(pool.size()).toBe(0);

      const obj1 = pool.get();
      const obj2 = pool.get();
      pool.release(obj1);

      expect(pool.size()).toBe(1);

      pool.release(obj2);
      expect(pool.size()).toBe(2);
    });
  });
});

describe('BuilderPool', () => {
  interface TestData {
    id?: number;
    name?: string;
  }

  const createMockBuilder = (): BuilderInstance<TestData> =>
    ({
      withId: vi.fn().mockReturnThis(),
      withName: vi.fn().mockReturnThis(),
      build: vi.fn(() => ({ id: 1, name: 'test' })),
    }) as any;

  describe('constructor', () => {
    it('should create builder pool with default maxSize', () => {
      const pool = new BuilderPool(createMockBuilder);
      expect(pool.size()).toBe(0);

      const stats = pool.getStats();
      expect(stats.maxSize).toBe(1000);
    });

    it('should create builder pool with custom maxSize', () => {
      const pool = new BuilderPool(createMockBuilder, 50);

      const stats = pool.getStats();
      expect(stats.maxSize).toBe(50);
    });
  });

  describe('get', () => {
    it('should return a builder instance', () => {
      const pool = new BuilderPool(createMockBuilder);
      const builder = pool.get();

      expect(builder).toBeDefined();
      expect(typeof builder.build).toBe('function');
    });

    it('should create new builder when pool is empty', () => {
      let counter = 0;
      const createBuilder = () => {
        counter++;
        return createMockBuilder();
      };

      const pool = new BuilderPool(createBuilder);
      pool.get();

      expect(counter).toBe(1);

      const stats = pool.getStats();
      expect(stats.misses).toBe(1);
    });

    it('should reuse builder from pool when available', () => {
      let counter = 0;
      const createBuilder = () => {
        counter++;
        return createMockBuilder();
      };

      const pool = new BuilderPool(createBuilder);
      const builder1 = pool.get();
      pool.release(builder1);
      const builder2 = pool.get();

      expect(builder1).toBe(builder2);
      expect(counter).toBe(1);

      const stats = pool.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });
  });

  describe('release', () => {
    it('should add builder back to pool', () => {
      const pool = new BuilderPool(createMockBuilder);
      const builder = pool.get();

      expect(pool.size()).toBe(0);
      pool.release(builder);
      expect(pool.size()).toBe(1);
    });

    it('should call reset function when releasing', () => {
      const pool = new BuilderPool(createMockBuilder);
      const builder = pool.get();

      // Add custom properties that are functions (will be deleted)
      (builder as any).customMethod = function () {
        return 'test';
      };
      (builder as any).anotherMethod = function () {
        return 123;
      };

      pool.release(builder);

      // Function properties should be deleted (except build)
      expect((builder as any).customMethod).toBeUndefined();
      expect((builder as any).anotherMethod).toBeUndefined();
      expect(builder.build).toBeDefined(); // build should remain
    });

    it('should not reset build function', () => {
      const pool = new BuilderPool(createMockBuilder);
      const builder = pool.get();
      const originalBuild = builder.build;

      pool.release(builder);

      expect(builder.build).toBe(originalBuild);
    });
  });

  describe('clear', () => {
    it('should remove all builders from pool', () => {
      const pool = new BuilderPool(createMockBuilder);

      const builder1 = pool.get();
      const builder2 = pool.get();
      pool.release(builder1);
      pool.release(builder2);

      expect(pool.size()).toBe(2);

      pool.clear();

      expect(pool.size()).toBe(0);
    });
  });

  describe('size', () => {
    it('should return current pool size', () => {
      const pool = new BuilderPool(createMockBuilder);

      expect(pool.size()).toBe(0);

      const builder = pool.get();
      pool.release(builder);

      expect(pool.size()).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should delegate to internal pool', () => {
      const pool = new BuilderPool(createMockBuilder, 5);

      const builder1 = pool.get();
      const builder2 = pool.get();
      pool.release(builder1);
      pool.get(); // hit

      const stats = pool.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(2);
      expect(stats.size).toBe(0);
      expect(stats.maxSize).toBe(5);
    });
  });

  describe('resetStats', () => {
    it('should reset statistics counters', () => {
      const pool = new BuilderPool(createMockBuilder);

      pool.get();
      pool.get();

      let stats = pool.getStats();
      expect(stats.misses).toBe(2);

      pool.resetStats();

      stats = pool.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });
});
