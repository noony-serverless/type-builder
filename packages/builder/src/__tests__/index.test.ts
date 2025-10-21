import { describe, it, expect, afterEach } from 'vitest';
import { z } from 'zod';
import builder, {
  builder as namedBuilder,
  builderAsync,
  createBuilder,
  createAsyncBuilder,
  clearPools,
  getPoolStats,
  getDetailedPoolStats,
  resetPoolStats,
  FastObjectPool,
  BuilderPool,
  detectBuilderType,
  isZodSchema,
  isClass,
} from '../index';

describe('index - Public API', () => {
  afterEach(() => {
    clearPools();
  });

  describe('exports', () => {
    it('should export builder as default', () => {
      expect(builder).toBeDefined();
      expect(typeof builder).toBe('function');
    });

    it('should export builder as named export', () => {
      expect(namedBuilder).toBeDefined();
      expect(typeof namedBuilder).toBe('function');
      expect(namedBuilder).toBe(builder); // Should be the same function
    });

    it('should export builderAsync', () => {
      expect(builderAsync).toBeDefined();
      expect(typeof builderAsync).toBe('function');
    });

    it('should export factory functions', () => {
      expect(createBuilder).toBeDefined();
      expect(createAsyncBuilder).toBeDefined();
      expect(clearPools).toBeDefined();
      expect(getPoolStats).toBeDefined();
      expect(getDetailedPoolStats).toBeDefined();
      expect(resetPoolStats).toBeDefined();
    });

    it('should export pool classes', () => {
      expect(FastObjectPool).toBeDefined();
      expect(BuilderPool).toBeDefined();
    });

    it('should export detection utilities', () => {
      expect(detectBuilderType).toBeDefined();
      expect(isZodSchema).toBeDefined();
      expect(isClass).toBeDefined();
    });
  });

  describe('builder function', () => {
    it('should create interface builder from array', () => {
      const builderFn = builder<{ id: number; name: string }>(['id', 'name']);

      expect(typeof builderFn).toBe('function');

      const instance = builderFn();
      const result = (instance as any).withId(1).withName('Test').build();

      expect(result).toEqual({ id: 1, name: 'Test' });
    });

    it('should create class builder from class constructor', () => {
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

      const builderFn = builder(User);
      const instance = builderFn();

      const result = (instance as any).withId(1).withName('John').build();

      expect(result).toBeInstanceOf(User);
      expect(result.getName()).toBe('John');
    });

    it('should create Zod builder from schema', () => {
      const schema = z.object({
        id: z.number(),
        email: z.string().email(),
      });

      const builderFn = builder(schema);
      const instance = builderFn();

      const result = (instance as any).withId(1).withEmail('test@example.com').build();

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
      });
    });

    it('should accept explicit keys parameter', () => {
      class Product {
        id: number = 0;
        name: string = '';
        price: number = 0;

        constructor(data: Partial<Product> = {}) {
          Object.assign(this, data);
        }
      }

      const builderFn = builder(Product, ['id', 'name']);
      const instance = builderFn();

      expect(typeof (instance as any).withId).toBe('function');
      expect(typeof (instance as any).withName).toBe('function');
    });

    it('should work without type parameter', () => {
      const builderFn = builder(['id', 'name']);

      expect(typeof builderFn).toBe('function');

      const instance = builderFn();
      const result = (instance as any).withId(1).withName('Test').build();

      expect(result).toBeDefined();
    });
  });

  describe('builderAsync function', () => {
    it('should create async builder from Zod schema', () => {
      const schema = z.object({
        id: z.number(),
        username: z.string(),
      });

      const builderFn = builderAsync(schema);

      expect(typeof builderFn).toBe('function');
    });

    it('should create working async builder', async () => {
      const schema = z.object({
        id: z.number(),
        username: z.string(),
      });

      const builderFn = builderAsync(schema);
      const instance = builderFn();

      (instance as any).withId(1).withUsername('john');

      const result = await (instance as any).buildAsync();

      expect(result).toEqual({
        id: 1,
        username: 'john',
      });
    });

    it('should throw error for non-Zod input', () => {
      expect(() => {
        builderAsync(['id', 'name'] as any);
      }).toThrow('Async builder only supports Zod schemas');
    });

    it('should accept explicit keys parameter', () => {
      const schema = z.object({
        id: z.number(),
        name: z.string(),
      });

      const builderFn = builderAsync(schema, ['id']);

      expect(typeof builderFn).toBe('function');
    });

    it('should work without type parameter', () => {
      const schema = z.object({
        id: z.number(),
      });

      const builderFn = builderAsync(schema);

      expect(typeof builderFn).toBe('function');
    });
  });

  describe('integration tests', () => {
    it('should use builder and builderAsync together', async () => {
      const schema = z.object({
        id: z.number(),
        name: z.string(),
      });

      // Sync builder
      const syncBuilderFn = builder(schema);
      const syncInstance = syncBuilderFn();
      const syncResult = (syncInstance as any).withId(1).withName('Sync').build();

      // Async builder
      const asyncBuilderFn = builderAsync(schema);
      const asyncInstance = asyncBuilderFn();
      (asyncInstance as any).withId(2).withName('Async');
      const asyncResult = await (asyncInstance as any).buildAsync();

      expect(syncResult).toEqual({ id: 1, name: 'Sync' });
      expect(asyncResult).toEqual({ id: 2, name: 'Async' });
    });

    it('should manage pools across different builder types', () => {
      class User {
        id: number = 0;
        constructor(data: any = {}) {
          this.id = data.id;
        }
      }

      const schema = z.object({ id: z.number() });

      builder(['id'])();
      builder(User)();
      builder(schema)();
      builderAsync(schema)();

      const stats = getPoolStats();
      expect(stats.sync).toBeGreaterThanOrEqual(0);
      expect(stats.async).toBeGreaterThanOrEqual(0);
    });

    it('should clear all pools correctly', () => {
      const schema = z.object({ id: z.number() });

      builder(['id'])();
      builderAsync(schema)();

      clearPools();

      const stats = getPoolStats();
      expect(stats.sync).toBe(0);
      expect(stats.async).toBe(0);
    });

    it('should reset pool statistics', () => {
      builder(['id'])();
      builder(['id'])();

      let stats = getDetailedPoolStats();
      expect(stats.sync.totalMisses).toBeGreaterThan(0);

      resetPoolStats();

      stats = getDetailedPoolStats();
      expect(stats.sync.totalHits).toBe(0);
      expect(stats.sync.totalMisses).toBe(0);
    });

    it('should get detailed pool statistics', () => {
      builder(['id'])();

      const stats = getDetailedPoolStats();

      expect(stats).toHaveProperty('sync');
      expect(stats).toHaveProperty('async');
      expect(stats.sync).toHaveProperty('totalPools');
      expect(stats.sync).toHaveProperty('totalObjects');
      expect(stats.sync).toHaveProperty('averageHitRate');
    });
  });

  describe('pool classes', () => {
    it('should create FastObjectPool instance', () => {
      const pool = new FastObjectPool(() => ({ value: 0 }));

      expect(pool).toBeDefined();
      expect(typeof pool.get).toBe('function');
      expect(typeof pool.release).toBe('function');
    });

    it('should create BuilderPool instance', () => {
      const pool = new BuilderPool(
        () =>
          ({
            build: () => ({ id: 1 }),
          }) as any
      );

      expect(pool).toBeDefined();
      expect(typeof pool.get).toBe('function');
      expect(typeof pool.release).toBe('function');
    });
  });

  describe('detection utilities', () => {
    it('should detect builder type for array', () => {
      const type = detectBuilderType(['id', 'name']);

      expect(type).toBe('interface');
    });

    it('should detect builder type for class', () => {
      class User {}
      const type = detectBuilderType(User);

      expect(type).toBe('class');
    });

    it('should detect builder type for Zod schema', () => {
      const schema = z.object({ id: z.number() });
      const type = detectBuilderType(schema);

      expect(type).toBe('zod');
    });

    it('should check if input is Zod schema', () => {
      const schema = z.object({ id: z.number() });

      expect(isZodSchema(schema)).toBe(true);
      expect(isZodSchema(['id'])).toBe(false);
      expect(isZodSchema(class {})).toBe(false);
    });

    it('should check if input is class', () => {
      class User {}

      expect(isClass(User)).toBe(true);
      expect(isClass(['id'])).toBe(false);
      expect(isClass(z.object({}))).toBe(false);
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple builder instances from same factory', () => {
      const builderFn = builder(['id', 'name']);

      const instance1 = builderFn();
      const instance2 = builderFn();

      const result1 = (instance1 as any).withId(1).withName('First').build();
      const result2 = (instance2 as any).withId(2).withName('Second').build();

      expect(result1).toEqual({ id: 1, name: 'First' });
      expect(result2).toEqual({ id: 2, name: 'Second' });
    });

    it('should handle validation errors gracefully', () => {
      const schema = z.object({
        email: z.string().email(),
      });

      const builderFn = builder(schema);
      const instance = builderFn();

      (instance as any).withEmail('invalid-email');

      expect(() => (instance as any).build()).toThrow();
    });

    it('should handle async validation errors', async () => {
      const schema = z.object({
        email: z.string().email(),
      });

      const builderFn = builderAsync(schema);
      const instance = builderFn();

      (instance as any).withEmail('invalid-email');

      await expect((instance as any).buildAsync()).rejects.toThrow();
    });

    it('should maintain type safety through builder chain', () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const builderFn = builder<User>(['id', 'name', 'email']);
      const instance = builderFn();

      const result = (instance as any)
        .withId(1)
        .withName('John')
        .withEmail('john@example.com')
        .build();

      expect(typeof result.id).toBe('number');
      expect(typeof result.name).toBe('string');
      expect(typeof result.email).toBe('string');
    });

    it('should work with complex Zod schemas', () => {
      const schema = z.object({
        id: z.number(),
        tags: z.array(z.string()),
        metadata: z
          .object({
            createdAt: z.date(),
            updatedAt: z.date(),
          })
          .optional(),
      });

      const builderFn = builder(schema);
      const instance = builderFn();

      const now = new Date();
      const result = (instance as any)
        .withId(1)
        .withTags(['tag1', 'tag2'])
        .withMetadata({ createdAt: now, updatedAt: now })
        .build();

      expect(result.id).toBe(1);
      expect(result.tags).toEqual(['tag1', 'tag2']);
      expect(result.metadata?.createdAt).toStrictEqual(now);
    });
  });

  describe('edge cases', () => {
    it('should handle builder with no data set', () => {
      const builderFn = builder(['id', 'name']);
      const instance = builderFn();

      const result = (instance as any).build();

      expect(result).toEqual({});
    });

    it('should handle class with complex inheritance', () => {
      class Animal {
        name: string = '';

        constructor(data: Partial<Animal> = {}) {
          Object.assign(this, data);
        }
      }

      class Dog extends Animal {
        breed: string = '';

        constructor(data: Partial<Dog> = {}) {
          super(data);
          if (data.breed) this.breed = data.breed;
        }
      }

      const builderFn = builder(Dog);
      const instance = builderFn();

      const result = (instance as any).withName('Rex').withBreed('Labrador').build();

      expect(result).toBeInstanceOf(Dog);
      expect(result).toBeInstanceOf(Animal);
    });

    it('should handle empty keys array error', () => {
      expect(() => {
        builder([]);
      }).toThrow('Interface mode requires an array of property keys');
    });

    it('should handle rapid builder creation and pool usage', () => {
      const builderFn = builder(['id']);

      for (let i = 0; i < 100; i++) {
        const instance = builderFn();
        (instance as any).withId(i).build();
      }

      const stats = getDetailedPoolStats();
      expect(stats.sync.totalMisses).toBeGreaterThan(0);
    });
  });
});
