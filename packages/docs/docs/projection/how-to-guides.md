---
sidebar_position: 2
---

# How-to Guides

Practical solutions to common DynamicPick problems.

## API Response Sanitization

### Problem
You need to remove sensitive fields before sending data to clients.

### Solution

```typescript
import { createPicker } from '@noony-serverless/type-builder';
import express from 'express';

// Define safe projections once
const toPublicUser = createPicker([
  'id',
  'name',
  'email',
  'avatar',
  'createdAt',
]);

const app = express();

app.get('/api/users/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id);
  // Database user has: password, passwordHash, salt, sessionToken, etc.

  res.json(toPublicUser(user));
  // Response only has: id, name, email, avatar, createdAt
});
```

**Why this works:**
- `createPicker` caches the schema for performance
- All fields not in the projection are automatically stripped
- Original database object is never modified

---

## Dynamic Field Selection (GraphQL-style)

### Problem
Let clients specify which fields they want via API query parameters.

### Solution

```typescript
import { customPicker } from '@noony-serverless/type-builder';

app.get('/api/posts', async (req, res) => {
  const posts = await db.posts.findMany();

  // Parse fields from query: /api/posts?fields=id,title,author.name
  const requestedFields = req.query.fields
    ? req.query.fields.split(',')
    : ['id', 'title', 'excerpt']; // Default fields

  // Whitelist allowed fields for security
  const allowedFields = [
    'id',
    'title',
    'excerpt',
    'content',
    'author.id',
    'author.name',
    'author.email',
    'comments[].id',
    'comments[].text',
    'createdAt',
  ];

  const safeFields = requestedFields.filter((field) =>
    allowedFields.includes(field)
  );

  res.json(customPicker(posts, safeFields));
});
```

**Security Note:** Always whitelist allowed fields to prevent exposing sensitive data.

---

## Database JOIN Result Projection

### Problem
Database JOINs return flat objects with prefixed column names. You need structured nested objects.

### Solution

```typescript
interface FlatDBResult {
  user_id: number;
  user_name: string;
  user_email: string;
  order_id: number;
  order_total: number;
  order_created_at: string;
}

interface NestedAPIResponse {
  user: {
    id: number;
    name: string;
    email: string;
  };
  order: {
    id: number;
    total: number;
    createdAt: string;
  };
}

// First, reshape the data
const dbResults = await db.query(`
  SELECT
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    o.id as order_id,
    o.total as order_total,
    o.created_at as order_created_at
  FROM users u
  JOIN orders o ON u.id = o.user_id
`);

// Transform flat structure to nested
const apiResponse = dbResults.map((row) => ({
  user: customPicker(
    {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
    },
    ['id', 'name', 'email']
  ),
  order: customPicker(
    {
      id: row.order_id,
      total: row.order_total,
      createdAt: row.order_created_at,
    },
    ['id', 'total', 'createdAt']
  ),
}));
```

---

## Remove Null/Undefined Fields

### Problem
You want to strip out null or undefined fields from responses.

### Solution

```typescript
import { customPicker } from '@noony-serverless/type-builder';

function removeNullish<T>(obj: T): Partial<T> {
  const cleaned: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

// Combine projection with null removal
const user = {
  id: 1,
  name: 'John',
  email: 'john@example.com',
  phone: null,
  address: undefined,
  password: 'secret',
};

const projected = customPicker(user, ['id', 'name', 'email', 'phone', 'address']);
const cleaned = removeNullish(projected);

console.log(cleaned);
// { id: 1, name: 'John', email: 'john@example.com' }
```

---

## Shape-based Projection (Reference Objects)

### Problem
You want to define projection using a reference object instead of listing field names.

### Solution

```typescript
import { projectByShape, createShapeProjector } from '@noony-serverless/type-builder';

const fullUser = {
  id: 1,
  name: 'John',
  email: 'john@example.com',
  password: 'secret',
  internalId: 'USR-001',
};

// Define shape with example values (values don't matter, only keys)
const publicUserShape = {
  id: 0,
  name: '',
  email: '',
};

// Project using shape
const publicUser = projectByShape(fullUser, publicUserShape);
// { id: 1, name: 'John', email: 'john@example.com' }

// Create reusable shape projector
const toPublicUser = createShapeProjector(publicUserShape);

const user1 = toPublicUser(dbUser1);
const user2 = toPublicUser(dbUser2);
```

