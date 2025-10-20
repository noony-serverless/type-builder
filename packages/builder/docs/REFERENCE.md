# API Reference

**Complete API documentation for @noony-serverless/type-builder**

---

## Table of Contents

- [Main API](#main-api)
  - [builder()](#builder)
  - [builderAsync()](#builderasync)
- [Types](#types)
  - [FluentBuilder](#fluentbuilder)
  - [FluentAsyncBuilder](#fluentasyncbuilder)
  - [BuilderConfig](#builderconfig)
  - [BuilderType](#buildertype)
- [Utility Functions](#utility-functions)
  - [clearPools()](#clearpools)
  - [getPoolStats()](#getpoolstats)
  - [getDetailedPoolStats()](#getdetailedpoolstats)
  - [resetPoolStats()](#resetpoolstats)
- [Detection Functions](#detection-functions)
  - [detectBuilderType()](#detectbuildertype)
  - [isZodSchema()](#iszodschema)
  - [isClass()](#isclass)
  - [extractKeysFromZod()](#extractkeysfromzod)
  - [extractKeysFromClass()](#extractkeysfromclass)

---

## Main API

### `builder()`

Creates a synchronous builder function for the given input.

#### Signatures

```typescript
// Overload 1: Zod schema
function builder<T extends ZodSchema>(
  input: T
): () => FluentBuilder<InferZodType<T>>;

// Overload 2: Class constructor
function builder<T>(
  input: new (...args: any[]) => T
): () => FluentBuilder<T>;

// Overload 3: Interface with explicit keys
function builder<T>(
  input: (keyof T & string)[]
): () => FluentBuilder<T>;
```

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `input` | `ZodSchema \| Constructor \| string[]` | The schema, class, or property keys to build from |
| `explicitKeys` | `string[]` (optional) | Manual property keys override |

#### Returns

A factory function that returns a `FluentBuilder<T>` instance.

#### Examples

**Zod Schema:**
```typescript
import { z } from 'zod';
import builder from '@noony-serverless/type-builder';

const UserSchema = z.object({
  email: z.string().email(),
  name: z.string()
});

const createUser = builder(UserSchema);

const user = createUser()
  .withEmail('alice@example.com')
  .withName('Alice')
  .build();

// Type: { email: string; name: string }
```

**Class:**
```typescript
class Product {
  id!: number;
  name!: string;
  price!: number;
}

const createProduct = builder(Product);

const product = createProduct()
  .withId(1)
  .withName('Laptop')
  .withPrice(1200)
  .build();

// Type: Product (instance of Product class)
```

**Interface:**
```typescript
interface Order {
  id: string;
  total: number;
  status: 'pending' | 'completed';
}

const createOrder = builder<Order>(['id', 'total', 'status']);

const order = createOrder()
  .withId('ORD-123')
  .withTotal(1500)
  .withStatus('pending')
  .build();

// Type: Order
```

#### Throws

- `Error` - If input type cannot be detected
- `ZodError` - If Zod validation fails during `.build()`

---

### `builderAsync()`

Creates an asynchronous builder function for Zod schemas only.

#### Signature

```typescript
function builderAsync<T extends ZodSchema>(
  input: T,
  explicitKeys?: string[]
): () => FluentAsyncBuilder<InferZodType<T>>;
```

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `input` | `ZodSchema` | The Zod schema to validate against |
| `explicitKeys` | `string[]` (optional) | Manual property keys override |

#### Returns

A factory function that returns a `FluentAsyncBuilder<T>` instance.

#### Example

```typescript
import { z } from 'zod';
import { builderAsync } from '@noony-serverless/type-builder';

const UserSchema = z.object({
  email: z.string().email(),
  name: z.string()
});

const createUser = builderAsync(UserSchema);

const user = await createUser()
  .withEmail('alice@example.com')
  .withName('Alice')
  .buildAsync(); // ← Async validation

// Type: { email: string; name: string }
```

#### Notes

- Only works with Zod schemas
- Uses `schema.parseAsync()` for non-blocking validation
- Recommended for high-concurrency scenarios (1000+ req/sec)

#### Throws

- `Error` - If input is not a Zod schema
- `ZodError` - If Zod validation fails during `.buildAsync()`

---

## Types

### `FluentBuilder<T>`

The main builder interface with fluent `.withXYZ()` methods.

#### Type Definition

```typescript
type FluentBuilder<T> = WithMethods<T> & {
  build(): T;
};

type WithMethods<T> = {
  [K in keyof T & string as `with${Capitalize<K>}`]: (value: T[K]) => FluentBuilder<T>;
};
```

#### Methods

- **`.withXYZ(value)`** - Sets property `xyz` to `value`. Returns `this` for chaining.
- **`.build()`** - Validates and constructs the final object.

#### Example

```typescript
interface User {
  name: string;
  email: string;
  age: number;
}

// Type expands to:
type UserBuilder = {
  withName(value: string): UserBuilder;
  withEmail(value: string): UserBuilder;
  withAge(value: number): UserBuilder;
  build(): User;
};
```

---

### `FluentAsyncBuilder<T>`

Async version of `FluentBuilder` with `.buildAsync()`.

#### Type Definition

```typescript
type FluentAsyncBuilder<T> = WithMethods<T> & {
  buildAsync(): Promise<T>;
};
```

#### Methods

- **`.withXYZ(value)`** - Sets property `xyz` to `value`. Returns `this` for chaining.
- **`.buildAsync()`** - Asynchronously validates and constructs the final object.

#### Example

```typescript
const user = await createUser()
  .withEmail('test@example.com')
  .withName('Test User')
  .buildAsync(); // ← Returns Promise<User>
```

---

### `BuilderConfig`

Internal configuration object for builder instances.

#### Type Definition

```typescript
type BuilderConfig =
  | { type: 'zod'; schema: ZodSchema; keys?: string[] }
  | { type: 'class'; constructor: new (...args: any[]) => any; keys?: string[] }
  | { type: 'interface'; keys: string[] };
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `type` | `'zod' \| 'class' \| 'interface'` | The detected builder type |
| `schema` | `ZodSchema` (Zod only) | The Zod schema |
| `constructor` | `Constructor` (Class only) | The class constructor |
| `keys` | `string[]` | Property names |

#### Notes

This is an internal type. You typically don't interact with it directly.

---

### `BuilderType`

Union type representing builder modes.

#### Type Definition

```typescript
type BuilderType = 'interface' | 'class' | 'zod';
```

#### Values

- `'interface'` - Plain object builder (fastest)
- `'class'` - Class instance builder (with methods)
- `'zod'` - Zod schema builder (with validation)

---

## Utility Functions

### `clearPools()`

Clears all object pools, releasing pooled builder instances.

#### Signature

```typescript
function clearPools(): void;
```

#### Example

```typescript
import { clearPools } from '@noony-serverless/type-builder';

// Clear all pools
clearPools();
```

#### Use Cases

- Testing (reset state between tests)
- Memory cleanup in long-running processes
- Admin endpoints for cache clearing

#### Notes

After calling `clearPools()`, the next builder call will create new instances. Performance may temporarily decrease until the pool refills.

---

### `getPoolStats()`

Returns basic statistics about current pool usage.

#### Signature

```typescript
function getPoolStats(): { sync: number; async: number };
```

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `sync` | `number` | Total objects in sync pools |
| `async` | `number` | Total objects in async pools |

#### Example

```typescript
import { getPoolStats } from '@noony-serverless/type-builder';

const stats = getPoolStats();
console.log(`Sync pool size: ${stats.sync}`);
console.log(`Async pool size: ${stats.async}`);

// Output:
// Sync pool size: 45
// Async pool size: 10
```

---

### `getDetailedPoolStats()`

Returns detailed statistics for all pools.

#### Signature

```typescript
function getDetailedPoolStats(): {
  sync: PoolStatistics;
  async: PoolStatistics;
};

interface PoolStatistics {
  totalPools: number;
  totalObjects: number;
  totalHits: number;
  totalMisses: number;
  totalCreated: number;
  averageHitRate: number;
  averageUtilization: number;
  pools: Array<{
    key: string;
    size: number;
    hits: number;
    misses: number;
    totalCreated: number;
    hitRate: number;
    utilization: number;
  }>;
}
```

#### Returns

Detailed statistics object with pool metrics.

#### Example

```typescript
import { getDetailedPoolStats } from '@noony-serverless/type-builder';

const stats = getDetailedPoolStats();

console.log('Sync Pools:');
console.log(`  Total pools: ${stats.sync.totalPools}`);
console.log(`  Total objects: ${stats.sync.totalObjects}`);
console.log(`  Hit rate: ${(stats.sync.averageHitRate * 100).toFixed(2)}%`);
console.log(`  Utilization: ${(stats.sync.averageUtilization * 100).toFixed(2)}%`);

console.log('\nPool Details:');
stats.sync.pools.forEach(pool => {
  console.log(`  ${pool.key}:`);
  console.log(`    Size: ${pool.size}`);
  console.log(`    Hits: ${pool.hits}`);
  console.log(`    Misses: ${pool.misses}`);
  console.log(`    Hit rate: ${(pool.hitRate * 100).toFixed(2)}%`);
});

// Output:
// Sync Pools:
//   Total pools: 3
//   Total objects: 150
//   Hit rate: 98.50%
//   Utilization: 75.30%
//
// Pool Details:
//   zod-email,name,age:
//     Size: 50
//     Hits: 4925
//     Misses: 75
//     Hit rate: 98.50%
```

#### Metrics Explained

- **Hit rate** - Percentage of pool reuses vs new allocations (higher is better)
- **Utilization** - Percentage of pool capacity in use
- **Hits** - Number of times an object was reused from pool
- **Misses** - Number of times a new object was created

---

### `resetPoolStats()`

Resets pool statistics counters without clearing the pools.

#### Signature

```typescript
function resetPoolStats(): void;
```

#### Example

```typescript
import { resetPoolStats, getDetailedPoolStats } from '@noony-serverless/type-builder';

// Reset counters
resetPoolStats();

// Run workload
for (let i = 0; i < 10000; i++) {
  createUser().withEmail('test@example.com').build();
}

// Check stats (counters start from 0)
const stats = getDetailedPoolStats();
console.log(`Hits: ${stats.sync.totalHits}`);
console.log(`Misses: ${stats.sync.totalMisses}`);
```

#### Notes

Useful for performance testing and benchmarking specific workloads.

---

## Detection Functions

### `detectBuilderType()`

Detects the builder type from input.

#### Signature

```typescript
function detectBuilderType(input: any): BuilderType;
```

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `input` | `any` | The schema, class, or array to detect |

#### Returns

- `'zod'` - If input is a Zod schema
- `'class'` - If input is a class constructor
- `'interface'` - If input is an array

#### Example

```typescript
import { detectBuilderType } from '@noony-serverless/type-builder/detection';
import { z } from 'zod';

const schema = z.object({ name: z.string() });
console.log(detectBuilderType(schema)); // 'zod'

class User {
  name!: string;
}
console.log(detectBuilderType(User)); // 'class'

console.log(detectBuilderType(['name', 'email'])); // 'interface'
```

#### Throws

- `Error` - If input type cannot be detected

---

### `isZodSchema()`

Checks if input is a Zod schema.

#### Signature

```typescript
function isZodSchema(input: any): input is ZodSchema;
```

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `input` | `any` | The value to check |

#### Returns

`true` if input is a Zod schema, `false` otherwise.

#### Example

```typescript
import { isZodSchema } from '@noony-serverless/type-builder/detection';
import { z } from 'zod';

const schema = z.object({ name: z.string() });
console.log(isZodSchema(schema)); // true

class User {}
console.log(isZodSchema(User)); // false
```

---

### `isClass()`

Checks if input is a class constructor.

#### Signature

```typescript
function isClass(input: any): input is new (...args: any[]) => any;
```

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `input` | `any` | The value to check |

#### Returns

`true` if input is a class constructor, `false` otherwise.

#### Example

```typescript
import { isClass } from '@noony-serverless/type-builder/detection';

class User {
  name!: string;
}

console.log(isClass(User)); // true

const schema = { name: 'string' };
console.log(isClass(schema)); // false
```

---

### `extractKeysFromZod()`

Extracts property names from a Zod schema.

#### Signature

```typescript
function extractKeysFromZod(schema: ZodSchema): string[];
```

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `schema` | `ZodSchema` | The Zod schema to extract from |

#### Returns

Array of property names.

#### Example

```typescript
import { extractKeysFromZod } from '@noony-serverless/type-builder/detection';
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  age: z.number()
});

const keys = extractKeysFromZod(UserSchema);
console.log(keys); // ['email', 'name', 'age']
```

---

### `extractKeysFromClass()`

Extracts property names from a class constructor.

#### Signature

```typescript
function extractKeysFromClass<T>(
  constructor: new (...args: any[]) => T
): string[];
```

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `constructor` | `Constructor<T>` | The class constructor |

#### Returns

Array of property names.

#### Example

```typescript
import { extractKeysFromClass } from '@noony-serverless/type-builder/detection';

class Product {
  id!: number;
  name!: string;
  price!: number;
}

const keys = extractKeysFromClass(Product);
console.log(keys); // ['id', 'name', 'price']
```

#### Notes

- Uses a Proxy to detect property assignments in the constructor
- Falls back to multiple strategies if Proxy approach fails
- Filters out 'constructor' property

---

## Error Handling

### ZodError

Thrown when Zod validation fails in `.build()` or `.buildAsync()`.

#### Example

```typescript
import { z, ZodError } from 'zod';

try {
  const user = createUser()
    .withEmail('invalid-email')
    .build();
} catch (error) {
  if (error instanceof ZodError) {
    console.error('Validation errors:', error.errors);
    // [
    //   {
    //     code: 'invalid_string',
    //     validation: 'email',
    //     path: ['email'],
    //     message: 'Invalid email'
    //   }
    // ]
  }
}
```

### TypeError

Thrown when builder is called with incorrect types.

#### Example

```typescript
const createUser = builder<User>(['email', 'name']);

createUser()
  .withEmail(123) // ❌ TypeScript error: Argument of type 'number' is not assignable to 'string'
  .build();
```

---

## Type Inference

### InferZodType

Extracts TypeScript type from Zod schema.

#### Type Definition

```typescript
export type InferZodType<T> = T extends ZodSchema<infer U> ? U : never;
```

#### Example

```typescript
import { z } from 'zod';
import type { InferZodType } from '@noony-serverless/type-builder';

const UserSchema = z.object({
  email: z.string(),
  name: z.string()
});

type User = InferZodType<typeof UserSchema>;
// Type: { email: string; name: string }
```

---

## Performance Characteristics

### Operation Complexity

| Operation | Time Complexity | Notes |
|-----------|----------------|-------|
| `builder()` call | O(1) | Returns cached pool |
| `.withXYZ()` | O(1) | Property assignment |
| `.build()` (interface) | O(n) | n = number of properties |
| `.build()` (class) | O(n) | n = number of properties |
| `.build()` (Zod) | O(n × m) | n = properties, m = validation complexity |
| `.buildAsync()` | O(n × m) | Same as Zod, but non-blocking |

### Throughput Benchmarks

| Mode | Operations/second | Use Case |
|------|------------------|----------|
| Interface | ~400,000 | Data transformation |
| Class | ~300,000 | Domain models |
| Zod (sync) | ~100,000 | Input validation |
| Zod (async) | ~100,000 | High-concurrency validation |

### Memory Usage

- **Pool overhead:** ~100 bytes per pooled instance
- **Builder instance:** ~50 bytes + property data
- **Pool hit rate:** 95-99% (most instances reused)

---

## TypeScript Configuration

### Recommended `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### Required Compiler Options

- `strict: true` - For full type safety
- `target: ES2020` or higher - For Proxy support

---

## Module Exports

### Main Export

```typescript
import builder from '@noony-serverless/type-builder';
```

### Named Exports

```typescript
import {
  builder,
  builderAsync,
  clearPools,
  getPoolStats,
  getDetailedPoolStats,
  resetPoolStats
} from '@noony-serverless/type-builder';
```

### Type Exports

```typescript
import type {
  FluentBuilder,
  FluentAsyncBuilder,
  BuilderConfig,
  BuilderType,
  InferZodType
} from '@noony-serverless/type-builder';
```

### Detection Exports

```typescript
import {
  detectBuilderType,
  isZodSchema,
  isClass,
  extractKeysFromZod,
  extractKeysFromClass
} from '@noony-serverless/type-builder/detection';
```

---

## Version Compatibility

| Package Version | TypeScript | Node.js | Zod |
|----------------|------------|---------|-----|
| 1.x.x | ≥5.0 | ≥18.0 | ≥3.0 |

---

## Further Reading

- **[Tutorial](./TUTORIAL.md)** - Step-by-step learning guide
- **[How-To Guide](./HOW-TO.md)** - Practical recipes
- **[Explanation](./EXPLANATION.md)** - Design philosophy and trade-offs
- **[GitHub](https://github.com/your-org/typescript-bulder-lib)** - Source code and issues

---

**Last Updated:** 2025-10-18
**Version:** 1.0.0
