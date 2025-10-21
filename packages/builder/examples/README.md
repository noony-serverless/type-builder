# UltraFastBuilder Examples

This directory contains practical examples demonstrating how to use the UltraFastBuilder library.

## Available Examples

### Core Builder Examples

#### 1. [basic-usage.ts](./basic-usage.ts)

Basic builder pattern examples showing auto-detection for Zod, Class, and Interface modes.

**Covers:**

- Zod schema builders with validation
- Class builders with methods
- Interface builders (fastest mode)
- Async validation with `builderAsync`

**Run:**

```bash
npx tsx examples/basic-usage.ts
```

#### 2. [typed-usage.ts](./typed-usage.ts)

TypeScript type inference and IDE autocomplete demonstrations.

**Covers:**

- Full type inference from Zod schemas
- Class constructor type inference
- Interface type safety
- Compile-time validation
- IDE autocomplete for `.withXYZ()` methods

**Run:**

```bash
npx tsx examples/typed-usage.ts
```

### Field Selection (Pick Specific Fields)

#### 3. [field-selection-usage.ts](./field-selection-usage.ts)

Comprehensive CustomPicker API guide for efficient data projection.

**Covers:**

- Path-based projection (dot notation + arrays)
- Zod schema-based projection with validation
- Shape-based projection with reference objects
- Helper functions (`pickFields`, `omitFields`)
- Pre-cached projectors for performance
- Cache management and statistics
- Real-world API use cases

**Run:**

```bash
npx tsx examples/field-selection-usage.ts
```

#### 4. [field-selection-shapes.ts](./field-selection-shapes.ts)

Shape-based projection using TypeScript interfaces as templates.

**Covers:**

- `projectByShape()` for type-safe DTOs
- `createShapeProjector()` for reusable projectors
- Array projection with `projectArrayByShape()`
- Nested object projections
- Performance optimization techniques

**Run:**

```bash
npx tsx examples/field-selection-shapes.ts
```

### Functional Programming

#### 5. [functional-usage.ts](./functional-usage.ts)

Core functional programming patterns with immutable state.

**Covers:**

- Immutable builder pattern
- Function composition (`pipe`, `compose`)
- Higher-order functions (map, filter, fold)
- Currying and partial application
- Transducers for performance
- Reusable transformation templates

**Run:**

```bash
npx tsx examples/functional-usage.ts
```

#### 6. [safe-values-usage.ts](./safe-values-usage.ts)

Safe error handling with Maybe and Either monads.

**Covers:**

- **Maybe Monad**: Handle nullable values without crashes
- **Either Monad**: Type-safe validation with errors
- Chaining operations safely
- Replacing try/catch patterns
- Form validation examples
- Database query handling

**Run:**

```bash
npx tsx examples/safe-values-usage.ts
```

#### 7. [immutable-updates-usage.ts](./immutable-updates-usage.ts)

Immutable state updates with Lenses and Prisms (Optics).

**Covers:**

- **Lenses**: Update deeply nested objects
- **Prisms**: Work with union types and optional values
- Composing lenses for deep updates
- React/Redux state management
- Avoid spread operator boilerplate
- Type-safe nested transformations

**Run:**

```bash
npx tsx examples/immutable-updates-usage.ts
```

### Unified API

#### 8. [unified-imports.ts](./unified-imports.ts)

Demonstrates single unified import vs multiple subpath imports.

**Covers:**

- All features from one import
- Core builder functions
- Functional programming utilities
- Monads (Maybe, Either)
- Optics (Lens, Prism)
- Projection utilities

**Run:**

```bash
npx tsx examples/unified-imports.ts
```

---

## Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Build the library
npm run build
```

### Run Any Example

```bash
# Using tsx (recommended)
npx tsx examples/<example-name>.ts

# Using ts-node
npx ts-node examples/<example-name>.ts

# Compile and run
npx tsc examples/<example-name>.ts
node examples/<example-name>.js
```

---

## Feature Guide

### 🎯 Core Builder (basic-usage.ts, typed-usage.ts)

**When to use:**

- Build objects with validation (Zod mode)
- Domain models with methods (Class mode)
- Internal DTOs (Interface mode - fastest)
- Test data generation
- Form data handling

**Performance:**

- Interface: 400,000+ ops/sec
- Class: 300,000+ ops/sec
- Zod: 100,000+ ops/sec

---

### 🎭 Field Selection (field-selection-usage.ts, field-selection-shapes.ts)

**When to use:**

- API response sanitization (remove passwords, tokens)
- GraphQL-style field selection
- Database to API transformation
- User role-based data filtering
- Mobile payload optimization

**Performance:**
| Method | Ops/Sec | Best For |
|--------|---------|----------|
| `customPicker(data, paths[])` | 50-100k | Dynamic selection |
| `customPicker(data, schema)` | 30-60k | With validation |
| `projectByShape(data, shape)` | 60-120k | Type-safe DTOs |
| `createPicker(paths)` | 80-150k | Repeated projections |

**Cache Benefit:** ~70% performance improvement

---

### ✅ Safe Values / Monads (safe-values-usage.ts)

**When to use:**

- Form validation with clear errors
- Database queries (nullable results)
- API input validation
- Replace try/catch patterns
- Optional configuration values

**Maybe Monad:**

```typescript
// Handle nullable values safely
Maybe.fromNullable(user)
  .map((u) => u.email)
  .getOrElse('no-email@example.com');