**When to use:**
- When you have existing type definitions or example objects
- For better IDE autocomplete on shapes
- When field names are more readable as objects than arrays

---

## Multi-level Array Projection

### Problem
You have deeply nested arrays and need to project fields from all levels.

### Solution

```typescript
const blogPost = {
  id: 1,
  title: 'My Blog Post',
  author: {
    id: 123,
    name: 'John',
    email: 'john@example.com',
    privateKey: 'secret',
  },
  comments: [
    {
      id: 1,
      text: 'Great post!',
      author: {
        id: 456,
        name: 'Jane',
        ipAddress: '192.168.1.1',
      },
      replies: [
        {
          id: 1,
          text: 'Thanks!',
          author: { id: 123, name: 'John', sessionToken: 'xyz' },
        },
      ],
    },
  ],
};

const publicBlogPost = customPicker(blogPost, [
  'id',
  'title',
  'author.id',
  'author.name',
  'comments[].id',
  'comments[].text',
  'comments[].author.name',
  'comments[].replies[].id',
  'comments[].replies[].text',
  'comments[].replies[].author.name',
]);

console.log(publicBlogPost);
// All sensitive fields (privateKey, ipAddress, sessionToken) removed
// Structure preserved across all nesting levels
```

---

## Validation with Custom Error Handling

### Problem
You need projection with validation but want to handle errors gracefully.

### Solution

```typescript
import { z } from 'zod';
import { customPicker } from '@noony-serverless/type-builder';

const UserResponseSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  email: z.string().email(),
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await db.users.findById(req.params.id);

    // Project and validate
    const publicUser = customPicker(user, UserResponseSchema);

    res.json(publicUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle validation errors
      return res.status(500).json({
        error: 'Data validation failed',
        details: error.errors,
      });
    }
    throw error;
  }
});
```

**Disable validation for performance:**

```typescript
// Skip validation (faster)
const publicUser = customPicker(user, UserResponseSchema, { validate: false });
```

---

## Combine Multiple Projections

### Problem
You need to apply different projections based on user roles.

### Solution

```typescript
import { createPicker } from '@noony-serverless/type-builder';

const publicFields = createPicker(['id', 'name', 'email']);

const memberFields = createPicker([
  'id',
  'name',
  'email',
  'phone',
  'address.city',
  'address.country',
]);

const adminFields = createPicker([
  'id',
  'name',
  'email',
  'phone',
  'address.street',
  'address.city',
  'address.zipCode',
  'address.country',
  'createdAt',
  'lastLogin',
  'role',
]);

app.get('/api/users/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id);
  const requestingUser = req.user;

  let projectedUser;

  if (requestingUser.role === 'admin') {
    projectedUser = adminFields(user);
  } else if (requestingUser.role === 'member') {
    projectedUser = memberFields(user);
  } else {
    projectedUser = publicFields(user);
  }

  res.json(projectedUser);
});
```

---

## Batch Projection with Different Schemas

### Problem
You have an array of objects that need different projections based on their type.

### Solution

```typescript
import { customPicker, createPicker } from '@noony-serverless/type-builder';

interface Activity {
  type: 'post' | 'comment' | 'like';
  data: any;
}

const projectPost = createPicker(['id', 'title', 'excerpt', 'author.name']);
const projectComment = createPicker(['id', 'text', 'author.name', 'post.title']);
const projectLike = createPicker(['id', 'user.name', 'target.title']);

const activities: Activity[] = await db.activities.findMany();

const projected = activities.map((activity) => {
  switch (activity.type) {
    case 'post':
      return { type: 'post', data: projectPost(activity.data) };
    case 'comment':
      return { type: 'comment', data: projectComment(activity.data) };
    case 'like':
      return { type: 'like', data: projectLike(activity.data) };
    default:
      return activity;
  }
});

res.json(projected);
```

---

