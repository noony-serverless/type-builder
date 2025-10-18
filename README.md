# 🚀 UltraFastBuilder

Ultra-fast TypeScript builder library with auto-detection for Zod schemas, classes, and interfaces. Optimized for maximum performance with object pooling and minimal GC pressure.

## ✨ Features

- **🎯 Auto-Detection**: Automatically detects Zod schemas, classes, and interfaces
- **⚡ Ultra-Fast**: 400,000+ operations per second for interface mode
- **🧠 Memory Efficient**: Optimized for minimal garbage collection pressure
- **🔒 Type Safe**: Full TypeScript support with zero runtime overhead
- **♻️ Object Pooling**: Built-in object pooling for maximum performance
- **🚫 Non-Blocking**: Async validation support for Zod schemas

## 📊 Performance

| Mode | Operations/sec | Memory/op | Use Case |
|------|----------------|-----------|----------|
| **Interface** | 400,000+ | ~60 bytes | Internal DTOs |
| **Class** | 300,000+ | ~80 bytes | Domain Models |
| **Zod** | 100,000+ | ~120 bytes | API Validation |

## 🚀 Quick Start

```bash
npm install @ultra-fast-builder/core zod
```

```typescript
import builder from '@ultra-fast-builder/core';
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

## 🎯 Usage Examples

### Zod Schema (Auto-detected)
```typescript
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email()
});

const createUser = builder(UserSchema);

const user = createUser()
  .withId(1)
  .withName('John Doe')
  .withEmail('john@example.com')
  .build(); // ✅ Validated automatically
```

### Class (Auto-detected)
```typescript
class Product {
  id!: number;
  name!: string;
  price!: number;
  
  constructor(data: Partial<Product>) {
    Object.assign(this, data);
  }
  
  getTax(): number {
    return this.price * 0.1;
  }
}

const createProduct = builder(Product);

const product = createProduct()
  .withId(1)
  .withName('Laptop')
  .withPrice(999)
  .build();

console.log(product.getTax()); // ✅ Methods work!
```

### Interface (Explicit)
```typescript
interface Order {
  id: string;
  total: number;
}

const createOrder = builder<Order>(['id', 'total']);

const order = createOrder()
  .withId('ORD-001')
  .withTotal(299.99)
  .build();
```

### Async Validation
```typescript
const createUserAsync = builderAsync(UserSchema);

const user = await createUserAsync()
  .withName('John Doe')
  .withEmail('john@example.com')
  .buildAsync(); // ✅ Non-blocking validation
```

## 🏗️ Project Structure

```
packages/
├── builder/          # Core builder library
├── benchmarks/       # Performance benchmarks
├── clinic-tests/     # Clinic.js performance tests
└── docs/            # Documentation
```

## 🧪 Running Tests

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run benchmarks
npm run benchmark

# Run Clinic.js tests
npm run clinic
```

## 📈 Benchmarks

Run the comprehensive benchmarks:

```bash
cd packages/benchmarks
npm run benchmark
```

Expected results:
- **Interface**: 400,000+ ops/sec
- **Class**: 300,000+ ops/sec
- **Zod**: 100,000+ ops/sec

## 🔬 Performance Analysis

Use Clinic.js for detailed performance analysis:

```bash
cd packages/clinic-tests
npm run clinic:doctor    # CPU and memory analysis
npm run clinic:flame     # Flame graph
npm run clinic:bubbleprof # Async analysis
```

## 🎨 Use Cases

- **API Validation**: Validate incoming requests with Zod
- **Domain Models**: Create business objects with methods
- **Data Transformation**: Convert between different data formats
- **DTOs**: High-performance data transfer objects
- **Testing**: Generate test data quickly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Zod](https://github.com/colinhacks/zod) for schema validation
- [Clinic.js](https://clinicjs.org/) for performance analysis
- [Turbo](https://turbo.build/) for monorepo management