```

**Either Monad:**

```typescript
// Validation with clear errors
validateAge(15).fold(
  (error) => `Failed: ${error}`,
  (valid) => `Success: ${valid}`
);
```

---

### 🔄 Immutable Updates / Optics (immutable-updates-usage.ts)

**When to use:**

- React/Redux state management
- Form state updates (nested fields)
- Settings/configuration UI
- Event sourcing
- Any deeply nested immutable data

**Lens Example:**

```typescript
// Update nested state without boilerplate
const cityLens = composeLenses(prop('user'), prop('profile'), prop('address'), prop('city'));

const newState = cityLens.set(state, 'LA');
// Original unchanged, clean immutable update!
```

**Prism Example:**

```typescript
// Work with union types
const circlePrism = prismType<Shape, 'circle'>('circle');
const doubled = circlePrism.modify(shape, (c) => ({
  ...c,
  radius: c.radius * 2,
}));
```

---

### ⚙️ FP Utilities (functional-usage.ts)

**When to use:**

- Complex data transformation pipelines
- Function composition patterns
- High-performance data processing
- Reusable transformation templates

**Key Features:**

- **pipe/compose**: Chain functions left-to-right or right-to-left
- **curry**: Create partially applied functions
- **transducers**: Zero intermediate allocations
- **immutableBuilder**: Every transform returns frozen object

---

## Real-World Use Cases

### API Response Sanitization

```typescript
import { createPicker } from '@noony-serverless/type-builder';

const toPublicUser = createPicker(['id', 'name', 'email']);

app.get('/api/users/:id', async (req, res) => {
  const user = await db.users.findOne(req.params.id);
  res.json(toPublicUser(user)); // Password/tokens removed
});
```

### Form Validation with Either

```typescript
import { Either } from '@noony-serverless/type-builder';

function validateEmail(email: string): Either<string, string> {
  if (!email.includes('@')) return Either.left('Invalid email');
  return Either.right(email);
}

const result = validateEmail('test').fold(
  (error) => ({ success: false, error }),
  (email) => ({ success: true, email })
);
```

### React State Update with Lens

```typescript
import { prop, composeLenses } from '@noony-serverless/type-builder';

const settingsLens = composeLenses(prop('user'), prop('settings'), prop('theme'));

// Clean immutable update
setState(settingsLens.set(state, 'dark'));
```

### Bulk Data Processing

```typescript
import { createPicker } from '@noony-serverless/type-builder';

const orderSummary = createPicker(['id', 'customer.name', 'items[].product.name', 'total']);

// Process thousands efficiently
const summaries = orders.map(orderSummary);
// ~150,000 ops/sec with cached schema
```

---

## Performance Tips

### 1. Use Pre-cached Projectors

```typescript
// ❌ Slow: Rebuilds schema every time
orders.map((o) => customPicker(o, paths));

// ✅ Fast: Pre-cached schema
const toSummary = createPicker(paths);
orders.map(toSummary);
```

### 2. Choose Right Mode

```typescript
// Interface mode (fastest) for internal DTOs
const createDTO = builder<DTO>(['id', 'name']);

// Zod mode only when validation needed
const createUser = builder(UserSchema);
```

### 3. Monitor Cache

```typescript
import { getGlobalSchemaCacheStats } from '@noony-serverless/type-builder';

const stats = getGlobalSchemaCacheStats();
console.log(`Cache hit rate: ${stats.hitRate * 100}%`);
```

---

## Additional Resources

- [Main Documentation](../../../README.md)
- [API Reference](../../docs/docs/api/api-reference.md)
- [Performance Dashboard](../../clinic-tests/)
- [Development Guide](../../../CLAUDE.md)

## Contributing

To add new examples:

1. Create a new `.ts` file in this directory
2. Use package imports: `from '@noony-serverless/type-builder'`
3. Add comprehensive comments
4. Include multiple use cases
5. Update this README
6. Test with `npx tsx examples/your-example.ts`

## Questions?

- Check the [main README](../../../README.md)
- Review [CLAUDE.md](../../../CLAUDE.md) for development guidelines
- Run examples to see features in action
