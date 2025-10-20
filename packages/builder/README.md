# @noony-serverless/type-builder

Ultra-fast TypeScript builder library with auto-detection. Build objects with zero boilerplate.

[![npm version](https://img.shields.io/npm/v/@noony-serverless/type-builder.svg)](https://www.npmjs.com/package/@noony-serverless/type-builder)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-97.43%25-brightgreen.svg)](./COVERAGE-ANALYSIS.md)
[![Tests](https://img.shields.io/badge/tests-396%20passing-success.svg)](./COVERAGE-ANALYSIS.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @noony-serverless/type-builder
```

## Quick Start

```typescript
import { builder, pipe, Maybe, lens } from '@noony-serverless/type-builder';
import { z } from 'zod';

// Zod schema - auto-detected with validation
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

const createUser = builder(UserSchema);

const user = createUser().withName('John Doe').withEmail('john@example.com').build(); // ✅ Validated automatically
```

## Unified Imports

Everything is available from a single import - no more subpath imports needed!

```typescript
// ✅ Single import for everything
import {
  // Core builders
  builder,
  builderAsync,

  // Functional programming
  pipe,
  compose,
  createImmutableBuilder,
  partialApply,
  curriedBuilder,

  // Monads
  Maybe,
  Either,

  // Optics
  lens,
  prism,
  prop,
  path,
} from '@noony-serverless/type-builder';

// ❌ No more multiple imports needed
// import { pipe } from '@noony-serverless/type-builder';
// import { Maybe } from '@noony-serverless/type-builder/monads';
// import { lens } from '@noony-serverless/type-builder/optics';
```

## Usage

### Three Builder Modes

**1. Zod Mode** - Runtime validation (~100k ops/sec)

```typescript
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});
const createUser = builder(UserSchema);
```

**2. Class Mode** - Domain objects with methods (~300k ops/sec)

```typescript
class User {
  name!: string;
  email!: string;
  constructor(data: Partial<User>) {
    Object.assign(this, data);
  }
}
const createUser = builder(User);
```

**3. Interface Mode** - Maximum performance (~400k ops/sec)

```typescript
interface User {
  name: string;
  email: string;
}
const createUser = builder<User>(['name', 'email']);
```

## Mixed Paradigm Examples

### OOP + Functional Programming

```typescript
import { builder, pipe, createImmutableBuilder } from '@noony-serverless/type-builder';

// OOP builder for validation
const UserSchema = z.object({ name: z.string(), email: z.string().email() });
const createUser = builder(UserSchema);

// Functional processing
const processUser = pipe(
  (user: any) => ({ ...user, processed: true }),
  (user: any) => ({ ...user, timestamp: Date.now() })
);

const user = createUser().withName('John').withEmail('john@example.com').build();

const processedUser = processUser(user);
```

### Monads + Optics

```typescript
import { Maybe, Either, lens, prism } from '@noony-serverless/type-builder';

const user = { name: 'John', email: 'john@example.com' };

// Safe access with Maybe
const nameLens = lens(prop('name'));
const maybeName = Maybe.of(nameLens.view(user));

// Error handling with Either
const emailPrism = prism(prop('email'));
const eitherEmail = emailPrism
  .getOption(user)
  .map((email) => (email.includes('@') ? Either.right(email) : Either.left('Invalid email')))
  .getOrElse(Either.left('No email'));
```

## Development

### Setup

```bash
npm install
npm run build
```

### Testing

```bash
npm run test              # Run tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

### Building

```bash
npm run build             # Build library
npm run dev               # Watch mode
```

### Performance Testing

```bash
npm run benchmark         # Run benchmarks
npm run clinic            # Clinic.js analysis
```

## API Reference

### Core Functions

- `builder<T>(input)` - Create builder with auto-detection
- `builderAsync<T>(input)` - Async builder for Zod schemas
- `clearPools()` - Clear object pools
- `getPoolStats()` - Get performance stats

### Builder Methods

- `.withX(value)` - Set property value
- `.build()` - Build final object (sync)
- `.buildAsync()` - Build final object (async)

## Performance

| Mode      | Ops/Sec | Time/Op | Memory   | Use Case       |
| --------- | ------- | ------- | -------- | -------------- |
| Interface | 420,000 | 2.4μs   | 60 bytes | Internal DTOs  |
| Class     | 310,000 | 3.2μs   | 80 bytes | Domain models  |
| Zod       | 105,000 | 9.5μs   | 90 bytes | API validation |

## Documentation

- [Complete Documentation](./docs/README.md)
- [API Reference](./docs/REFERENCE.md)
- [Performance Analysis](./PERFORMANCE.md)
- [Coverage Report](./COVERAGE-ANALYSIS.md)

---

## 🤔 Why Should You Care?

Let me paint you a picture. You're building an API. You need to:

- ✅ Validate user input (hello, Zod!)
- ✅ Build domain objects with methods
- ✅ Transform DTOs at lightning speed
- ✅ Keep everything type-safe

**The old way?** Write a manual builder class for every single type. Boilerplate city. 😴

**The new way?** One function. Auto-detection. Zero config. Fast as hell.

```typescript
// One function to rule them all
const create = builder(anything); // Zod schema? Class? Interface? We got you.
```

---

## 🎨 TypeScript Autocomplete

**Your IDE will autocomplete everything.** The builder generates typed `.withXYZ()` methods automatically from your schemas, classes, and interfaces. Type-safe, with zero runtime cost.

### ✅ Full Type Inference

**Zod Schema:**

```typescript
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

const createUser = builder(UserSchema);

// ✅ IDE autocompletes: .withId(), .withName(), .withEmail()
// ✅ TypeScript validates parameter types
const user = createUser()
  .withId(1) // Knows this is number
  .withName('John') // Knows this is string
  .withEmail('j@example.com') // Knows this is string
  .build();
```

**Class:**

```typescript
class Product {
  id!: number;
  name!: string;
  price!: number;
}

const create = builder(Product);

// ✅ IDE autocompletes: .withId(), .withName(), .withPrice()
const product = create().withId(1).withName('Laptop').withPrice(999).build(); // Returns Product instance
```

**Interface:**

```typescript
interface Order {
  id: string;
  total: number;
  status: 'pending' | 'completed';
}

const create = builder<Order>(['id', 'total', 'status']);

// ✅ IDE autocompletes: .withId(), .withTotal(), .withStatus()
const order = create()
  .withId('ORD-1')
  .withTotal(99.99)
  .withStatus('pending') // TypeScript knows: 'pending' | 'completed'
  .build();
```

### ❌ Type-Safe Errors

TypeScript catches mistakes at compile time:

```typescript
// ❌ Error: Property 'withFoo' does not exist
createUser().withFoo('bar');

// ❌ Error: Argument of type 'string' not assignable to 'number'
createUser().withId('not-a-number');

// ❌ Error: Type '"invalid"' not assignable to '"pending" | "completed"'
createOrder().withStatus('invalid');
```

### 🚀 Zero Runtime Cost

All types are **compile-time only**. They disappear when compiled to JavaScript:

```typescript
// TypeScript (with types)
const create = builder<User>(UserSchema);
const user = create().withName('John').build();

// JavaScript (after compilation - identical!)
const create = builder(UserSchema);
const user = create().withName('John').build();
```

**No performance impact. No bundle size increase. Pure autocomplete magic.** ✨

### 🎯 Works with ANY Type

The type inference is **100% dynamic**. Create a new interface, class, or schema—autocomplete just works:

```typescript
// Brand new type you just created
const BlogPostSchema = z.object({
  title: z.string(),
  content: z.string(),
  author: z.object({ name: z.string(), email: z.string() }),
  tags: z.array(z.string()),
  publishedAt: z.date(),
});

const createPost = builder(BlogPostSchema);

// ✅ IDE immediately suggests all methods:
// .withTitle(), .withContent(), .withAuthor(), .withTags(), .withPublishedAt()

const post = createPost()
  .withTitle('My Post')
  .withContent('Hello world')
  .withAuthor({ name: 'John', email: 'john@example.com' })
  .withTags(['typescript', 'builder'])
  .withPublishedAt(new Date())
  .build();
```

**Zero configuration. No manual type definitions. It just works.** 🎉

See [typed-usage.ts](src/examples/typed-usage.ts) for 10+ comprehensive examples.

---

## 🎯 The Magic: Auto-Detection

Here's where things get fun. You pass _something_ to `builder()`, and it automatically figures out what to do:

### 🔮 Three Modes, Zero Config

```typescript
import builder from '@noony-serverless/type-builder';
import { z } from 'zod';

// 1️⃣ Zod Schema → Validated builders (~100k ops/sec)
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});
const createUser = builder(UserSchema); // 🔍 "Ah, that's a Zod schema!"

// 2️⃣ Class → Methods + type safety (~300k ops/sec)
class Product {
  name!: string;
  price!: number;
  getTax() {
    return this.price * 0.1;
  }
}
const createProduct = builder(Product); // 🔍 "Ah, that's a class constructor!"

// 3️⃣ Interface → Blazing fast DTOs (~400k ops/sec)
interface Order {
  id: string;
  total: number;
}
const createOrder = builder<Order>(['id', 'total']); // 🔍 "Ah, explicit keys!"
```

**How does it work?**

Under the hood, we use runtime type detection:

- **Zod schemas** have `.parse()` and `.safeParse()` methods
- **Classes** have `Function.prototype` and `constructor` properties
- **Arrays** are... well, arrays

It's not rocket science, but it saves you a ton of typing. 🎯

---

## 📚 The Three Modes (Deep Dive)

Let's break down each mode and when to use it.

### 1️⃣ Zod Mode - Validated Builders

**TL;DR:** External input? Use Zod. Type safety + runtime validation = ❤️

```typescript
import builder from '@noony-serverless/type-builder';
import { z } from 'zod';

const CreateUserDTO = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const validateUser = builder(CreateUserDTO);

// In your API endpoint
app.post('/api/users', async (req, res) => {
  try {
    const userData = validateUser()
      .withEmail(req.body.email)
      .withPassword(req.body.password)
      .withName(req.body.name)
      .build(); // ✅ Throws if validation fails

    const user = await db.users.create(userData);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.errors });
  }
});
```

**How it works:**

1. You pass a Zod schema
2. We detect it's a Zod schema (check for `.parse()` method)
3. Extract keys from the schema shape
4. Generate `.withX()` methods for each key
5. On `.build()`, we call `schema.parse(data)` to validate

**Performance:** ~100,000 ops/sec (10μs per operation)

**When to use:**

- ✅ API request validation
- ✅ External data (user input, file uploads, etc.)
- ✅ Anywhere you need runtime validation

**Deep Dive: Schema Detection**

<details>
<summary>Click to see how we detect Zod schemas</summary>

```typescript
function isZodSchema(input: any): boolean {
  return (
    input &&
    typeof input === 'object' &&
    typeof input.parse === 'function' &&
    typeof input.safeParse === 'function' &&
    input._def !== undefined
  );
}
```

We check for Zod's unique signature: `parse()`, `safeParse()`, and the internal `_def` property. This works with all Zod schema types (objects, arrays, unions, etc.).

</details>

---

### 2️⃣ Class Mode - Domain Objects with Methods

**TL;DR:** Need methods? Use classes. Full OOP, zero compromises.

```typescript
class Order {
  id!: string;
  items!: OrderItem[];
  status!: OrderStatus;
  total!: number;

  constructor(data: Partial<Order>) {
    Object.assign(this, data);
  }

  // Business logic lives here
  canBeCancelled(): boolean {
    return this.status === 'pending';
  }

  calculateTax(rate: number): number {
    return this.total * rate;
  }

  applyDiscount(percent: number): void {
    this.total *= 1 - percent / 100;
  }
}

const createOrder = builder(Order);

const order = createOrder()
  .withId('ORD-001')
  .withItems([{ sku: 'LAPTOP', qty: 1 }])
  .withStatus('pending')
  .withTotal(999.99)
  .build();

// Use your methods!
if (order.canBeCancelled()) {
  order.applyDiscount(10);
}

console.log('Tax:', order.calculateTax(0.08)); // $79.99
```

**How it works:**

1. You pass a class constructor
2. We detect it's a class (check for `.prototype.constructor`)
3. Create a proxy instance with an empty object
4. Call the constructor to capture property assignments
5. Generate `.withX()` methods for discovered properties
6. On `.build()`, call `new YourClass(data)` to create the real instance

**Performance:** ~300,000 ops/sec (3.3μs per operation)

**When to use:**

- ✅ Domain models with business logic
- ✅ Rich objects with methods
- ✅ OOP-style architecture
- ✅ When you need `instanceof` checks

**Pro tip:** Your constructor should accept a `Partial<YourClass>` object and use `Object.assign(this, data)`. This makes it work seamlessly with the builder.

**Deep Dive: Class Property Detection**

<details>
<summary>Click to see the Proxy magic</summary>

We use a Proxy `set` trap to capture property assignments in the constructor:

```typescript
const capturedKeys = new Set<string>();
const proxyHandler = {
  set(target: any, prop: string | symbol, value: any) {
    if (typeof prop === 'string' && prop !== 'constructor') {
      capturedKeys.add(prop);
    }
    target[prop] = value;
    return true;
  },
};

const proxy = new Proxy({}, proxyHandler);
YourClass.call(proxy, {}); // Captures all `this.x = y` assignments
```

This way, we don't need decorators, reflect-metadata, or any TypeScript magic. Pure runtime goodness.

</details>

---

### 3️⃣ Interface Mode - Maximum Performance

**TL;DR:** Internal data? Use interfaces. 400k+ ops/sec, minimal memory.

```typescript
interface UserDTO {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

const createUserDTO = builder<UserDTO>(['id', 'name', 'email', 'createdAt']);

// In your data transformation pipeline
app.get('/api/users', async (req, res) => {
  const users = await db.users.findMany();

  const dtos = users.map((user) =>
    createUserDTO()
      .withId(user.id)
      .withName(user.name)
      .withEmail(user.email)
      .withCreatedAt(user.createdAt)
      .build()
  );

  res.json(dtos); // ⚡ Lightning fast
});
```

**How it works:**

1. You pass an array of property keys
2. We generate `.withX()` methods for each key
3. On `.build()`, return the accumulated data object
4. No validation, no class instantiation, just raw speed

**Performance:** ~400,000 ops/sec (2.5μs per operation)

**When to use:**

- ✅ Internal DTOs (Data Transfer Objects)
- ✅ High-throughput transformations
- ✅ When validation already happened upstream
- ✅ Maximum performance scenarios

**Why so fast?**

- No validation overhead
- No class instantiation
- No method copying
- Just plain object creation with object pooling

---

## 🏎️ Performance: Fast as Hell

Let's talk numbers. Here's how we stack up:

| Mode          | Ops/Sec  | Time/Op | Use Case                       |
| ------------- | -------- | ------- | ------------------------------ |
| **Interface** | ~400,000 | 2.5μs   | Internal DTOs, max speed       |
| **Class**     | ~300,000 | 3.3μs   | Domain models with methods     |
| **Zod**       | ~100,000 | 10μs    | API validation, external input |

**Memory:**

- 60-90 bytes per object (thanks to object pooling)
- Zero blocking operations
- GC-friendly (minimal allocations with pooling)

**Real-world impact:**

```typescript
// Processing 10,000 API requests/sec?
// Interface mode: 25ms total
// Class mode: 33ms total
// Zod mode: 100ms total

// You're spending MORE time on database queries than object building. As it should be. 👍
```

**Pro tip:** Use interface mode for internal transformations, Zod mode for API boundaries. Best of both worlds.

---

## 🎓 Real-World Examples

Let's wire it up with real code you'd actually write.

### Example 1: Express API with Validation

```typescript
import express from 'express';
import builder from '@noony-serverless/type-builder';
import { z } from 'zod';

const app = express();

// Define your validation schema
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(50),
});

const validateCreateUser = builder(CreateUserSchema);

app.post('/api/users', async (req, res) => {
  try {
    // Validate and build in one step
    const userData = validateCreateUser()
      .withEmail(req.body.email)
      .withPassword(req.body.password)
      .withName(req.body.name)
      .build(); // ✅ Throws ZodError if invalid

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Save to database
    const user = await db.users.create({
      ...userData,
      password: hashedPassword,
    });

    res.status(201).json({ id: user.id, email: user.email, name: user.name });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

**Why this rocks:**

- ✅ Type-safe all the way through
- ✅ Clear validation errors
- ✅ No manual builder classes
- ✅ Easy to test

---

### Example 2: Domain-Driven Design with Classes

```typescript
class Order {
  id!: string;
  customerId!: string;
  items!: OrderItem[];
  status!: OrderStatus;
  total!: number;
  createdAt!: Date;

  constructor(data: Partial<Order>) {
    Object.assign(this, data);
    this.status = this.status || 'pending';
    this.createdAt = this.createdAt || new Date();
  }

  // Business logic
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
    this.total *= 1 - percent / 100;
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

    // Domain logic is in the class
    if (order.total > 1000) {
      order.applyDiscount(10); // 10% off for big orders
    }

    await this.orderRepository.save(order);
    return order;
  }

  async cancelOrder(orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    order.cancel(); // ✅ Business logic in the domain model
    await this.orderRepository.save(order);
  }
}
```

**Why this rocks:**

- ✅ Rich domain models with behavior
- ✅ Business logic lives in the class (not scattered in services)
- ✅ Easy to test (just test the class methods)
- ✅ Type-safe builders for free

---

### Example 3: High-Performance Data Transformation

```typescript
// Database entity (what comes from DB)
interface UserEntity {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: Date;
  updated_at: Date;
  password_hash: string;
  is_active: boolean;
}

// API DTO (what you send to clients)
interface UserDTO {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  isActive: boolean;
}

const createUserDTO = builder<UserDTO>(['id', 'email', 'name', 'createdAt', 'isActive']);

// In your API endpoint
app.get('/api/users', async (req, res) => {
  const users = await db.users.findMany({ where: { is_active: true } });

  // Transform 10,000 users in ~25ms
  const dtos = users.map((user) =>
    createUserDTO()
      .withId(user.id)
      .withEmail(user.email)
      .withName(`${user.first_name} ${user.last_name}`)
      .withCreatedAt(user.created_at.toISOString())
      .withIsActive(user.is_active)
      .build()
  );

  res.json(dtos);
});
```

**Why this rocks:**

- ✅ Blazing fast (400k+ ops/sec)
- ✅ Type-safe transformation
- ✅ Clear, readable code
- ✅ No manual mapping logic

---

### Example 4: Async Validation (Non-Blocking)

```typescript
import { builderAsync } from '@noony-serverless/type-builder';
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
});