## Projection with Computed Fields

### Problem
You want to add computed fields during projection.

### Solution

```typescript
import { customPicker } from '@noony-serverless/type-builder';

app.get('/api/products', async (req, res) => {
  const products = await db.products.findMany();

  const projected = products.map((product) => {
    // First, project the fields you need
    const base = customPicker(product, [
      'id',
      'name',
      'price',
      'discount',
      'stock',
    ]);

    // Then, add computed fields
    return {
      ...base,
      finalPrice: base.price * (1 - base.discount),
      inStock: base.stock > 0,
    };
  });

  res.json(projected);
});
```

---

## Omit Nested Fields

### Problem
You want to keep most fields but remove specific nested ones.

### Solution

```typescript
import { customPicker } from '@noony-serverless/type-builder';

const user = {
  id: 1,
  profile: {
    name: 'John',
    email: 'john@example.com',
    settings: {
      theme: 'dark',
      notifications: true,
      privateKey: 'secret',
    },
  },
};

// Keep everything except privateKey
const safe = customPicker(user, [
  'id',
  'profile.name',
  'profile.email',
  'profile.settings.theme',
  'profile.settings.notifications',
  // Omit 'profile.settings.privateKey'
]);

console.log(safe);
// {
//   id: 1,
//   profile: {
//     name: 'John',
//     email: 'john@example.com',
//     settings: { theme: 'dark', notifications: true }
//   }
// }
```

---

## Cache Performance Monitoring

### Problem
You want to monitor projection performance and cache effectiveness.

### Solution

```typescript
import {
  getGlobalSchemaCacheStats,
  resetGlobalSchemaCacheStats,
  clearGlobalSchemaCache,
} from '@noony-serverless/type-builder';

// Middleware to log cache stats
app.use((req, res, next) => {
  res.on('finish', () => {
    const stats = getGlobalSchemaCacheStats();
    console.log(`Cache stats: ${JSON.stringify(stats)}`);
    // { size: 15, hits: 1234, misses: 20, hitRate: 0.984 }
  });
  next();
});

// Periodic cache cleanup (prevent memory growth)
setInterval(() => {
  const stats = getGlobalSchemaCacheStats();

  if (stats.size > 500) {
    console.log('Cache size exceeded limit, clearing...');
    clearGlobalSchemaCache();
  }
}, 60000); // Every minute

// Reset stats for metrics
app.get('/api/metrics/projection', (req, res) => {
  const stats = getGlobalSchemaCacheStats();
  resetGlobalSchemaCacheStats();
  res.json(stats);
});
```

---

## Testing with Projection

### Problem
You need to test projection behavior in your test suite.

### Solution

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { customPicker, clearGlobalSchemaCache } from '@noony-serverless/type-builder';

describe('User API Projection', () => {
  beforeEach(() => {
    // Clear cache before each test for isolation
    clearGlobalSchemaCache();
  });

  it('should remove sensitive fields', () => {
    const dbUser = {
      id: 1,
      name: 'John',
      email: 'john@example.com',
      password: 'secret',
      sessionToken: 'abc123',
    };

    const publicUser = customPicker(dbUser, ['id', 'name', 'email']);

    expect(publicUser).toEqual({
      id: 1,
      name: 'John',
      email: 'john@example.com',
    });
    expect(publicUser).not.toHaveProperty('password');
    expect(publicUser).not.toHaveProperty('sessionToken');
  });

  it('should project nested arrays correctly', () => {
    const order = {
      id: 1,
      items: [
        { id: 101, name: 'Item 1', price: 100, cost: 50 },
        { id: 102, name: 'Item 2', price: 200, cost: 100 },
      ],
    };

    const projected = customPicker(order, ['id', 'items[].id', 'items[].name']);

    expect(projected.items[0]).not.toHaveProperty('price');
    expect(projected.items[0]).not.toHaveProperty('cost');
  });
});
```

---

## Next Steps

- 🔍 [API Reference](./api-reference) - Complete function reference
- 💡 [Understanding Projection](./understanding) - How it works internally
- 🎨 [Advanced Patterns](./advanced-patterns) - Complex use cases
