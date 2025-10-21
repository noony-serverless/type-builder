# Async Validation

Learn how to use async builders for non-blocking validation in high-concurrency applications.

## Overview

Async builders provide non-blocking validation using Zod's async parsing, perfect for Node.js servers handling thousands of concurrent requests.

- **Performance**: Same throughput as sync, but non-blocking
- **Use Case**: High-concurrency APIs, I/O-heavy operations
- **Limitation**: Only works with Zod schemas

## When to Use

Use async validation when:

- ✅ Building high-concurrency Node.js APIs
- ✅ Validation might take > 1ms (complex schemas)
- ✅ You want to keep the event loop responsive
- ✅ Handling thousands of concurrent requests

Use sync validation when:

- ❌ Simple schemas (< 1ms validation time)
- ❌ Low-concurrency applications
- ❌ Using Interface or Class mode (async not supported)

## Basic Usage

### Creating Async Builders

```typescript
import { builderAsync } from '@ultra-fast-builder/core';
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

// Create async builder
const createUser = builderAsync(UserSchema);

// Use with async/await
const user = await createUser().withName('John Doe').withEmail('john@example.com').buildAsync(); // Returns Promise<User>

console.log(user); // { name: 'John Doe', email: 'john@example.com' }
```

### Error Handling

```typescript
try {
  const user = await createUser().withName('J').withEmail('invalid-email').buildAsync();
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('Validation failed:', error.errors);
  }
}
```

## Real-World Examples

### Express API with Async Validation

```typescript
import express from 'express';
import { builderAsync } from '@ultra-fast-builder/core';
import { z } from 'zod';

const app = express();
app.use(express.json());

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const validateUser = builderAsync(CreateUserSchema);

app.post('/api/users', async (req, res) => {
  try {
    // Non-blocking validation
    const userData = await validateUser()
      .withEmail(req.body.email)
      .withPassword(req.body.password)
      .withName(req.body.name)
      .buildAsync();

    // Continue processing
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await db.users.create({
      ...userData,
      password: hashedPassword,
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
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

app.listen(3000);
```

### Concurrent Request Handling

```typescript
const OrderSchema = z.object({
  customerId: z.string(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().positive(),
    })
  ),
  total: z.number().positive(),
});

const validateOrder = builderAsync(OrderSchema);

app.post('/api/orders', async (req, res) => {
  // While validating, event loop remains free for other requests
  const order = await validateOrder()
    .withCustomerId(req.body.customerId)
    .withItems(req.body.items)
    .withTotal(req.body.total)
    .buildAsync();

  await db.orders.create(order);
  res.json(order);
});
```

### Batch Processing

```typescript
async function processBatch(inputs: any[]): Promise<User[]> {
  const createUser = builderAsync(UserSchema);

  // Process all inputs concurrently
  return Promise.all(
    inputs.map(async (input) => {
      try {
        return await createUser().withName(input.name).withEmail(input.email).buildAsync();
      } catch (error) {
        console.error('Failed to process:', input, error);
        return null;
      }
    })
  ).then((results) => results.filter(Boolean) as User[]);
}

const validUsers = await processBatch([
  { name: 'John', email: 'john@example.com' },
  { name: 'Jane', email: 'jane@example.com' },
  { name: 'Invalid', email: 'not-an-email' }, // Filtered out
]);
```

## Performance Comparison

### Sync vs Async Throughput

```typescript
import { builder, builderAsync } from '@ultra-fast-builder/core';

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

// Sync builder
const createUserSync = builder(UserSchema);

console.time('sync');
for (let i = 0; i < 100000; i++) {
  createUserSync().withName('John').withEmail('john@example.com').build();
}
console.timeEnd('sync');
// sync: ~1000ms

// Async builder
const createUserAsync = builderAsync(UserSchema);

console.time('async');
for (let i = 0; i < 100000; i++) {
  await createUserAsync().withName('John').withEmail('john@example.com').buildAsync();
}
console.timeEnd('async');
// async: ~1000ms (similar throughput)
```

### Event Loop Impact

```typescript
// Sync validation blocks the event loop
app.post('/api/users', (req, res) => {
  const user = createUserSync().withEmail(req.body.email).build(); // Blocks for ~10μs

  // Event loop blocked during validation
  res.json(user);
});

// Async validation doesn't block
app.post('/api/users', async (req, res) => {
  const user = await createUserAsync().withEmail(req.body.email).buildAsync(); // Yields to event loop

  // Other requests can be processed during validation
  res.json(user);
});
```

