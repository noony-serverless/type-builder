# Object Pooling

Learn how UltraFastBuilder uses object pooling to achieve exceptional performance and minimize garbage collection pressure.

## Overview

Object pooling is the secret behind UltraFastBuilder's high performance. Instead of creating new builder instances for every operation, we reuse existing instances from a pool.

- **Performance Gain**: ~70% improvement over non-pooled builders
- **Memory**: Reduces allocations by 95%+
- **GC Impact**: Minimal garbage collection pressure

## How It Works

### The Problem

Without pooling:

```typescript
// Every call creates new objects
for (let i = 0; i < 100000; i++) {
  const builder = new UserBuilder(); // New allocation
  const user = builder.withName('John').build();
  // Builder becomes garbage
}
// Result: 100,000 allocations, GC runs frequently
```

### The Solution

With pooling:

```typescript
// Reuse builders from a pool
const pool = new BuilderPool<UserBuilder>(() => new UserBuilder());

for (let i = 0; i < 100000; i++) {
  const builder = pool.get(); // Reuse from pool
  builder.reset(); // Clear previous data
  const user = builder.withName('John').build();
  pool.release(builder); // Return to pool
}
// Result: ~100 allocations, minimal GC
```

## Automatic Pooling

UltraFastBuilder automatically pools all builders:

```typescript
import builder from '@ultra-fast-builder/core';

const createUser = builder(UserSchema);

// Behind the scenes:
// 1. Pool is created for this builder type
// 2. Each createUser() call gets a builder from the pool
// 3. After build(), builder is returned to pool
// 4. You don't manage any of this!

for (let i = 0; i < 100000; i++) {
  const user = createUser().withName('John').build();
  // Builder automatically returned to pool
}
```

## Pool Architecture

### Pool Structure

Each builder type gets its own pool:

```typescript
// Internal structure (simplified)
const builderPools = new Map<string, BuilderPool>();

// Pool key: "zod-name,email,age"
builderPools.set('zod-name,email,age', new BuilderPool());

// Pool key: "class-Product"
builderPools.set('class-Product', new BuilderPool());

// Pool key: "interface-id,name"
builderPools.set('interface-id,name', new BuilderPool());
```

### Pool Lifecycle

```
1. createUser() called
   ↓
2. Check pool for available builder
   ↓
3a. Pool has builder → Reuse (HIT)
3b. Pool empty → Create new (MISS)
   ↓
4. Reset builder data
   ↓
5. Return builder instance to user
   ↓
6. User calls .build()
   ↓
7. Builder returned to pool automatically
```

## Pool Statistics

### Viewing Pool Stats

```typescript
import { getPoolStats } from '@ultra-fast-builder/core';

// Run some operations
for (let i = 0; i < 10000; i++) {
  createUser().withName('John').build();
}

// Check pool performance
const stats = getPoolStats();
console.log(stats);
// {
//   totalPools: 1,
//   totalObjects: 50,
//   totalHits: 9950,
//   totalMisses: 50,
//   averageHitRate: 0.995 // 99.5% hit rate
// }
```

### Understanding Stats

- **totalPools**: Number of active pools
- **totalObjects**: Total pooled objects across all pools
- **totalHits**: Number of times a pooled object was reused
- **totalMisses**: Number of times a new object was created
- **averageHitRate**: Percentage of requests served from pool (higher is better)

### Hit Rate Interpretation

- **95%+**: Excellent - pool is well-sized
- **80-95%**: Good - pool is working effectively
- **50-80%**: Fair - consider warming up the pool
- **Less than 50%**: Poor - pool might be too small

## Pool Configuration

### Default Configuration

```typescript
// Default pool settings (internal)
const DEFAULT_POOL_SIZE = 1000;

// Pool automatically grows/shrinks based on usage
```

### Pool Warmup

For consistent performance, warm up pools during startup:

```typescript
import builder from '@ultra-fast-builder/core';

const createUser = builder(UserSchema);

// Warmup: Fill the pool
for (let i = 0; i < 100; i++) {
  createUser().withName('warmup').build();
}

// Now the pool is ready for production traffic
console.log(getPoolStats());
// { totalObjects: 100, averageHitRate: 0 }

// After real traffic
for (let i = 0; i < 10000; i++) {
  createUser().withName('John').build();
}

console.log(getPoolStats());
// { totalObjects: 100, averageHitRate: 0.99 } // 99% hit rate!
```

## Memory Management

### Clearing Pools

Clear pools to release memory:

```typescript
import { clearPools } from '@ultra-fast-builder/core';

// During app lifecycle
clearPools(); // Releases all pooled objects

console.log(getPoolStats());
// { totalPools: 0, totalObjects: 0, totalHits: 0, totalMisses: 0 }
```

### When to Clear Pools

```typescript
// ✅ GOOD: Clear during tests
afterEach(() => {
  clearPools();
});

// ✅ GOOD: Clear during graceful shutdown
process.on('SIGTERM', () => {
  clearPools();
  server.close();
});

// ✅ GOOD: Clear after batch processing
async function processBatch(items: any[]) {
  for (const item of items) {
    await processItem(item);
  }
  clearPools(); // Free memory after batch
}

// ❌ BAD: Clearing during normal operation
app.post('/users', (req, res) => {
  const user = createUser().build();
  clearPools(); // DON'T DO THIS - defeats the purpose!
  res.json(user);
});
```

### Resetting Stats

```typescript
import { resetPoolStats } from '@ultra-fast-builder/core';

// Reset hit/miss counters without clearing pools
resetPoolStats();

console.log(getPoolStats());
// { totalObjects: 100, totalHits: 0, totalMisses: 0 }
// Objects still in pool, but counters reset
```

## Performance Impact

### Benchmark: With vs Without Pooling

