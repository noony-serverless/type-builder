# Welcome to UltraFastBuilder

UltraFastBuilder is the fastest TypeScript builder library with auto-detection for Zod schemas, classes, and interfaces. Built for maximum performance with object pooling and minimal garbage collection pressure.

**Now with comprehensive Functional Programming support!** Build immutable objects with composable, type-safe functions using `pipe`, `compose`, transducers, and higher-order functions.

**Plus DynamicPick for DynamicPick!** Select and sanitize specific fields from objects with MongoDB/GraphQL-style path syntax, automatic caching, and optional Zod validation.

## 🚀 Key Features

### OOP Builder (Mutable, Fast)

- **Auto-Detection**: Automatically detects Zod schemas, classes, and interfaces
- **Ultra-Fast**: 400,000+ operations per second for interface mode
- **Memory Efficient**: Optimized for minimal GC pressure
- **Type Safe**: Full TypeScript support with zero runtime overhead
- **Object Pooling**: Built-in object pooling for maximum performance
- **Non-Blocking**: Async validation support for Zod schemas

### Functional Programming (Immutable, Composable)

- **Immutable State**: Every transformation returns a new object with `Object.freeze()`
- **Function Composition**: `pipe` (left-to-right) and `compose` (right-to-left) for clean, readable code
- **Higher-Order Functions**: Map, filter, fold, pick, omit, partition, and compact
- **Transducers**: High-performance transformations with zero intermediate allocations
- **Partial Application**: Reusable templates and defaults with `partial`, `partialDefaults`, and more
- **Currying**: `curry2`, `curry3`, `curry4` for advanced function transformation
- **Conditional Logic**: `pipeIf`, `pipeWhen` for dynamic object construction
- **Type Safe**: Full TypeScript inference with curried functions and readonly state
- **Flexible**: Choose OOP or FP based on your needs, or mix both approaches

### DynamicPick (DynamicPick)

- **Path-based Selection**: MongoDB/GraphQL-style field selection with dotted paths (`'user.address.city'`)
- **Nested Arrays**: Deep array projection with `items[].id` syntax
- **Auto-Caching**: ~70% performance improvement with LRU schema caching
- **Type Safe**: Full TypeScript support with type inference
- **Schema Validation**: Optional Zod validation for projected data
- **API Sanitization**: Remove sensitive fields (passwords, tokens) before sending responses
- **Shape-based Projection**: Use reference objects to define projections
- **High Performance**: 300,000+ ops/sec for cached projections

## 📊 Performance

| Mode                | Operations/sec | Memory/op  | Use Case                |
| ------------------- | -------------- | ---------- | ----------------------- |
| **Interface (OOP)** | 400,000+       | ~60 bytes  | Internal DTOs           |
| **DynamicPick**     | 300,000+       | ~50 bytes  | DynamicPick             |
| **Class (OOP)**     | 300,000+       | ~80 bytes  | Domain Models           |
| **Immutable (FP)**  | 150,000+       | ~120 bytes | Complex Transformations |
| **Zod (OOP)**       | 100,000+       | ~120 bytes | API Validation          |

## 🎯 Quick Start

### OOP Builder (Method Chaining)

```typescript
import { builder } from '@noony-serverless/type-builder';
import { z } from 'zod';

// Auto-detects Zod schema
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

const createUser = builder(UserSchema);

const user = createUser().withName('John Doe').withEmail('john@example.com').build(); // ✅ Validated automatically
```

### Functional Programming (Immutable)

```typescript
import { createImmutableBuilder, pipe } from '@noony-serverless/type-builder';

interface User {
  id: number;
  name: string;
  email: string;
}

const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email']);

const user = userBuilder.build(
  pipe<User>(
    userBuilder.withId(1),
    userBuilder.withName('John Doe'),
    userBuilder.withEmail('john@example.com')
  )(userBuilder.empty())
); // ✅ Immutable and composable
```

### DynamicPick (DynamicPick)

```typescript
import { customPicker } from '@noony-serverless/type-builder';

const dbUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  password: '$2a$10$...', // ❌ Sensitive
  sessionToken: 'abc123', // ❌ Sensitive
  internalId: 'USR-XYZ-001', // ❌ Internal
};

// Remove sensitive fields before sending to client
const apiUser = customPicker(dbUser, ['id', 'name', 'email']);
// ✅ { id: 1, name: 'John Doe', email: 'john@example.com' }

// Works with nested objects and arrays
const order = {
  id: 1,
  user: { name: 'John', email: 'john@example.com', password: 'secret' },
  items: [
    { id: 101, name: 'Laptop', price: 999, cost: 500 },
    { id: 102, name: 'Mouse', price: 29, cost: 10 },
  ],
};

const publicOrder = customPicker(order, [
  'id',
  'user.name',
  'user.email',
  'items[].id',
  'items[].name',
  'items[].price',
]);
// ✅ Nested projection with sensitive fields removed
```

### Unified Imports

Everything is available from a single import - no more subpath imports needed!

```typescript
// ✅ Single import for everything
import {
  // Core builders
  builder,
  builderAsync,

  // DynamicPick (DynamicPick)
  customPicker,
  createPicker,
  pickFields,
  omitFields,
  projectByShape,

  // Functional programming
  pipe,
  compose,
  createImmutableBuilder,
  partialApply,
  curriedBuilder,

  // Monads
  Maybe,
  Either,

  // Optics
  lens,
  prism,
  prop,
  path,
} from '@noony-serverless/type-builder';

// ❌ No more multiple imports needed
// import { pipe } from '@noony-serverless/type-builder';
// import { Maybe } from '@noony-serverless/type-builder/monads';
// import { lens } from '@noony-serverless/type-builder/optics';
```

## 🏗️ Project Structure

This monorepo contains:

- **`packages/builder`**: Core builder library
- **`packages/docs`**: Documentation site (this package)
- **`packages/benchmarks`**: Performance benchmarks
- **`packages/clinic-tests`**: Clinic.js performance tests

## 🎨 Use Cases

### OOP Builder

- **API Validation**: Validate incoming requests with Zod
- **Domain Models**: Create business objects with methods
- **DTOs**: High-performance data transfer objects
- **Testing**: Generate test data quickly

### DynamicPick

- **API Response Sanitization**: Remove passwords, tokens, and internal fields before sending to clients
- **Database to API Transformation**: Project specific columns from database results
- **GraphQL-style Field Selection**: Let clients specify which fields they want
- **Privacy Controls**: Expose different fields based on user roles (public, member, admin)
- **Performance Optimization**: Transfer less data over the network
- **Multi-tenant Data**: Filter sensitive fields per tenant
- **Audit Logging**: Strip PII before logging

### Functional Programming

- **React/Redux State**: Immutable state management with guaranteed no mutations
- **Complex Pipelines**: Compose reusable transformations with `pipe` and `compose`
- **Data Transformation**: Pure, testable data conversions with higher-order functions
- **Event Sourcing**: Immutable event handlers with time-travel debugging
- **Form Validation**: Multi-step validation pipelines with error handling
- **Configuration Management**: Multi-environment configs with templates and overrides
- **API Response Transformation**: Transform external APIs to internal formats

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/ultra-fast-builder/ultra-fast-builder/blob/main/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](https://github.com/ultra-fast-builder/ultra-fast-builder/blob/main/LICENSE) for details.