const createUser = builderAsync(UserSchema);

// Non-blocking validation (great for high-concurrency APIs)
app.post('/api/users', async (req, res) => {
  try {
    const user = await createUser()
      .withEmail(req.body.email)
      .withUsername(req.body.username)
      .buildAsync(); // ✅ Async validation (won't block event loop)

    await db.users.create(user);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.errors });
  }
});
```

**When to use async:**

- Node.js servers handling thousands of concurrent requests
- When validation might take > 1ms (complex Zod schemas)
- You want to keep the event loop free

---

## 📖 API Reference

### Main Functions

#### `builder<T>(input, explicitKeys?): BuilderFunction<T>`

Create a builder with automatic type detection.

**TL;DR:**

```typescript
const create = builder(ZodSchema | Class | ['keys']);
```

**Parameters:**

- `input`: Zod schema, class constructor, or array of keys
- `explicitKeys?`: Optional explicit keys (for classes if auto-detection fails)

**Returns:** A function that creates a new builder instance

**Examples:**

```typescript
// Zod
const createUser = builder(UserSchema);

// Class
const createProduct = builder(Product);

// Interface
const createOrder = builder<Order>(['id', 'total']);

// Class with explicit keys (rare, but possible)
const createThing = builder(Thing, ['prop1', 'prop2']);
```

---

#### `builderAsync<T>(input, explicitKeys?): AsyncBuilderFunction<T>`

Create an async builder (Zod only, for non-blocking validation).

**TL;DR:**

```typescript
const create = builderAsync(ZodSchema);
const obj = await create().withX(1).buildAsync();
```

**Parameters:**

- `input`: Zod schema (**only** Zod is supported for async)
- `explicitKeys?`: Optional explicit keys

**Returns:** A function that creates a new async builder instance

**Throws:** Error if you pass anything other than a Zod schema

**Examples:**

```typescript
const createUser = builderAsync(UserSchema);

