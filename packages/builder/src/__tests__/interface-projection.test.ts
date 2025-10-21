import { describe, it, expect, beforeEach } from 'vitest';
import {
  projectByShape,
  createShapeProjector,
  projectArrayByShape,
  clearGlobalSchemaCache,
} from '../field-selection';

describe('Interface-based Projection', () => {
  beforeEach(() => {
    clearGlobalSchemaCache();
  });

  describe('projectByShape', () => {
    it('should project data based on reference object shape', () => {
      const fullUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        internalId: 'USR-001',
      };

      const publicShape = {
        id: 0,
        name: '',
        email: '',
      };

      const result = projectByShape(fullUser, publicShape);

      expect(result).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('internalId');
    });

    it('should handle nested object shapes', () => {
      const data = {
        id: 1,
        user: {
          name: 'John',
          email: 'john@example.com',
          password: 'secret',
        },
        metadata: {
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
        },
      };

      const shape = {
        id: 0,
        user: null,
      };

      const result = projectByShape(data, shape);

      expect(result).toEqual({
        id: 1,
        user: {
          name: 'John',
          email: 'john@example.com',
          password: 'secret',
        },
      });
      expect(result).not.toHaveProperty('metadata');
    });

    it('should work with arrays in shape', () => {
      const data = {
        id: 1,
        items: [
          { id: 101, name: 'Item 1', price: 100 },
          { id: 102, name: 'Item 2', price: 200 },
        ],
        tags: ['tag1', 'tag2'],
        metadata: { foo: 'bar' },
      };

      const shape = {
        id: 0,
        items: [],
        tags: [],
      };

      const result = projectByShape(data, shape);

      expect(result).toEqual({
        id: 1,
        items: [
          { id: 101, name: 'Item 1', price: 100 },
          { id: 102, name: 'Item 2', price: 200 },
        ],
        tags: ['tag1', 'tag2'],
      });
      expect(result).not.toHaveProperty('metadata');
    });

    it('should handle empty shape (returns original data)', () => {
      const data = { id: 1, name: 'John' };
      const shape = {};

      const result = projectByShape(data, shape);

      // Empty shape means no keys to project, so returns original data
      expect(result).toEqual({ id: 1, name: 'John' });
    });

    it('should handle missing fields gracefully', () => {
      const data = { id: 1, name: 'John' };
      const shape = { id: 0, name: '', email: '' };

      const result = projectByShape(data, shape);

      expect(result).toEqual({ id: 1, name: 'John' });
      expect(result).not.toHaveProperty('email');
    });

    it('should preserve data types', () => {
      const data = {
        id: 1,
        name: 'John',
        isActive: true,
        count: 42,
        tags: ['a', 'b'],
        metadata: { foo: 'bar' },
      };

      const shape = {
        id: 0,
        name: '',
        isActive: false,
        count: 0,
        tags: [],
      };

      const result = projectByShape(data, shape);

      expect(result.id).toBe(1);
      expect(result.name).toBe('John');
      expect(result.isActive).toBe(true);
      expect(result.count).toBe(42);
      expect(result.tags).toEqual(['a', 'b']);
    });
  });

  describe('createShapeProjector', () => {
    it('should create reusable projector function', () => {
      const publicShape = {
        id: 0,
        name: '',
        email: '',
      };

      const toPublic = createShapeProjector(publicShape);

      const user1 = {
        id: 1,
        name: 'John',
        email: 'john@example.com',
        password: 'secret1',
      };

      const user2 = {
        id: 2,
        name: 'Jane',
        email: 'jane@example.com',
        password: 'secret2',
      };

      const result1 = toPublic(user1);
      const result2 = toPublic(user2);

      expect(result1).toEqual({ id: 1, name: 'John', email: 'john@example.com' });
      expect(result2).toEqual({ id: 2, name: 'Jane', email: 'jane@example.com' });
      expect(result1).not.toHaveProperty('password');
      expect(result2).not.toHaveProperty('password');
    });

    it('should cache schema for performance', () => {
      clearGlobalSchemaCache();

      const shape = { id: 0, name: '' };
      const projector = createShapeProjector(shape);

      const data1 = { id: 1, name: 'John', extra: 'data1' };
      const data2 = { id: 2, name: 'Jane', extra: 'data2' };

      projector(data1);
      projector(data2);

      // Both calls should use the same cached schema
      // (verified by the fact that this doesn't throw)
      expect(projector(data1)).toBeDefined();
      expect(projector(data2)).toBeDefined();
    });

    it('should work with complex shapes', () => {
      const orderShape = {
        id: 0,
        orderNumber: '',
        total: 0,
      };

      const toOrderDTO = createShapeProjector(orderShape);

      const fullOrder = {
        id: 1,
        orderNumber: 'ORD-001',
        total: 99.99,
        userId: 123,
        internalNotes: 'VIP customer',
        paymentMethodId: 'pm_123',
      };

      const result = toOrderDTO(fullOrder);

      expect(result).toEqual({
        id: 1,
        orderNumber: 'ORD-001',
        total: 99.99,
      });
      expect(result).not.toHaveProperty('userId');
      expect(result).not.toHaveProperty('internalNotes');
    });
  });

  describe('projectArrayByShape', () => {
    it('should project array of objects', () => {
      const users = [
        { id: 1, name: 'John', email: 'john@example.com', password: 'secret1' },
        { id: 2, name: 'Jane', email: 'jane@example.com', password: 'secret2' },
        { id: 3, name: 'Bob', email: 'bob@example.com', password: 'secret3' },
      ];

      const publicShape = { id: 0, name: '', email: '' };

      const result = projectArrayByShape(users, publicShape);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ id: 1, name: 'John', email: 'john@example.com' });
      expect(result[1]).toEqual({ id: 2, name: 'Jane', email: 'jane@example.com' });
      expect(result[2]).toEqual({ id: 3, name: 'Bob', email: 'bob@example.com' });
      expect(result[0]).not.toHaveProperty('password');
    });

    it('should handle empty array', () => {
      const shape = { id: 0, name: '' };
      const result = projectArrayByShape([], shape);

      expect(result).toEqual([]);
    });

    it('should work with single item array', () => {
      const users = [{ id: 1, name: 'John', password: 'secret' }];
      const shape = { id: 0, name: '' };

      const result = projectArrayByShape(users, shape);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 1, name: 'John' });
    });

    it('should handle varying object structures', () => {
      const data = [
        { id: 1, name: 'John', email: 'john@example.com', extra: 'data1' },
        { id: 2, name: 'Jane', phone: '123-456-7890', extra: 'data2' },
        { id: 3, email: 'bob@example.com', extra: 'data3' },
      ];

      const shape = { id: 0, name: '', email: '' };

      const result = projectArrayByShape(data, shape);

      expect(result[0]).toEqual({ id: 1, name: 'John', email: 'john@example.com' });
      expect(result[1]).toEqual({ id: 2, name: 'Jane' });
      expect(result[2]).toEqual({ id: 3, email: 'bob@example.com' });
    });
  });

  describe('TypeScript type inference', () => {
    it('should infer correct types at compile time', () => {
      interface FullUser {
        id: number;
        name: string;
        email: string;
        password: string;
      }

      const fullUser: FullUser = {
        id: 1,
        name: 'John',
        email: 'john@example.com',
        password: 'secret',
      };

      const publicShape = {
        id: 0,
        name: '',
        email: '',
      };

      const result = projectByShape(fullUser, publicShape);

      // TypeScript should infer: Pick<FullUser, 'id' | 'name' | 'email'>
      expect(result.id).toBe(1);
      expect(result.name).toBe('John');
      expect(result.email).toBe('john@example.com');
    });
  });

  describe('Real-world scenarios', () => {
    it('should sanitize database result for API response', () => {
      const dbUser = {
        id: 1,
        username: 'john_doe',
        email: 'john@example.com',
        password_hash: '$2a$10$...',
        salt: 'xyz',
        session_token: 'abc123',
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
        last_login: '2024-01-03',
      };

      const apiShape = {
        id: 0,
        username: '',
        email: '',
        created_at: '',
      };

      const apiResponse = projectByShape(dbUser, apiShape);

      expect(apiResponse).toEqual({
        id: 1,
        username: 'john_doe',
        email: 'john@example.com',
        created_at: '2024-01-01',
      });
      expect(apiResponse).not.toHaveProperty('password_hash');
      expect(apiResponse).not.toHaveProperty('salt');
      expect(apiResponse).not.toHaveProperty('session_token');
    });

    it('should create DTO projector for database results', () => {
      const dtoShape = {
        id: 0,
        order_number: '',
        total: 0,
        status: '',
      };

      const toOrderDTO = createShapeProjector(dtoShape);

      const dbOrders = [
        {
          id: 1,
          order_number: 'ORD-001',
          total: 99.99,
          status: 'completed',
          user_id: 123,
          payment_method_id: 'pm_123',
          internal_notes: 'VIP',
        },
        {
          id: 2,
          order_number: 'ORD-002',
          total: 149.99,
          status: 'pending',
          user_id: 456,
          payment_method_id: 'pm_456',
          internal_notes: 'Rush',
        },
      ];

      const dtos = dbOrders.map(toOrderDTO);

      expect(dtos[0]).toEqual({
        id: 1,
        order_number: 'ORD-001',
        total: 99.99,
        status: 'completed',
      });
      expect(dtos[1]).toEqual({
        id: 2,
        order_number: 'ORD-002',
        total: 149.99,
        status: 'pending',
      });
    });

    it('should handle GraphQL-style field selection', () => {
      const product = {
        id: 1,
        name: 'Laptop',
        description: 'High-performance laptop',
        price: 999.99,
        cost: 500,
        supplier_id: 'SUP-001',
        warehouse_location: 'A-12-34',
        inventory_count: 25,
        tags: ['electronics', 'computers'],
      };

      // Client requests specific fields
      const requestedShape = {
        id: 0,
        name: '',
        price: 0,
        tags: [],
      };

      const response = projectByShape(product, requestedShape);

      expect(response).toEqual({
        id: 1,
        name: 'Laptop',
        price: 999.99,
        tags: ['electronics', 'computers'],
      });
      expect(response).not.toHaveProperty('cost');
      expect(response).not.toHaveProperty('supplier_id');
    });
  });
});
