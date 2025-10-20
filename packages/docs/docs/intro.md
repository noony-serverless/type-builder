# Welcome to UltraFastBuilder

UltraFastBuilder is the fastest TypeScript builder library with auto-detection for Zod schemas, classes, and interfaces. Built for maximum performance with object pooling and minimal garbage collection pressure.

**Now with comprehensive Functional Programming support!** Build immutable objects with composable, type-safe functions using `pipe`, `compose`, transducers, and higher-order functions.

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

## 📊 Performance

| Mode                | Operations/sec | Memory/op  | Use Case                |
| ------------------- | -------------- | ---------- | ----------------------- |
| **Interface (OOP)** | 400,000+       | ~60 bytes  | Internal DTOs           |
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

### Unified Imports

Everything is available from a single import - no more subpath imports needed!

```typescript
// ✅ Single import for everything
import {
  // Core builders
  builder,
  builderAsync,

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
