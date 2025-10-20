# GC Optimization

Minimize garbage collection pauses and pressure with UltraFastBuilder's object pooling.

## Understanding GC Impact

### Without Object Pooling

```
Request → Create Builder → Use → Discard → GC
  1         100 KB          0      -100 KB   ⏸️ 5ms pause
Request → Create Builder → Use → Discard → GC
  2         100 KB          0      -100 KB   ⏸️ 5ms pause
Request → Create Builder → Use → Discard → GC
  3         100 KB          0      -100 KB   ⏸️ 5ms pause

Result: Frequent GC pauses, degraded performance
```

### With Object Pooling (UltraFastBuilder)

```
Warmup → Create 50 Builders → Pool
  ↓
Request 1 → Reuse from pool → Return to pool
Request 2 → Reuse from pool → Return to pool
Request 3 → Reuse from pool → Return to pool
...
Request 10000 → Reuse from pool → Return to pool

Result: Minimal allocations, rare GC pauses
```

## Monitoring GC

### Using Node.js Flags

```bash
# Show GC activity
node --trace-gc app.js

# Output:
# [12345:0x...] 45 ms: Scavenge 2.5 (3.2) -> 1.8 (3.2) MB, 0.5 / 0.0 ms
# [12345:0x...] 89 ms: Mark-sweep 3.1 (4.2) -> 2.2 (4.2) MB, 2.3 / 0.0 ms

# Detailed GC stats
node --trace-gc --trace-gc-verbose app.js
```

### Programmatic Monitoring

```typescript
import v8 from 'v8';

// Get heap statistics
const heapStats = v8.getHeapStatistics();

console.log('Heap stats:', {
  totalHeapSize: `${(heapStats.total_heap_size / 1024 / 1024).toFixed(2)} MB`,
  usedHeapSize: `${(heapStats.used_heap_size / 1024 / 1024).toFixed(2)} MB`,
  heapSizeLimit: `${(heapStats.heap_size_limit / 1024 / 1024).toFixed(2)} MB`
});

// Track GC events
import { PerformanceObserver } from 'perf_hooks';

const obs = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    if (entry.entryType === 'gc') {
      console.log(`GC ${entry.kind}: ${entry.duration.toFixed(2)}ms`);
    }
  });
});

obs.observe({ entryTypes: ['gc'], buffered: true });
```

## Minimizing GC Pressure

### 1. Object Pooling (Automatic)

```typescript
import builder from '@ultra-fast-builder/core';

// UltraFastBuilder automatically pools builders
const createUser = builder(UserSchema);

// First 50-100 calls create new builders
// Subsequent calls reuse from pool
for (let i = 0; i < 100000; i++) {
  const user = createUser()
    .withName('John')
    .build(); // 99%+ pool hit rate
}

// Result: Only ~50 allocations instead of 100,000
```

### 2. Reduce Allocations

```typescript
// ❌ BAD: Creates new arrays
function transformUsers(users: any[]) {
  return users
    .map(u => ({ ...u }))           // Allocation 1
    .map(u => createUser()          // Allocation 2
      .withName(u.name)
      .build())
    .filter(u => u.name !== '');    // Allocation 3
}

// ✅ GOOD: Single pass
function transformUsers(users: any[]) {
  const result: User[] = [];
  for (const u of users) {
    if (u.name === '') continue;
    result.push(createUser().withName(u.name).build());
  }
  return result;
}
```

### 3. Reuse Builder Factories

```typescript
// ❌ BAD: Creates new pool
function processUser(data: any) {
  const createUser = builder(UserSchema); // New pool!
  return createUser().withName(data.name).build();
}

// ✅ GOOD: Reuse pool
const createUser = builder(UserSchema);

function processUser(data: any) {
  return createUser().withName(data.name).build();
}
```

### 4. Batch Operations

```typescript
// ❌ BAD: Saves one at a time
async function saveUsers(users: any[]) {
  for (const userData of users) {
    const user = createUser().withName(userData.name).build();
    await db.users.create(user); // Individual saves
  }
}

// ✅ GOOD: Batch save
async function saveUsers(users: any[]) {
  const builtUsers = users.map(userData =>
    createUser().withName(userData.name).build()
  );
  await db.users.createMany(builtUsers); // Single batch
}
```

## GC Tuning

### Heap Size Configuration

```bash
# Increase max heap size (default: ~1.4 GB)
node --max-old-space-size=4096 app.js

# Decrease for constrained environments
node --max-old-space-size=512 app.js
```

### GC Strategy

```bash
# Use parallel GC (faster, more CPU)
node --parallel-scavenge app.js

# Optimize for latency (smaller pauses)
node --optimize-for-size app.js

# Expose GC function for manual control
node --expose-gc app.js
```

