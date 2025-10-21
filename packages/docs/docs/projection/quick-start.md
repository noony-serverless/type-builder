---
sidebar_position: 1
---

# Quick Start: DynamicPick

Learn how to use **customPicker** to project and select specific fields from objects in just 5 minutes!

## TL;DR - Show Me the Code!

```typescript
import { customPicker } from '@noony-serverless/type-builder';

const user = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  password: 'secret123',
  internalId: 'USR-XYZ-001',
};

// Project only safe fields for API response
const safeUser = customPicker(user, ['id', 'name', 'email']);

console.log(safeUser);
// { id: 1, name: 'John Doe', email: 'john@example.com' }
```

**That's it!** Password and internal fields are automatically stripped out.

---

## What is DynamicPick?

**DynamicPick** (or field selection) is selecting specific fields from an object while excluding others. It's similar to:

- **MongoDB's projection**: `db.users.find({}, { name: 1, email: 1 })`
- **GraphQL's field selection**: `{ user { id name email } }`
- **SQL's SELECT**: `SELECT id, name, email FROM users`

### Why Use It?

✅ **API Response Sanitization** - Remove sensitive fields (passwords, tokens)
✅ **Data Privacy** - Expose only public fields
✅ **Performance** - Transfer less data over the network
✅ **Type Safety** - TypeScript validates field names
✅ **Validation** - Optional Zod schema validation

---

## Installation

```bash
npm install @noony-serverless/type-builder zod
```

The projection API is included in the main package:

```typescript
import { customPicker } from '@noony-serverless/type-builder';
```

---

## Basic Usage

### Simple DynamicPick

```typescript
const user = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  password: 'secret',
};

const publicUser = customPicker(user, ['id', 'name', 'email']);
// Returns: { id: 1, name: 'John Doe', email: 'john@example.com' }
```

### Nested DynamicPick

```typescript
const order = {
  id: 1,
  user: {
    name: 'John',
    email: 'john@example.com',
    password: 'secret',
  },
  total: 99.99,
};

const publicOrder = customPicker(order, [
  'id',
  'user.name',
  'user.email',
  'total',
]);

// Returns:
// {
//   id: 1,
//   user: { name: 'John', email: 'john@example.com' },
//   total: 99.99
// }
```

### Array DynamicPick

```typescript
const order = {
  id: 1,
  items: [
    { id: 101, name: 'Laptop', price: 999, cost: 500 },
    { id: 102, name: 'Mouse', price: 29, cost: 10 },
  ],
};

const publicOrder = customPicker(order, [
  'id',
  'items[].id',
  'items[].name',
  'items[].price',
]);

// Returns:
// {
//   id: 1,
//   items: [
//     { id: 101, name: 'Laptop', price: 999 },
//     { id: 102, name: 'Mouse', price: 29 }
//   ]
// }
```

---

## Path Syntax

### Simple Fields
```typescript
['name', 'email', 'age']
```

### Nested Objects
```typescript
['user.name', 'user.address.city', 'profile.settings.theme']
```

### Arrays
```typescript
['items[]']                    // Entire array
['items[].id']                 // Specific field from array items
['items[].name']               // Another field
```

### Deep Nested Arrays
```typescript
[
  'comments[].text',           // First level array
  'comments[].author.name',    // Nested object in array
  'comments[].replies[].text'  // Nested array in array
]
```

---

## Common Patterns

### Pattern 1: API Response Sanitization

```typescript
import express from 'express';

const app = express();

app.get('/api/users/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id);

  // Remove sensitive fields
  const publicUser = customPicker(user, ['id', 'name', 'email', 'createdAt']);

  res.json(publicUser);
});
```

### Pattern 2: GraphQL-style Field Selection

```typescript
app.get('/api/users', async (req, res) => {
  const users = await db.users.findMany();

  // User can specify fields via query params
  const fields = req.query.fields?.split(',') || ['id', 'name', 'email'];

  const projected = customPicker(users, fields);

  res.json(projected);
});
```

### Pattern 3: Reusable Projection

```typescript
import { createPicker } from '@noony-serverless/type-builder';

// Create reusable picker (schema is cached)
const toPublicUser = createPicker(['id', 'name', 'email', 'avatar']);

// Use it multiple times
const user1 = toPublicUser(dbUser1);
const user2 = toPublicUser(dbUser2);
const users = toPublicUser([dbUser1, dbUser2, dbUser3]);
```

### Pattern 4: Omit Fields (Inverse)

```typescript
import { omitFields } from '@noony-serverless/type-builder';

const user = {
  id: 1,
  name: 'John',
  email: 'john@example.com',
  password: 'secret',
  token: 'abc123',
};

// Omit sensitive fields (keep everything else)
const safeUser = omitFields(user, ['password', 'token']);
// Returns: { id: 1, name: 'John', email: 'john@example.com' }
```

---

## Type Safety

Full TypeScript support with type inference:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

interface PublicUser {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: 'John',
  email: 'john@example.com',
  password: 'secret',
};

