# Class Builder

The **Class Builder** mode creates instances of classes with full method support, perfect for domain-driven design and rich object models.

## Overview

- **Performance**: 300,000+ operations per second (~3.3μs per operation)
- **Memory**: ~80 bytes per object
- **Use Case**: Domain models with business logic
- **Feature**: Preserves class methods and instanceof checks

## When to Use

Use Class mode when:

- ✅ You need methods on your objects
- ✅ Building domain models with business logic
- ✅ Using object-oriented programming patterns
- ✅ You need `instanceof` type checks
- ✅ Encapsulating behavior with data

Don't use Class mode when:

- ❌ You only need plain data objects (use [Interface mode](./interface-builder.md))
- ❌ You need runtime validation (use [Zod mode](./zod-builder.md))
- ❌ Maximum performance is critical (Interface mode is faster)

## Basic Usage

### Defining a Class

```typescript
import { builder } from '@noony-serverless/type-builder';

class User {
  id!: number;
  name!: string;
  email!: string;

  constructor(data: Partial<User>) {
    Object.assign(this, data);
  }

  getDisplayName(): string {
    return `${this.name} <${this.email}>`;
  }
}

// Auto-detects it's a class
const createUser = builder(User);

const user = createUser()
  .withId(1)
  .withName('John Doe')
  .withEmail('john@example.com')
  .build();

console.log(user.getDisplayName()); // "John Doe <john@example.com>"
console.log(user instanceof User);  // true
```

### Constructor Requirements

Your class constructor should:

1. Accept a `Partial<YourClass>` parameter
2. Use `Object.assign(this, data)` to set properties

```typescript
class Product {
  id!: number;
  name!: string;
  price!: number;

  // ✅ GOOD: Accepts partial, uses Object.assign
  constructor(data: Partial<Product>) {
    Object.assign(this, data);
  }
}

// ❌ BAD: Doesn't accept partial data
class BadProduct {
  constructor(id: number, name: string, price: number) {
    this.id = id;
    this.name = name;
    this.price = price;
  }
}
```

## Real-World Examples

### Domain-Driven Design

```typescript
class Order {
  id!: string;
  customerId!: string;
  items!: OrderItem[];
  status!: 'pending' | 'processing' | 'completed' | 'cancelled';
  total!: number;
  createdAt!: Date;

  constructor(data: Partial<Order>) {
    Object.assign(this, data);
    this.status = this.status || 'pending';
    this.createdAt = this.createdAt || new Date();
  }

  // Business logic methods
  canBeCancelled(): boolean {
    return ['pending', 'processing'].includes(this.status);
  }

  cancel(): void {
    if (!this.canBeCancelled()) {
      throw new Error(`Cannot cancel order with status: ${this.status}`);
    }
    this.status = 'cancelled';
  }

  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  applyDiscount(percent: number): void {
    if (percent < 0 || percent > 100) {
      throw new Error('Discount must be between 0 and 100');
    }
    this.total *= (1 - percent / 100);
  }
}

const createOrder = builder(Order);

// In your service layer
class OrderService {
  async createOrder(customerId: string, items: OrderItem[]): Promise<Order> {
    const order = createOrder()
      .withId(generateId())
      .withCustomerId(customerId)
      .withItems(items)
      .withTotal(items.reduce((sum, i) => sum + i.price * i.quantity, 0))
      .build();

    // Business logic is in the domain model
    if (order.total > 1000) {
      order.applyDiscount(10); // 10% off for big orders
    }

    await this.orderRepository.save(order);
    return order;
  }

  async cancelOrder(orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);

    order.cancel(); // ✅ Business logic in the model

    await this.orderRepository.save(order);
  }
}
```

### Entity with Methods

```typescript
class BlogPost {
  id!: string;
  title!: string;
  content!: string;
  authorId!: string;
  tags!: string[];
  publishedAt!: Date | null;
  createdAt!: Date;

  constructor(data: Partial<BlogPost>) {
    Object.assign(this, data);
    this.publishedAt = this.publishedAt || null;
    this.createdAt = this.createdAt || new Date();
  }

  isPublished(): boolean {
    return this.publishedAt !== null;
  }

  publish(): void {
    if (this.isPublished()) {
      throw new Error('Post is already published');
    }
    this.publishedAt = new Date();
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  addTag(tag: string): void {
    if (!this.hasTag(tag)) {
      this.tags.push(tag);
    }
  }

  getExcerpt(maxLength: number = 100): string {
    return this.content.length > maxLength
      ? this.content.substring(0, maxLength) + '...'
      : this.content;
  }
}

const createBlogPost = builder(BlogPost);

const post = createBlogPost()
  .withId('post-001')
  .withTitle('My First Post')
  .withContent('This is a great post about TypeScript builders.')
  .withAuthorId('user-123')
  .withTags(['typescript', 'programming'])
  .build();

console.log(post.getExcerpt(20)); // "This is a great post..."
post.publish();
console.log(post.isPublished()); // true
```