### Manual GC (Advanced)

```typescript
// Only available with --expose-gc flag

if (global.gc) {
  // Trigger GC manually after batch processing
  async function processBatch(items: any[]) {
    for (const item of items) {
      processItem(item);
    }

    // Force GC after batch
    global.gc();
  }
}
```

## GC-Friendly Patterns

### Pattern 1: Pool Warmup

```typescript
// Warm up pools during startup
const createUser = builder(UserSchema);
const createOrder = builder(OrderSchema);

// Fill pools before handling traffic
for (let i = 0; i < 100; i++) {
  createUser().withName('warmup').build();
  createOrder().withId('warmup').build();
}

// Now 99%+ hit rate from the start
```

### Pattern 2: Clear Pools Strategically

```typescript
// Clear pools after large batch jobs
async function dailyReport() {
  const users = await db.users.findMany();

  for (const user of users) {
    generateReport(user);
  }

  // Free memory after batch
  clearPools();
}

// NOT during normal operation
app.post('/users', (req, res) => {
  const user = createUser().build();
  // clearPools(); // ❌ DON'T DO THIS
  res.json(user);
});
```

### Pattern 3: Avoid Intermediate Objects

```typescript
// ❌ BAD: Intermediate objects
const user = createUser()
  .withName('John')
  .build();

const dto = {
  ...user,
  formatted: true
}; // Extra allocation

return dto;

// ✅ GOOD: Direct creation
return createUserDTO()
  .withName('John')
  .withFormatted(true)
  .build();
```

## Measuring GC Impact

### Benchmark GC Pauses

```typescript
import { PerformanceObserver } from 'perf_hooks';

let totalGCTime = 0;
let gcCount = 0;

const obs = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'gc') {
      totalGCTime += entry.duration;
      gcCount++;
    }
  }
});

obs.observe({ entryTypes: ['gc'] });

// Run operations
for (let i = 0; i < 100000; i++) {
  createUser().withName('John').build();
}

setTimeout(() => {
  console.log(`GC count: ${gcCount}`);
  console.log(`Total GC time: ${totalGCTime.toFixed(2)}ms`);
  console.log(`Avg GC pause: ${(totalGCTime / gcCount).toFixed(2)}ms`);
}, 1000);
```

### Before/After Comparison

```typescript
// Without pooling (hypothetical)
// GC count: 47
// Total GC time: 235ms
// Avg GC pause: 5ms

// With pooling (UltraFastBuilder)
// GC count: 3
// Total GC time: 12ms
// Avg GC pause: 4ms

// Result: 95% fewer GC events
```

## Production Monitoring

### GC Metrics Dashboard

```typescript
app.get('/metrics', (req, res) => {
  const heapStats = v8.getHeapStatistics();

  res.json({
    heap: {
      used: `${(heapStats.used_heap_size / 1024 / 1024).toFixed(2)} MB`,
      total: `${(heapStats.total_heap_size / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(heapStats.heap_size_limit / 1024 / 1024).toFixed(2)} MB`,
      utilization: `${((heapStats.used_heap_size / heapStats.total_heap_size) * 100).toFixed(1)}%`
    },
    pools: getPoolStats()
  });
});
```

### Alerting

```typescript
setInterval(() => {
  const stats = v8.getHeapStatistics();
  const usedPercent = (stats.used_heap_size / stats.heap_size_limit) * 100;

  if (usedPercent > 85) {
    console.warn(`⚠️  High heap usage: ${usedPercent.toFixed(1)}%`);
    // Send alert
  }
}, 60000);
```

## Best Practices

### ✅ DO

- Warm up pools during startup
- Reuse builder factory functions
- Use object pooling (automatic)
- Monitor GC in production
- Batch operations when possible
- Clear pools after large batch jobs
- Set appropriate heap limits

### ❌ DON'T

- Create builder factories in loops
- Clear pools during normal operation
- Hold references to all objects
- Ignore GC warnings
- Use manual GC in production
- Skip GC profiling
- Allocate unnecessarily

## GC Checklist

- ✅ Profile GC activity under load
- ✅ Warm up pools before production traffic
- ✅ Monitor GC pause times
- ✅ Set appropriate heap size
- ✅ Use object pooling (automatic)
- ✅ Minimize allocations
- ✅ Batch operations
- ✅ Alert on high memory usage

## Next Steps

- [Memory Usage](./memory-usage.md) - Memory patterns
- [Benchmarks](./benchmarks.md) - Performance numbers
- [Object Pooling](../guides/object-pooling.md) - Pooling deep dive
- [Performance Optimization](../guides/performance-optimization.md) - More tips