// Type-safe projection
const publicUser = pickFields<User, PublicUser>(user, ['id', 'name', 'email']);
// Type: PublicUser
```

---

## Schema-based Validation

Use Zod schemas for both projection and validation:

```typescript
import { z } from 'zod';

const PublicUserSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  email: z.string().email(),
});

const dbUser = {
  id: 1,
  name: 'John',
  email: 'john@example.com',
  password: 'secret',
  internalId: 'USR-001',
};

// Project AND validate
const publicUser = customPicker(dbUser, PublicUserSchema);
// Returns validated: { id: 1, name: 'John', email: 'john@example.com' }

// Invalid data throws ZodError
const invalidUser = { ...dbUser, email: 'not-an-email' };
customPicker(invalidUser, PublicUserSchema); // ❌ Throws validation error
```

---

## Performance

### How Fast Is It?

```typescript
// Benchmark results (operations per second)
Simple projection (cached):    ~300,000 ops/sec  (~3.3μs per operation)
Nested projection (cached):    ~200,000 ops/sec  (~5μs per operation)
First call (builds schema):    ~100,000 ops/sec  (~10μs per operation)
```

### Automatic Caching

Schemas are automatically cached (~70% performance improvement):

```typescript
const toDTO = createPicker(['id', 'name', 'email']);

// First call: builds schema (~10μs)
const user1 = toDTO(dbUser1);

// Subsequent calls: uses cached schema (~3μs)
const user2 = toDTO(dbUser2);
const user3 = toDTO(dbUser3);
```

### Cache Management

```typescript
import {
  clearGlobalSchemaCache,
  getGlobalSchemaCacheStats,
} from '@noony-serverless/type-builder';

// Get cache statistics
const stats = getGlobalSchemaCacheStats();
console.log(`Cache size: ${stats.size}, Hit rate: ${stats.hitRate}`);

// Clear cache (e.g., in tests)
clearGlobalSchemaCache();
```

---

## Comparison with Alternatives

| Approach | Performance | Type Safety | Validation | API |
|----------|-------------|-------------|------------|-----|
| **customPicker** | ⚡⚡⚡ Fast | ✅ Full | ✅ Optional | 🎯 Simple |
| Manual picking | ⚡⚡⚡⚡ Fastest | ⚠️ Partial | ❌ None | 😓 Tedious |
| Lodash `pick` | ⚡⚡ Slower | ❌ None | ❌ None | 😊 Simple |
| Zod transform | ⚡ Slowest | ✅ Full | ✅ Always | 😐 Complex |

---

## Real-World Example

Complete API endpoint with projection:

```typescript
import express from 'express';
import { createPicker, customPicker } from '@noony-serverless/type-builder';

const app = express();

// Create reusable projections
const toUserListItem = createPicker(['id', 'name', 'email', 'avatar']);

const toUserDetail = createPicker([
  'id',
  'name',
  'email',
  'avatar',
  'bio',
  'createdAt',
  'settings.theme',
  'settings.language',
]);

// List endpoint (minimal fields)
app.get('/api/users', async (req, res) => {
  const users = await db.users.findMany();
  res.json(toUserListItem(users));
});

// Detail endpoint (more fields)
app.get('/api/users/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id);
  res.json(toUserDetail(user));
});

// Custom projection via query params
app.get('/api/users/:id/custom', async (req, res) => {
  const user = await db.users.findById(req.params.id);
  const fields = req.query.fields?.split(',') || ['id', 'name'];

  res.json(customPicker(user, fields));
});
```

---

## Next Steps

Now that you understand the basics, explore:

- 📖 [How-to Guides](./how-to-guides) - Solve specific problems
- 🔍 [API Reference](./api-reference) - Complete function reference
- 💡 [Understanding Projection](./understanding) - How it works internally
- 🎨 [Advanced Patterns](./advanced-patterns) - Shape-based projection and more

---

## Frequently Asked Questions

### Can I use this with arrays?

**Yes!** Pass an array to any picker function:

```typescript
const users = [/* array of users */];
const publicUsers = customPicker(users, ['id', 'name', 'email']);
```

### Does this modify the original object?

**No!** The original object is never modified. A new object is always returned.

### What if a field doesn't exist?

By default, missing fields are ignored. Use `{ strict: true }` to throw errors:

```typescript
customPicker(user, ['id', 'name', 'missingField'], { strict: true });
// ❌ Throws error if 'missingField' is missing
```

### Can I keep extra fields?

Yes, use `{ stripUnknown: false }`:

```typescript
customPicker(user, ['id', 'name'], { stripUnknown: false });
// Returns all fields, ensuring 'id' and 'name' exist
```

### Is this compatible with the builder pattern?

**Yes!** They work great together:

```typescript
import { builder, customPicker } from '@noony-serverless/type-builder';

// Build object
const user = createUser()
  .withId(1)
  .withName('John')
  .withEmail('john@example.com')
  .withPassword('secret')
  .build();

// Project safe fields
const publicUser = customPicker(user, ['id', 'name', 'email']);
```

---

**Ready to dive deeper?** Check out the [How-to Guides](./how-to-guides) next!
