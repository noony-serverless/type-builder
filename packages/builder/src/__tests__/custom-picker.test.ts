/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import {
  customPicker,
  pickFields,
  pickFieldsArray,
  createPicker,
  omitFields,
  clearGlobalSchemaCache,
  getGlobalSchemaCacheStats,
} from '../projection';

describe('customPicker', () => {
  beforeEach(() => {
    clearGlobalSchemaCache();
  });

  describe('path-based projection', () => {
    it('should project simple fields', () => {
      const user = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
      };

      const result = customPicker(user, ['id', 'name', 'email']);

      expect(result).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should project nested fields', () => {
      const data = {
        id: 1,
        user: {
          name: 'John',
          email: 'john@example.com',
          address: {
            city: 'New York',
            country: 'USA',
          },
        },
        metadata: {
          createdAt: '2024-01-01',
        },
      };

      const result = customPicker(data, ['id', 'user.name', 'user.address.city']);

      expect(result).toEqual({
        id: 1,
        user: {
          name: 'John',
          address: {
            city: 'New York',
          },
        },
      });
      expect(result).not.toHaveProperty('metadata');
    });

    it('should project array fields', () => {
      const data = {
        id: 1,
        items: [
          { id: 101, name: 'Item 1', price: 100 },
          { id: 102, name: 'Item 2', price: 200 },
        ],
      };

      const result = customPicker(data, ['id', 'items[].id', 'items[].name']);

      expect(result).toEqual({
        id: 1,
        items: [
          { id: 101, name: 'Item 1' },
          { id: 102, name: 'Item 2' },
        ],
      });
    });

    it('should handle deeply nested arrays', () => {
      const data = {
        orders: [
          {
            id: 1,
            items: [
              { product: { name: 'Laptop', sku: 'LAP-001' } },
              { product: { name: 'Mouse', sku: 'MOU-001' } },
            ],
          },
        ],
      };

      const result = customPicker(data, ['orders[].id', 'orders[].items[].product.name']);

      expect(result).toEqual({
        orders: [
          {
            id: 1,
            items: [{ product: { name: 'Laptop' } }, { product: { name: 'Mouse' } }],
          },
        ],
      });
    });

    it('should handle empty projection', () => {
      const data = { id: 1, name: 'Test' };
      const result = customPicker(data, []);

      expect(result).toEqual(data);
    });

    it('should handle undefined selector', () => {
      const data = { id: 1, name: 'Test' };
      const result = customPicker(data, undefined);

      expect(result).toEqual(data);
    });

    it('should project arrays of objects', () => {
      const users = [
        { id: 1, name: 'John', password: 'secret1' },
        { id: 2, name: 'Jane', password: 'secret2' },
      ];

      const result = customPicker(users, ['id', 'name']);

      expect(result).toEqual([
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ]);
    });
  });

  describe('schema-based projection', () => {
    it('should use provided Zod schema', () => {
      const UserSchema = z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().email(),
      });

      const user = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret',
      };

      const result = customPicker(user, UserSchema);

      expect(result).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('should validate with Zod schema', () => {
      const UserSchema = z.object({
        id: z.number(),
        email: z.string().email(),
      });

      const invalidUser = {
        id: 1,
        email: 'not-an-email',
      };

      expect(() => customPicker(invalidUser, UserSchema)).toThrow();
    });

    it('should work with nested schemas', () => {
      const OrderSchema = z.object({
        id: z.number(),
        user: z.object({
          name: z.string(),
        }),
      });

      const order = {
        id: 1,
        user: { name: 'John', email: 'john@example.com' },
        total: 999,
      };

      const result = customPicker(order, OrderSchema);

      expect(result).toEqual({
        id: 1,
        user: { name: 'John' },
      });
    });
  });

  describe('options', () => {
    it('should respect stripUnknown: false', () => {
      const data = { id: 1, name: 'John', extra: 'field' };

      const result = customPicker(data, ['id', 'name'], { stripUnknown: false });

      expect(result).toHaveProperty('extra');
    });

    it('should respect validate: false', () => {
      const UserSchema = z.object({
        id: z.number(),
        email: z.string().email(),
      });

      const invalidUser = {
        id: 1,
        email: 'not-an-email',
      };

      // Should not throw when validate is false
      const result = customPicker(invalidUser, UserSchema, { validate: false });
      expect(result).toBeDefined();
    });

    it('should respect cache: false', () => {
      const data = { id: 1, name: 'John' };

      customPicker(data, ['id', 'name'], { cache: false });

      const stats = getGlobalSchemaCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should cache by default', () => {
      const data = { id: 1, name: 'John' };

      customPicker(data, ['id', 'name']);

      const stats = getGlobalSchemaCacheStats();
      expect(stats.size).toBe(1);
    });
  });

  describe('pickFields helper', () => {
    it('should work like customPicker for single object', () => {
      interface User {
        id: number;
        name: string;
        password: string;
      }

      const user: User = { id: 1, name: 'John', password: 'secret' };
      const result = pickFields(user, ['id', 'name']);

      expect(result).toEqual({ id: 1, name: 'John' });
    });
  });

  describe('pickFieldsArray helper', () => {
    it('should work like customPicker for arrays', () => {
      const users = [
        { id: 1, name: 'John', password: 'secret1' },
        { id: 2, name: 'Jane', password: 'secret2' },
      ];

      const result = pickFieldsArray(users, ['id', 'name']);

      expect(result).toEqual([
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ]);
    });
  });

  describe('createPicker', () => {
    it('should create reusable picker function', () => {
      const safePicker = createPicker(['id', 'name']);

      const user1 = { id: 1, name: 'John', password: 'secret1' };
      const user2 = { id: 2, name: 'Jane', password: 'secret2' };

      const result1 = safePicker(user1);
      const result2 = safePicker(user2);

      expect(result1).toEqual({ id: 1, name: 'John' });
      expect(result2).toEqual({ id: 2, name: 'Jane' });
    });

    it('should work with arrays', () => {
      const safePicker = createPicker(['id', 'name']);

      const users = [
        { id: 1, name: 'John', password: 'secret1' },
        { id: 2, name: 'Jane', password: 'secret2' },
      ];

      const result = safePicker(users);

      expect(result).toEqual([
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ]);
    });

    it('should pre-cache schema during creation', () => {
      clearGlobalSchemaCache();

      const picker = createPicker(['id', 'name']);

      // Schema should be cached during createPicker call
      const statsAfterCreate = getGlobalSchemaCacheStats();
      expect(statsAfterCreate.size).toBe(1);

      picker({ id: 1, name: 'John', extra: 'data' });
      picker({ id: 2, name: 'Jane', extra: 'data' });

      // Size should remain 1, no new cache entries
      const statsAfterUse = getGlobalSchemaCacheStats();
      expect(statsAfterUse.size).toBe(1);
    });
  });

  describe('omitFields helper', () => {
    it('should exclude specified fields', () => {
      const user = {
        id: 1,
        name: 'John',
        email: 'john@example.com',
        password: 'secret',
      };

      const result = omitFields(user, ['password']);

      expect(result).toEqual({
        id: 1,
        name: 'John',
        email: 'john@example.com',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should exclude multiple fields', () => {
      const user = {
        id: 1,
        name: 'John',
        email: 'john@example.com',
        password: 'secret',
        token: 'abc123',
      };

      const result = omitFields(user, ['password', 'token']);

      expect(result).toEqual({
        id: 1,
        name: 'John',
        email: 'john@example.com',
      });
    });
  });

  describe('schema caching', () => {
    it('should cache schemas for repeated projections', () => {
      clearGlobalSchemaCache();

      const data = { id: 1, name: 'John', email: 'john@example.com' };

      customPicker(data, ['id', 'name']);
      const statsBefore = getGlobalSchemaCacheStats();
      expect(statsBefore.misses).toBe(1); // First call is a cache miss

      customPicker(data, ['id', 'name']); // Same projection - should use cache
      const statsAfter = getGlobalSchemaCacheStats();

      expect(statsAfter.hits).toBe(1); // Second call is a hit
      expect(statsAfter.misses).toBe(1); // Misses haven't increased
      expect(statsAfter.size).toBe(1); // Only one schema cached
    });

    it('should cache regardless of path order', () => {
      clearGlobalSchemaCache();

      const data = { id: 1, name: 'John', email: 'john@example.com' };

      customPicker(data, ['name', 'id']);
      customPicker(data, ['id', 'name']); // Different order - same projection

      const stats = getGlobalSchemaCacheStats();
      expect(stats.size).toBe(1); // Should reuse same schema (paths are sorted for cache key)
      expect(stats.hits).toBeGreaterThanOrEqual(1); // At least one hit
    });

    it('should create separate cache entries for different projections', () => {
      clearGlobalSchemaCache();

      const data = { id: 1, name: 'John', email: 'john@example.com' };

      customPicker(data, ['id', 'name']);
      customPicker(data, ['id', 'email']);

      const stats = getGlobalSchemaCacheStats();
      expect(stats.size).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle missing fields gracefully', () => {
      const data = { id: 1 };

      const result = customPicker(data, ['id', 'name', 'email']);

      expect(result).toEqual({ id: 1 });
    });

    it('should handle null values', () => {
      const data = { id: 1, name: null };

      const result = customPicker(data, ['id', 'name']);

      expect(result).toEqual({ id: 1, name: null });
    });

    it('should handle undefined values', () => {
      const data = { id: 1, name: undefined };

      const result = customPicker(data, ['id', 'name']);

      expect(result).toEqual({ id: 1 });
    });

    it('should handle empty objects', () => {
      const data = {};

      const result = customPicker(data, ['id', 'name']);

      expect(result).toEqual({});
    });

    it('should handle empty arrays', () => {
      const data: any[] = [];

      const result = customPicker(data, ['id', 'name']);

      expect(result).toEqual([]);
    });

    it('should handle bare array projection', () => {
      const data = {
        items: [1, 2, 3, 4, 5],
      };

      const result = customPicker(data, ['items[]']);

      expect(result).toEqual({
        items: [1, 2, 3, 4, 5],
      });
    });
  });

  describe('real-world scenarios', () => {
    it('should sanitize API response', () => {
      const apiResponse = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret',
        token: 'abc123',
        internalId: 'XYZ-999',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      };

      const publicUser = customPicker(apiResponse, ['id', 'name', 'email', 'createdAt']);

      expect(publicUser).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: '2024-01-01',
      });
      expect(publicUser).not.toHaveProperty('password');
      expect(publicUser).not.toHaveProperty('token');
    });

    it('should transform database result to DTO', () => {
      const dbResult = {
        id: 1,
        order_number: 'ORD-001',
        user_id: 123,
        user: {
          id: 123,
          name: 'John Doe',
          email: 'john@example.com',
          password_hash: 'hash',
        },
        items: [
          {
            id: 1,
            product_id: 456,
            quantity: 2,
            price: 99.99,
            product: {
              id: 456,
              name: 'Laptop',
              sku: 'LAP-001',
              cost: 50,
              margin: 49.99,
            },
          },
        ],
        total: 199.98,
        tax: 19.99,
        shipping: 10.0,
        internal_notes: 'VIP customer',
      };

      const orderDTO = customPicker(dbResult, [
        'id',
        'order_number',
        'user.name',
        'user.email',
        'items[].quantity',
        'items[].price',
        'items[].product.name',
        'total',
        'tax',
        'shipping',
      ]);

      expect(orderDTO).toEqual({
        id: 1,
        order_number: 'ORD-001',
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        items: [
          {
            quantity: 2,
            price: 99.99,
            product: {
              name: 'Laptop',
            },
          },
        ],
        total: 199.98,
        tax: 19.99,
        shipping: 10.0,
      });
      expect(orderDTO).not.toHaveProperty('internal_notes');
    });
  });
});
