# How-To Guide: @noony-serverless/type-builder

**Practical recipes for common tasks and problems**

---

## Table of Contents

### Basics

- [How to validate API input](#how-to-validate-api-input)
- [How to create builders for existing classes](#how-to-create-builders-for-existing-classes)
- [How to handle optional fields](#how-to-handle-optional-fields)
- [How to work with default values](#how-to-work-with-default-values)

### Advanced

- [How to build complex nested objects](#how-to-build-complex-nested-objects)
- [How to transform database records to DTOs](#how-to-transform-database-records-to-dtos)
- [How to handle validation errors gracefully](#how-to-handle-validation-errors-gracefully)
- [How to create reusable builder factories](#how-to-create-reusable-builder-factories)

### Performance

- [How to optimize for high-throughput APIs](#how-to-optimize-for-high-throughput-apis)
- [How to use async builders correctly](#how-to-use-async-builders-correctly)
- [How to monitor pool performance](#how-to-monitor-pool-performance)
- [How to clear pools when needed](#how-to-clear-pools-when-needed)

### Integration

- [How to integrate with Express.js](#how-to-integrate-with-expressjs)
- [How to integrate with NestJS](#how-to-integrate-with-nestjs)
- [How to use with Prisma/TypeORM](#how-to-use-with-prismatypeorm)
- [How to test builders](#how-to-test-builders)

### Troubleshooting

- [How to debug builder creation](#how-to-debug-builder-creation)
- [How to fix "property doesn't exist" errors](#how-to-fix-property-doesnt-exist-errors)
- [How to handle circular dependencies](#how-to-handle-circular-dependencies)

---

## Basics

### How to validate API input

**Problem:** You need to validate untrusted user input from an API request.

**Solution:** Use Zod builder mode with runtime validation.

```typescript
import builder from '@noony-serverless/type-builder';
import { z } from 'zod';
import express from 'express';

// Step 1: Define validation schema
const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name too short'),
  age: z.number().min(18, 'Must be 18 or older').optional(),
});

// Step 2: Create builder
const validateUser = builder(CreateUserSchema);

// Step 3: Use in API endpoint
const app = express();
app.use(express.json());

app.post('/api/users', (req, res) => {
  try {
    const user = validateUser()
      .withEmail(req.body.email)
      .withPassword(req.body.password)
      .withName(req.body.name)
      .withAge(req.body.age)
      .build(); // ← Validates here

    // If we reach here, data is valid
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    } else {
      res.status(500).json({ success: false, error: 'Internal error' });
    }
  }
});
```

**Result:** Invalid requests return detailed error messages, valid requests proceed safely.

---

### How to create builders for existing classes

**Problem:** You have existing classes and want to add builder pattern without modifying them.

**Solution:** Pass the class to `builder()` - it auto-detects properties.

```typescript
// Existing class (don't modify)
class Product {
  id!: number;
  name!: string;
  price!: number;
  category!: string;

  getDiscountedPrice(discount: number): number {
    return this.price * (1 - discount / 100);
  }
}

// Create builder without touching the class
const createProduct = builder(Product);

// Use it
const product = createProduct()
  .withId(1)
  .withName('Laptop')
  .withPrice(1200)
  .withCategory('Electronics')
  .build();

// Methods still work
console.log(product.getDiscountedPrice(10)); // 1080
```

**Note:** The class must have property declarations (`id!: number`) or initialize them in the constructor.

---

### How to handle optional fields

**Problem:** Some fields should be optional, not required.

**Solution:** Use Zod's `.optional()` or TypeScript's `?` syntax.

**With Zod:**

```typescript
const UserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  bio: z.string().optional(), // ← Optional
  website: z.string().url().optional(), // ← Optional
});

const createUser = builder(UserSchema);

// Both valid
const user1 = createUser().withEmail('alice@example.com').withName('Alice').build(); // ✅ bio and website not required

const user2 = createUser()
  .withEmail('bob@example.com')
  .withName('Bob')
  .withBio('Developer')
  .withWebsite('https://bob.dev')
  .build(); // ✅ Optional fields included
```

**With Classes:**

```typescript
class User {
  email!: string;
  name!: string;
  bio?: string; // ← Optional (TypeScript ?)
  website?: string; // ← Optional
}

const createUser = builder(User);

// Same usage as above
```

---

### How to work with default values

**Problem:** You want fields to have default values if not provided.

**Solution:** Use Zod's `.default()` or class property initializers.

**With Zod:**

```typescript
const ConfigSchema = z.object({
  apiKey: z.string(),
  timeout: z.number().default(5000), // ← Default
  retries: z.number().default(3), // ← Default
  debug: z.boolean().default(false), // ← Default
});

const createConfig = builder(ConfigSchema);

const config = createConfig()
  .withApiKey('secret-key')
  // Don't set timeout, retries, or debug
  .build();

console.log(config);
// { apiKey: 'secret-key', timeout: 5000, retries: 3, debug: false }
```

**With Classes:**

```typescript
class Config {
  apiKey!: string;
  timeout: number = 5000; // ← Default
  retries: number = 3; // ← Default
  debug: boolean = false; // ← Default
}

const createConfig = builder(Config);

const config = createConfig().withApiKey('secret-key').build();

console.log(config);
// { apiKey: 'secret-key', timeout: 5000, retries: 3, debug: false }
```

---

## Advanced

### How to build complex nested objects

**Problem:** You need to build objects with nested structures.

**Solution:** Define nested schemas and pass complete objects to `.withXYZ()` methods.

```typescript
// Define nested schemas
const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zipCode: z.string().regex(/^\d{5}$/),
  country: z.string(),
});

const CompanySchema = z.object({
  name: z.string(),
  address: AddressSchema,
  employees: z.number().min(1),
});

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  address: AddressSchema, // ← Nested
  company: CompanySchema.optional(), // ← Optional nested
});

// Create builder
const createUser = builder(UserSchema);

// Build with nested objects
const user = createUser()
  .withName('Alice')
  .withEmail('alice@example.com')
  .withAddress({
    street: '123 Main St',
    city: 'New York',
    zipCode: '10001',
    country: 'USA',
  })
  .withCompany({
    name: 'Acme Corp',
    address: {
      street: '456 Business Ave',
      city: 'San Francisco',
      zipCode: '94102',
      country: 'USA',
    },
    employees: 100,
  })
  .build();
```

**Tip:** You can also create builders for nested objects and compose them:

```typescript
const createAddress = builder(AddressSchema);
const createCompany = builder(CompanySchema);

const address = createAddress()
  .withStreet('123 Main St')
  .withCity('New York')
  .withZipCode('10001')
  .withCountry('USA')
  .build();

const user = createUser()
  .withName('Alice')
  .withEmail('alice@example.com')
  .withAddress(address) // ← Use pre-built object
  .build();
```

---

### How to transform database records to DTOs

**Problem:** You need to convert database records to API response DTOs quickly.

**Solution:** Use interface builders for maximum performance.

```typescript
// Database entity (what Prisma/TypeORM returns)
interface UserEntity {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
  passwordHash: string; // ← Don't expose this!
}

// API response DTO
interface UserDTO {
  id: string; // ← Convert to string
  email: string;
  fullName: string; // ← Combine firstName + lastName
  memberSince: string; // ← Format date
}

// Create fast DTO builder
const createUserDTO = builder<UserDTO>(['id', 'email', 'fullName', 'memberSince']);

// Transform function
function toUserDTO(entity: UserEntity): UserDTO {
  return createUserDTO()
    .withId(entity.id.toString())
    .withEmail(entity.email)
    .withFullName(`${entity.firstName} ${entity.lastName}`)
    .withMemberSince(entity.createdAt.toISOString())
    .build();
}

// API endpoint
app.get('/api/users', async (req, res) => {
  const users = await db.user.findMany(); // ← Database query

  // Transform all users (fast!)
  const dtos = users.map(toUserDTO);

  res.json(dtos);
});
```

**Performance:** With interface builders, you can transform ~400,000 records per second.

---

### How to handle validation errors gracefully

**Problem:** Zod errors are verbose and not user-friendly.

**Solution:** Create a custom error formatter.

```typescript
import { z, ZodError } from 'zod';

// Custom error formatter
interface ValidationError {
  field: string;
  message: string;
  code: string;
}

function formatZodError(error: ZodError): ValidationError[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
}

// Helper function for safe building
function buildSafely<T>(
  builderFn: () => T
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  try {
    const data = builderFn();
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, errors: formatZodError(error) };
    }
    throw error; // Re-throw unexpected errors
  }
}

// Usage
const result = buildSafely(() => createUser().withEmail('invalid-email').withName('A').build());

if (!result.success) {
  console.error('Validation failed:', result.errors);
  // [
  //   { field: 'email', message: 'Invalid email', code: 'invalid_string' },
  //   { field: 'name', message: 'String must contain at least 2 character(s)', code: 'too_small' }
  // ]
} else {
  console.log('User created:', result.data);
}
```

---

### How to create reusable builder factories

**Problem:** You need different builder configurations for different contexts.

**Solution:** Create factory functions that return configured builders.

```typescript
// Builder factory for different user types
function createUserBuilder(type: 'admin' | 'user' | 'guest') {
  const schemas = {
    admin: z.object({
      email: z.string().email(),
      name: z.string(),
      role: z.literal('admin'),
      permissions: z.array(z.string()),
    }),
    user: z.object({
      email: z.string().email(),
      name: z.string(),
      role: z.literal('user'),
    }),
    guest: z.object({
      sessionId: z.string(),
      role: z.literal('guest'),
    }),
  };

  return builder(schemas[type]);
}

// Usage
const createAdmin = createUserBuilder('admin');
const createRegularUser = createUserBuilder('user');
const createGuest = createUserBuilder('guest');

const admin = createAdmin()
  .withEmail('admin@example.com')
  .withName('Admin User')
  .withRole('admin')
  .withPermissions(['read', 'write', 'delete'])
  .build();

const user = createRegularUser()
  .withEmail('user@example.com')
  .withName('Regular User')
  .withRole('user')
  .build();
```

---

## Performance

### How to optimize for high-throughput APIs

**Problem:** Your API needs to handle 10,000+ requests per second.

**Solution:** Use the right mode for each layer + async builders.

```typescript
import { builderAsync } from '@noony-serverless/type-builder';

// Layer 1: Validation (Zod + Async)
const validateInput = builderAsync(InputSchema);

// Layer 2: Domain (Class - sync is fine)
const createOrder = builder(Order);

// Layer 3: Response (Interface - fastest)
const createResponse = builder<ResponseDTO>(['id', 'status', 'total']);

app.post('/api/orders', async (req, res) => {
  // ⚡ Async validation (non-blocking)
  const input = await validateInput()
    .withCustomerId(req.body.customerId)
    .withItems(req.body.items)
    .buildAsync();

  // ⚡ Fast domain object creation
  const order = createOrder()
    .withId(generateId())
    .withCustomerId(input.customerId)
    .withItems(input.items)
    .build();

  await db.orders.create(order);

  // ⚡ Ultra-fast DTO creation
  const response = createResponse()
    .withId(order.id)
    .withStatus(order.status)
    .withTotal(order.total)
    .build();

  res.json(response);
});
```

**Results:**

- Async validation: No event loop blocking
- Class builder: ~300k ops/sec (good enough for domain logic)
- Interface builder: ~400k ops/sec (blazing fast for DTOs)

---

### How to use async builders correctly

**Problem:** You're not sure when to use `builderAsync` vs `builder`.

**Solution:** Use async when validation is CPU-intensive or in high-concurrency scenarios.

**❌ Wrong - sync in high-concurrency:**

```typescript
// Bad: Blocks event loop under load
app.post('/api/data', (req, res) => {
  const data = builder(HeavySchema)().withLargeField(req.body.large).build(); // ← Blocks for 10-50ms per request

  // Under 1000 concurrent requests, this creates latency spikes
});
```

**✅ Right - async in high-concurrency:**

```typescript
// Good: Yields to event loop
app.post('/api/data', async (req, res) => {
  const data = await builderAsync(HeavySchema)().withLargeField(req.body.large).buildAsync(); // ← Non-blocking

  // Event loop can process other requests during validation
});
```

**When to use async:**

- ✅ API servers with >100 concurrent requests
- ✅ Schemas with complex validation rules
- ✅ Processing large arrays/objects

**When sync is fine:**

- ✅ CLI tools
- ✅ Background workers (low concurrency)
- ✅ Simple validation (<5ms)

---

### How to monitor pool performance

**Problem:** You want to see if object pooling is working efficiently.

**Solution:** Use pool statistics APIs.

```typescript
import { getDetailedPoolStats, resetPoolStats } from '@noony-serverless/type-builder';

// Reset stats before measurement
resetPoolStats();

// Run your workload
for (let i = 0; i < 10000; i++) {
  const user = createUser().withEmail(`user${i}@example.com`).withName(`User ${i}`).build();
}

// Check stats
const stats = getDetailedPoolStats();

console.log('Performance Metrics:');
console.log(`Total pools: ${stats.sync.totalPools}`);
console.log(`Total objects created: ${stats.sync.totalCreated}`);
console.log(`Cache hits: ${stats.sync.totalHits}`);
console.log(`Cache misses: ${stats.sync.totalMisses}`);
console.log(`Hit rate: ${(stats.sync.averageHitRate * 100).toFixed(2)}%`);

// Expected output:
// Total pools: 1
// Total objects created: 150
// Cache hits: 9850
// Cache misses: 150
// Hit rate: 98.50%
```

**What good stats look like:**

- Hit rate >95%: Excellent pooling efficiency
- Total objects << iterations: Pool is reusing objects
- Low cache misses: Pool size is appropriate

---

### How to clear pools when needed

**Problem:** You need to clear pools (e.g., during testing or memory cleanup).

**Solution:** Use `clearPools()`.

```typescript
import { clearPools } from '@noony-serverless/type-builder';

// In tests
afterEach(() => {
  clearPools(); // ← Reset pools between tests
});

// In production (rarely needed)
app.post('/admin/clear-cache', (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  clearPools();
  res.json({ success: true, message: 'Pools cleared' });
});
```

**Note:** Clearing pools forces new object allocation on next use. Only do this when necessary.

---

## Integration

### How to integrate with Express.js

**Problem:** You want to validate request bodies in Express routes.

**Solution:** Create a validation middleware.

```typescript
import express, { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import builder from '@noony-serverless/type-builder';

// Validation middleware factory
function validateBody<T extends ZodSchema>(schema: T) {
  const validate = builder(schema);

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = validate()
        .withEmail(req.body.email)
        .withPassword(req.body.password)
        .withName(req.body.name)
        .build();

      next(); // ← Proceed if valid
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      } else {
        next(error);
      }
    }
  };
}

// Usage
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string(),
});

app.post(
  '/api/users',
  validateBody(CreateUserSchema), // ← Middleware
  (req, res) => {
    // req.body is now validated and typed
    const user = req.body;
    res.json({ success: true, user });
  }
);
```

---

### How to integrate with NestJS

**Problem:** You want to use builders in NestJS services.

**Solution:** Create builders in service constructors.

```typescript
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import builder from '@noony-serverless/type-builder';

const CreateUserDto = z.object({
  email: z.string().email(),
  name: z.string(),
});

@Injectable()
export class UserService {
  private createUser = builder(CreateUserDto);

  async createUser(data: z.infer<typeof CreateUserDto>) {
    // Validate with builder
    const validatedData = this.createUser().withEmail(data.email).withName(data.name).build();

    // Save to database
    return this.userRepository.create(validatedData);
  }
}

// Controller
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  async create(@Body() body: any) {
    return this.userService.createUser(body);
  }
}
```

---

### How to use with Prisma/TypeORM

**Problem:** You want to build entities before saving to database.

**Solution:** Create builders for your entities.

**With Prisma:**

```typescript
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Zod schema matching Prisma model
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  age: z.number().optional(),
});

const validateUser = builder(CreateUserSchema);

async function createUser(data: any) {
  // Validate input
  const validated = validateUser()
    .withEmail(data.email)
    .withName(data.name)
    .withAge(data.age)
    .build();

  // Save to database
  return prisma.user.create({
    data: validated,
  });
}
```

**With TypeORM:**

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import builder from '@noony-serverless/type-builder';

@Entity()
class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  email!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  age?: number;
}

const createUser = builder(User);

async function saveUser(data: any) {
  const user = createUser().withEmail(data.email).withName(data.name).withAge(data.age).build();

  return userRepository.save(user);
}
```

---

### How to test builders

**Problem:** You need to write tests for code using builders.

**Solution:** Mock the builder or use test data builders.

**Unit test example:**

```typescript
import { describe, it, expect } from 'vitest';

describe('User Builder', () => {
  it('should create valid user', () => {
    const user = createUser().withEmail('test@example.com').withName('Test User').build();

    expect(user.email).toBe('test@example.com');
    expect(user.name).toBe('Test User');
  });

  it('should throw on invalid email', () => {
    expect(() => createUser().withEmail('invalid-email').withName('Test').build()).toThrow(
      'Invalid email'
    );
  });

  it('should handle optional fields', () => {
    const user = createUser().withEmail('test@example.com').withName('Test').build();

    expect(user.age).toBeUndefined();
  });
});
```

**Test data builder pattern:**

```typescript
// Test helpers
function createTestUser(overrides?: Partial<User>): User {
  return createUser()
    .withEmail(overrides?.email ?? 'test@example.com')
    .withName(overrides?.name ?? 'Test User')
    .withAge(overrides?.age ?? 25)
    .build();
}

// Use in tests
it('should process user', () => {
  const user = createTestUser({ email: 'alice@example.com' });
  const result = processUser(user);
  expect(result).toBeDefined();
});
```

---

## Troubleshooting

### How to debug builder creation

**Problem:** Builder isn't being created correctly.

**Solution:** Check what type was detected.

```typescript
import { detectBuilderType } from '@noony-serverless/type-builder/detection';

// Check detection
const type = detectBuilderType(UserSchema);
console.log('Detected type:', type); // 'zod', 'class', or 'interface'

// Check extracted keys
import { extractKeysFromZod, extractKeysFromClass } from '@noony-serverless/type-builder/detection';

const keys = extractKeysFromZod(UserSchema);
console.log('Extracted keys:', keys); // ['email', 'name', 'age']
```

---

### How to fix "property doesn't exist" errors

**Problem:** TypeScript complains that `.withXYZ()` doesn't exist.

**Solution:** Make sure the property is defined in your schema/class/interface.

**❌ Wrong:**

```typescript
interface User {
  email: string;
  name: string;
}

const createUser = builder<User>(['email', 'name']);

createUser()
  .withEmail('test@example.com')
  .withAge(25) // ❌ Error: Property 'withAge' doesn't exist
  .build();
```

**✅ Fixed:**

```typescript
interface User {
  email: string;
  name: string;
  age: number; // ← Add the property
}

const createUser = builder<User>(['email', 'name', 'age']); // ← Include in array

createUser()
  .withEmail('test@example.com')
  .withAge(25) // ✅ Works
  .build();
```

---

### How to handle circular dependencies

**Problem:** Your objects have circular references.

**Solution:** Build in stages or use a different approach.

**Problem code:**

```typescript
interface User {
  name: string;
  friends: User[]; // ← Circular!
}
```

**Solution 1: Build in stages**

```typescript
const user1 = createUser().withName('Alice').withFriends([]).build();

const user2 = createUser().withName('Bob').withFriends([user1]).build();

// Update user1
user1.friends.push(user2);
```

**Solution 2: Use IDs instead**

```typescript
interface User {
  name: string;
  friendIds: string[]; // ← No circular reference
}

const user1 = createUser().withName('Alice').withFriendIds(['user2-id']).build();
```

---

## Quick Reference

### Common Patterns Cheat Sheet

```typescript
// ✅ Zod builder (validation)
const create = builder(zodSchema);

// ✅ Class builder (methods)
const create = builder(MyClass);

// ✅ Interface builder (speed)
const create = builder<MyInterface>(['prop1', 'prop2']);

// ✅ Async builder
const create = builderAsync(zodSchema);
await create().withProp(value).buildAsync();

// ✅ Optional fields
z.string().optional()
class MyClass { prop?: string }

// ✅ Default values
z.string().default('value')
class MyClass { prop = 'value' }

// ✅ Nested objects
.withNested({ key: 'value' })

// ✅ Error handling
try {
  create().build();
} catch (error) {
  if (error instanceof ZodError) { /* handle */ }
}

// ✅ Pool stats
import { getPoolStats, clearPools } from '@noony-serverless/type-builder';
```

---

## More Help

- **Tutorial:** [Step-by-step learning guide](./TUTORIAL.md)
- **Explanation:** [Understanding the design](./EXPLANATION.md)
- **Reference:** [Complete API docs](./REFERENCE.md)
- **GitHub Issues:** [Report bugs or ask questions](https://github.com/your-org/typescript-bulder-lib/issues)
