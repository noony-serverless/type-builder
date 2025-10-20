# Testing Examples

Examples of using UltraFastBuilder in tests with various testing frameworks.

## Test Data Generation

### Vitest

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import builder, { clearPools } from '@ultra-fast-builder/core';
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
});

const createUser = builder(UserSchema);

describe('UserService', () => {
  beforeEach(() => {
    clearPools(); // Clean state between tests
  });

  afterEach(() => {
    clearPools();
  });

  it('should create a user', () => {
    const user = createUser().withId(1).withEmail('test@example.com').withName('Test User').build();

    expect(user).toEqual({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
    });
  });

  it('should validate email format', () => {
    expect(() => {
      createUser().withId(1).withEmail('invalid-email').withName('Test User').build();
    }).toThrow();
  });
});
```

### Jest

```typescript
import builder from '@ultra-fast-builder/core';

describe('Order processing', () => {
  const createOrder = builder(OrderSchema);

  it('should calculate total correctly', () => {
    const order = createOrder()
      .withId('order-001')
      .withItems([
        { productId: 'p1', quantity: 2, price: 10 },
        { productId: 'p2', quantity: 1, price: 20 },
      ])
      .build();

    const total = order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    expect(total).toBe(40);
  });
});
```

## Test Fixtures

### Factory Functions

```typescript
import builder from '@ultra-fast-builder/core';

// Create reusable test factories
const createTestUser = builder(UserSchema);
const createTestProduct = builder(ProductSchema);
const createTestOrder = builder(OrderSchema);

// Default test data
function makeUser(overrides: Partial<User> = {}) {
  return createTestUser()
    .withId(overrides.id || 1)
    .withEmail(overrides.email || 'test@example.com')
    .withName(overrides.name || 'Test User')
    .build();
}

function makeProduct(overrides: Partial<Product> = {}) {
  return createTestProduct()
    .withId(overrides.id || 'prod-001')
    .withName(overrides.name || 'Test Product')
    .withPrice(overrides.price || 99.99)
    .withStock(overrides.stock || 10)
    .build();
}

// Use in tests
describe('Shopping cart', () => {
  it('should add product to cart', () => {
    const user = makeUser();
    const product = makeProduct({ price: 50 });

    const cart = new ShoppingCart(user);
    cart.addProduct(product);

    expect(cart.total).toBe(50);
  });

  it('should handle multiple products', () => {
    const user = makeUser();
    const product1 = makeProduct({ id: 'p1', price: 25 });
    const product2 = makeProduct({ id: 'p2', price: 30 });

    const cart = new ShoppingCart(user);
    cart.addProduct(product1);
    cart.addProduct(product2);

    expect(cart.total).toBe(55);
  });
});
```

### Builder Sequences

```typescript
import builder from '@ultra-fast-builder/core';

// Generate sequences of test data
function createUserSequence(count: number): User[] {
  const createUser = builder(UserSchema);

  return Array.from({ length: count }, (_, i) =>
    createUser()
      .withId(i + 1)
      .withEmail(`user${i}@example.com`)
      .withName(`User ${i}`)
      .build()
  );
}

// Use in tests
it('should handle multiple users', () => {
  const users = createUserSequence(100);

  const service = new UserService();
  users.forEach((user) => service.addUser(user));

  expect(service.getUserCount()).toBe(100);
});
```

## Mocking and Stubbing

### Partial Objects

```typescript
// Create partial mock objects
const createMockUser = builder<Partial<User>>(['id', 'name']);

it('should work with partial data', () => {
  const mockUser = createMockUser().withId(1).withName('Mock User').build();

  const result = formatUserName(mockUser as User);
  expect(result).toBe('Mock User');
});
```

### Test Doubles

```typescript
interface IUserRepository {
  findById(id: number): Promise<User | null>;
  save(user: User): Promise<User>;
}

class MockUserRepository implements IUserRepository {
  private users = new Map<number, User>();

  async findById(id: number) {
    return this.users.get(id) || null;
  }

  async save(user: User) {
    this.users.set(user.id, user);
    return user;
  }

  // Test helper
  seed(users: User[]) {
    users.forEach((user) => this.users.set(user.id, user));
  }
}

describe('UserService with mock repository', () => {
  it('should find user by id', async () => {
    const repo = new MockUserRepository();
    const service = new UserService(repo);

    // Seed with test data
    const testUsers = createUserSequence(10);
    repo.seed(testUsers);

    const user = await service.findById(5);
    expect(user?.name).toBe('User 4'); // 0-indexed
  });
});
```

## Integration Tests

### Database Tests

```typescript
import builder, { clearPools } from '@ultra-fast-builder/core';
import { db } from './test-db';

describe('User CRUD operations', () => {
  beforeAll(async () => {
    await db.migrate();
  });

  afterAll(async () => {
    await db.close();
  });

  beforeEach(async () => {
    await db.clearTables();
    clearPools();
  });

  it('should create and retrieve user', async () => {
    const createUser = builder(CreateUserSchema);

    const userData = createUser()
      .withEmail('test@example.com')
      .withPassword('password123')
      .withName('Test User')
      .build();

    const created = await db.users.create(userData);
    const retrieved = await db.users.findUnique({ where: { id: created.id } });

    expect(retrieved).toMatchObject({
      email: 'test@example.com',
      name: 'Test User',
    });
  });

  it('should update user', async () => {
    const user = await db.users.create(
      createUser().withEmail('old@example.com').withName('Old Name').build()
    );

    const updateData = createUpdateUser().withName('New Name').build();

    await db.users.update({
      where: { id: user.id },
      data: updateData,
    });

    const updated = await db.users.findUnique({ where: { id: user.id } });
    expect(updated?.name).toBe('New Name');
  });
});
```

### API Tests

```typescript
import request from 'supertest';
import { app } from './app';
import builder from '@ultra-fast-builder/core';