## Advanced Patterns

### Timeout Protection

```typescript
async function validateWithTimeout<T>(builderFn: () => Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    builderFn(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Validation timeout')), timeoutMs)
    ),
  ]);
}

try {
  const user = await validateWithTimeout(
    () => createUser().withName(req.body.name).withEmail(req.body.email).buildAsync(),
    5000 // 5 second timeout
  );
} catch (error) {
  console.error('Validation timeout or failed');
}
```

### Retry Logic

```typescript
async function validateWithRetry<T>(
  builderFn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await builderFn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

const user = await validateWithRetry(() =>
  createUser().withName(req.body.name).withEmail(req.body.email).buildAsync()
);
```

### Parallel Validation

```typescript
const UserSchema = z.object({ name: z.string(), email: z.string().email() });
const OrderSchema = z.object({ id: z.string(), total: z.number() });

const validateUser = builderAsync(UserSchema);
const validateOrder = builderAsync(OrderSchema);

// Validate multiple schemas in parallel
const [user, order] = await Promise.all([
  validateUser().withName(req.body.userName).withEmail(req.body.userEmail).buildAsync(),
  validateOrder().withId(req.body.orderId).withTotal(req.body.total).buildAsync(),
]);
```

## Zod-Only Limitation

Async builders only work with Zod schemas:

```typescript
import { builderAsync } from '@ultra-fast-builder/core';

// ✅ Works: Zod schema
const createUser = builderAsync(UserSchema);

// ❌ Error: Class not supported
const createProduct = builderAsync(ProductClass);
// Throws: "Async builder only supports Zod schemas"

// ❌ Error: Interface not supported
const createOrder = builderAsync<Order>(['id', 'total']);
// Throws: "Async builder only supports Zod schemas"
```

## Best Practices

### 1. Use Async for High-Concurrency APIs

```typescript
// ✅ GOOD: High-traffic endpoint
app.post('/api/users', async (req, res) => {
  const user = await createUserAsync().withEmail(req.body.email).buildAsync(); // Non-blocking
});

// ❌ BAD: Low-traffic admin endpoint
app.post('/admin/settings', async (req, res) => {
  const settings = await createSettingsAsync().withTheme(req.body.theme).buildAsync(); // Unnecessary overhead
});
```

### 2. Handle Errors Gracefully

```typescript
app.post('/api/users', async (req, res) => {
  try {
    const user = await createUser().withEmail(req.body.email).buildAsync();

    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 3. Reuse Builder Factories

```typescript
// ✅ GOOD: Create once, reuse
const createUser = builderAsync(UserSchema);

app.post('/api/users', async (req, res) => {
  const user = await createUser().withEmail(req.body.email).buildAsync();
});

// ❌ BAD: Create on every request
app.post('/api/users', async (req, res) => {
  const createUser = builderAsync(UserSchema); // Slow!
  const user = await createUser().withEmail(req.body.email).buildAsync();
});
```

## Monitoring and Debugging

### Logging Validation Time

```typescript
async function buildWithLogging<T>(name: string, builderFn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    const result = await builderFn();
    const duration = performance.now() - start;
    console.log(`✅ ${name} validated in ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.log(`❌ ${name} failed after ${duration.toFixed(2)}ms`);
    throw error;
  }
}

const user = await buildWithLogging('User validation', () =>
  createUser().withEmail(req.body.email).buildAsync()
);
```

### Metrics Collection

```typescript
const validationMetrics = {
  success: 0,
  failed: 0,
  totalTime: 0,
};

async function validateWithMetrics<T>(builderFn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    const result = await builderFn();
    validationMetrics.success++;
    validationMetrics.totalTime += performance.now() - start;
    return result;
  } catch (error) {
    validationMetrics.failed++;
    validationMetrics.totalTime += performance.now() - start;
    throw error;
  }
}

// View metrics
setInterval(() => {
  const total = validationMetrics.success + validationMetrics.failed;
  const avgTime = validationMetrics.totalTime / total;
  console.log('Validation metrics:', {
    successRate: `${((validationMetrics.success / total) * 100).toFixed(2)}%`,
    avgTime: `${avgTime.toFixed(2)}ms`,
    total,
  });
}, 60000); // Every minute
```

## Next Steps

- [Zod Builder Guide](./zod-builder.md) - Learn about sync validation
- [Performance Optimization](./performance-optimization.md) - Optimize async operations
- [API Reference](../api/api-reference.md) - Complete API documentation
- [Examples: API Validation](../examples/api-validation.md) - More examples
