import { describe, it, expect, beforeEach } from 'vitest';
import { ClassBuilder } from '../core/builders/class-builder';

describe('ClassBuilder', () => {
  class User {
    id: number = 0;
    name: string = '';
    email: string = '';
    age: number = 0;

    constructor(data: Partial<User> = {}) {
      Object.assign(this, data);
    }

    getName(): string {
      return this.name;
    }

    isAdult(): boolean {
      return this.age >= 18;
    }
  }

  let builder: ClassBuilder<User>;

  beforeEach(() => {
    builder = new ClassBuilder<User>(['id', 'name', 'email', 'age'], User);
  });

  describe('constructor', () => {
    it('should initialize with keys and class constructor', () => {
      const builder = new ClassBuilder(['id', 'name'], User);

      expect((builder as any).keys).toEqual(['id', 'name']);
      expect((builder as any).classConstructor).toBe(User);
    });
  });

  describe('build', () => {
    it('should create instance of the class', () => {
      (builder as any).data = {
        id: 1,
        name: 'John',
      };

      const result = builder.build();

      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(1);
      expect(result.name).toBe('John');
    });

    it('should pass data to class constructor', () => {
      (builder as any).data = {
        id: 42,
        name: 'Alice',
        email: 'alice@example.com',
        age: 30,
      };

      const result = builder.build();

      expect(result.id).toBe(42);
      expect(result.name).toBe('Alice');
      expect(result.email).toBe('alice@example.com');
      expect(result.age).toBe(30);
    });

    it('should preserve class methods', () => {
      (builder as any).data = {
        name: 'Bob',
      };

      const result = builder.build();

      expect(typeof result.getName).toBe('function');
      expect(result.getName()).toBe('Bob');
    });

    it('should create instance with default values when no data provided', () => {
      const result = builder.build();

      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(0);
      expect(result.name).toBe('');
      expect(result.email).toBe('');
      expect(result.age).toBe(0);
    });

    it('should handle partial data', () => {
      (builder as any).data = {
        id: 10,
        name: 'Partial',
      };

      const result = builder.build();

      expect(result.id).toBe(10);
      expect(result.name).toBe('Partial');
      expect(result.email).toBe(''); // default
      expect(result.age).toBe(0); // default
    });
  });

  describe('integration with proxy', () => {
    it('should work with createProxy method', () => {
      const proxy = builder.createProxy();

      const result = (proxy as any)
        .withId(100)
        .withName('Test User')
        .withEmail('test@example.com')
        .withAge(25)
        .build();

      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(100);
      expect(result.name).toBe('Test User');
      expect(result.email).toBe('test@example.com');
      expect(result.age).toBe(25);
    });

    it('should allow method chaining', () => {
      const proxy = builder.createProxy();

      const result = (proxy as any).withId(1).withName('Chained').build();

      expect(result.id).toBe(1);
      expect(result.name).toBe('Chained');
    });

    it('should preserve instance methods after building', () => {
      const proxy = builder.createProxy();

      const result = (proxy as any).withName('Alice').withAge(20).build();

      expect(result.getName()).toBe('Alice');
      expect(result.isAdult()).toBe(true);
    });
  });

  describe('with different class types', () => {
    it('should work with class that has getters and setters', () => {
      class Product {
        private _price: number = 0;

        get price(): number {
          return this._price;
        }

        set price(value: number) {
          this._price = value;
        }

        constructor(data: any = {}) {
          if (data.price !== undefined) {
            this.price = data.price;
          }
        }
      }

      const productBuilder = new ClassBuilder(['price'], Product);
      (productBuilder as any).data = { price: 99.99 };

      const result = productBuilder.build();

      expect(result).toBeInstanceOf(Product);
      expect(result.price).toBe(99.99);
    });

    it('should work with class that has computed properties', () => {
      class Rectangle {
        width: number = 0;
        height: number = 0;

        constructor(data: Partial<Rectangle> = {}) {
          Object.assign(this, data);
        }

        get area(): number {
          return this.width * this.height;
        }
      }

      const rectBuilder = new ClassBuilder(['width', 'height'], Rectangle);
      (rectBuilder as any).data = { width: 10, height: 5 };

      const result = rectBuilder.build();

      expect(result.area).toBe(50);
    });

    it('should work with class that has static methods', () => {
      class Counter {
        count: number = 0;

        constructor(data: Partial<Counter> = {}) {
          Object.assign(this, data);
        }

        static create(): Counter {
          return new Counter({ count: 0 });
        }
      }

      const counterBuilder = new ClassBuilder(['count'], Counter);
      (counterBuilder as any).data = { count: 10 };

      const result = counterBuilder.build();

      expect(result).toBeInstanceOf(Counter);
      expect(result.count).toBe(10);
      expect(typeof Counter.create).toBe('function');
    });
  });

  describe('edge cases', () => {
    it('should handle class with no constructor parameters', () => {
      class Simple {
        id: number = 1;
        name: string = 'default';

        constructor() {
          // No parameters
        }
      }

      const simpleBuilder = new ClassBuilder(['id', 'name'], Simple);
      (simpleBuilder as any).data = { id: 5 };

      const result = simpleBuilder.build();

      expect(result).toBeInstanceOf(Simple);
    });

    it('should handle class with complex constructor logic', () => {
      class Complex {
        value: number;

        constructor(data: any = {}) {
          this.value = data.value ? data.value * 2 : 0;
        }
      }

      const complexBuilder = new ClassBuilder(['value'], Complex);
      (complexBuilder as any).data = { value: 5 };

      const result = complexBuilder.build();

      expect(result.value).toBe(10); // constructor doubles the value
    });

    it('should handle class with private fields', () => {
      class PrivateFields {
        public id: number = 0;
        private secret: string = '';

        constructor(data: any = {}) {
          if (data.id) this.id = data.id;
          if (data.secret) this.secret = data.secret;
        }

        getSecret(): string {
          return this.secret;
        }
      }

      const privateBuilder = new ClassBuilder(['id', 'secret'], PrivateFields);
      (privateBuilder as any).data = { id: 1, secret: 'hidden' };

      const result = privateBuilder.build();

      expect(result.id).toBe(1);
      expect(result.getSecret()).toBe('hidden');
    });

    it('should create new instance on each build', () => {
      (builder as any).data = { id: 1, name: 'Test' };

      const result1 = builder.build();
      const result2 = builder.build();

      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });

    it('should handle nested object data', () => {
      class Profile {
        user: { name: string; age: number };

        constructor(data: any = {}) {
          this.user = data.user || { name: '', age: 0 };
        }
      }

      const profileBuilder = new ClassBuilder(['user'], Profile);
      (profileBuilder as any).data = {
        user: { name: 'John', age: 30 },
      };

      const result = profileBuilder.build();

      expect(result.user).toEqual({ name: 'John', age: 30 });
    });

    it('should handle class with arrays', () => {
      class TodoList {
        items: string[] = [];

        constructor(data: Partial<TodoList> = {}) {
          Object.assign(this, data);
        }

        addItem(item: string) {
          this.items.push(item);
        }
      }

      const todoBuilder = new ClassBuilder(['items'], TodoList);
      (todoBuilder as any).data = {
        items: ['task1', 'task2'],
      };

      const result = todoBuilder.build();

      expect(result.items).toEqual(['task1', 'task2']);
      expect(typeof result.addItem).toBe('function');
    });

    it('should handle class with dates', () => {
      class Event {
        createdAt: Date;

        constructor(data: any = {}) {
          this.createdAt = data.createdAt || new Date();
        }
      }

      const date = new Date('2024-01-01');
      const eventBuilder = new ClassBuilder(['createdAt'], Event);
      (eventBuilder as any).data = { createdAt: date };

      const result = eventBuilder.build();

      expect(result.createdAt).toBe(date);
    });

    it('should handle overwriting values in builder', () => {
      const proxy = builder.createProxy();

      (proxy as any).withId(1).withId(2).withName('First').withName('Second');

      const result = proxy.build();

      expect(result.id).toBe(2);
      expect(result.name).toBe('Second');
    });
  });

  describe('inheritance', () => {
    it('should work with class inheritance', () => {
      class Animal {
        name: string = '';

        constructor(data: Partial<Animal> = {}) {
          Object.assign(this, data);
        }

        speak(): string {
          return 'Some sound';
        }
      }

      class Dog extends Animal {
        breed: string = '';

        constructor(data: Partial<Dog> = {}) {
          super(data);
          if (data.breed) this.breed = data.breed;
        }

        speak(): string {
          return 'Woof!';
        }
      }

      const dogBuilder = new ClassBuilder(['name', 'breed'], Dog);
      (dogBuilder as any).data = {
        name: 'Rex',
        breed: 'Labrador',
      };

      const result = dogBuilder.build();

      expect(result).toBeInstanceOf(Dog);
      expect(result).toBeInstanceOf(Animal);
      expect(result.name).toBe('Rex');
      expect(result.breed).toBe('Labrador');
      expect(result.speak()).toBe('Woof!');
    });
  });
});
