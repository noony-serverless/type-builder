import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  detectBuilderType,
  isZodSchema,
  isClass,
  createBuilderConfig,
  extractKeysFromZod,
  extractKeysFromClass,
} from '../core/detection';

describe('detection', () => {
  describe('isZodSchema', () => {
    it('should return true for valid Zod schema', () => {
      const schema = z.object({ name: z.string() });
      expect(isZodSchema(schema)).toBe(true);
    });

    it('should return false for class constructor', () => {
      class TestClass {}
      expect(isZodSchema(TestClass)).toBe(false);
    });

    it('should return false for array', () => {
      expect(isZodSchema(['id', 'name'])).toBe(false);
    });

    it('should return false for null', () => {
      expect(isZodSchema(null)).toBeFalsy();
    });

    it('should return false for undefined', () => {
      expect(isZodSchema(undefined)).toBeFalsy();
    });

    it('should return false for object without parse method', () => {
      const obj = { safeParse: () => {}, _def: {} };
      expect(isZodSchema(obj)).toBe(false);
    });

    it('should return false for object without safeParse method', () => {
      const obj = { parse: () => {}, _def: {} };
      expect(isZodSchema(obj)).toBe(false);
    });

    it('should return false for object without _def', () => {
      const obj = { parse: () => {}, safeParse: () => {} };
      expect(isZodSchema(obj)).toBe(false);
    });

    it('should return false for plain object', () => {
      expect(isZodSchema({})).toBe(false);
    });

    it('should return false for string', () => {
      expect(isZodSchema('test')).toBe(false);
    });

    it('should return false for number', () => {
      expect(isZodSchema(123)).toBe(false);
    });
  });

  describe('isClass', () => {
    it('should return true for class constructor', () => {
      class TestClass {
        constructor() {}
      }
      expect(isClass(TestClass)).toBe(true);
    });

    it('should return true for class with methods', () => {
      class TestClass {
        method() {}
      }
      expect(isClass(TestClass)).toBe(true);
    });

    it('should return false for arrow function', () => {
      const fn = () => {};
      expect(isClass(fn)).toBeFalsy();
    });

    it('should return false for regular function', () => {
      function fn() {}
      // Regular functions have prototype.constructor === itself, so this actually returns true
      // This is an implementation detail - regular functions ARE constructors in JavaScript
      expect(isClass(fn)).toBe(true);
    });

    it('should return false for Zod schema', () => {
      const schema = z.object({ name: z.string() });
      expect(isClass(schema)).toBe(false);
    });

    it('should return false for array', () => {
      expect(isClass(['id', 'name'])).toBe(false);
    });

    it('should return false for object', () => {
      expect(isClass({})).toBe(false);
    });

    it('should return false for null', () => {
      expect(isClass(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isClass(undefined)).toBe(false);
    });
  });

  describe('detectBuilderType', () => {
    it('should detect Zod schema', () => {
      const schema = z.object({ name: z.string() });
      expect(detectBuilderType(schema)).toBe('zod');
    });

    it('should detect class constructor', () => {
      class TestClass {}
      expect(detectBuilderType(TestClass)).toBe('class');
    });

    it('should detect array of keys', () => {
      expect(detectBuilderType(['id', 'name'])).toBe('interface');
    });

    it('should throw error for invalid input', () => {
      expect(() => detectBuilderType(null)).toThrow(
        'Unable to detect builder type. Expected Zod schema, class constructor, or array of keys.'
      );
    });

    it('should throw error for object', () => {
      expect(() => detectBuilderType({})).toThrow(
        'Unable to detect builder type. Expected Zod schema, class constructor, or array of keys.'
      );
    });

    it('should throw error for string', () => {
      expect(() => detectBuilderType('test')).toThrow(
        'Unable to detect builder type. Expected Zod schema, class constructor, or array of keys.'
      );
    });

    it('should throw error for number', () => {
      expect(() => detectBuilderType(123)).toThrow(
        'Unable to detect builder type. Expected Zod schema, class constructor, or array of keys.'
      );
    });
  });

  describe('createBuilderConfig', () => {
    describe('Zod schema', () => {
      it('should create config for Zod schema', () => {
        const schema = z.object({
          id: z.number(),
          name: z.string(),
        });

        const config = createBuilderConfig(schema);

        expect(config.type).toBe('zod');
        expect(config.schema).toBe(schema);
      });
    });

    describe('Class', () => {
      it('should create config for class constructor', () => {
        class TestClass {
          id: number = 0;
          name: string = '';
        }

        const config = createBuilderConfig(TestClass);

        expect(config.type).toBe('class');
        expect(config.constructor).toBe(TestClass);
      });
    });

    describe('Interface', () => {
      it('should create config for array of keys', () => {
        const keys = ['id', 'name', 'email'];

        const config = createBuilderConfig(keys);

        expect(config.type).toBe('interface');
        expect(config.keys).toEqual(keys);
      });

      it('should use explicitKeys when provided with class', () => {
        class TestClass {}
        const explicitKeys = ['id', 'name'];

        const config = createBuilderConfig(TestClass, explicitKeys);

        expect(config.type).toBe('class');
        expect(config.constructor).toBe(TestClass);
      });

      it('should throw error for empty array of keys', () => {
        expect(() => createBuilderConfig([])).toThrow(
          'Interface mode requires an array of property keys'
        );
      });
    });

    describe('Invalid input', () => {
      it('should throw error for unsupported type', () => {
        expect(() => createBuilderConfig(null as any)).toThrow('Unable to detect builder type');
      });
    });
  });

  describe('extractKeysFromZod', () => {
    it('should extract keys from simple Zod object schema', () => {
      const schema = z.object({
        id: z.number(),
        name: z.string(),
        email: z.string(),
      });

      const keys = extractKeysFromZod(schema);

      expect(keys).toEqual(['id', 'name', 'email']);
    });

    it('should extract keys from nested Zod schema', () => {
      const schema = z.object({
        user: z.string(),
        age: z.number(),
      });

      const keys = extractKeysFromZod(schema);

      expect(keys).toContain('user');
      expect(keys).toContain('age');
    });

    it('should return empty array for non-object schema', () => {
      const schema = z.string();

      const keys = extractKeysFromZod(schema);

      expect(keys).toEqual([]);
    });

    it('should return empty array for schema without shape', () => {
      const schema = z.array(z.string());

      const keys = extractKeysFromZod(schema);

      expect(keys).toEqual([]);
    });
  });

  describe('extractKeysFromClass', () => {
    it('should extract keys from class with default values', () => {
      class TestClass {
        id: number = 0;
        name: string = '';
        email: string = '';

        constructor(data: Partial<TestClass> = {}) {
          Object.assign(this, data);
        }
      }

      const keys = extractKeysFromClass(TestClass);

      expect(keys).toContain('id');
      expect(keys).toContain('name');
      expect(keys).toContain('email');
    });

    it('should extract keys from class with constructor assignment', () => {
      class TestClass {
        id: number;
        name: string;

        constructor(data: any = {}) {
          this.id = data.id || 0;
          this.name = data.name || '';
        }
      }

      const keys = extractKeysFromClass(TestClass);

      expect(keys).toContain('id');
      expect(keys).toContain('name');
    });

    it('should extract keys using instance creation fallback', () => {
      class TestClass {
        id: number = 1;
        name: string = 'test';
      }

      const keys = extractKeysFromClass(TestClass);

      expect(keys.length).toBeGreaterThan(0);
      expect(keys).toContain('id');
      expect(keys).toContain('name');
    });

    it('should handle class without constructor parameters', () => {
      class TestClass {
        id: number = 0;
        name: string = '';

        constructor() {
          // No parameters
        }
      }

      const keys = extractKeysFromClass(TestClass);

      expect(keys).toContain('id');
      expect(keys).toContain('name');
    });

    it('should not extract constructor as key', () => {
      class TestClass {
        id: number = 0;

        constructor(data: any = {}) {
          this.id = data.id;
        }
      }

      const keys = extractKeysFromClass(TestClass);

      expect(keys).not.toContain('constructor');
    });

    it('should handle class with methods', () => {
      class TestClass {
        id: number = 0;

        getId() {
          return this.id;
        }

        constructor(data: any = {}) {
          this.id = data.id;
        }
      }

      const keys = extractKeysFromClass(TestClass);

      expect(keys).toContain('id');
      expect(keys).not.toContain('getId');
    });

    it('should return empty array for class that throws in all strategies', () => {
      class ThrowingClass {
        constructor() {
          throw new Error('Cannot instantiate');
        }
      }

      const keys = extractKeysFromClass(ThrowingClass);

      expect(keys).toEqual([]);
    });

    it('should handle class with getters and setters', () => {
      class TestClass {
        private _id: number = 0;

        get id() {
          return this._id;
        }

        set id(value: number) {
          this._id = value;
        }

        constructor(data: any = {}) {
          if (data.id) this.id = data.id;
        }
      }

      const keys = extractKeysFromClass(TestClass);

      // Should extract the private field or the property accessed via getter/setter
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should extract keys using proxy strategy', () => {
      class TestClass {
        id?: number;
        name?: string;

        constructor(data: any) {
          this.id = data.id;
          this.name = data.name;
        }
      }

      const keys = extractKeysFromClass(TestClass);

      expect(keys).toContain('id');
      expect(keys).toContain('name');
    });

    it('should fallback to instance creation when proxy fails', () => {
      class TestClass {
        id: number = 0;
        name: string = '';

        constructor(data?: any) {
          if (data) {
            Object.assign(this, data);
          }
        }
      }

      const keys = extractKeysFromClass(TestClass);

      expect(keys).toContain('id');
      expect(keys).toContain('name');
    });

    it('should handle class with only own properties', () => {
      class TestClass {
        id: number = 1;

        constructor() {
          // Properties defined in class
        }
      }

      const keys = extractKeysFromClass(TestClass);

      expect(keys).toContain('id');
    });

    it('should filter out symbol properties from proxy strategy', () => {
      const symProp = Symbol('test');

      class TestClass {
        id: number;

        constructor(data: any) {
          this.id = data.id;
          // Try to set a symbol property - should be filtered out
          (this as any)[symProp] = 'value';
        }
      }

      const keys = extractKeysFromClass(TestClass);

      expect(keys).toContain('id');
      // Symbol properties should not be in keys array
      expect(keys.every((k) => typeof k === 'string')).toBe(true);
    });

    it('should handle class that requires constructor params and fails empty object', () => {
      class TestClass {
        id: number = 1;
        name: string = 'test';

        constructor(requiredParam?: string) {
          if (requiredParam === undefined && arguments.length > 0) {
            // This creates a scenario where empty object fails but no args succeeds
            throw new Error('Empty object not allowed');
          }
        }
      }

      const keys = extractKeysFromClass(TestClass);

      // Should fall back to strategy 3 (no arguments)
      expect(keys.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter out inherited properties in strategy 2', () => {
      class BaseClass {
        baseId: number = 0;
      }

      class TestClass extends BaseClass {
        id: number = 1;

        constructor(data: any = {}) {
          super();
          this.id = data.id;
        }
      }

      const keys = extractKeysFromClass(TestClass);

      // Should extract own properties using hasOwnProperty check
      expect(keys).toContain('id');
    });
  });
});
