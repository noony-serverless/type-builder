---
sidebar_position: 4
---

# Understanding Projection

Deep dive into how customPicker works internally, performance characteristics, and design decisions.

## What is DynamicPick?

DynamicPick is the process of **selecting specific fields** from a data structure while **excluding others**. It's a fundamental operation in data transformation that serves several purposes:

1. **Security** - Remove sensitive fields before sending data to clients
2. **Performance** - Transfer less data over the network
3. **Privacy** - Expose only what users are allowed to see
4. **API Design** - Define clear data contracts

### The Problem

Imagine you have a user object from your database:

```typescript
const dbUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  password: '$2a$10$...',           // ❌ Sensitive
  passwordHash: 'xyz',              // ❌ Sensitive
  sessionToken: 'abc123',           // ❌ Sensitive
  internalId: 'USR-XYZ-001',        // ❌ Internal
  createdAt: '2024-01-01',
  lastLogin: '2024-01-15'
};
```

You want to send only safe fields to the client:

```typescript
const apiUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: '2024-01-01'
};
```

### Manual Solutions (Before customPicker)

**Option 1: Manual Object Construction**
```typescript
const apiUser = {
  id: dbUser.id,
  name: dbUser.name,
  email: dbUser.email,
  createdAt: dbUser.createdAt
};
```
- ✅ Simple
- ❌ Repetitive
- ❌ Error-prone (easy to forget fields)
- ❌ Hard to maintain

**Option 2: Destructuring**
```typescript
const { password, passwordHash, sessionToken, internalId, ...apiUser } = dbUser;
```
- ✅ Concise
- ❌ Excludes instead of includes (risky - new fields auto-exposed)
- ❌ No type safety
- ❌ Doesn't work with nested objects

**Option 3: Lodash `pick`**
```typescript
import _ from 'lodash';
const apiUser = _.pick(dbUser, ['id', 'name', 'email', 'createdAt']);
```
- ✅ Declarative
- ❌ No type safety
- ❌ No validation
- ❌ Doesn't handle nested paths well
- ❌ No caching (slower)

### The customPicker Solution

```typescript
import { customPicker } from '@noony-serverless/type-builder';

const apiUser = customPicker(dbUser, ['id', 'name', 'email', 'createdAt']);
```

- ✅ Declarative
- ✅ Type-safe
- ✅ Optional validation
- ✅ Handles nested objects and arrays
- ✅ Automatic schema caching
- ✅ 300,000+ ops/sec performance

---

## Architecture Overview

### High-Level Flow

```
Input Data + Projection Paths
         ↓
    Path Parser
         ↓
    Path Tree Builder
         ↓
    Schema Builder (Zod)
         ↓
    Schema Cache (LRU)
         ↓
    Zod Validation/Projection
         ↓
    Projected Output
```

### Core Components

#### 1. Path Parser

Converts string paths into structured segments:

```typescript
'user.address.city'
  ↓
[
  { key: 'user', isArray: false },
  { key: 'address', isArray: false },
  { key: 'city', isArray: false }
]

'items[].id'
  ↓
[
  { key: 'items', isArray: true },
  { key: 'id', isArray: false }
]
```

**Key Functions:**
- `parsePath()` - Parse single path into segments
- `buildPathTree()` - Build nested tree from multiple paths
- `normalizePaths()` - Deduplicate and sort paths for caching

#### 2. Schema Builder

Converts path tree into Zod schema:

```typescript
buildProjectionSchema(['name', 'email', 'address.city'])
  ↓
z.object({
  name: z.any().optional(),
  email: z.any().optional(),
  address: z.object({
    city: z.any().optional()
  }).optional()
})
```

**Why Zod?**
- ✅ Runtime validation
- ✅ Strip unknown fields automatically
- ✅ Composable schemas
- ✅ Great TypeScript integration
- ✅ Battle-tested library

#### 3. Schema Cache

LRU cache for built schemas:

```typescript
// First call: builds schema (~10μs)
customPicker(user, ['id', 'name', 'email']);

// Second call: uses cached schema (~3μs)
customPicker(user2, ['id', 'name', 'email']);
```

**Cache Strategy:**
- **LRU eviction** - Least recently used schemas are evicted
- **Max size: 1000** - Prevents unbounded memory growth
- **Cache key** - Normalized, sorted path string (`'email|id|name'`)
- **Performance gain** - ~70% faster on cache hits

