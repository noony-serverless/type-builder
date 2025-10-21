import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { ZodBuilder, AsyncZodBuilder } from '../core/builders/zod-builder';

describe('ZodBuilder', () => {
  const userSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
    age: z.number().min(0).max(120),
  });

  type User = z.infer<typeof userSchema>;

  let builder: ZodBuilder<User>;

  beforeEach(() => {
    builder = new ZodBuilder<User>(['id', 'name', 'email', 'age'], userSchema);
  });

  describe('constructor', () => {
    it('should initialize with keys and schema', () => {
      const builder = new ZodBuilder(['id', 'name'], userSchema);

      expect((builder as any).keys).toEqual(['id', 'name']);
      expect((builder as any).schema).toBe(userSchema);
    });
  });

  describe('build', () => {
    it('should build and validate valid data', () => {
      (builder as any).data = {
        id: 1,
        name: 'John',
        email: 'john@example.com',
        age: 30,
      };

      const result = builder.build();

      expect(result).toEqual({
        id: 1,
        name: 'John',
        email: 'john@example.com',
        age: 30,
      });
    });

    it('should throw error for invalid data', () => {
      (builder as any).data = {
        id: '1', // should be number
        name: 'John',
        email: 'invalid-email', // invalid email
        age: 30,
      };

      expect(() => builder.build()).toThrow();
    });

    it('should throw error for missing required fields', () => {
      (builder as any).data = {
        id: 1,
        // missing name, email, age
      };

      expect(() => builder.build()).toThrow();
    });

    it('should validate email format', () => {
      (builder as any).data = {
        id: 1,
        name: 'John',
        email: 'not-an-email',
        age: 30,
      };

      expect(() => builder.build()).toThrow();
    });

    it('should validate age constraints', () => {
      (builder as any).data = {
        id: 1,
        name: 'John',
        email: 'john@example.com',
        age: 150, // > 120
      };

      expect(() => builder.build()).toThrow();
    });

    it('should validate negative age', () => {
      (builder as any).data = {
        id: 1,
        name: 'John',
        email: 'john@example.com',
        age: -5, // < 0
      };

      expect(() => builder.build()).toThrow();
    });
  });

  describe('integration with proxy', () => {
    it('should work with createProxy method', () => {
      const proxy = builder.createProxy();

      const result = (proxy as any)
        .withId(42)
        .withName('Alice')
        .withEmail('alice@example.com')
        .withAge(25)
        .build();

      expect(result).toEqual({
        id: 42,
        name: 'Alice',
        email: 'alice@example.com',
        age: 25,
      });
    });

    it('should throw error when building invalid data via proxy', () => {
      const proxy = builder.createProxy();

      (proxy as any)
        .withId('invalid') // should be number
        .withName('Test')
        .withEmail('test@example.com')
        .withAge(20);

      expect(() => proxy.build()).toThrow();
    });

    it('should validate on build not on with methods', () => {
      const proxy = builder.createProxy();

      // These should not throw
      expect(() => {
        (proxy as any).withId('invalid').withEmail('not-an-email');
      }).not.toThrow();

      // But build should throw
      expect(() => proxy.build()).toThrow();
    });
  });

  describe('with different schemas', () => {
    it('should work with optional fields', () => {
      const schema = z.object({
        id: z.number(),
        name: z.string(),
        nickname: z.string().optional(),
      });

      const builder = new ZodBuilder(['id', 'name', 'nickname'], schema);
      (builder as any).data = {
        id: 1,
        name: 'John',
        // nickname is optional
      };

      const result = builder.build();

      expect(result.id).toBe(1);
      expect(result.name).toBe('John');
      expect(result.nickname).toBeUndefined();
    });

    it('should work with default values', () => {
      const schema = z.object({
        id: z.number(),
        status: z.string().default('active'),
      });

      const builder = new ZodBuilder(['id', 'status'], schema);
      (builder as any).data = {
        id: 1,
      };

      const result = builder.build();

      expect(result.id).toBe(1);
      expect(result.status).toBe('active');
    });

    it('should work with enums', () => {
      const schema = z.object({
        role: z.enum(['admin', 'user', 'guest']),
      });

      const builder = new ZodBuilder(['role'], schema);
      (builder as any).data = {
        role: 'admin',
      };

      const result = builder.build();

      expect(result.role).toBe('admin');
    });

    it('should throw error for invalid enum value', () => {
      const schema = z.object({
        role: z.enum(['admin', 'user', 'guest']),
      });

      const builder = new ZodBuilder(['role'], schema);
      (builder as any).data = {
        role: 'superuser', // not in enum
      };

      expect(() => builder.build()).toThrow();
    });

    it('should work with nested objects', () => {
      const schema = z.object({
        id: z.number(),
        profile: z.object({
          name: z.string(),
          age: z.number(),
        }),
      });

      const builder = new ZodBuilder(['id', 'profile'], schema);
      (builder as any).data = {
        id: 1,
        profile: {
          name: 'John',
          age: 30,
        },
      };

      const result = builder.build();

      expect(result.profile.name).toBe('John');
      expect(result.profile.age).toBe(30);
    });

    it('should work with arrays', () => {
      const schema = z.object({
        id: z.number(),
        tags: z.array(z.string()),
      });

      const builder = new ZodBuilder(['id', 'tags'], schema);
      (builder as any).data = {
        id: 1,
        tags: ['tag1', 'tag2', 'tag3'],
      };

      const result = builder.build();

      expect(result.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should validate array element types', () => {
      const schema = z.object({
        ids: z.array(z.number()),
      });

      const builder = new ZodBuilder(['ids'], schema);
      (builder as any).data = {
        ids: [1, 'two', 3], // 'two' is invalid
      };

      expect(() => builder.build()).toThrow();
    });

    it('should work with transformed data', () => {
      const schema = z.object({
        name: z.string().transform((val) => val.toUpperCase()),
      });

      const builder = new ZodBuilder(['name'], schema);
      (builder as any).data = {
        name: 'john',
      };

      const result = builder.build();

      expect(result.name).toBe('JOHN');
    });

    it('should work with refined data', () => {
      const schema = z
        .object({
          password: z.string().min(8),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: "Passwords don't match",
        });

      const builder = new ZodBuilder(['password', 'confirmPassword'], schema);
      (builder as any).data = {
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = builder.build();

      expect(result.password).toBe('password123');
    });

    it('should throw error when refinement fails', () => {
      const schema = z
        .object({
          password: z.string(),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword);

      const builder = new ZodBuilder(['password', 'confirmPassword'], schema);
      (builder as any).data = {
        password: 'password123',
        confirmPassword: 'different',
      };

      expect(() => builder.build()).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty data for schema with all optional fields', () => {
      const schema = z.object({
        name: z.string().optional(),
        age: z.number().optional(),
      });

      const builder = new ZodBuilder(['name', 'age'], schema);

      const result = builder.build();

      expect(result).toEqual({});
    });

    it('should strip unknown keys by default', () => {
      const schema = z.object({
        id: z.number(),
      });

      const builder = new ZodBuilder(['id'], schema);
      (builder as any).data = {
        id: 1,
        unknown: 'field',
      };

      const result = builder.build();

      expect(result).toEqual({ id: 1 });
      expect(result).not.toHaveProperty('unknown');
    });
  });
});

describe('AsyncZodBuilder', () => {
  const userSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
    age: z.number().min(0).max(120),
  });

  type User = z.infer<typeof userSchema>;

  let builder: AsyncZodBuilder<User>;

  beforeEach(() => {
    builder = new AsyncZodBuilder<User>(['id', 'name', 'email', 'age'], userSchema);
  });

  describe('constructor', () => {
    it('should initialize with keys and schema', () => {
      const builder = new AsyncZodBuilder(['id', 'name'], userSchema);

      expect((builder as any).keys).toEqual(['id', 'name']);
      expect((builder as any).schema).toBe(userSchema);
    });
  });

  describe('buildAsync', () => {
    it('should build and validate valid data asynchronously', async () => {
      (builder as any).data = {
        id: 1,
        name: 'John',
        email: 'john@example.com',
        age: 30,
      };

      const result = await builder.buildAsync();

      expect(result).toEqual({
        id: 1,
        name: 'John',
        email: 'john@example.com',
        age: 30,
      });
    });

    it('should throw error for invalid data asynchronously', async () => {
      (builder as any).data = {
        id: '1', // should be number
        name: 'John',
        email: 'invalid-email',
        age: 30,
      };

      await expect(builder.buildAsync()).rejects.toThrow();
    });

    it('should validate email format asynchronously', async () => {
      (builder as any).data = {
        id: 1,
        name: 'John',
        email: 'not-an-email',
        age: 30,
      };

      await expect(builder.buildAsync()).rejects.toThrow();
    });

    it('should validate age constraints asynchronously', async () => {
      (builder as any).data = {
        id: 1,
        name: 'John',
        email: 'john@example.com',
        age: 150, // > 120
      };

      await expect(builder.buildAsync()).rejects.toThrow();
    });

    it('should throw error for missing required fields', async () => {
      (builder as any).data = {
        id: 1,
        // missing name, email, age
      };

      await expect(builder.buildAsync()).rejects.toThrow();
    });
  });

  describe('integration with proxy', () => {
    it('should work with createProxy method', async () => {
      const proxy = builder.createProxy();

      (proxy as any).withId(42).withName('Alice').withEmail('alice@example.com').withAge(25);

      const result = await (proxy as any).buildAsync();

      expect(result).toEqual({
        id: 42,
        name: 'Alice',
        email: 'alice@example.com',
        age: 25,
      });
    });

    it('should throw error when building invalid data via proxy', async () => {
      const proxy = builder.createProxy();

      (proxy as any).withId('invalid').withName('Test').withEmail('test@example.com').withAge(20);

      await expect((proxy as any).buildAsync()).rejects.toThrow();
    });
  });

  describe('with async refinements', () => {
    it('should work with async refinements', async () => {
      const schema = z
        .object({
          username: z.string(),
        })
        .refine(
          async (data) => {
            // Simulate async validation (e.g., checking if username exists)
            await new Promise((resolve) => setTimeout(resolve, 10));
            return data.username !== 'taken';
          },
          {
            message: 'Username is taken',
          }
        );

      const builder = new AsyncZodBuilder(['username'], schema);
      (builder as any).data = {
        username: 'available',
      };

      const result = await builder.buildAsync();

      expect(result.username).toBe('available');
    });

    it('should throw error when async refinement fails', async () => {
      const schema = z
        .object({
          username: z.string(),
        })
        .refine(async (data) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return data.username !== 'taken';
        });

      const builder = new AsyncZodBuilder(['username'], schema);
      (builder as any).data = {
        username: 'taken',
      };

      await expect(builder.buildAsync()).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty data for schema with all optional fields', async () => {
      const schema = z.object({
        name: z.string().optional(),
        age: z.number().optional(),
      });

      const builder = new AsyncZodBuilder(['name', 'age'], schema);

      const result = await builder.buildAsync();

      expect(result).toEqual({});
    });

    it('should handle complex async scenarios', async () => {
      const schema = z.object({
        id: z.number(),
        data: z.string().transform(async (val) => {
          // Simulate async transformation
          await new Promise((resolve) => setTimeout(resolve, 10));
          return val.toUpperCase();
        }),
      });

      const builder = new AsyncZodBuilder(['id', 'data'], schema);
      (builder as any).data = {
        id: 1,
        data: 'test',
      };

      const result = await builder.buildAsync();

      expect(result.id).toBe(1);
      expect(result.data).toBe('TEST');
    });
  });
});
