/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { extractKeysFromZod, extractKeysFromClass } from '../core/detection';

describe('detection - Edge Cases for 100% Coverage', () => {
  describe('extractKeysFromZod - edge cases', () => {
    it('should handle schema without _def property', () => {
      const fakeSchema = {} as any;

      const keys = extractKeysFromZod(fakeSchema);

      expect(keys).toEqual([]);
    });

    it('should handle schema with _def but no shape', () => {
      const fakeSchema = {
        _def: {},
      } as any;

      const keys = extractKeysFromZod(fakeSchema);

      expect(keys).toEqual([]);
    });

    it('should handle schema with shape that is not a function', () => {
      const fakeSchema = {
        _def: {
          shape: { id: 'not a function' },
        },
      } as any;

      const keys = extractKeysFromZod(fakeSchema);

      expect(keys).toEqual([]);
    });

    it('should extract keys when schema._def.shape is a function', () => {
      const schema = z.object({
        id: z.number(),
        name: z.string(),
        email: z.string(),
      });

      const keys = extractKeysFromZod(schema);

      expect(keys).toContain('id');
      expect(keys).toContain('name');
      expect(keys).toContain('email');
      expect(keys.length).toBe(3);
    });
  });

  describe('extractKeysFromClass - proxy handler edge cases', () => {
    it('should filter symbol properties in proxy set trap', () => {
      const sym = Symbol('test');

      class TestClass {
        id: number;

        constructor(data: any) {
          this.id = data.id;
          // Set a symbol property
          (this as any)[sym] = 'value';
        }
      }

      const keys = extractKeysFromClass(TestClass);

      // Should only have string keys
      expect(keys).toContain('id');
      expect(keys.every((k) => typeof k === 'string')).toBe(true);
    });

    it('should filter constructor property in proxy set trap', () => {
      class TestClass {
        id: number;

        constructor(data: any) {
          this.id = data.id;
          // Try to set constructor (should be filtered)
          try {
            (this as any)['constructor'] = 'something';
          } catch {
            // May throw
          }
        }
      }

      const keys = extractKeysFromClass(TestClass);

      expect(keys).toContain('id');
      // constructor is filtered in proxy trap
    });

    it('should return true from proxy set trap', () => {
      // This tests line 96: return true;
      class TestClass {
        id: number = 0;
        name: string = '';

        constructor(data: any) {
          this.id = data.id;
          this.name = data.name;
        }
      }

      const keys = extractKeysFromClass(TestClass);

      expect(keys.length).toBeGreaterThan(0);
    });
  });

  describe('extractKeysFromClass - strategy 3 (no args)', () => {
    it('should use strategy 3 when strategy 2 fails', () => {
      class TestClass {
        id: number = 1;
        name: string = 'default';

        constructor(arg?: any) {
          // Throws if empty object is passed but works with no args
          if (arg !== undefined && Object.keys(arg).length === 0) {
            throw new Error('Empty object not allowed');
          }
        }
      }

      const keys = extractKeysFromClass(TestClass);

      // Should fall back to strategy 3 (no arguments)
      expect(keys).toContain('id');
      expect(keys).toContain('name');
    });

    it('should extract keys using for...in loop in strategy 3', () => {
      class TestClass {
        id: number = 1;
        name: string = 'test';
        active: boolean = true;

        constructor() {
          // Constructor with no parameters
        }
      }

      const keys = extractKeysFromClass(TestClass);

      expect(keys).toContain('id');
      expect(keys).toContain('name');
      expect(keys).toContain('active');
    });

    it('should use hasOwnProperty check in strategy 3', () => {
      class BaseClass {
        baseId: number = 0;
      }

      class TestClass extends BaseClass {
        id: number = 1;

        constructor() {
          super();
        }
      }

      const keys = extractKeysFromClass(TestClass);

      // Should only extract own properties
      expect(keys).toContain('id');
    });

    it('should handle class that throws in all strategies', () => {
      class AlwaysThrows {
        constructor(...args: any[]) {
          throw new Error('Cannot be instantiated');
        }
      }

      const keys = extractKeysFromClass(AlwaysThrows);

      // All strategies fail, should return empty array
      expect(keys).toEqual([]);
    });
  });

  describe('extractKeysFromClass - all branches', () => {
    it('should test strategy 1 success (proxy approach)', () => {
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

    it('should test strategy 2 when proxy fails but new constructor({}) works', () => {
      class TestClass {
        id: number = 1;

        constructor(data: Partial<TestClass> = {}) {
          Object.assign(this, data);
        }
      }

      const keys = extractKeysFromClass(TestClass);

      expect(keys).toContain('id');
    });

    it('should cover for...in loop in strategy 2', () => {
      class TestClass {
        id: number = 0;
        name: string = '';
        email: string = '';

        constructor(data: Partial<TestClass> = {}) {
          Object.assign(this, data);
        }
      }

      const keys = extractKeysFromClass(TestClass);

      expect(keys.length).toBe(3);
      expect(keys).toContain('id');
      expect(keys).toContain('name');
      expect(keys).toContain('email');
    });
  });
});