describe('User API', () => {
  const createUserRequest = builder(CreateUserSchema);

  it('POST /api/users should create user', async () => {
    const userData = createUserRequest()
      .withEmail('test@example.com')
      .withPassword('password123')
      .withName('Test User')
      .build();

    const response = await request(app).post('/api/users').send(userData).expect(201);

    expect(response.body).toMatchObject({
      email: 'test@example.com',
      name: 'Test User',
    });
  });

  it('POST /api/users should validate input', async () => {
    const invalidData = createUserRequest()
      .withEmail('invalid-email')
      .withPassword('short')
      .withName('T')
      .build();

    const response = await request(app).post('/api/users').send(invalidData).expect(400);

    expect(response.body.error).toBe('Validation failed');
  });
});
```

## Performance Tests

### Load Testing

```typescript
import builder, { getPoolStats, resetPoolStats } from '@ultra-fast-builder/core';

describe('Performance benchmarks', () => {
  const createUser = builder(UserSchema);

  it('should handle high throughput', () => {
    // Warmup
    for (let i = 0; i < 100; i++) {
      createUser().withId(i).withEmail(`warmup${i}@example.com`).withName('Warmup').build();
    }

    resetPoolStats();

    // Benchmark
    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
      createUser().withId(i).withEmail(`test${i}@example.com`).withName('Test User').build();
    }
    const end = performance.now();

    const duration = end - start;
    const opsPerSec = (100000 / duration) * 1000;

    console.log(`Performance: ${opsPerSec.toFixed(0)} ops/sec`);

    const stats = getPoolStats();
    console.log(`Pool hit rate: ${(stats.averageHitRate * 100).toFixed(1)}%`);

    expect(opsPerSec).toBeGreaterThan(50000); // At least 50k ops/sec
    expect(stats.averageHitRate).toBeGreaterThan(0.95); // 95%+ hit rate
  });
});
```

### Memory Tests

```typescript
import builder, { clearPools } from '@ultra-fast-builder/core';

describe('Memory usage', () => {
  it('should not leak memory', () => {
    const createUser = builder(UserSchema);

    if (global.gc) global.gc();

    const before = process.memoryUsage().heapUsed;

    // Create many objects
    for (let i = 0; i < 100000; i++) {
      createUser().withId(i).withEmail(`test${i}@example.com`).withName('Test').build();
    }

    if (global.gc) global.gc();

    const after = process.memoryUsage().heapUsed;
    const increase = (after - before) / 1024 / 1024;

    console.log(`Memory increase: ${increase.toFixed(2)} MB`);

    // Should use < 10 MB (with pooling)
    expect(increase).toBeLessThan(10);

    clearPools();
  });
});
```

## Snapshot Testing

### Jest Snapshots

```typescript
describe('User DTO transformation', () => {
  it('should match snapshot', () => {
    const user = createTestUser()
      .withId(1)
      .withEmail('test@example.com')
      .withName('Test User')
      .withCreatedAt(new Date('2024-01-01'))
      .build();

    expect(user).toMatchSnapshot();
  });

  it('should match inline snapshot', () => {
    const user = createTestUser()
      .withId(1)
      .withEmail('test@example.com')
      .withName('Test User')
      .build();

    expect(user).toMatchInlineSnapshot(`
      {
        "id": 1,
        "email": "test@example.com",
        "name": "Test User"
      }
    `);
  });
});
```

## Property-Based Testing

### Fast-check

```typescript
import fc from 'fast-check';
import builder from '@ultra-fast-builder/core';

describe('Property-based tests', () => {
  const createUser = builder(UserSchema);

  it('should always produce valid users', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1 }),
        fc.emailAddress(),
        fc.string({ minLength: 2 }),
        (id, email, name) => {
          const user = createUser().withId(id).withEmail(email).withName(name).build();

          expect(user.id).toBe(id);
          expect(user.email).toBe(email);
          expect(user.name).toBe(name);
        }
      )
    );
  });
});
```

## Best Practices

### Test Setup

```typescript
// test-utils.ts
import builder, { clearPools, resetPoolStats } from '@ultra-fast-builder/core';

export function setupTests() {
  beforeEach(() => {
    clearPools();
    resetPoolStats();
  });

  afterEach(() => {
    clearPools();
  });
}

export const testBuilders = {
  user: builder(UserSchema),
  product: builder(ProductSchema),
  order: builder(OrderSchema),
};

// In tests
import { setupTests, testBuilders } from './test-utils';

describe('My tests', () => {
  setupTests();

  it('should work', () => {
    const user = testBuilders.user().withId(1).withName('Test').build();
  });
});
```

## Next Steps

- [API Validation](./api-validation.md) - Validation examples
- [Domain Models](./domain-models.md) - Class-based examples
- [Data Transformation](./data-transformation.md) - DTO examples
