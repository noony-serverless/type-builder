# Core Functions

Complete API reference for UltraFastBuilder's core functions.

## builder()

Creates a synchronous builder with automatic type detection.

### Signature

```typescript
function builder<T>(
  input: ZodSchema<T> | Constructor<T> | ReadonlyArray<keyof T>,
  explicitKeys?: ReadonlyArray<keyof T>
): BuilderFunction<T>;
```

### Parameters

| Parameter      | Type                                                           | Required | Description                                                  |
| -------------- | -------------------------------------------------------------- | -------- | ------------------------------------------------------------ |
| `input`        | `ZodSchema<T>` \| `Constructor<T>` \| `ReadonlyArray<keyof T>` | Yes      | Zod schema, class constructor, or array of property keys     |
| `explicitKeys` | `ReadonlyArray<keyof T>`                                       | No       | Optional explicit keys (for classes if auto-detection fails) |

### Returns

`BuilderFunction<T>` - A function that creates new builder instances

### Examples

#### Zod Schema

```typescript
import { builder } from '@noony-serverless/type-builder';
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

const createUser = builder(UserSchema);

const user = createUser().withName('John Doe').withEmail('john@example.com').build();
```

#### Class

```typescript
class Product {
  id!: number;
  name!: string;

  constructor(data: Partial<Product>) {
    Object.assign(this, data);
  }

  getDisplayName() {
    return `Product: ${this.name}`;
  }
}

const createProduct = builder(Product);

const product = createProduct().withId(1).withName('Laptop').build();

console.log(product.getDisplayName()); // "Product: Laptop"
```

#### Interface

```typescript
interface Order {
  id: string;
  total: number;
}

const createOrder = builder<Order>(['id', 'total']);

const order = createOrder().withId('ORD-001').withTotal(99.99).build();
```

#### With Explicit Keys

```typescript
class MyClass {
  prop1!: string;
  prop2!: number;

  constructor(data: Partial<MyClass>) {
    Object.assign(this, data);
  }
}

// Pass explicit keys if auto-detection fails
const create = builder(MyClass, ['prop1', 'prop2']);
```

### Type Inference

The builder automatically infers types from the input:

```typescript
const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
});

const createUser = builder(UserSchema);

// TypeScript knows the methods:
createUser().withName('John'); // ✅ OK
createUser().withAge(30); // ✅ OK
createUser().withFoo('bar'); // ❌ Error: Property 'withFoo' does not exist
```

## builderAsync()

Creates an async builder with non-blocking validation (Zod only).

### Signature

```typescript
function builderAsync<T>(
  input: ZodSchema<T>,
  explicitKeys?: ReadonlyArray<keyof T>
): AsyncBuilderFunction<T>;
```

### Parameters

| Parameter      | Type                     | Required | Description                        |
| -------------- | ------------------------ | -------- | ---------------------------------- |
| `input`        | `ZodSchema<T>`           | Yes      | Zod schema (only Zod is supported) |
| `explicitKeys` | `ReadonlyArray<keyof T>` | No       | Optional explicit keys             |

### Returns

`AsyncBuilderFunction<T>` - A function that creates new async builder instances

### Throws

- `Error` if input is not a Zod schema

### Examples

#### Basic Usage

```typescript
import { builderAsync } from '@noony-serverless/type-builder';
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
});

const createUser = builderAsync(UserSchema);

const user = await createUser().withEmail('john@example.com').withName('John Doe').buildAsync();
```

#### In Express

```typescript
app.post('/api/users', async (req, res) => {
  try {
    const user = await createUser().withEmail(req.body.email).withName(req.body.name).buildAsync();

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.errors });
  }
});
```

#### Error Handling

```typescript
try {
  const user = await createUser().withEmail('invalid-email').buildAsync();
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('Validation failed:', error.errors);
  }
}
```

## clearPools()

Clears all object pools, releasing pooled builder instances.

### Signature

```typescript
function clearPools(): void;
```

### Parameters

None

### Returns

`void`

### Examples

```typescript
import { clearPools } from '@noony-serverless/type-builder';

// Clear all pools
clearPools();

// Typical use: in tests
afterEach(() => {
  clearPools();
});

// Or during graceful shutdown
process.on('SIGTERM', () => {
  clearPools();
  server.close();
});
```

### When to Use

- ✅ Between test cases to prevent pollution
- ✅ During graceful shutdown
- ✅ After large batch processing jobs
- ❌ During normal operation (defeats pooling)

## getPoolStats()

Returns performance statistics for all object pools.

### Signature

```typescript
function getPoolStats(): PoolStats;
```

### Parameters

None

### Returns

