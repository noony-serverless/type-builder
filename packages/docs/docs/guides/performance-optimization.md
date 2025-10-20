# Performance Optimization

Learn how to squeeze every ounce of performance from UltraFastBuilder for high-throughput applications.

## Quick Wins

### 1. Choose the Right Builder Mode

```typescript
// ✅ Interface mode for internal DTOs (400k+ ops/sec)
const createDTO = builder<UserDTO>(['id', 'name']);

// ✅ Class mode for domain models (300k+ ops/sec)
const createModel = builder(UserClass);

// ✅ Zod mode ONLY at API boundaries (100k+ ops/sec)
const validateInput = builder(UserSchema);
```

**Rule of thumb**: Validate once at the boundary, use Interface mode internally.

### 2. Reuse Builder Factories

```typescript
// ✅ GOOD: Create once, reuse everywhere
const createUser = builder(UserSchema);

for (const data of users) {
  createUser().withName(data.name).build();
}

// ❌ BAD: Creates new pool every iteration
for (const data of users) {
  const create = builder(UserSchema); // Slow!
  create().withName(data.name).build();
}
```

**Impact**: 10-20x performance difference

### 3. Warm Up Pools

```typescript
// Warm up before production traffic
const createUser = builder(UserSchema);

for (let i = 0; i < 100; i++) {
  createUser().withName('warmup').build();
}

// Now 95%+ of requests hit the pool
```

**Impact**: Consistent performance, no cold starts

## Mode Selection Strategy

### Layered Validation Pattern

```typescript
// Layer 1: API Boundary - Zod validation
const validateUserInput = builder(CreateUserSchema);

app.post('/api/users', async (req, res) => {
  // Validate external input
  const input = validateUserInput()
    .withEmail(req.body.email)
    .withPassword(req.body.password)
    .build();

  // Layer 2: Internal processing - Interface mode
  const userDTO = createUserDTO()
    .withId(generateId())
    .withEmail(input.email)
    .withCreatedAt(new Date().toISOString())
    .build();

  // Layer 3: Domain model - Class mode
  const user = createUser()
    .withId(userDTO.id)
    .withEmail(userDTO.email)
    .build();

  await user.sendWelcomeEmail();
  res.json(userDTO);
});
```

### Performance by Use Case

| Use Case | Mode | Ops/Sec | Why |
|----------|------|---------|-----|
| API request validation | Zod | 100k+ | Need validation |
| Database to API response | Interface | 400k+ | Already validated |
| Domain model creation | Class | 300k+ | Need methods |
| Test data generation | Interface | 400k+ | No validation needed |
| Internal DTOs | Interface | 400k+ | Maximum speed |

## Benchmarking

### Measure Your Own Code

```typescript
import { performance } from 'node:perf_hooks';
import { getPoolStats, resetPoolStats } from '@ultra-fast-builder/core';

function benchmark(name: string, fn: () => void, iterations: number) {
  // Warmup
  for (let i = 0; i < 100; i++) fn();

  resetPoolStats();

  // Benchmark
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const end = performance.now();

  const duration = end - start;
  const opsPerSec = (iterations / duration) * 1000;
  const timePerOp = duration / iterations;

  console.log(`\n${name}:`);
  console.log(`  Duration: ${duration.toFixed(2)}ms`);
  console.log(`  Ops/sec: ${opsPerSec.toFixed(0)}`);
  console.log(`  Time/op: ${timePerOp.toFixed(4)}ms`);

  const stats = getPoolStats();
  console.log(`  Hit rate: ${(stats.averageHitRate * 100).toFixed(1)}%`);
}

// Usage
const createUser = builder(UserSchema);

benchmark(
  'Zod Builder',
  () => createUser().withName('John').withEmail('john@example.com').build(),
  100000
);
```

### Compare Builder Modes

```typescript
import { z } from 'zod';

const UserSchema = z.object({ name: z.string(), email: z.string() });
class UserClass {
  name!: string;
  email!: string;
  constructor(data: Partial<UserClass>) { Object.assign(this, data); }
}
interface UserInterface { name: string; email: string; }

const createZod = builder(UserSchema);
const createClass = builder(UserClass);
const createInterface = builder<UserInterface>(['name', 'email']);

benchmark('Interface mode', () =>
  createInterface().withName('John').withEmail('john@example.com').build(),
  100000
);

benchmark('Class mode', () =>
  createClass().withName('John').withEmail('john@example.com').build(),
  100000
);

benchmark('Zod mode', () =>
  createZod().withName('John').withEmail('john@example.com').build(),
  100000
);

// Results:
// Interface mode: ~400,000 ops/sec
// Class mode:     ~300,000 ops/sec
// Zod mode:       ~100,000 ops/sec
```

## Memory Optimization

### Monitor Memory Usage

