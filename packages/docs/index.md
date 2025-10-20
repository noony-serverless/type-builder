# UltraFastBuilder

> Ultra-fast TypeScript builder library with auto-detection for Zod, Classes, and Interfaces

[![npm version](https://badge.fury.io/js/@ultra-fast-builder%2Fcore.svg)](https://badge.fury.io/js/@ultra-fast-builder%2Fcore)
[![Performance](https://img.shields.io/badge/performance-400k%2B%20ops%2Fsec-brightgreen)](https://github.com/ultra-fast-builder/benchmarks)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)

## 🚀 Features

- **Auto-Detection**: Automatically detects Zod schemas, classes, and interfaces
- **Ultra-Fast**: 400,000+ operations per second for interface mode
- **Memory Efficient**: Optimized for minimal GC pressure
- **Type Safe**: Full TypeScript support with zero runtime overhead
- **Object Pooling**: Built-in object pooling for maximum performance
- **Non-Blocking**: Async validation support for Zod schemas

## 📊 Performance

| Mode | Operations/sec | Memory/op | Use Case |
|------|----------------|-----------|----------|
| **Interface** | 400,000+ | ~60 bytes | Internal DTOs |
| **Class** | 300,000+ | ~80 bytes | Domain Models |
| **Zod** | 100,000+ | ~120 bytes | API Validation |

## 🎯 Quick Start

```typescript
import builder from '@noony-serverless/type-builder';
import { z } from 'zod';

// Auto-detects Zod schema
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email()
});

const createUser = builder(UserSchema);

const user = createUser()
  .withName('John Doe')
  .withEmail('john@example.com')
  .build(); // ✅ Validated automatically
```

## 🔧 Installation

```bash
npm install @noony-serverless/type-builder zod
```

## 📖 Documentation

- [Installation Guide](/guide/installation)
- [Quick Start](/guide/quick-start)
- [API Reference](/api/core)
- [Performance Benchmarks](/performance/benchmarks)

## 🏆 Why UltraFastBuilder?

### Traditional Builder Pattern
```typescript
// ❌ Manual, verbose, slow
class UserBuilder {
  private data: Partial<User> = {};
  
  withName(name: string): this {
    this.data.name = name;
    return this;
  }
  
  withEmail(email: string): this {
    this.data.email = email;
    return this;
  }
  
  build(): User {
    return new User(this.data);
  }
}
```

### UltraFastBuilder
```typescript
// ✅ Auto-generated, fast, type-safe
const createUser = builder(UserSchema);
const user = createUser()
  .withName('John')
  .withEmail('john@example.com')
  .build();
```

## 🎨 Use Cases

- **API Validation**: Validate incoming requests with Zod
- **Domain Models**: Create business objects with methods
- **Data Transformation**: Convert between different data formats
- **DTOs**: High-performance data transfer objects
- **Testing**: Generate test data quickly

## 📈 Benchmarks

See our [comprehensive benchmarks](/performance/benchmarks) comparing UltraFastBuilder against manual builders, generic builders, and other popular libraries.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/ultra-fast-builder/contributing) for details.

## 📄 License

MIT License - see [LICENSE](https://github.com/ultra-fast-builder/LICENSE) for details.