const user = await createUser().withEmail('john@example.com').withName('John').buildAsync(); // ✅ Non-blocking validation
```

---

### Builder Instance Methods

Every builder instance (the thing you get from `createUser()`) has:

#### `.withX(value): BuilderInstance`

Set a property value. Chainable.

```typescript
const user = createUser()
  .withName('John') // Sets `name` property
  .withEmail('j@x.com') // Sets `email` property
  .build();
```

**Note:** The method name is generated from the property name:

- `name` → `.withName()`
- `email` → `.withEmail()`
- `firstName` → `.withFirstName()`

---

#### `.build(): T`

Build the final object (sync).

```typescript
const user = createUser().withName('John').build(); // Returns validated/constructed object
```

**Throws:**

- Zod mode: `ZodError` if validation fails
- Class mode: Any error from your constructor
- Interface mode: Never throws

---

#### `.buildAsync(): Promise<T>`

Build the final object (async, Zod only).

```typescript
const user = await createUser().withName('John').buildAsync(); // Non-blocking validation
```

**Only available** when using `builderAsync()`.

---

### Utility Functions

#### `clearPools(): void`

Clear all object pools (release all pooled builders).

```typescript
import { clearPools } from '@noony-serverless/type-builder';

clearPools(); // Releases memory from pooled objects
```

**When to use:** During tests, or if you're building millions of objects and want to free memory.

---

#### `getPoolStats(): PoolStats`

Get performance stats for all pools.

```typescript
import { getPoolStats } from '@noony-serverless/type-builder';

