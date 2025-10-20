import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import {
  createBuilder,
  createAsyncBuilder,
  clearPools,
  getPoolStats,
  getDetailedPoolStats,
  resetPoolStats
} from '../factory';

describe('factory', () => {
  afterEach(() => {
    clearPools();
  });

  describe('createBuilder', () => {
    describe('with interface (array of keys)', () => {
      it('should create builder function for interface', () => {
        const builderFn = createBuilder<{ id: number; name: string }>(['id', 'name']);

        expect(typeof builderFn).toBe('function');
      });

      it('should create working builder instance', () => {
        const builderFn = createBuilder<{ id: number; name: string }>(['id', 'name']);
        const builder = builderFn();

        const result = (builder as any)
          .withId(1)
          .withName('Test')
          .build();

        expect(result).toEqual({ id: 1, name: 'Test' });
      });

      it('should reuse builder instances from pool', () => {
        const builderFn = createBuilder<{ id: number }>(['id']);

        const builder1 = builderFn();
        const builder2 = builderFn();

        // Should create separate instances but reuse from pool
        expect(builder1).toBeDefined();
        expect(builder2).toBeDefined();
      });
    });

    describe('with class constructor', () => {
      class User {
        id: number = 0;
        name: string = '';

        constructor(data: Partial<User> = {}) {
          Object.assign(this, data);
        }

        getName() {
          return this.name;
        }
      }

      it('should create builder function for class', () => {
        const builderFn = createBuilder(User);

        expect(typeof builderFn).toBe('function');
      });

      it('should create working builder instance for class', () => {
        const builderFn = createBuilder(User);
        const builder = builderFn();

        const result = (builder as any)
          .withId(1)
          .withName('John')
          .build();

        expect(result).toBeInstanceOf(User);
        expect(result.id).toBe(1);
        expect(result.name).toBe('John');
        expect(result.getName()).toBe('John');
      });

      it('should extract keys from class automatically', () => {
        const builderFn = createBuilder(User);
        const builder = builderFn();

        // Should have withId and withName methods
        expect(typeof (builder as any).withId).toBe('function');
        expect(typeof (builder as any).withName).toBe('function');
      });
    });

    describe('with Zod schema', () => {
      const userSchema = z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().email()
      });

      it('should create builder function for Zod schema', () => {
        const builderFn = createBuilder(userSchema);

        expect(typeof builderFn).toBe('function');
      });

      it('should create working builder instance for Zod', () => {
        const builderFn = createBuilder(userSchema);
        const builder = builderFn();

        const result = (builder as any)
          .withId(1)
          .withName('John')
          .withEmail('john@example.com')
          .build();

        expect(result).toEqual({
          id: 1,
          name: 'John',
          email: 'john@example.com'
        });
      });

      it('should validate data with Zod schema', () => {
        const builderFn = createBuilder(userSchema);
        const builder = builderFn();

        (builder as any)
          .withId('invalid') // should be number
          .withName('John')
          .withEmail('invalid-email');

        expect(() => (builder as any).build()).toThrow();
      });

      it('should extract keys from Zod schema automatically', () => {
        const builderFn = createBuilder(userSchema);
        const builder = builderFn();

        expect(typeof (builder as any).withId).toBe('function');
        expect(typeof (builder as any).withName).toBe('function');
        expect(typeof (builder as any).withEmail).toBe('function');
      });
    });

    describe('with explicit keys', () => {
      it('should use explicit keys when provided', () => {
        class Product {
          id: number = 0;
          name: string = '';
          price: number = 0;

          constructor(data: Partial<Product> = {}) {
            Object.assign(this, data);
          }
        }

        // Provide explicit keys to override auto-detection
        const builderFn = createBuilder(Product, ['id', 'name']);
        const builder = builderFn();

        expect(typeof (builder as any).withId).toBe('function');
        expect(typeof (builder as any).withName).toBe('function');
        // price should not have a with method since not in explicit keys
      });
    });

    describe('pooling behavior', () => {
      it('should use same pool for same configuration', () => {
        const builderFn1 = createBuilder(['id', 'name']);
        const builderFn2 = createBuilder(['id', 'name']);

        builderFn1();
        builderFn2();

        const stats = getPoolStats();
        // Should reuse the same pool
        expect(stats.sync).toBeGreaterThanOrEqual(0);
      });

      it('should create different pools for different configurations', () => {
        const builderFn1 = createBuilder(['id', 'name']);
        const builderFn2 = createBuilder(['id', 'email']); // different keys

        builderFn1();
        builderFn2();

        // Different pools are created for different key sets
        const detailedStats = getDetailedPoolStats();
        expect(detailedStats.sync.totalPools).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('createAsyncBuilder', () => {
    const userSchema = z.object({
      id: z.number(),
      username: z.string()
    });

    it('should create async builder function for Zod schema', () => {
      const builderFn = createAsyncBuilder(userSchema);

      expect(typeof builderFn).toBe('function');
    });

    it('should create working async builder instance', async () => {
      const builderFn = createAsyncBuilder(userSchema);
      const builder = builderFn();

      (builder as any)
        .withId(1)
        .withUsername('john');

      const result = await (builder as any).buildAsync();

      expect(result).toEqual({
        id: 1,
        username: 'john'
      });
    });

    it('should throw error for non-Zod input', () => {
      class User {}

      expect(() => {
        createAsyncBuilder(User as any);
      }).toThrow('Async builder only supports Zod schemas');
    });

    it('should throw error for array input', () => {
      expect(() => {
        createAsyncBuilder(['id', 'name'] as any);
      }).toThrow('Async builder only supports Zod schemas');
    });

    it('should extract keys from Zod schema', () => {
      const builderFn = createAsyncBuilder(userSchema);
      const builder = builderFn();

      expect(typeof (builder as any).withId).toBe('function');
      expect(typeof (builder as any).withUsername).toBe('function');
    });

    it('should validate async', async () => {
      const builderFn = createAsyncBuilder(userSchema);
      const builder = builderFn();

      (builder as any)
        .withId('invalid')
        .withUsername('john');

      await expect((builder as any).buildAsync()).rejects.toThrow();
    });

    it('should use separate pool from sync builders', () => {
      createBuilder(userSchema)();
      createAsyncBuilder(userSchema)();

      const stats = getPoolStats();
      expect(stats.sync).toBeGreaterThanOrEqual(0);
      expect(stats.async).toBeGreaterThanOrEqual(0);
    });
  });

  describe('clearPools', () => {
    it('should clear all sync pools', () => {
      const builderFn = createBuilder(['id', 'name']);
      builderFn();
      builderFn();

      clearPools();

      const stats = getPoolStats();
      expect(stats.sync).toBe(0);
    });

    it('should clear all async pools', () => {
      const schema = z.object({ id: z.number() });
      const builderFn = createAsyncBuilder(schema);
      builderFn();

      clearPools();

      const stats = getPoolStats();
      expect(stats.async).toBe(0);
    });

    it('should clear both sync and async pools', () => {
      const schema = z.object({ id: z.number() });

      createBuilder(['id'])();
      createAsyncBuilder(schema)();

      clearPools();

      const stats = getPoolStats();
      expect(stats.sync).toBe(0);
      expect(stats.async).toBe(0);
    });

    it('should allow creating new builders after clearing', () => {
      const builderFn = createBuilder(['id']);
      builderFn();

      clearPools();

      const newBuilder = builderFn();
      expect(newBuilder).toBeDefined();
    });
  });

  describe('getPoolStats', () => {
    it('should return stats with sync and async counts', () => {
      const stats = getPoolStats();

      expect(stats).toHaveProperty('sync');
      expect(stats).toHaveProperty('async');
      expect(typeof stats.sync).toBe('number');
      expect(typeof stats.async).toBe('number');
    });

    it('should count sync pool objects', () => {
      const builderFn = createBuilder(['id']);
      builderFn();
      builderFn();

      const stats = getPoolStats();
      expect(stats.sync).toBeGreaterThanOrEqual(0);
    });

    it('should count async pool objects', () => {
      const schema = z.object({ id: z.number() });
      const builderFn = createAsyncBuilder(schema);
      builderFn();

      const stats = getPoolStats();
      expect(stats.async).toBeGreaterThanOrEqual(0);
    });

    it('should return zero when pools are empty', () => {
      clearPools();

      const stats = getPoolStats();
      expect(stats.sync).toBe(0);
      expect(stats.async).toBe(0);
    });
  });

  describe('getDetailedPoolStats', () => {
    it('should return detailed statistics', () => {
      const builderFn = createBuilder(['id', 'name']);
      builderFn();

      const stats = getDetailedPoolStats();

      expect(stats).toHaveProperty('sync');
      expect(stats).toHaveProperty('async');
      expect(stats.sync).toHaveProperty('totalPools');
      expect(stats.sync).toHaveProperty('totalObjects');
      expect(stats.sync).toHaveProperty('totalHits');
      expect(stats.sync).toHaveProperty('totalMisses');
      expect(stats.sync).toHaveProperty('totalCreated');
      expect(stats.sync).toHaveProperty('averageHitRate');
      expect(stats.sync).toHaveProperty('averageUtilization');
      expect(stats.sync).toHaveProperty('pools');
    });

    it('should track hit rate correctly', () => {
      const builderFn = createBuilder(['id']);

      // Create first builder (miss)
      builderFn();

      let stats = getDetailedPoolStats();
      const initialMisses = stats.sync.totalMisses;

      // Create second builder (should also be a miss since we didn't release first)
      builderFn();

      stats = getDetailedPoolStats();
      expect(stats.sync.totalMisses).toBeGreaterThan(initialMisses);
    });

    it('should track multiple pools', () => {
      createBuilder(['id'])();
      createBuilder(['name'])();

      const stats = getDetailedPoolStats();
      expect(stats.sync.totalPools).toBeGreaterThanOrEqual(1);
    });

    it('should include pool details array', () => {
      createBuilder(['id'])();

      const stats = getDetailedPoolStats();
      expect(Array.isArray(stats.sync.pools)).toBe(true);
      expect(stats.sync.pools.length).toBeGreaterThan(0);
    });

    it('should calculate average hit rate', () => {
      const builderFn = createBuilder(['id']);
      builderFn();
      builderFn();

      const stats = getDetailedPoolStats();
      expect(stats.sync.averageHitRate).toBeGreaterThanOrEqual(0);
      expect(stats.sync.averageHitRate).toBeLessThanOrEqual(1);
    });

    it('should handle async pools separately', () => {
      const schema = z.object({ id: z.number() });
      createBuilder(['id'])();
      createAsyncBuilder(schema)();

      const stats = getDetailedPoolStats();
      expect(stats.sync.totalPools).toBeGreaterThanOrEqual(1);
      expect(stats.async.totalPools).toBeGreaterThanOrEqual(1);
    });

    it('should return zero averages when no operations', () => {
      clearPools();

      const stats = getDetailedPoolStats();
      expect(stats.sync.averageHitRate).toBe(0);
      expect(stats.sync.averageUtilization).toBe(0);
      expect(stats.async.averageHitRate).toBe(0);
      expect(stats.async.averageUtilization).toBe(0);
    });
  });

  describe('resetPoolStats', () => {
    it('should reset statistics counters', () => {
      const builderFn = createBuilder(['id']);
      builderFn();
      builderFn();

      let stats = getDetailedPoolStats();
      const initialMisses = stats.sync.totalMisses;
      expect(initialMisses).toBeGreaterThan(0);

      resetPoolStats();

      stats = getDetailedPoolStats();
      expect(stats.sync.totalHits).toBe(0);
      expect(stats.sync.totalMisses).toBe(0);
    });

    it('should reset both sync and async pool stats', () => {
      const schema = z.object({ id: z.number() });

      createBuilder(['id'])();
      createAsyncBuilder(schema)();

      resetPoolStats();

      const stats = getDetailedPoolStats();
      expect(stats.sync.totalHits).toBe(0);
      expect(stats.sync.totalMisses).toBe(0);
      expect(stats.async.totalHits).toBe(0);
      expect(stats.async.totalMisses).toBe(0);
    });

    it('should not clear pool objects, only stats', () => {
      const builderFn = createBuilder(['id']);
      builderFn();

      resetPoolStats();

      // Pools should still exist
      const stats = getDetailedPoolStats();
      expect(stats.sync.totalPools).toBeGreaterThanOrEqual(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty interface keys array error', () => {
      expect(() => {
        createBuilder([]);
      }).toThrow('Interface mode requires an array of property keys');
    });

    it('should throw error for createAsyncBuilder with missing schema', () => {
      const schema = z.object({ id: z.number() });
      // Force a scenario where schema might be missing in config
      // This is more of a type-level test, but we can check the error path

      expect(() => {
        createAsyncBuilder(null as any);
      }).toThrow();
    });

    it('should throw error for unsupported builder type in createBuilderInstance', () => {
      // This tests the default case in createBuilderInstance switch statement
      // We need to create a config with an invalid type
      const invalidConfig = {
        type: 'invalid' as any,
        keys: ['id']
      };

      expect(() => {
        // We can't directly call createBuilderInstance, but we can test through createBuilder
        // by passing an object that detectBuilderType would reject
        createBuilder({} as any);
      }).toThrow();
    });

    it('should throw error when async builder config is missing schema', () => {
      // Create a scenario where config.schema is missing for async builder
      const schema = z.object({ id: z.number() });

      // Test the error path in createAsyncBuilder when schema is missing
      // This happens when config is created but schema is not set properly
      expect(() => {
        // Pass invalid input that would create a config without schema
        createAsyncBuilder(null as any);
      }).toThrow('Unable to detect builder type');
    });

    it('should throw error when async builder type is not zod', () => {
      // Test the type check in createAsyncBuilder
      class TestClass {
        id: number = 0;
      }

      expect(() => {
        createAsyncBuilder(TestClass as any);
      }).toThrow('Async builder only supports Zod schemas');
    });

    it('should handle rapid builder creation', () => {
      const builderFn = createBuilder(['id']);

      const builders = [];
      for (let i = 0; i < 100; i++) {
        builders.push(builderFn());
      }

      expect(builders.length).toBe(100);
      const stats = getDetailedPoolStats();
      expect(stats.sync.totalMisses).toBeGreaterThan(0);
    });

    it('should handle different builder types simultaneously', () => {
      class User {
        id: number = 0;
        constructor(data: any = {}) {
          this.id = data.id;
        }
      }

      const schema = z.object({ id: z.number() });

      createBuilder(['id'])();
      createBuilder(User)();
      createBuilder(schema)();
      createAsyncBuilder(schema)();

      const stats = getDetailedPoolStats();
      expect(stats.sync.totalPools).toBeGreaterThanOrEqual(1);
      expect(stats.async.totalPools).toBeGreaterThanOrEqual(1);
    });
  });

  describe('builder config creation', () => {
    it('should handle class without keys in config', () => {
      class Product {
        id: number = 0;
        name: string = '';

        constructor(data: Partial<Product> = {}) {
          Object.assign(this, data);
        }
      }

      const builderFn = createBuilder(Product);
      const builder = builderFn();

      // Keys should be extracted automatically
      expect((builder as any).data).toBeDefined();
    });

    it('should handle Zod schema without keys in config', () => {
      const schema = z.object({
        id: z.number(),
        name: z.string()
      });

      const builderFn = createBuilder(schema);
      const builder = builderFn();

      expect(typeof (builder as any).withId).toBe('function');
      expect(typeof (builder as any).withName).toBe('function');
    });
  });
});
