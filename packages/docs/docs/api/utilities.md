# Utilities Reference

Utility functions and helpers for working with UltraFastBuilder.

## Pool Management

### clearPools()

See [Core Functions: clearPools()](./core-functions.md#clearpools)

### getPoolStats()

See [Core Functions: getPoolStats()](./core-functions.md#getpoolstats)

### resetPoolStats()

See [Core Functions: resetPoolStats()](./core-functions.md#resetpoolstats)

## Type Detection

### isZodSchema()

Check if an input is a Zod schema.

```typescript
function isZodSchema<T>(input: any): input is ZodSchema<T>;
```

**Parameters:**

- `input`: Any value to check

**Returns:**

- `boolean`: True if input is a Zod schema

**Example:**

```typescript
import { z } from 'zod';

const UserSchema = z.object({ name: z.string() });

if (isZodSchema(UserSchema)) {
  console.log('This is a Zod schema');
}
```

### isClass()

Check if an input is a class constructor.

```typescript
function isClass<T>(input: any): input is Constructor<T>;
```

**Parameters:**

- `input`: Any value to check

**Returns:**

- `boolean`: True if input is a class constructor

**Example:**

```typescript
class User {}

if (isClass(User)) {
  console.log('This is a class');
}
```

## Helper Functions

### capitalize()

Capitalize the first letter of a string (used internally for method names).

```typescript
function capitalize(str: string): string;
```

**Parameters:**

- `str`: String to capitalize

**Returns:**

- `string`: Capitalized string

**Example:**

```typescript
capitalize('name'); // 'Name'
capitalize('email'); // 'Email'
capitalize('firstName'); // 'FirstName'
```

### generatePoolKey()

Generate a unique key for builder pools (internal use).

```typescript
function generatePoolKey(mode: string, keys: string[]): string;
```

**Parameters:**

- `mode`: Builder mode ('zod' | 'class' | 'interface')
- `keys`: Array of property keys

**Returns:**

- `string`: Unique pool key

**Example:**

```typescript
generatePoolKey('zod', ['name', 'email']);
// 'zod-name,email'

generatePoolKey('class', ['Product']);
// 'class-Product'
```

## Debugging Utilities

### debugBuilder()

Print debug information about a builder (internal use).

```typescript
function debugBuilder<T>(builder: Builder<T>): void;
```

**Example:**

```typescript
const createUser = builder(UserSchema);
const userBuilder = createUser();

debugBuilder(userBuilder);
// Logs:
// Builder {
//   mode: 'zod',
//   keys: ['name', 'email'],
//   data: {}
// }
```

### logPoolStats()

Pretty-print pool statistics.

```typescript
function logPoolStats(): void;
```

**Example:**

```typescript
import { logPoolStats } from '@ultra-fast-builder/core';

// Run some operations
for (let i = 0; i < 10000; i++) {
  createUser().withName('John').build();
}

logPoolStats();
// Output:
// Pool Statistics:
//   Total Pools: 1
//   Total Objects: 50
//   Total Hits: 9950
//   Total Misses: 50
//   Average Hit Rate: 99.5%
```

## Performance Utilities

### warmupPool()

Warm up a builder pool for consistent performance.

```typescript
function warmupPool<T>(builderFn: BuilderFunction<T>, count: number = 100): void;
```

**Parameters:**

- `builderFn`: Builder factory function
- `count`: Number of warmup iterations (default: 100)

**Example:**

```typescript
import { warmupPool } from '@ultra-fast-builder/core';

const createUser = builder(UserSchema);

// Warm up the pool
warmupPool(createUser, 100);

// Now 95%+ hit rate from the start
const stats = getPoolStats();
console.log(stats.totalObjects); // 100
```

### benchmark()

Simple benchmarking utility.

```typescript
function benchmark(name: string, fn: () => void, iterations: number): BenchmarkResult;
```

**Parameters:**

- `name`: Benchmark name
- `fn`: Function to benchmark
- `iterations`: Number of iterations

**Returns:**

```typescript
interface BenchmarkResult {
  name: string;
  iterations: number;
  durationMs: number;
  opsPerSec: number;
  timePerOp: number;
}
```

**Example:**

```typescript
import { benchmark } from '@ultra-fast-builder/core';

const createUser = builder(UserSchema);

const result = benchmark('User builder', () => createUser().withName('John').build(), 100000);

console.log(`${result.name}: ${result.opsPerSec.toFixed(0)} ops/sec`);
```

## Validation Utilities

### safeValidate()

Safely validate without throwing (returns result object).

```typescript
function safeValidate<T>(builderFn: BuilderFunction<T>, data: Partial<T>): ValidationResult<T>;
```

**Returns:**

```typescript
type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };
```

**Example:**

```typescript
import { safeValidate } from '@ultra-fast-builder/core';

const result = safeValidate(createUser, {
  name: 'John',
  email: 'invalid-email',
});

if (result.success) {
  console.log('Valid:', result.data);
} else {
  console.log('Errors:', result.errors);
}
```

## Testing Utilities

### createTestBuilder()

Create a builder pre-filled with test data.

```typescript
function createTestBuilder<T>(
  builderFn: BuilderFunction<T>,
  defaults: Partial<T>
): BuilderFunction<T>;
```

**Parameters:**

- `builderFn`: Original builder function
- `defaults`: Default values for testing

**Returns:**

- `BuilderFunction<T>`: New builder with defaults

**Example:**

```typescript
import { createTestBuilder } from '@ultra-fast-builder/core';

const createUser = builder(UserSchema);

const createTestUser = createTestBuilder(createUser, {
  name: 'Test User',
  email: 'test@example.com',
});

// Use in tests - defaults are pre-filled
const user1 = createTestUser().build();
// { name: 'Test User', email: 'test@example.com' }

const user2 = createTestUser().withName('Custom Name').build();
// { name: 'Custom Name', email: 'test@example.com' }
```

### resetBuilder()

Reset a builder instance (internal use).

```typescript
function resetBuilder<T>(builder: Builder<T>): void;
```

**Example:**

```typescript
const userBuilder = createUser();

userBuilder.withName('John').withEmail('john@example.com');

resetBuilder(userBuilder);
// Builder is now empty again
```

## Export Utilities

### buildersToJSON()

Convert multiple builder instances to JSON.

```typescript
function buildersToJSON<T>(builders: Builder<T>[]): string;
```

**Example:**

```typescript
const users = [createUser().withName('John'), createUser().withName('Jane')];

const json = buildersToJSON(users.map((b) => b.build()));
console.log(json);
// '[{"name":"John"},{"name":"Jane"}]'
```

## Next Steps

- [Core Functions](./core-functions.md) - Main API functions
- [Types](./types.md) - Type definitions
- [Performance Optimization](../guides/performance-optimization.md) - Performance tips
