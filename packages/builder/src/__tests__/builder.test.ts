import { describe, it, expect } from 'vitest';
import { builder, builderAsync } from '../index';
import { z } from 'zod';

describe('Builder', () => {
  describe('Zod Schema', () => {
    const UserSchema = z.object({
      id: z.number(),
      name: z.string(),
      email: z.string().email()
    });

    it('should create a builder from Zod schema', () => {
      const createUser = builder(UserSchema);
      expect(typeof createUser).toBe('function');
    });

    it('should build a valid user object', () => {
      const createUser = builder(UserSchema);
      const user = createUser()
        .withId(1)
        .withName('John Doe')
        .withEmail('john@example.com')
        .build();

      expect(user).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com'
      });
    });

    it('should validate input with Zod', () => {
      const createUser = builder(UserSchema);
      
      expect(() => {
        createUser()
          .withId(1)
          .withName('John Doe')
          .withEmail('invalid-email')
          .build();
      }).toThrow();
    });
  });

  describe('Class', () => {
    class Product {
      id!: number;
      name!: string;
      price!: number;
      
      constructor(data: Partial<Product>) {
        Object.assign(this, data);
      }
      
      getTax(): number {
        return this.price * 0.1;
      }
    }

    it('should create a builder from class', () => {
      const createProduct = builder(Product);
      expect(typeof createProduct).toBe('function');
    });

    it('should build a product instance with methods', () => {
      const createProduct = builder(Product);
      const product = createProduct()
        .withId(1)
        .withName('Laptop')
        .withPrice(999)
        .build();

      expect(product).toBeInstanceOf(Product);
      expect(product.id).toBe(1);
      expect(product.name).toBe('Laptop');
      expect(product.price).toBe(999);
      expect(product.getTax()).toBe(99.9);
    });
  });

  describe('Interface', () => {
    interface Order {
      id: string;
      total: number;
    }

    it('should create a builder from interface with explicit keys', () => {
      const createOrder = builder<Order>(['id', 'total']);
      expect(typeof createOrder).toBe('function');
    });

    it('should build an order object', () => {
      const createOrder = builder<Order>(['id', 'total']);
      const order = createOrder()
        .withId('ORD-001')
        .withTotal(299.99)
        .build();

      expect(order).toEqual({
        id: 'ORD-001',
        total: 299.99
      });
    });
  });

  describe('Async Builder', () => {
    const UserSchema = z.object({
      id: z.number(),
      name: z.string(),
      email: z.string().email()
    });

    it('should create an async builder', () => {
      const createUserAsync = builderAsync(UserSchema);
      expect(typeof createUserAsync).toBe('function');
    });

    it('should build a user asynchronously', async () => {
      const createUserAsync = builderAsync(UserSchema);
      const user = await createUserAsync()
        .withId(1)
        .withName('John Doe')
        .withEmail('john@example.com')
        .buildAsync();

      expect(user).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com'
      });
    });
  });
});
