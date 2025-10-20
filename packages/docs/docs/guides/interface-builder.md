# Interface Builder

The **Interface Builder** is the fastest builder mode in UltraFastBuilder, optimized for maximum performance when building plain objects.

## Overview

- **Performance**: 400,000+ operations per second (~2.5μs per operation)
- **Memory**: ~60 bytes per object
- **Use Case**: Internal DTOs, data transformation, high-throughput scenarios
- **Trade-off**: No runtime validation

## When to Use

Use Interface mode when:

- ✅ Building internal data transfer objects (DTOs)
- ✅ Transforming database records to API responses
- ✅ High-performance requirements (thousands of objects per second)
- ✅ Data has already been validated upstream
- ✅ You don't need methods on the objects

Don't use Interface mode when:

- ❌ You need runtime validation (use [Zod mode](./zod-builder.md))
- ❌ You need methods on objects (use [Class mode](./class-builder.md))
- ❌ You're handling external user input

## Basic Usage

### Defining an Interface Builder

```typescript
import { builder } from '@noony-serverless/type-builder';

interface UserDTO {
  id: number;
  name: string;
  email: string;
}

// Pass the interface type and array of property keys
const createUserDTO = builder<UserDTO>(['id', 'name', 'email']);

const user = createUserDTO()
  .withId(1)
  .withName('John Doe')
  .withEmail('john@example.com')
  .build();

console.log(user); // { id: 1, name: 'John Doe', email: 'john@example.com' }
```

### With Complex Types

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  tags: string[];
  metadata: Record<string, any>;
}

const createProduct = builder<Product>([
  'id',
  'name',
  'price',
  'tags',
  'metadata'
]);

const product = createProduct()
  .withId('PROD-001')
  .withName('Laptop')
  .withPrice(999.99)
  .withTags(['electronics', 'computers'])
  .withMetadata({ color: 'silver', weight: '1.5kg' })
  .build();
```

## Real-World Examples

### Database to DTO Transformation

```typescript
import express from 'express';

interface UserEntity {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: Date;
  password_hash: string;
}

interface UserDTO {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

const toUserDTO = builder<UserDTO>([
  'id',
  'email',
  'name',
  'createdAt'
]);

const app = express();

app.get('/api/users', async (req, res) => {
  const users: UserEntity[] = await db.users.findMany();

  // Transform 10,000 records in ~25ms
  const dtos = users.map(user =>
    toUserDTO()
      .withId(user.id)
      .withEmail(user.email)
      .withName(`${user.first_name} ${user.last_name}`)
      .withCreatedAt(user.created_at.toISOString())
      .build()
  );

  res.json(dtos);
});
```

### GraphQL Resolvers

```typescript
interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
}

const createPost = builder<Post>(['id', 'title', 'content', 'authorId']);

const resolvers = {
  Query: {
    posts: async () => {
      const posts = await db.posts.findMany();

      return posts.map(post =>
        createPost()
          .withId(post.id)
          .withTitle(post.title)
          .withContent(post.content)
          .withAuthorId(post.author_id)
          .build()
      );
    }
  }
};
```

### Testing Factory

```typescript
interface TestUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

const createTestUser = builder<TestUser>(['id', 'email', 'name', 'role']);

describe('User Service', () => {
  it('should process admin users', () => {
    const admin = createTestUser()
      .withId(1)
      .withEmail('admin@example.com')
      .withName('Admin User')
      .withRole('admin')
      .build();

    const result = userService.processUser(admin);
    expect(result.hasAdminAccess).toBe(true);
  });
});
```

## Performance Characteristics

### Benchmark Results

```typescript
// Building 100,000 objects
const createUser = builder<User>(['id', 'name', 'email']);

console.time('interface-builder');
for (let i = 0; i < 100000; i++) {
  createUser()
    .withId(i)
    .withName('John Doe')
    .withEmail('john@example.com')
    .build();
}
console.timeEnd('interface-builder');
// interface-builder: ~250ms (400,000 ops/sec)
```

### Why It's Fast

1. **No validation**: Skips all validation logic
2. **No class instantiation**: Returns plain objects
3. **Object pooling**: Reuses builder instances
4. **Minimal allocations**: Reduces garbage collection pressure

## Best Practices

### 1. Reuse Builder Factories

```typescript
// ✅ GOOD: Create once, reuse
const createDTO = builder<UserDTO>(['id', 'name']);

function transformUsers(users: User[]): UserDTO[] {
  return users.map(user =>
    createDTO()
      .withId(user.id)
      .withName(user.name)
      .build()
  );
}

// ❌ BAD: Create inside loop
function transformUsers(users: User[]): UserDTO[] {
  return users.map(user => {
    const createDTO = builder<UserDTO>(['id', 'name']); // Slow!
    return createDTO().withId(user.id).withName(user.name).build();
  });
}
```

### 2. Use for Internal Data Only

```typescript
// ✅ GOOD: Internal transformation
const users = await db.users.findMany();
const dtos = users.map(u => createDTO().withId(u.id).build());

// ❌ BAD: External user input (use Zod instead)
app.post('/api/users', (req, res) => {
  const user = createDTO()
    .withEmail(req.body.email) // No validation!
    .build();
});
```

### 3. Validate Upstream

```typescript
// ✅ GOOD: Validate at boundary, transform internally
const validateInput = builder(CreateUserSchema); // Zod mode

app.post('/api/users', async (req, res) => {
  // Validate at API boundary
  const validated = validateInput()
    .withEmail(req.body.email)
    .withName(req.body.name)
    .build();

  // Transform for internal use (fast)
  const dto = createUserDTO()
    .withId(generateId())
    .withEmail(validated.email)
    .withName(validated.name)
    .build();

  await db.users.create(dto);
  res.json(dto);
});
```

## Type Safety

TypeScript provides compile-time safety:

```typescript
interface Product {
  id: number;
  name: string;
  price: number;
}

const create = builder<Product>(['id', 'name', 'price']);

// ✅ Type-safe
create().withId(1).withName('Laptop').withPrice(999);

// ❌ TypeScript errors
create().withId('invalid');      // Error: Type 'string' not assignable to 'number'
create().withInvalidProp('foo'); // Error: Property 'withInvalidProp' does not exist
```

## Comparison with Other Modes

| Feature | Interface | Class | Zod |
|---------|-----------|-------|-----|
| **Speed** | 400k ops/sec | 300k ops/sec | 100k ops/sec |
| **Memory** | ~60 bytes | ~80 bytes | ~120 bytes |
| **Validation** | None | None | Runtime |
| **Methods** | No | Yes | No |
| **Use Case** | Internal DTOs | Domain models | API validation |

## Next Steps

- [Class Builder Guide](./class-builder.md) - Add methods to your objects
- [Zod Builder Guide](./zod-builder.md) - Add runtime validation
- [Performance Optimization](./performance-optimization.md) - Squeeze out more speed
- [Object Pooling](./object-pooling.md) - Understand the pooling system