const stats = getPoolStats();
console.log(stats);
// {
//   totalPools: 3,
//   totalObjects: 150,
//   totalHits: 10000,
//   totalMisses: 150,
//   averageHitRate: 0.985
// }
```

---

#### `resetPoolStats(): void`

Reset performance counters (hits/misses).

```typescript
import { resetPoolStats } from '@noony-serverless/type-builder';

resetPoolStats(); // Resets hit/miss counters
```

---

## 🧠 Advanced Topics

### Object Pooling (How We're So Fast)

You might be thinking: "How the hell are you building 400k objects per second?"

**Answer:** Object pooling. Here's the secret sauce:

```typescript
// Behind the scenes:
const builderPool = new BuilderPool<UserBuilder>(() => new UserBuilder());

// When you call createUser():
const builder = builderPool.get(); // Reuses a pooled builder (if available)
builder.reset(); // Clears previous data
return builder; // You build your object

// After you're done, we return it to the pool automatically
builderPool.release(builder); // Ready for next request
```

**Why this matters:**

- ❌ **Without pooling:** Create 400k objects → GC runs → pause → slowdown
- ✅ **With pooling:** Reuse 100 objects → GC rarely runs → consistent performance

**Pool stats:**

```typescript
import { getPoolStats } from '@noony-serverless/type-builder';