```typescript
// Without pooling (hypothetical)
console.time('no-pool');
for (let i = 0; i < 100000; i++) {
  const builder = new UserBuilder(); // New allocation every time
  builder.withName('John').build();
}
console.timeEnd('no-pool');
// no-pool: ~850ms

// With pooling (UltraFastBuilder)
console.time('with-pool');
for (let i = 0; i < 100000; i++) {
  createUser().withName('John').build();
}
console.timeEnd('with-pool');
// with-pool: ~250ms (~70% faster!)
```

### Memory Footprint

```typescript
// Monitor memory usage
const before = process.memoryUsage().heapUsed;

for (let i = 0; i < 100000; i++) {
  createUser().withName('John').build();
}

const after = process.memoryUsage().heapUsed;
const increase = (after - before) / 1024 / 1024;

console.log(`Memory increase: ${increase.toFixed(2)} MB`);
// Memory increase: ~6 MB (vs ~60 MB without pooling)
```

## Advanced Patterns

### Per-Request Pools

For multi-tenant applications:

```typescript
// DON'T: UltraFastBuilder uses global pools
// This pattern is just to illustrate the concept

class TenantBuilderPool {
  private pools = new Map<string, any>();

  getBuilder(tenantId: string) {
    if (!this.pools.has(tenantId)) {
      this.pools.set(tenantId, builder(UserSchema));
    }
    return this.pools.get(tenantId)!;
  }

  clearTenant(tenantId: string) {
    this.pools.delete(tenantId);
  }
}
```

### Monitoring Pool Health

```typescript
function monitorPools() {
  setInterval(() => {
    const stats = getPoolStats();

    if (stats.averageHitRate < 0.8) {
      console.warn('⚠️  Low pool hit rate:', stats.averageHitRate);
      console.warn('Consider warming up pools or increasing pool size');
    }

    if (stats.totalObjects > 5000) {
      console.warn('⚠️  Large number of pooled objects:', stats.totalObjects);
      console.warn('Consider calling clearPools() to free memory');
    }

    console.log('Pool stats:', {
      hitRate: `${(stats.averageHitRate * 100).toFixed(1)}%`,
      objects: stats.totalObjects,
      pools: stats.totalPools,
    });
  }, 60000); // Every minute
}

// Start monitoring
monitorPools();
```

### Pool Testing

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { builder, getPoolStats, clearPools, resetPoolStats } from '@ultra-fast-builder/core';

describe('Pool performance', () => {
  beforeEach(() => {
    clearPools();
    resetPoolStats();
  });

  afterEach(() => {
    clearPools();
  });

  it('should achieve > 95% hit rate after warmup', () => {
    const createUser = builder(UserSchema);

    // Warmup
    for (let i = 0; i < 100; i++) {
      createUser().withName('warmup').build();
    }

    resetPoolStats();

    // Test
    for (let i = 0; i < 10000; i++) {
      createUser().withName('test').build();
    }

    const stats = getPoolStats();
    expect(stats.averageHitRate).toBeGreaterThan(0.95);
  });

  it('should not leak memory', () => {
    const createUser = builder(UserSchema);

    // Build many objects
    for (let i = 0; i < 100000; i++) {
      createUser().withName('test').build();
    }

    const stats = getPoolStats();
    // Pool should stabilize, not grow indefinitely
    expect(stats.totalObjects).toBeLessThan(200);
  });
});
```

## Best Practices

### 1. Warm Up Pools in Production

```typescript
// app.ts
async function startup() {
  console.log('Warming up builder pools...');

  const createUser = builder(UserSchema);
  const createOrder = builder(OrderSchema);

  for (let i = 0; i < 100; i++) {
    createUser().withName('warmup').withEmail('warmup@example.com').build();
    createOrder().withId('warmup').withTotal(0).build();
  }

  const stats = getPoolStats();
  console.log(`Pools warmed up: ${stats.totalObjects} objects ready`);

  app.listen(3000);
}

startup();
```

### 2. Clear Pools During Tests

```typescript
import { afterEach } from 'vitest';
import { clearPools } from '@ultra-fast-builder/core';

// Global test setup
afterEach(() => {
  clearPools(); // Prevent test pollution
});
```

### 3. Monitor in Production

```typescript
// Add to your monitoring/observability
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

## Common Pitfalls

### ❌ Clearing Pools Too Often

```typescript
// BAD: Defeats pooling
app.post('/users', (req, res) => {
  const user = createUser().build();
  clearPools(); // DON'T DO THIS
  res.json(user);
});
```

### ❌ Creating New Factories

```typescript
// BAD: Creates new pool every time
function processUser(data: any) {
  const createUser = builder(UserSchema); // New pool!
  return createUser().withName(data.name).build();
}

// GOOD: Reuse factory
const createUser = builder(UserSchema);

function processUser(data: any) {
  return createUser().withName(data.name).build();
}
```

### ❌ Not Warming Up for Benchmarks

```typescript
// BAD: Benchmark includes pool initialization
console.time('benchmark');
for (let i = 0; i < 100000; i++) {
  createUser().withName('test').build();
}
console.timeEnd('benchmark');

// GOOD: Warmup before benchmark
for (let i = 0; i < 100; i++) {
  createUser().withName('warmup').build();
}

console.time('benchmark');
for (let i = 0; i < 100000; i++) {
  createUser().withName('test').build();
}
console.timeEnd('benchmark');
```

## Next Steps

- [Performance Optimization](./performance-optimization.md) - More performance tips
- [GC Optimization](../performance/gc-optimization.md) - Minimize garbage collection
- [Memory Usage](../performance/memory-usage.md) - Understand memory patterns
- [Benchmarks](../performance/benchmarks.md) - See the numbers