### Value Objects

```typescript
class Money {
  amount!: number;
  currency!: string;

  constructor(data: Partial<Money>) {
    Object.assign(this, data);
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add different currencies');
    }
    return createMoney()
      .withAmount(this.amount + other.amount)
      .withCurrency(this.currency)
      .build();
  }

  multiply(factor: number): Money {
    return createMoney()
      .withAmount(this.amount * factor)
      .withCurrency(this.currency)
      .build();
  }

  format(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}

const createMoney = builder(Money);

const price = createMoney().withAmount(100).withCurrency('USD').build();
const tax = createMoney().withAmount(10).withCurrency('USD').build();
const total = price.add(tax);

console.log(total.format()); // "USD 110.00"
```

## Auto-Detection

UltraFastBuilder automatically detects classes by checking for:

1. Function type (`typeof input === 'function'`)
2. Prototype existence (`input.prototype`)
3. Constructor property

```typescript
class Product {
  name!: string;
  price!: number;

  constructor(data: Partial<Product>) {
    Object.assign(this, data);
  }
}

// ✅ Auto-detects as class
const create = builder(Product);
```

## Explicit Keys (Optional)

If auto-detection fails, pass explicit keys:

```typescript
class MyClass {
  prop1!: string;
  prop2!: number;

  constructor(data: Partial<MyClass>) {
    Object.assign(this, data);
  }
}

// Explicit keys (optional)
const create = builder(MyClass, ['prop1', 'prop2']);
```

## Property Detection Strategies

The library uses multiple strategies to detect class properties:

1. **Proxy Capture**: Intercepts property assignments during construction
2. **Empty Object Instantiation**: Creates instance with `{}`
3. **No-Args Instantiation**: Calls constructor with no arguments

For best results, initialize properties with defaults or use explicit keys.

## Type Safety

Full TypeScript support with autocomplete:

```typescript
class User {
  id!: number;
  name!: string;

  constructor(data: Partial<User>) {
    Object.assign(this, data);
  }

  greet(): string {
    return `Hello, ${this.name}!`;
  }
}

const create = builder(User);

// ✅ Type-safe
const user = create().withId(1).withName('John').build();
user.greet(); // "Hello, John!"

// ❌ TypeScript errors
create().withId('invalid');    // Error: Type 'string' not assignable
create().withInvalid('foo');   // Error: Property 'withInvalid' does not exist
```

## Performance Characteristics

```typescript
// Building 100,000 class instances
class User {
  id!: number;
  name!: string;

  constructor(data: Partial<User>) {
    Object.assign(this, data);
  }

  greet() { return `Hello, ${this.name}`; }
}

const createUser = builder(User);

console.time('class-builder');
for (let i = 0; i < 100000; i++) {
  createUser()
    .withId(i)
    .withName('John Doe')
    .build();
}
console.timeEnd('class-builder');
// class-builder: ~330ms (300,000 ops/sec)
```

## Best Practices

### 1. Keep Business Logic in the Class

```typescript
// ✅ GOOD: Logic in the domain model
class Order {
  total!: number;

  applyDiscount(percent: number): void {
    this.total *= (1 - percent / 100);
  }
}

order.applyDiscount(10);

// ❌ BAD: Logic scattered in services
interface Order { total: number; }

class OrderService {
  applyDiscount(order: Order, percent: number) {
    order.total *= (1 - percent / 100);
  }
}
```

### 2. Use Constructor for Defaults

```typescript
class User {
  id!: number;
  role!: string;
  createdAt!: Date;

  constructor(data: Partial<User>) {
    Object.assign(this, data);
    // Set defaults after Object.assign
    this.role = this.role || 'user';
    this.createdAt = this.createdAt || new Date();
  }
}
```

### 3. Combine with Validation

```typescript
class Order {
  total!: number;

  constructor(data: Partial<Order>) {
    Object.assign(this, data);
    this.validate();
  }

  private validate(): void {
    if (this.total < 0) {
      throw new Error('Total cannot be negative');
    }
  }
}
```

## Comparison with Other Modes

| Feature | Class | Interface | Zod |
|---------|-------|-----------|-----|
| **Speed** | 300k ops/sec | 400k ops/sec | 100k ops/sec |
| **Methods** | Yes | No | No |
| **instanceof** | Yes | No | No |
| **Validation** | Manual | None | Automatic |
| **Use Case** | Domain models | DTOs | API validation |

## Next Steps

- [Interface Builder Guide](./interface-builder.md) - Faster plain objects
- [Zod Builder Guide](./zod-builder.md) - Add runtime validation
- [Object Pooling](./object-pooling.md) - Understand pooling internals
- [Examples: Domain Models](../examples/domain-models.md) - More examples