const stats = getPoolStats();
console.log(stats.averageHitRate); // ~98.5% (most builders are reused)
```

**Deep Dive: Pool Configuration**

<details>
<summary>Click to see how pooling works</summary>

We use a custom `FastObjectPool` with:

- **Max size:** 1000 objects per pool (configurable)
- **Hit rate tracking:** Monitors cache efficiency
- **Auto-reset:** Clears builder state between uses
- **Memory-friendly:** Only grows when needed

```typescript
class BuilderPool<T> {
  private pool: T[] = [];
  private hits = 0;
  private misses = 0;

  get(): T {
    if (this.pool.length > 0) {
      this.hits++;
      return this.pool.pop()!; // Reuse existing
    }
    this.misses++;
    return this.createFn(); // Create new if pool is empty
  }

  release(obj: T): void {
    this.resetFn(obj); // Clear data
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj); // Return to pool
    }
  }
}
```

In production, hit rates are typically 95-99%, meaning you're reusing objects constantly.

</details>

---

### TypeScript Tips

#### Type Inference

The builder automatically infers types from your input:

```typescript
const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
});

const createUser = builder(UserSchema);

// TypeScript knows:
createUser().withName('John'); // ✅ OK
createUser().withName(123); // ❌ Error: Expected string
createUser().withFoo('bar'); // ❌ Error: Property 'withFoo' doesn't exist
```

---

#### Partial vs Full Objects

Builders always return complete objects, not partials:

```typescript
const user = createUser()
  .withName('John')
  // .withAge() - forgot this!
  .build();

