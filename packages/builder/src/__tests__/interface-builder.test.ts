/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { InterfaceBuilder } from '../builders/interface-builder';

describe('InterfaceBuilder', () => {
  interface TestInterface {
    id: number;
    name: string;
    email: string;
    age?: number;
  }

  let builder: InterfaceBuilder<TestInterface>;

  beforeEach(() => {
    builder = new InterfaceBuilder<TestInterface>(['id', 'name', 'email', 'age']);
  });

  describe('build', () => {
    it('should build object with all provided keys', () => {
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

    it('should exclude undefined values', () => {
      (builder as any).data = {
        id: 1,
        name: 'John',
        email: undefined,
        age: undefined,
      };

      const result = builder.build();

      expect(result).toEqual({
        id: 1,
        name: 'John',
      });
      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('age');
    });

    it('should build empty object when no data is set', () => {
      const result = builder.build();

      expect(result).toEqual({});
    });

    it('should include falsy values that are not undefined', () => {
      (builder as any).data = {
        id: 0,
        name: '',
        age: 0,
      };

      const result = builder.build();

      expect(result).toEqual({
        id: 0,
        name: '',
        age: 0,
      });
    });

    it('should include null values', () => {
      (builder as any).data = {
        id: null,
        name: null,
      };

      const result = builder.build();

      expect(result).toEqual({
        id: null,
        name: null,
      });
    });

    it('should only include keys that are in the keys array', () => {
      (builder as any).data = {
        id: 1,
        name: 'John',
        extraKey: 'should not appear',
      };

      const result = builder.build();

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).not.toHaveProperty('extraKey');
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

    it('should allow partial data building', () => {
      const proxy = builder.createProxy();

      const result = (proxy as any).withId(1).withName('Bob').build();

      expect(result).toEqual({
        id: 1,
        name: 'Bob',
      });
      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('age');
    });

    it('should support overwriting values', () => {
      const proxy = builder.createProxy();

      (proxy as any).withId(1).withId(2).withName('First').withName('Second');

      const result = proxy.build();

      expect(result).toEqual({
        id: 2,
        name: 'Second',
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty keys array', () => {
      const emptyBuilder = new InterfaceBuilder([]);
      (emptyBuilder as any).data = {
        id: 1,
        name: 'test',
      };

      const result = emptyBuilder.build();

      expect(result).toEqual({});
    });

    it('should handle large number of keys', () => {
      const keys = Array.from({ length: 100 }, (_, i) => `key${i}`);
      const largeBuilder = new InterfaceBuilder(keys);

      const data: any = {};
      keys.forEach((key, i) => {
        data[key] = i;
      });

      (largeBuilder as any).data = data;

      const result = largeBuilder.build();

      expect(Object.keys(result).length).toBe(100);
      keys.forEach((key, i) => {
        expect(result).toHaveProperty(key, i);
      });
    });

    it('should handle boolean values correctly', () => {
      interface BoolInterface {
        isActive: boolean;
        isVerified: boolean;
      }

      const boolBuilder = new InterfaceBuilder<BoolInterface>(['isActive', 'isVerified']);
      (boolBuilder as any).data = {
        isActive: true,
        isVerified: false,
      };

      const result = boolBuilder.build();

      expect(result).toEqual({
        isActive: true,
        isVerified: false,
      });
    });

    it('should handle complex nested objects', () => {
      interface ComplexInterface {
        id: number;
        metadata: { tags: string[] };
      }

      const complexBuilder = new InterfaceBuilder<ComplexInterface>(['id', 'metadata']);
      (complexBuilder as any).data = {
        id: 1,
        metadata: { tags: ['tag1', 'tag2'] },
      };

      const result = complexBuilder.build();

      expect(result).toEqual({
        id: 1,
        metadata: { tags: ['tag1', 'tag2'] },
      });
    });

    it('should handle arrays', () => {
      interface ArrayInterface {
        ids: number[];
        names: string[];
      }

      const arrayBuilder = new InterfaceBuilder<ArrayInterface>(['ids', 'names']);
      (arrayBuilder as any).data = {
        ids: [1, 2, 3],
        names: ['a', 'b', 'c'],
      };

      const result = arrayBuilder.build();

      expect(result).toEqual({
        ids: [1, 2, 3],
        names: ['a', 'b', 'c'],
      });
    });

    it('should handle dates', () => {
      interface DateInterface {
        createdAt: Date;
      }

      const date = new Date('2024-01-01');
      const dateBuilder = new InterfaceBuilder<DateInterface>(['createdAt']);
      (dateBuilder as any).data = {
        createdAt: date,
      };

      const result = dateBuilder.build();

      expect(result).toEqual({
        createdAt: date,
      });
    });

    it('should create new object reference on each build', () => {
      (builder as any).data = {
        id: 1,
        name: 'John',
      };

      const result1 = builder.build();
      const result2 = builder.build();

      expect(result1).toEqual(result2);
      expect(result1).not.toBe(result2); // Different references
    });

    it('should not mutate internal data object', () => {
      (builder as any).data = {
        id: 1,
        name: 'John',
      };

      const result = builder.build();
      result.name = 'Modified';

      expect((builder as any).data.name).toBe('John');
    });
  });

  describe('TypeScript type safety', () => {
    it('should maintain type information at runtime', () => {
      const proxy = builder.createProxy();

      const result = (proxy as any).withId(123).withName('TypeScript').build();

      expect(typeof result.id).toBe('number');
      expect(typeof result.name).toBe('string');
    });
  });
});