---

## How Path Parsing Works

### Simple Paths

```typescript
parsePath('name')
// [{ key: 'name', isArray: false }]
```

### Nested Paths

```typescript
parsePath('user.address.city')
// [
//   { key: 'user', isArray: false },
//   { key: 'address', isArray: false },
//   { key: 'city', isArray: false }
// ]
```

### Array Paths

The `[]` suffix indicates an array field:

```typescript
parsePath('items[]')
// [{ key: 'items', isArray: true }]

parsePath('items[].id')
// [
//   { key: 'items', isArray: true },
//   { key: 'id', isArray: false }
// ]
```

### Deep Nested Arrays

```typescript
parsePath('comments[].replies[].author.name')
// [
//   { key: 'comments', isArray: true },
//   { key: 'replies', isArray: true },
//   { key: 'author', isArray: false },
//   { key: 'name', isArray: false }
// ]
```

### Path Tree Structure

Multiple paths are merged into a tree:

```typescript
buildPathTree([
  'user.name',
  'user.email',
  'items[].id',
  'items[].name'
])

// Returns:
{
  user: {
    name: true,
    email: true
  },
  'items[]': {
    id: true,
    name: true
  }
}
```

**Leaf nodes** (`true`) indicate terminal fields.
**Branch nodes** (objects) indicate nesting.

---

## How Schema Building Works

### Leaf Fields (Simple)

```typescript
buildProjectionSchema(['name', 'email'])

// Generates:
z.object({
  name: z.any().optional(),
  email: z.any().optional()
})
```

**Why `.optional()`?**
- Allows missing fields (non-strict mode)
- Can be made required with `{ strict: true }`

**Why `z.any()`?**
- We don't know the actual types from paths alone
- Users can provide Zod schemas for type validation

### Nested Objects

```typescript
buildProjectionSchema(['user.name', 'user.email'])

// Generates:
z.object({
  user: z.object({
    name: z.any().optional(),
    email: z.any().optional()
  }).optional()
})
```

### Arrays

```typescript
buildProjectionSchema(['items[]'])

// Generates:
z.object({
  items: z.array(z.any()).optional()
})
```

### Array of Objects

```typescript
buildProjectionSchema(['items[].id', 'items[].name'])

// Generates:
z.object({
  items: z.array(
    z.object({
      id: z.any().optional(),
      name: z.any().optional()
    })
  ).optional()
})
```

### Deep Nesting

```typescript
buildProjectionSchema([
  'comments[].text',
  'comments[].author.name',
  'comments[].replies[].text'
])

// Generates:
z.object({
  comments: z.array(
    z.object({
      text: z.any().optional(),
      author: z.object({
        name: z.any().optional()
      }).optional(),
      replies: z.array(
        z.object({
          text: z.any().optional()
        })
      ).optional()
    })
  ).optional()
})
```

---

## Caching Strategy

### Cache Key Generation

Paths are **normalized** before caching:

```typescript
// These all generate the same cache key:
['name', 'email', 'id']
['email', 'id', 'name']
['id', 'name', 'email']

// Normalized: 'email|id|name' (sorted, deduplicated, joined)
```

**Why normalize?**
- Order doesn't matter for projection
- Maximizes cache hits
- Prevents duplicate schemas

### LRU Eviction

When cache size exceeds `maxSize` (default: 1000):

1. Oldest accessed schema is evicted
2. New schema is cached
3. Access order is updated

**Example:**
```typescript
const cache = new SchemaCache(3); // Max 3 schemas

cache.set('a', schemaA); // Cache: [a]
cache.set('b', schemaB); // Cache: [a, b]
cache.set('c', schemaC); // Cache: [a, b, c]

cache.get('a');          // Access 'a' → Cache: [b, c, a]
cache.set('d', schemaD); // Evict 'b' → Cache: [c, a, d]
```

### Cache Performance

**Cache Hit (~3μs):**
```typescript
const toDTO = createPicker(['id', 'name', 'email']);

// First call: builds schema + caches
const user1 = toDTO(dbUser1); // ~10μs

// Subsequent calls: uses cache
const user2 = toDTO(dbUser2); // ~3μs ← 70% faster!
const user3 = toDTO(dbUser3); // ~3μs
```

**Cache Miss (~10μs):**
```typescript
customPicker(user, ['different', 'fields']); // ~10μs (builds schema)
```