// user.age is undefined at runtime, but TypeScript thinks it's a number
// This is a limitation of the fluent API pattern
```

**Pro tip:** Use Zod mode for APIs (it'll catch missing fields). Use class mode for internal code (where you control the inputs).

---

### Performance Tuning

#### When Speed Matters

1. **Use interface mode** for internal transformations
2. **Use class mode** when you need methods
3. **Use Zod mode** only at API boundaries

```typescript
// API boundary: Validate
const validateInput = builder(CreateUserSchema);

// Internal: Fast transformation
interface UserEntity {
  id: number;
  name: string;
}
const createEntity = builder<UserEntity>(['id', 'name']);

// Domain: Business logic
class User {
  notify() {
    /* ... */
  }
}
const createDomain = builder(User);
```

---

#### Benchmarking Your Own Code

Want to see how fast your builders are?

```typescript
import { builder, getPoolStats, resetPoolStats } from '@noony-serverless/type-builder';

const createUser = builder(UserSchema);

// Warmup (fill the pool)
for (let i = 0; i < 100; i++) {
  createUser().withName('test').withEmail('test@example.com').build();
}

resetPoolStats();

// Benchmark
const start = performance.now();
for (let i = 0; i < 100000; i++) {
  createUser().withName('John').withEmail('john@example.com').build();
}
const end = performance.now();

