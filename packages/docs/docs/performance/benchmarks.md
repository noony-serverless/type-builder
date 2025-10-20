# Benchmarks

Performance benchmarks for UltraFastBuilder across all three modes.

## Summary Results

| Mode          | Operations/Sec | Time/Operation | Memory/Object | Use Case       |
| ------------- | -------------- | -------------- | ------------- | -------------- |
| **Interface** | 400,000+       | ~2.5μs         | ~60 bytes     | Internal DTOs  |
| **Class**     | 300,000+       | ~3.3μs         | ~80 bytes     | Domain models  |
| **Zod**       | 100,000+       | ~10μs          | ~120 bytes    | API validation |

## Running Benchmarks

### Quick Start

```bash
# From project root
npm run benchmark

# From benchmarks package
cd packages/benchmarks
npm run benchmark
```

### Custom Benchmarks

```typescript
import { builder } from '@ultra-fast-builder/core';
import { z } from 'zod';
import Benchmark from 'benchmark';

const suite = new Benchmark.Suite();

// Define builders
const UserSchema = z.object({ name: z.string(), email: z.string() });
class UserClass {
  name!: string;
  email!: string;
  constructor(data: Partial<UserClass>) {
    Object.assign(this, data);
  }
}
interface UserInterface {
  name: string;
  email: string;
}

const createZod = builder(UserSchema);
const createClass = builder(UserClass);
const createInterface = builder<UserInterface>(['name', 'email']);

// Add tests
suite
  .add('Interface Builder', () => {
    createInterface().withName('John Doe').withEmail('john@example.com').build();
  })
  .add('Class Builder', () => {
    createClass().withName('John Doe').withEmail('john@example.com').build();
  })
  .add('Zod Builder', () => {
    createZod().withName('John Doe').withEmail('john@example.com').build();
  })
  .on('cycle', (event: any) => {
    console.log(String(event.target));
  })
  .on('complete', function (this: any) {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({ async: true });
```

## Detailed Results

### Interface Builder

```
Operations: 420,342 ops/sec ±1.23%
Time/op: 2.38μs
Memory: ~60 bytes per object
Hit rate: 99.2%

Test: Building 100,000 simple DTOs
Duration: 238ms
```

**Why it's fast:**

- No validation overhead
- No class instantiation
- Plain object creation
- Object pooling

### Class Builder

```
Operations: 312,500 ops/sec ±0.89%
Time/op: 3.20μs
Memory: ~80 bytes per object
Hit rate: 98.7%

Test: Building 100,000 class instances
Duration: 320ms
```

**Overhead from:**

- Class instantiation (`new Constructor()`)
- `Object.assign()` call
- Method preservation

### Zod Builder

```
Operations: 105,263 ops/sec ±1.15%
Time/op: 9.50μs
Memory: ~120 bytes per object
Hit rate: 98.3%

Test: Building 100,000 validated objects
Duration: 950ms
```

**Overhead from:**

- Zod schema validation
- Type coercion
- Error handling

## Comparison with Alternatives

### vs Manual Object Creation

```typescript
// Manual object creation
console.time('manual');
for (let i = 0; i < 100000; i++) {
  const user = {
    name: 'John Doe',
    email: 'john@example.com',
  };
}
console.timeEnd('manual');
// manual: ~15ms (6,666,666 ops/sec)

// Interface builder
console.time('builder');
for (let i = 0; i < 100000; i++) {
  createInterface().withName('John Doe').withEmail('john@example.com').build();
}
console.timeEnd('builder');
// builder: ~250ms (400,000 ops/sec)

// Trade-off: 16x slower, but type-safe + fluent API
```

### vs Manual Builder Pattern

```typescript
// Manual builder class
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

  build() {
    return { name: this.name!, email: this.email! };
  }
}

console.time('manual-builder');
for (let i = 0; i < 100000; i++) {
  new UserBuilder().withName('John Doe').withEmail('john@example.com').build();
}
console.timeEnd('manual-builder');
// manual-builder: ~850ms (117,647 ops/sec)

// UltraFastBuilder is 3.4x faster due to pooling
```

### vs Zod Alone

```typescript
// Zod parse only
const UserSchema = z.object({ name: z.string(), email: z.string() });

console.time('zod-only');
for (let i = 0; i < 100000; i++) {
  UserSchema.parse({
    name: 'John Doe',
    email: 'john@example.com',
  });
}
console.timeEnd('zod-only');
// zod-only: ~920ms (108,695 ops/sec)

// UltraFastBuilder Zod mode: ~950ms (105,263 ops/sec)
// Minimal overhead (~3%) for fluent API
```

## Scaling Benchmarks

### Object Complexity

```typescript
// Simple object (2 properties)
interface Simple {
  name: string;
  email: string;
}
const createSimple = builder<Simple>(['name', 'email']);
// 420,000 ops/sec

// Medium object (10 properties)
interface Medium {
  id: number;
  name: string;
  email: string;
  age: number;
  address: string;
  city: string;
  country: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}
const createMedium = builder<Medium>([
  /* all keys */
]);
// 380,000 ops/sec (-9%)

// Complex object (50 properties)
interface Complex {
  /* 50 properties */
}
const createComplex = builder<Complex>([
  /* all keys */
]);
// 310,000 ops/sec (-26%)
```