---

## Performance Characteristics

### Benchmark Results

```
Simple projection (cached):      ~300,000 ops/sec  (~3.3μs)
Nested projection (cached):      ~200,000 ops/sec  (~5μs)
Array projection (cached):       ~150,000 ops/sec  (~6.7μs)
First call (builds schema):      ~100,000 ops/sec  (~10μs)

Lodash pick:                     ~500,000 ops/sec  (~2μs)    ← No validation
Manual construction:             ~5,000,000 ops/sec (~0.2μs)  ← No safety
```

### Why Not Faster?

**Tradeoffs:**
- ✅ Type safety
- ✅ Validation
- ✅ Nested path support
- ✅ Array handling
- ⚠️ Zod parsing overhead

**Is 300k ops/sec slow?**
No! That's **3.3 microseconds** per operation.

For context:
- Database query: ~1-10ms (1000-10000μs)
- HTTP request: ~10-100ms (10000-100000μs)
- Projection: ~3μs

### Optimization Tips

**1. Use `createPicker` for repeated projections:**
```typescript
// ✅ GOOD: Pre-cache schema
const toDTO = createPicker(['id', 'name']);
users.map(toDTO);

// ❌ BAD: Rebuild schema every time
users.map(u => customPicker(u, ['id', 'name']));
```

**2. Disable validation if not needed:**
```typescript
// ✅ FAST: Skip validation (~2x faster)
customPicker(data, paths, { validate: false });

// ⚠️ SLOWER: Full validation
customPicker(data, paths, { validate: true });
```

**3. Keep projections simple:**
```typescript
// ✅ FAST: Shallow projection
['id', 'name', 'email']

// ⚠️ SLOWER: Deep nesting
['comments[].replies[].author.profile.settings.theme']
```

---

## Design Decisions

### Why Zod?

**Considered Alternatives:**
1. **Manual object traversal** - Fast but no validation
2. **JSON Schema** - Validation but complex API
3. **Yup** - Similar to Zod but less TypeScript support
4. **Custom validator** - More control but more code

**Why Zod Won:**
- ✅ Best TypeScript integration
- ✅ Composable schemas
- ✅ `.strip()` removes unknown fields automatically
- ✅ Battle-tested
- ✅ Already used in builder pattern

### Why Auto-Caching?

**Alternatives:**
1. **No caching** - Simple but slow
2. **Manual caching** - Fast but complex API
3. **Auto-caching** - Best of both worlds

**Benefits:**
- Users don't think about caching
- 70% performance improvement
- Configurable (`{ cache: false }`)

### Why Path Strings?

**Alternatives:**
1. **Object notation**: `{ user: { name: true, email: true } }`
2. **Function chains**: `.pick('user').pick('name')`
3. **Path strings**: `['user.name', 'user.email']`

**Why Path Strings Won:**
- ✅ Concise
- ✅ Easy to serialize (URL params, JSON)
- ✅ Familiar (MongoDB, GraphQL)
- ✅ Easy to validate/whitelist

### Why `[]` Array Syntax?

**Alternatives:**
1. **`.items`** - Ambiguous (field or array?)
2. **`.*`** - Unix-style but unclear
3. **`[]`** - Clear and familiar (ES6, TypeScript)

**Benefits:**
- Clear intent (`items[]` = array)
- Composable (`items[].id`)
- Familiar syntax

---

## Comparison with Alternatives

### vs Lodash `pick`

| Feature | customPicker | Lodash pick |
|---------|--------------|-------------|
| Simple fields | ✅ | ✅ |
| Nested paths | ✅ `'user.name'` | ❌ Manual |
| Arrays | ✅ `'items[].id'` | ❌ Manual |
| Type safety | ✅ TypeScript | ❌ None |
| Validation | ✅ Zod | ❌ None |
| Caching | ✅ Auto | ❌ None |
| Performance | ⚡⚡⚡ 300k ops/sec | ⚡⚡⚡⚡ 500k ops/sec |

**When to use Lodash:**
- Simple, flat objects only
- Performance critical (2x faster)
- No validation needed

**When to use customPicker:**
- Nested objects
- Arrays
- Validation required
- Type safety important

### vs Manual Construction

| Feature | customPicker | Manual |
|---------|--------------|--------|
| Conciseness | ✅ | ❌ Verbose |
| Maintainability | ✅ | ❌ Error-prone |
| Performance | ⚡⚡⚡ 300k ops/sec | ⚡⚡⚡⚡⚡ 5M ops/sec |
| Type safety | ✅ | ⚠️ Partial |