console.log(`Time: ${end - start}ms`);
console.log(`Ops/sec: ${100000 / ((end - start) / 1000)}`);
console.log(`Pool hit rate: ${getPoolStats().averageHitRate * 100}%`);
```

---

## 🚀 Migration Guide

### From Manual Builder Classes

**Before:**

```typescript
class UserBuilder {
  private name?: string;
  private email?: string;

  withName(name: string): this {
    this.name = name;
    return this;
  }

  withEmail(email: string): this {
    this.email = email;
    return this;
  }

  build(): User {
    if (!this.name || !this.email) {
      throw new Error('Missing required fields');
    }
    return new User(this.name, this.email);
  }
}

const createUser = () => new UserBuilder();
```

**After:**

```typescript
import builder from '@noony-serverless/type-builder';
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

const createUser = builder(UserSchema);
```

**You just deleted 20 lines of boilerplate.** You're welcome. 🎉

---

### From Generic Builders

**Before:**

```typescript
class GenericBuilder<T> {
  private data: Partial<T> = {};

  with<K extends keyof T>(key: K, value: T[K]): this {
    this.data[key] = value;
    return this;
  }

  build(): T {
    return this.data as T; // 😬 Type assertion
  }
}

const createUser = () => new GenericBuilder<User>();
createUser().with('name', 'John').with('email', 'john@example.com').build();
```

**After:**

```typescript
const createUser = builder<User>(['name', 'email']);
createUser().withName('John').withEmail('john@example.com').build();
```

**Benefits:**

- ✅ Better autocomplete (`.withName()` vs `.with('name')`)
- ✅ No type assertions
- ✅ 10x faster (object pooling)

---

## 🐛 Troubleshooting

### "Unable to detect builder type"

**Problem:**

```typescript
const create = builder(myThing);
// Error: Unable to detect builder type. Expected Zod schema, class constructor, or array of keys.
```

**Solution:** Pass explicit keys or check your input:

```typescript
// If it's supposed to be a class:
console.log(typeof myThing); // Should be 'function'
console.log(myThing.prototype); // Should exist

// If it's supposed to be Zod:
console.log(myThing.parse); // Should be a function

// Workaround: Pass explicit keys
const create = builder(myThing, ['key1', 'key2']);
```

---

### "Property 'withX' does not exist"

**Problem:**

```typescript
const create = builder(MyClass);
create().withFoo('bar'); // Error: Property 'withFoo' does not exist
```

**Solution:** Make sure your class actually has a `foo` property:

```typescript
class MyClass {
  foo!: string; // ✅ Property exists

  constructor(data: Partial<MyClass>) {
    Object.assign(this, data);
  }
}
```

If your class doesn't assign properties in the constructor, we can't detect them. Use explicit keys:

```typescript
const create = builder(MyClass, ['foo', 'bar']);
```

---

### Zod Validation Errors

**Problem:**

```typescript
const user = createUser().withEmail('invalid-email').build(); // Throws ZodError
```

**Solution:** Catch and handle Zod errors:

```typescript
import { z } from 'zod';

try {
  const user = createUser().withEmail('invalid-email').build();
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Validation failed:', error.errors);
    // [{ path: ['email'], message: 'Invalid email' }]
  }
}
```

---

## 🎨 Best Practices

### 1. Validate at Boundaries

```typescript
// ✅ GOOD: Validate external input
const validateUser = builder(UserSchema);

app.post('/api/users', (req) => {
  const user = validateUser().withEmail(req.body.email).build(); // ✅ Throws if invalid

  // Now it's safe to use internally
  processUser(user);
});
```

```typescript
// ❌ BAD: Validating internal data (slow)
function processUser(user: User) {
  const validated = validateUser().withEmail(user.email).build(); // ❌ Wasteful - already validated upstream
}
```

---

### 2. Use Interface Mode for Speed

```typescript
// ✅ GOOD: Fast internal transformations
interface UserDTO {
  id: number;
  name: string;
}
const createDTO = builder<UserDTO>(['id', 'name']);

function mapToDTO(user: User): UserDTO {
  return createDTO().withId(user.id).withName(user.name).build(); // ⚡ 400k ops/sec
}
```

```typescript
// ❌ BAD: Using Zod for internal data (slow)
const DTOSchema = z.object({ id: z.number(), name: z.string() });
const createDTO = builder(DTOSchema);

function mapToDTO(user: User): UserDTO {
  return createDTO().withId(user.id).withName(user.name).build(); // 🐌 100k ops/sec (4x slower for no reason)
}
```

---

### 3. Use Class Mode for Business Logic

```typescript
// ✅ GOOD: Domain logic in the class
class Order {
  total!: number;

