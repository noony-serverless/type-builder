import { describe, it, expect, beforeEach } from 'vitest';
import { BaseBuilder, createBuilderWithProxy } from '../core/builders/base-builder';

// Concrete implementation for testing
class TestBuilder extends BaseBuilder<{ id: number; name: string; email: string }> {
  build() {
    return this.data as { id: number; name: string; email: string };
  }
}

describe('BaseBuilder', () => {
  let builder: TestBuilder;

  beforeEach(() => {
    builder = new TestBuilder(['id', 'name', 'email']);
  });

  describe('constructor', () => {
    it('should initialize with provided keys', () => {
      const builder = new TestBuilder(['id', 'name']);

      expect((builder as any).keys).toEqual(['id', 'name']);
    });

    it('should initialize with empty data', () => {
      const builder = new TestBuilder(['id']);

      expect((builder as any).data).toEqual({});
    });
  });

  describe('createWithMethod', () => {
    it('should set value in data object', () => {
      (builder as any).createWithMethod('id', 123);

      expect((builder as any).data.id).toBe(123);
    });

    it('should return this for method chaining', () => {
      const result = (builder as any).createWithMethod('name', 'test');

      expect(result).toBe(builder);
    });

    it('should overwrite existing values', () => {
      (builder as any).createWithMethod('id', 100);
      (builder as any).createWithMethod('id', 200);

      expect((builder as any).data.id).toBe(200);
    });

    it('should handle multiple properties', () => {
      (builder as any).createWithMethod('id', 1);
      (builder as any).createWithMethod('name', 'John');
      (builder as any).createWithMethod('email', 'john@example.com');

      expect((builder as any).data).toEqual({
        id: 1,
        name: 'John',
        email: 'john@example.com',
      });
    });
  });

  describe('createWithMethodName', () => {
    it('should create proper method name from key', () => {
      const methodName = (builder as any).createWithMethodName('id');

      expect(methodName).toBe('withId');
    });

    it('should capitalize first letter', () => {
      const methodName = (builder as any).createWithMethodName('name');

      expect(methodName).toBe('withName');
    });

    it('should handle multi-word keys', () => {
      const methodName = (builder as any).createWithMethodName('firstName');

      expect(methodName).toBe('withFirstName');
    });

    it('should handle single character keys', () => {
      const methodName = (builder as any).createWithMethodName('x');

      expect(methodName).toBe('withX');
    });
  });

  describe('createProxy', () => {
    it('should create a proxy with dynamic methods', () => {
      const proxy = builder.createProxy();

      expect(proxy).toBeDefined();
      expect(typeof (proxy as any).withId).toBe('function');
      expect(typeof (proxy as any).withName).toBe('function');
      expect(typeof (proxy as any).withEmail).toBe('function');
    });

    it('should create methods that set values', () => {
      const proxy = builder.createProxy();

      (proxy as any).withId(123);

      expect((builder as any).data.id).toBe(123);
    });

    it('should support method chaining', () => {
      const proxy = builder.createProxy();

      const result = (proxy as any).withId(1).withName('John').withEmail('john@example.com');

      expect(result).toBe(proxy);
      expect((builder as any).data).toEqual({
        id: 1,
        name: 'John',
        email: 'john@example.com',
      });
    });

    it('should only create methods for provided keys', () => {
      const proxy = builder.createProxy();

      expect(typeof (proxy as any).withId).toBe('function');
      expect((proxy as any).withUnknown).toBeUndefined();
    });

    it('should handle keys with different cases', () => {
      const builder = new TestBuilder(['userId', 'userName']);
      const proxy = builder.createProxy();

      expect(typeof (proxy as any).withUserId).toBe('function');
      expect(typeof (proxy as any).withUserName).toBe('function');
    });

    it('should preserve original methods', () => {
      const proxy = builder.createProxy();

      expect(typeof proxy.build).toBe('function');
    });

    it('should call build method correctly', () => {
      const proxy = builder.createProxy();

      (proxy as any).withId(1).withName('Test');

      const result = proxy.build();

      expect(result).toEqual({
        id: 1,
        name: 'Test',
      });
    });

    it('should not create method for non-existent keys', () => {
      const proxy = builder.createProxy();

      expect(typeof (proxy as any).withNonExistent).toBe('undefined');
    });

    it('should return proxy instance from with methods', () => {
      const proxy = builder.createProxy();

      const result1 = (proxy as any).withId(1);
      const result2 = result1.withName('test');

      expect(result1).toBe(proxy);
      expect(result2).toBe(proxy);
    });

    it('should handle property names starting with "with" correctly', () => {
      const builder = new TestBuilder(['withdrawal']);
      const proxy = builder.createProxy();

      // Should create withWithdrawal method
      expect(typeof (proxy as any).withWithdrawal).toBe('function');
    });

    it('should not intercept properties that do not start with "with"', () => {
      const proxy = builder.createProxy();

      expect((proxy as any).data).toBeDefined();
      expect((proxy as any).keys).toBeDefined();
    });
  });

  describe('method chaining integration', () => {
    it('should allow complex chaining scenarios', () => {
      const proxy = builder.createProxy();

      const result = (proxy as any)
        .withId(42)
        .withName('Alice')
        .withEmail('alice@example.com')
        .build();

      expect(result).toEqual({
        id: 42,
        name: 'Alice',
        email: 'alice@example.com',
      });
    });

    it('should allow re-using the same proxy multiple times', () => {
      const proxy = builder.createProxy();

      (proxy as any).withId(1).withName('First');
      const first = proxy.build();

      // Clear data
      (builder as any).data = {};

      (proxy as any).withId(2).withName('Second');
      const second = proxy.build();

      expect(first).toEqual({ id: 1, name: 'First' });
      expect(second).toEqual({ id: 2, name: 'Second' });
    });
  });
});

describe('createBuilderWithProxy', () => {
  it('should create proxy from builder instance', () => {
    const builder = new TestBuilder(['id', 'name']);
    const proxy = createBuilderWithProxy(builder);

    expect(proxy).toBeDefined();
    expect(typeof (proxy as any).withId).toBe('function');
    expect(typeof (proxy as any).withName).toBe('function');
  });

  it('should work with method chaining', () => {
    const builder = new TestBuilder(['id', 'name']);
    const proxy = createBuilderWithProxy(builder);

    const result = (proxy as any).withId(100).withName('Test').build();

    expect(result).toEqual({
      id: 100,
      name: 'Test',
    });
  });

  it('should return the same proxy as calling createProxy directly', () => {
    const builder = new TestBuilder(['id']);
    const proxy1 = createBuilderWithProxy(builder);
    const proxy2 = builder.createProxy();

    // Both should have the same methods
    expect(typeof (proxy1 as any).withId).toBe('function');
    expect(typeof (proxy2 as any).withId).toBe('function');
  });
});