**When to use manual:**
- Ultra-high performance (hot paths)
- Very simple objects (2-3 fields)

**When to use customPicker:**
- Complex objects
- Maintainability matters
- Validation needed

### vs Zod `.pick()`

Zod has a built-in `.pick()` method:

```typescript
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  password: z.string()
});

const PublicUserSchema = UserSchema.pick({ id: true, name: true, email: true });
```

**Limitations:**
- ❌ Requires pre-defined schema
- ❌ No path syntax (`'user.name'`)
- ❌ No array syntax (`'items[].id'`)
- ❌ More verbose

**When to use Zod `.pick()`:**
- You already have Zod schemas
- Schema-first approach

**When to use customPicker:**
- Data-first approach
- Dynamic field selection
- Nested/array projections

---

## Common Patterns Explained

### Pattern: Reusable Projections

```typescript
const toPublicUser = createPicker(['id', 'name', 'email']);
```

**What happens:**
1. Schema built immediately: `z.object({ id, name, email })`
2. Schema cached with key `'email|id|name'`
3. Returned function reuses cached schema

**Why it's fast:**
- Schema built once
- All subsequent calls use cache
- No re-parsing paths

### Pattern: Schema-based Projection

```typescript
const PublicUserSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  email: z.string().email()
});

customPicker(user, PublicUserSchema);
```

**What happens:**
1. Schema used directly (no path parsing)
2. Full Zod validation runs
3. Unknown fields stripped

**When to use:**
- Validation required
- Type guarantees needed
- Schema already defined

### Pattern: Shape-based Projection

```typescript
const publicShape = { id: 0, name: '', email: '' };
projectByShape(user, publicShape);
```

**What happens:**
1. Keys extracted: `['id', 'name', 'email']`
2. Paths normalized: `'email|id|name'`
3. Schema built and cached
4. Projection applied

**When to use:**
- Reference objects available
- Better IDE autocomplete
- Example-driven development

---

## Memory Characteristics

### Per-Operation Memory

**customPicker:**
- Schema cached: ~200-500 bytes
- Per-call overhead: ~50 bytes (object creation)
- Result object: Size of projected data

**Total:** ~250-550 bytes per unique projection

### Cache Memory

**Default cache (1000 schemas):**
- Average schema: ~300 bytes
- Total cache: ~300KB

**Worst case (1000 complex schemas):**
- Large schema: ~500 bytes
- Total cache: ~500KB

**Memory is not a concern** for most applications.

### Clearing Cache

For long-running apps with dynamic projections:

```typescript
// Periodic cleanup
setInterval(() => {
  const stats = getGlobalSchemaCacheStats();
  if (stats.size > 500) {
    clearGlobalSchemaCache();
  }
}, 60000); // Every minute
```

---

## Edge Cases & Limitations

### 1. Circular References

**Not handled.** Circular data structures will cause stack overflow.

```typescript
const user = { id: 1, name: 'John' };
user.self = user; // ❌ Circular

customPicker(user, ['id', 'name', 'self']); // ❌ Stack overflow
```

**Solution:** Don't project circular fields.

### 2. Very Deep Nesting (>10 levels)

Performance degrades with extreme nesting:

```typescript
['a.b.c.d.e.f.g.h.i.j.k.l.m.n.o'] // ⚠️ Slow
```

**Solution:** Flatten data structures when possible.

### 3. Dynamic Keys

Object keys must be known at projection time:

```typescript
const data = {
  user_1: { name: 'Alice' },
  user_2: { name: 'Bob' }
};

// ❌ Can't project unknown keys
customPicker(data, ['user_*.name']);
```

**Solution:** Use `Object.values()` or restructure data.

### 4. Function/Class Properties

Functions are stripped by Zod:

```typescript
const obj = {
  id: 1,
  getName() { return 'John'; }
};

customPicker(obj, ['id', 'getName']);
// Returns: { id: 1 } ← 'getName' stripped
```

**Solution:** Use class builder for method preservation.

---

## Next Steps

- 🎯 [Quick Start](./quick-start) - Get started quickly
- 📖 [How-to Guides](./how-to-guides) - Solve specific problems
- 🔍 [API Reference](./api-reference) - Complete function reference
