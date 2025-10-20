# Memory Usage

Understanding memory patterns and optimization strategies for UltraFastBuilder.

## Memory Overview

### Per-Object Memory

| Mode | Memory/Object | Components |
|------|---------------|------------|
| **Interface** | ~60 bytes | Plain object only |
| **Class** | ~80 bytes | Object + class instance |
| **Zod** | ~120 bytes | Object + validation metadata |

### Pool Overhead

- **Empty pool**: ~0 bytes
- **100 pooled builders**: ~4-6 KB
- **1000 pooled builders**: ~40-60 KB

**Conclusion**: Pool overhead is minimal (< 100 KB even at max capacity).

## Measuring Memory

### Basic Measurement

```typescript
// Run with: node --expose-gc script.js

if (global.gc) global.gc();

const before = process.memoryUsage();

// Your code here
for (let i = 0; i < 100000; i++) {
  createUser().withName('John').build();
}

if (global.gc) global.gc();

const after = process.memoryUsage();

console.log('Heap used:', (after.heapUsed - before.heapUsed) / 1024 / 1024, 'MB');
console.log('External:', (after.external - before.external) / 1024 / 1024, 'MB');
```

### Detailed Memory Tracking

```typescript
function trackMemory(name: string, fn: () => void) {
  if (global.gc) global.gc();

  const before = process.memoryUsage();
  const startTime = performance.now();

  fn();

  const endTime = performance.now();
  if (global.gc) global.gc();

  const after = process.memoryUsage();

  console.log(`\n${name}:`);
  console.log(`  Duration: ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`  Heap Used: ${((after.heapUsed - before.heapUsed) / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  RSS: ${((after.rss - before.rss) / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  External: ${((after.external - before.external) / 1024).toFixed(2)} KB`);
}

trackMemory('Interface Builder', () => {
  for (let i = 0; i < 100000; i++) {
    createInterface().withName('John').build();
  }
});
```

## Memory Patterns

### Without Pooling (Hypothetical)

```
Time →
[Create] [Use] [GC]  [Create] [Use] [GC]  [Create] [Use] [GC]
  ↑      ↑      ↑       ↑      ↑      ↑       ↑      ↑      ↑
  100KB  0KB    -80KB  100KB   0KB   -80KB   100KB   0KB   -80KB

Result: Constant allocations, frequent GC pauses
```

### With Pooling (UltraFastBuilder)

```
Time →
[Create 50 builders] [Reuse] [Reuse] [Reuse] [Reuse] ... [Stable]
  ↑                   ↑       ↑       ↑       ↑           ↑
  5KB                 0KB     0KB     0KB     0KB         5KB

Result: Initial allocation, then zero allocations, minimal GC
```

## Pool Memory Management

### Pool Growth

```typescript
import { getPoolStats } from '@ultra-fast-builder/core';

const createUser = builder(UserSchema);

// Start: empty pool
console.log('Initial:', getPoolStats().totalObjects); // 0

// After 100 operations
for (let i = 0; i < 100; i++) {
  createUser().withName('John').build();
}
console.log('After 100:', getPoolStats().totalObjects); // ~50

// After 10,000 operations
for (let i = 0; i < 10000; i++) {
  createUser().withName('John').build();
}
console.log('After 10k:', getPoolStats().totalObjects); // ~50 (stable)

// Pool doesn't grow indefinitely
```

### Pool Limits

```typescript
// Default: pools limited to 1000 objects
const DEFAULT_POOL_SIZE = 1000;

// After reaching limit, oldest objects are discarded
// Memory usage stays bounded
```

## Memory Leaks

### Common Leak Patterns

#### ❌ Holding References

```typescript
// BAD: Holding references prevents GC
const allUsers: User[] = [];

for (let i = 0; i < 1000000; i++) {
  const user = createUser().withName(`User ${i}`).build();
  allUsers.push(user); // Leak: array grows indefinitely
}

// Memory: 1,000,000 * 60 bytes = ~60 MB
```

#### ✅ Release References

```typescript
// GOOD: Process and release
for (let i = 0; i < 1000000; i++) {
  const user = createUser().withName(`User ${i}`).build();
  processUser(user);
  // user goes out of scope, eligible for GC
}