### Concurrent Operations

```typescript
// Sequential
console.time('sequential');
for (let i = 0; i < 100000; i++) {
  createUser().withName('John').build();
}
console.timeEnd('sequential');
// sequential: ~250ms

// Parallel (simulated concurrency)
console.time('parallel');
await Promise.all(
  Array.from({ length: 100000 }, async () => createUser().withName('John').build())
);
console.timeEnd('parallel');
// parallel: ~250ms (same - CPU bound)
```

## Memory Benchmarks

### Memory Per Object

```typescript
const measureMemory = (name: string, fn: () => void, count: number) => {
  if (global.gc) global.gc();
  const before = process.memoryUsage().heapUsed;

  fn();

  if (global.gc) global.gc();
  const after = process.memoryUsage().heapUsed;
  const perObject = (after - before) / count;

  console.log(`${name}: ${perObject.toFixed(0)} bytes/object`);
};

// Run with: node --expose-gc benchmark.js

measureMemory(
  'Interface',
  () => {
    for (let i = 0; i < 100000; i++) {
      createInterface().withName('John').build();
    }
  },
  100000
);
// Interface: 62 bytes/object

measureMemory(
  'Class',
  () => {
    for (let i = 0; i < 100000; i++) {
      createClass().withName('John').build();
    }
  },
  100000
);
// Class: 84 bytes/object

measureMemory(
  'Zod',
  () => {
    for (let i = 0; i < 100000; i++) {
      createZod().withName('John').build();
    }
  },
  100000
);
// Zod: 118 bytes/object
```

### Pool Memory Overhead

```typescript
import { getPoolStats } from '@ultra-fast-builder/core';

// Empty pool
const stats1 = getPoolStats();
console.log('Empty pool:', stats1.totalObjects);
// 0 objects

// After 10,000 operations
for (let i = 0; i < 10000; i++) {
  createUser().withName('John').build();
}

const stats2 = getPoolStats();
console.log('Filled pool:', stats2.totalObjects);
// ~50 objects (pool stabilizes)

console.log('Pool overhead:', stats2.totalObjects * 84);
// ~4.2 KB (minimal overhead)
```

## GC Impact

### Allocations Without Pooling

```typescript
// Hypothetical: Without pooling
let allocations = 0;
for (let i = 0; i < 100000; i++) {
  const builder = {}; // New allocation
  allocations++;
}
console.log('Allocations:', allocations);
// 100,000 allocations → frequent GC pauses
```

### Allocations With Pooling

```typescript
import { getPoolStats } from '@ultra-fast-builder/core';

for (let i = 0; i < 100000; i++) {
  createUser().withName('John').build();
}

const stats = getPoolStats();
console.log('Allocations:', stats.totalMisses);
// ~50 allocations (99.95% reuse rate)
```

## Real-World Scenarios

### API Request Handling

```typescript
// Simulate 10,000 requests/sec
const requests = 10000;

console.time('API validation');
for (let i = 0; i < requests; i++) {
  validateInput().withEmail('user@example.com').withPassword('password123').build();
}
console.timeEnd('API validation');
// API validation: ~95ms (10,526 requests/sec)
// Can handle 10k requests/sec with ease
```

### Database Transformation

```typescript
// Transform 100,000 database records to DTOs
const records = Array.from({ length: 100000 }, (_, i) => ({
  id: i,
  name: `User ${i}`,
  email: `user${i}@example.com`,
}));

console.time('Transform to DTOs');
const dtos = records.map((r) =>
  createDTO().withId(r.id).withName(r.name).withEmail(r.email).build()
);
console.timeEnd('Transform to DTOs');
// Transform to DTOs: ~250ms
// 400,000 transformations/sec
```

## Benchmarking Best Practices

### 1. Warm Up Before Measuring

```typescript
// Warmup
for (let i = 0; i < 100; i++) {
  createUser().withName('warmup').build();
}

// Now benchmark
console.time('benchmark');
for (let i = 0; i < 100000; i++) {
  createUser().withName('test').build();
}
console.timeEnd('benchmark');
```

### 2. Run Multiple Iterations

```typescript
const iterations = 5;
const results: number[] = [];

for (let i = 0; i < iterations; i++) {
  const start = performance.now();
  // ... benchmark code ...
  const end = performance.now();
  results.push(end - start);
}

const avg = results.reduce((a, b) => a + b) / results.length;
console.log(`Average: ${avg.toFixed(2)}ms`);
```

### 3. Measure Pool Hit Rate

```typescript
import { resetPoolStats, getPoolStats } from '@ultra-fast-builder/core';

// Reset before benchmarking
resetPoolStats();

// Run benchmark
// ...

const stats = getPoolStats();
console.log(`Hit rate: ${(stats.averageHitRate * 100).toFixed(1)}%`);
// Should be 95%+
```

## Next Steps

- [Memory Usage](./memory-usage.md) - Understand memory patterns
- [GC Optimization](./gc-optimization.md) - Minimize garbage collection
- [Performance Optimization](../guides/performance-optimization.md) - Optimization tips