  applyDiscount(percent: number) {
    this.total *= 1 - percent / 100;
  }
}

const order = createOrder().withTotal(100).build();
order.applyDiscount(10); // ✅ Business logic where it belongs
```

```typescript
// ❌ BAD: Business logic scattered in services
interface Order {
  total: number;
}

class OrderService {
  applyDiscount(order: Order, percent: number) {
    order.total *= 1 - percent / 100; // ❌ Logic in the wrong place
  }
}
```

---

## 📊 Benchmarks

Run the benchmarks yourself:

```bash
npm run benchmark
```

Or check out the live dashboard:

```bash
npm run serve
# Opens http://localhost:8080/builder_visual_dashboard.html
```

**Results on M1 MacBook Pro:**

```
🚀 Interface Builder: 420,000 ops/sec (2.4μs per operation)
🚀 Class Builder:     310,000 ops/sec (3.2μs per operation)
🚀 Zod Builder:       105,000 ops/sec (9.5μs per operation)

💾 Memory per object: 60-90 bytes
♻️  Pool hit rate:    98.5%
🚫 Blocking ops:      0
```

---

## 📚 Documentation

### Complete Documentation Suite

This project follows the **[Diataxis](https://diataxis.fr/)** framework for structured, high-quality documentation:

| Document                                     | Type          | Purpose                               | Start Here If...                  |
| -------------------------------------------- | ------------- | ------------------------------------- | --------------------------------- |
| **[📖 Documentation Hub](./docs/README.md)** | Index         | Navigate all docs                     | You want an overview              |
| **[🎯 Explanation](./docs/EXPLANATION.md)**  | Understanding | Learn WHY and HOW it works            | You're evaluating the library     |
| **[🎓 Tutorial](./docs/TUTORIAL.md)**        | Learning      | Step-by-step hands-on guide           | You're learning to use it         |
| **[🔧 How-To Guide](./docs/HOW-TO.md)**      | Tasks         | Practical recipes for common problems | You need to solve a specific task |
| **[📋 API Reference](./docs/REFERENCE.md)**  | Information   | Complete API documentation            | You need to look up an API detail |

### Quick Links

**Learning Path:**

1. [Why Use This Library?](./docs/EXPLANATION.md#the-builder-pattern-problem) - Understand the problem
2. [Getting Started Tutorial](./docs/TUTORIAL.md) - Build your first builder
3. [Common Recipes](./docs/HOW-TO.md) - Solve real-world problems
4. [API Reference](./docs/REFERENCE.md) - Look up function signatures

**Popular Topics:**

- [Validate API Input](./docs/HOW-TO.md#how-to-validate-api-input)
- [Transform Database Records](./docs/HOW-TO.md#how-to-transform-database-records-to-dtos)
- [Optimize Performance](./docs/HOW-TO.md#how-to-optimize-for-high-throughput-apis)
- [Integrate with Express](./docs/HOW-TO.md#how-to-integrate-with-expressjs)
- [Handle Errors](./docs/HOW-TO.md#how-to-handle-validation-errors-gracefully)
- [Test Builders](./docs/HOW-TO.md#how-to-test-builders)

### Additional Resources

- **[Coverage Analysis](./COVERAGE-ANALYSIS.md)** - 97.43% test coverage details
- **[Test Summary](./TEST-SUMMARY.md)** - 396 passing tests
- **[Performance Benchmarks](./PERFORMANCE.md)** - Speed and memory analysis

---

## 🤝 Contributing

Found a bug? Have a feature idea? PRs welcome!

```bash
git clone https://github.com/your-org/typescript-bulder-lib.git
cd typescript-bulder-lib
npm install
npm run test
```

**Running tests:**

```bash
npm run test           # Run tests
npm run test:watch     # Watch mode
npm run test:coverage  # Generate coverage report (96.88% and counting!)
```

---

## 📄 License

MIT © [Your Name]

---

## 🙏 Acknowledgments

Built with:

- [Zod](https://zod.dev/) - Amazing TypeScript validation
- [Vitest](https://vitest.dev/) - Blazing fast test runner
- [tsup](https://tsup.egoist.dev/) - TypeScript bundler

Inspired by the builder pattern, but without the boilerplate.

---

**Questions? Issues? Ideas?**

Open an issue on [GitHub](https://github.com/your-org/typescript-bulder-lib/issues) or hit me up on Twitter [@yourhandle](https://twitter.com/yourhandle).

**Now go build something awesome!** 🚀