```typescript
interface PoolStats {
  totalPools: number; // Number of active pools
  totalObjects: number; // Total pooled objects
  totalHits: number; // Number of pool hits
  totalMisses: number; // Number of pool misses
  averageHitRate: number; // Hit rate (0-1)
}
```

### Examples

```typescript
import { getPoolStats } from '@noony-serverless/type-builder';

// Run some operations
for (let i = 0; i < 10000; i++) {
  createUser().withName('John').build();
}

// Check performance
const stats = getPoolStats();

console.log('Pool Statistics:');
console.log(`  Pools: ${stats.totalPools}`);
console.log(`  Objects: ${stats.totalObjects}`);
console.log(`  Hits: ${stats.totalHits}`);
console.log(`  Misses: ${stats.totalMisses}`);
console.log(`  Hit Rate: ${(stats.averageHitRate * 100).toFixed(1)}%`);

// Output:
// Pool Statistics:
//   Pools: 1
//   Objects: 50
//   Hits: 9950
//   Misses: 50
//   Hit Rate: 99.5%
```

### Monitoring

```typescript
// Add to health check endpoint
app.get('/health', (req, res) => {
  const stats = getPoolStats();

  res.json({
    status: 'ok',
    pools: {
      count: stats.totalPools,
      objects: stats.totalObjects,
      hitRate: `${(stats.averageHitRate * 100).toFixed(1)}%`,
    },
  });
});
```

## resetPoolStats()

Resets pool performance counters (hits/misses) without clearing the pools.

### Signature

```typescript
function resetPoolStats(): void;
```

### Parameters

None

### Returns

`void`

### Examples

```typescript
import { resetPoolStats, getPoolStats } from '@noony-serverless/type-builder';

// Reset counters
resetPoolStats();

// Objects remain in pool, but counters are reset
const stats = getPoolStats();
console.log(stats);
// { totalPools: 1, totalObjects: 100, totalHits: 0, totalMisses: 0, averageHitRate: 0 }
```

### When to Use

- ✅ Before benchmarking (reset counters after warmup)
- ✅ Periodic monitoring (reset counters each interval)
- ❌ During normal operation (not usually needed)

### Benchmarking Example

```typescript
const createUser = builder(UserSchema);

// Warmup
for (let i = 0; i < 100; i++) {
  createUser().withName('warmup').build();
}

// Reset stats after warmup
resetPoolStats();

// Benchmark
console.time('benchmark');
for (let i = 0; i < 100000; i++) {
  createUser().withName('test').build();
}
console.timeEnd('benchmark');

const stats = getPoolStats();
console.log(`Hit rate: ${(stats.averageHitRate * 100).toFixed(1)}%`);
```

## Builder Instance Methods

Methods available on builder instances (returned by `createUser()`, etc.)

### .withX(value)

Sets a property value. Method name is generated from property name.

#### Signature

```typescript
withX(value: T[keyof T]): this
```

#### Returns

`this` - The builder instance (for chaining)

#### Examples

```typescript
const user = createUser()
  .withName('John') // Sets 'name' property
  .withEmail('j@x.com') // Sets 'email' property
  .withAge(30) // Sets 'age' property
  .build();
```

#### Method Name Generation

| Property    | Method             |
| ----------- | ------------------ |
| `name`      | `.withName()`      |
| `email`     | `.withEmail()`     |
| `firstName` | `.withFirstName()` |
| `isActive`  | `.withIsActive()`  |
| `user_id`   | `.withUser_id()`   |

### .build()

Builds the final object (synchronous).

#### Signature

```typescript
build(): T
```

#### Returns

`T` - The built object

#### Throws

- `ZodError` (Zod mode) - If validation fails
- `Error` (Class mode) - Any error from constructor
- (Interface mode) - Never throws

#### Examples

```typescript
// Zod mode - may throw validation error
try {
  const user = createUser().withEmail('invalid-email').build();
} catch (error) {
  console.error('Validation failed:', error);
}

// Interface mode - never throws
const order = createOrder().withId('ORD-001').build(); // Always succeeds

// Class mode - may throw from constructor
const product = createProduct().withId(1).build(); // May throw if constructor validates
```

### .buildAsync()

Builds the final object (asynchronous, Zod only).

#### Signature

```typescript
buildAsync(): Promise<T>
```

#### Returns

`Promise<T>` - Promise that resolves to the built object

#### Throws

- `ZodError` - If validation fails

#### Examples

```typescript
// Async validation
try {
  const user = await createUserAsync().withEmail('john@example.com').buildAsync();
} catch (error) {
  console.error('Validation failed:', error);
}
```

## Type Definitions

See [Types API Reference](./types.md) for complete type definitions.

## Next Steps

- [Types Reference](./types.md) - Type definitions
- [Utilities Reference](./utilities.md) - Utility functions
- [Basic Usage](../getting-started/basic-usage.md) - Learn the basics