```typescript
function measureMemory(name: string, fn: () => void, iterations: number) {
  // Force GC if available
  if (global.gc) global.gc();

  const before = process.memoryUsage();

  fn();

  if (global.gc) global.gc();

  const after = process.memoryUsage();

  console.log(`\n${name}:`);
  console.log(`  Heap used: ${((after.heapUsed - before.heapUsed) / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Per object: ${((after.heapUsed - before.heapUsed) / iterations).toFixed(0)} bytes`);
}

// Run Node with: node --expose-gc script.js
measureMemory('Builder memory', () => {
  for (let i = 0; i < 100000; i++) {
    createUser().withName('John').build();
  }
}, 100000);
```

### Minimize Allocations

```typescript
// ✅ GOOD: Reuse builder factory
const create = builder(UserSchema);

function processUsers(users: any[]) {
  return users.map(u => create().withName(u.name).build());
}

// ❌ BAD: Creating intermediate arrays
function processUsers(users: any[]) {
  const builders = users.map(() => builder(UserSchema)); // Extra allocation!
  return builders.map((b, i) => b().withName(users[i].name).build());
}
```

## High-Throughput APIs

### Express with Connection Pooling

```typescript
import express from 'express';
import { builder } from '@ultra-fast-builder/core';

const app = express();

// Create builders once
const validateUser = builder(UserSchema);
const createUserDTO = builder<UserDTO>(['id', 'email', 'name']);

// Warm up pools
for (let i = 0; i < 100; i++) {
  validateUser().withEmail('warmup@example.com').withName('warmup').build();
  createUserDTO().withId(0).withEmail('warmup').withName('warmup').build();
}

app.post('/api/users', async (req, res) => {
  const input = validateUser()
    .withEmail(req.body.email)
    .withName(req.body.name)
    .build();

  const user = await db.users.create(input);

  const dto = createUserDTO()
    .withId(user.id)
    .withEmail(user.email)
    .withName(user.name)
    .build();

  res.json(dto);
});

app.listen(3000);
```

### Load Testing

```bash
# Using autocannon for load testing
npm install -g autocannon

# Test endpoint
autocannon -c 100 -d 30 http://localhost:3000/api/users \
  -m POST \
  -H "Content-Type: application/json" \
  -b '{"email":"test@example.com","name":"Test User"}'
```

## Profiling

### Using Clinic.js

```bash
# Install
npm install -g clinic

# Profile CPU
clinic doctor -- node app.js

# Profile async operations
clinic bubbleprof -- node app.js

# Profile memory
clinic heapprofiler -- node app.js

# Profile flame graph
clinic flame -- node app.js
```

### Node.js Built-in Profiler

```bash
# Start with profiler
node --prof app.js

# Process prof file
node --prof-process isolate-*.log > profile.txt

# Analyze profile.txt for bottlenecks
```

## Advanced Optimizations

### Batch Processing

```typescript
// Process in batches for better throughput
async function processBatch(items: any[], batchSize: number = 1000) {
  const createUser = builder(UserSchema);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const users = batch.map(item =>
      createUser()
        .withName(item.name)
        .withEmail(item.email)
        .build()
    );

    await db.users.createMany(users);
  }
}
```

### Async Validation for Concurrency

```typescript
import { builderAsync } from '@ultra-fast-builder/core';

const validateUserAsync = builderAsync(UserSchema);

app.post('/api/users', async (req, res) => {
  // Non-blocking validation
  const user = await validateUserAsync()
    .withEmail(req.body.email)
    .buildAsync();

  res.json(user);
});
```

### Parallel Processing

```typescript
async function processParallel(items: any[]) {
  const createUser = builder(UserSchema);

  // Process all in parallel
  const users = await Promise.all(
    items.map(async item => {
      const user = createUser()
        .withName(item.name)
        .withEmail(item.email)
        .build();

      return db.users.create(user);
    })
  );

  return users;
}
```

## Common Performance Pitfalls

### ❌ Creating Factories in Loops

```typescript
// BAD: 10-20x slower
for (const user of users) {
  const create = builder(UserSchema);
  create().withName(user.name).build();
}

// GOOD: Reuse factory
const create = builder(UserSchema);
for (const user of users) {
  create().withName(user.name).build();
}
```

### ❌ Using Zod for Internal Data

```typescript
// BAD: Validating already-validated data
function transformUser(user: User) {
  return validateUser()
    .withName(user.name)
    .build(); // Slow, unnecessary validation
}

// GOOD: Use Interface mode internally
const createDTO = builder<UserDTO>(['id', 'name']);

function transformUser(user: User) {
  return createDTO()
    .withId(user.id)
    .withName(user.name)
    .build(); // 4x faster
}
```

### ❌ Clearing Pools During Operation

```typescript
// BAD: Defeats pooling
app.post('/users', (req, res) => {
  const user = createUser().build();
  clearPools(); // DON'T DO THIS
  res.json(user);
});

// GOOD: Let pools work
app.post('/users', (req, res) => {
  const user = createUser().build();
  res.json(user);
});
```

## Production Checklist

- ✅ Choose appropriate builder mode for each use case
- ✅ Reuse builder factory functions
- ✅ Warm up pools during startup
- ✅ Use Interface mode for internal transformations
- ✅ Use Zod mode only at API boundaries
- ✅ Monitor pool hit rates (target: 95%+)
- ✅ Profile in production-like environment
- ✅ Load test before deployment
- ✅ Monitor memory usage
- ✅ Set up health checks with pool stats

## Next Steps

- [Object Pooling](./object-pooling.md) - Deep dive into pooling
- [Benchmarks](../performance/benchmarks.md) - See the numbers
- [Memory Usage](../performance/memory-usage.md) - Understand memory patterns
- [GC Optimization](../performance/gc-optimization.md) - Minimize garbage collection