// Memory: ~60 KB (just the pool)
```

### Detecting Leaks

```typescript
// Monitor heap growth over time
setInterval(() => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`Heap used: ${used.toFixed(2)} MB`);
}, 1000);

// If heap grows continuously → leak
// If heap stabilizes → no leak
```

## Optimization Strategies

### 1. Clear Pools After Batch Jobs

```typescript
import { clearPools } from '@ultra-fast-builder/core';

async function processBatch(items: any[]) {
  for (const item of items) {
    const user = createUser()
      .withName(item.name)
      .build();
    await processUser(user);
  }

  // Release pool memory after batch
  clearPools();
}
```

### 2. Use Streaming for Large Datasets

```typescript
import { Readable } from 'stream';

// Instead of loading all into memory:
const users = await db.users.findMany(); // ❌ Loads all

// Use streams:
const stream = db.users.stream(); // ✅ One at a time

stream.on('data', (record) => {
  const user = createUser()
    .withName(record.name)
    .build();
  processUser(user);
});
```

### 3. Batch Processing with Limits

```typescript
async function processInBatches(items: any[], batchSize: number = 1000) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const users = batch.map(item =>
      createUser()
        .withName(item.name)
        .build()
    );

    await db.users.createMany(users);

    // Optional: clear pools between batches
    if (i % 10000 === 0) {
      clearPools();
    }
  }
}
```

## Memory Profiling

### Using Chrome DevTools

```bash
# Start Node with inspector
node --inspect app.js

# Open chrome://inspect in Chrome
# Take heap snapshots before/after operations
```

### Using Node.js heap profiler

```bash
# Install clinic
npm install -g clinic

# Run heap profiler
clinic heapprofiler -- node app.js

# Opens HTML report with memory timeline
```

### Using v8-profiler

```typescript
import v8Profiler from 'v8-profiler-next';
import fs from 'fs';

// Start profiling
v8Profiler.startProfiling('memory-test');

// Your code
for (let i = 0; i < 100000; i++) {
  createUser().withName('John').build();
}

// Stop and save
const profile = v8Profiler.stopProfiling('memory-test');
profile.export((error, result) => {
  fs.writeFileSync('memory-profile.cpuprofile', result);
  profile.delete();
});
```

## Memory in Production

### Monitoring

```typescript
// Add to health check
app.get('/health', (req, res) => {
  const mem = process.memoryUsage();

  res.json({
    memory: {
      heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
      external: `${(mem.external / 1024 / 1024).toFixed(2)} MB`
    },
    pools: getPoolStats()
  });
});
```

### Alerts

```typescript
// Alert if memory exceeds threshold
setInterval(() => {
  const usedMB = process.memoryUsage().heapUsed / 1024 / 1024;

  if (usedMB > 500) {
    console.warn(`⚠️  High memory usage: ${usedMB.toFixed(2)} MB`);
    // Send alert to monitoring system
  }
}, 60000); // Check every minute
```

### Graceful Degradation

```typescript
// Clear pools if memory is high
setInterval(() => {
  const mem = process.memoryUsage();
  const usedPercent = (mem.heapUsed / mem.heapTotal) * 100;

  if (usedPercent > 80) {
    console.log('Memory high, clearing pools');
    clearPools();
  }
}, 30000);
```

## Best Practices

### ✅ DO

- Monitor memory usage in production
- Use streaming for large datasets
- Clear pools after batch jobs
- Process data in chunks
- Let objects go out of scope
- Use object pooling (automatic in UltraFastBuilder)

### ❌ DON'T

- Hold references to all objects
- Clear pools during normal operation
- Create builder factories inside loops
- Load entire datasets into memory
- Ignore memory warnings
- Skip profiling before deployment

## Memory Checklist

- ✅ Profile memory usage with realistic data
- ✅ Monitor heap growth over time
- ✅ Set up memory alerts
- ✅ Use streaming for large datasets
- ✅ Clear pools after batch processing
- ✅ Check for memory leaks in tests
- ✅ Monitor pool statistics
- ✅ Set memory limits in production

## Next Steps

- [GC Optimization](./gc-optimization.md) - Minimize garbage collection
- [Benchmarks](./benchmarks.md) - Performance numbers
- [Object Pooling](../guides/object-pooling.md) - Deep dive into pooling
