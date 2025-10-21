# 🚀 UltraFastBuilder

Ultra-fast TypeScript builder library with auto-detection, DynamicPick field projection, and functional programming support. Optimized for maximum performance with object pooling and minimal GC pressure.

## ✨ Features

### Type-Builder (OOP)
- **🎯 Auto-Detection**: Automatically detects Zod schemas, classes, and interfaces
- **⚡ Ultra-Fast**: 400,000+ operations per second for interface mode
- **🧠 Memory Efficient**: Optimized for minimal garbage collection pressure
- **🔒 Type Safe**: Full TypeScript support with zero runtime overhead
- **♻️ Object Pooling**: Built-in object pooling for maximum performance (~70% improvement)
- **🚫 Non-Blocking**: Async validation support for Zod schemas

### DynamicPick (Field Projection)
- **🎭 Path-based Selection**: MongoDB/GraphQL-style field selection with dotted paths
- **📦 Nested Arrays**: Deep array projection with `items[].id` syntax
- **⚡ Auto-Caching**: ~70% performance improvement with LRU schema caching
- **🔒 Type Safe**: Full TypeScript support with type inference
- **✅ Schema Validation**: Optional Zod validation for projected data
- **🛡️ API Sanitization**: Remove sensitive fields (passwords, tokens) from responses
- **🚀 High Performance**: 300,000+ ops/sec for cached projections

### Functional Programming
- **🔄 Immutable State**: Every transformation returns a new frozen object
- **🔗 Function Composition**: `pipe` and `compose` for clean, readable code
- **🎨 Higher-Order Functions**: Map, filter, fold, pick, omit, partition
- **⚙️ Transducers**: High-performance transformations with zero intermediate allocations
- **🎯 Partial Application**: Reusable templates and defaults
- **🔧 Flexible**: Mix OOP and FP approaches as needed

## 📊 Performance

| Mode | Operations/sec | Memory/op | Use Case |
|------|----------------|-----------|----------|
| **Interface (OOP)** | 400,000+ | ~60 bytes | Internal DTOs |
| **DynamicPick** | 300,000+ | ~50 bytes | Field Projection |
| **Class (OOP)** | 300,000+ | ~80 bytes | Domain Models |
| **Immutable (FP)** | 150,000+ | ~120 bytes | Complex Transformations |
| **Zod (OOP)** | 100,000+ | ~120 bytes | API Validation |

## 🚀 Quick Start

### Installation

```bash
# npm
npm install @noony-serverless/type-builder zod

# pnpm (recommended for monorepo)
pnpm install @noony-serverless/type-builder zod
```

### Type-Builder (OOP)

```typescript
import { builder } from '@noony-serverless/type-builder';
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

### DynamicPick (Field Projection)

```typescript
import { customPicker } from '@noony-serverless/type-builder';

const dbUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  password: '$2a$10$...',      // ❌ Sensitive
  sessionToken: 'abc123',     // ❌ Sensitive
  internalId: 'USR-XYZ-001'   // ❌ Internal
};

// Remove sensitive fields before sending to client
const apiUser = customPicker(dbUser, ['id', 'name', 'email']);
// ✅ { id: 1, name: 'John Doe', email: 'john@example.com' }

// Works with nested objects and arrays
const order = customPicker(orderData, [
  'id',
  'user.name',
  'user.email',
  'items[].id',
  'items[].name',
  'items[].price'
]);
```

### Functional Programming

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

## 🎯 Usage Examples

### 1. Zod Schema Builder (Auto-detected)

```typescript
import { builder } from '@noony-serverless/type-builder';
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(18)
});

const createUser = builder(UserSchema);

const user = createUser()
  .withId(1)
  .withName('John Doe')
  .withEmail('john@example.com')
  .withAge(25)
  .build(); // ✅ Validated automatically
```

### 2. Class Builder (Auto-detected)

```typescript
class Product {
  id: number = 0;
  name: string = '';
  price: number = 0;

  getTax(): number {
    return this.price * 0.1;
  }

  applyDiscount(percent: number): void {
    this.price *= (1 - percent / 100);
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

### 3. Interface Builder (Fastest)

```typescript
interface Order {
  id: string;
  total: number;
  items: string[];
}

const createOrder = builder<Order>(['id', 'total', 'items']);

const order = createOrder()
  .withId('ORD-001')
  .withTotal(299.99)
  .withItems(['item1', 'item2'])
  .build();
```

### 4. DynamicPick - API Response Sanitization

```typescript
import { customPicker, createPicker } from '@noony-serverless/type-builder';

// Create reusable picker
const toPublicUser = createPicker(['id', 'name', 'email', 'avatar']);

// Express.js endpoint
app.get('/api/users/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id);
  res.json(toPublicUser(user)); // ✅ Safe, cached
});
```

### 5. DynamicPick - Nested Arrays

```typescript
const blogPost = customPicker(post, [
  'id',
  'title',
  'author.name',
  'author.email',
  'comments[].id',
  'comments[].text',
  'comments[].author.name',
  'comments[].replies[].text'
]);
```

### 6. Functional Programming - Immutable State

```typescript
import { createImmutableBuilder, pipe } from '@noony-serverless/type-builder';

const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email', 'role']);

// Define reusable patterns
const adminDefaults = pipe<User>(
  userBuilder.withRole('admin'),
  userBuilder.withPermissions(['read', 'write', 'delete'])
);

// Compose with specific data
const admin = userBuilder.build(
  pipe<User>(
    adminDefaults,
    userBuilder.withId(1),
    userBuilder.withName('Admin User')
  )(userBuilder.empty())
);
```

### 7. Async Validation

```typescript
import { builderAsync } from '@noony-serverless/type-builder';

const createUserAsync = builderAsync(UserSchema);

const user = await createUserAsync()
  .withName('John Doe')
  .withEmail('john@example.com')
  .buildAsync(); // ✅ Non-blocking validation
```

### 8. Combining All Three

```typescript
import { builder, customPicker, createImmutableBuilder, pipe } from '@noony-serverless/type-builder';

// 1. Validate with Type-Builder
const validateInput = builder(CreateUserSchema);

// 2. Transform with FP
const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email']);

// 3. Sanitize with DynamicPick
const toPublicUser = createPicker(['id', 'name', 'email']);

app.post('/api/users', async (req, res) => {
  // Validate
  const validated = validateInput()
    .withName(req.body.name)
    .withEmail(req.body.email)
    .build();

  // Transform
  const user = userBuilder.build(
    pipe<User>(
      userBuilder.withId(generateId()),
      userBuilder.withName(validated.name),
      userBuilder.withEmail(validated.email.toLowerCase())
    )(userBuilder.empty())
  );

  // Save & return sanitized
  await db.users.create(user);
  res.json(toPublicUser(user));
});
```

## 🏗️ Project Structure

```
packages/
├── builder/          # Core builder library
├── benchmarks/       # Performance benchmarks
├── clinic-tests/     # Clinic.js performance tests
└── docs/            # Docusaurus documentation site
```

## 🧪 Development

### Setup (pnpm recommended)

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Development mode (watch)
pnpm run dev
```

### Testing

```bash
# Run all tests
pnpm run test

# Run tests in specific package
pnpm --filter @noony-serverless/type-builder test

# Run benchmarks
pnpm run benchmark

# Run Clinic.js performance tests
pnpm run clinic
```

### Cleaning

```bash
# Clean all build outputs
pnpm run clean

# Clean and rebuild
pnpm run clean && pnpm run build
```

## 📈 Benchmarks

Run comprehensive benchmarks:

```bash
# Using npm
npm run benchmark

# Using pnpm
pnpm run benchmark

# Or directly
cd packages/benchmarks
pnpm run benchmark
```

Expected results:
- **Interface**: 400,000+ ops/sec (~2.5μs per operation)
- **DynamicPick**: 300,000+ ops/sec (~3.3μs per operation)
- **Class**: 300,000+ ops/sec (~3.3μs per operation)
- **Immutable (FP)**: 150,000+ ops/sec (~6.7μs per operation)
- **Zod**: 100,000+ ops/sec (~10μs per operation)

## 🔬 Performance Analysis

Use Clinic.js for detailed performance profiling:

```bash
cd packages/clinic-tests

# CPU and memory analysis
pnpm run clinic:doctor

# Flame graph
pnpm run clinic:flame

# Async profiling
pnpm run clinic:bubbleprof

# Heap profiling
pnpm run clinic:heapprofiler
```

### View HTML Performance Dashboards

```bash
# Start local server
pnpm run serve
# or
pnpm run html:test

# Open in browser
# http://localhost:3000/builder_visual_dashboard.html
# http://localhost:3000/customPicker_dashboard.html
# http://localhost:3000/test-dashboard.html
```

## 🎨 Use Cases

### Type-Builder (OOP)
- API request/response validation
- Domain models with business logic
- Data transfer objects (DTOs)
- Test data generation
- Form data handling

### DynamicPick
- API response sanitization (remove passwords, tokens)
- Database to API transformation
- GraphQL-style field selection
- User role-based data filtering
- Mobile API payload optimization
- Audit logging (strip PII)
- Multi-tenant data security

### Functional Programming
- React/Redux state management
- Complex data transformation pipelines
- Event sourcing
- Configuration management
- Multi-step validation
- Reusable transformation patterns

## 📚 Documentation

Full documentation available at:
- **Online**: [UltraFastBuilder Docs](https://noony-serverless.github.io/type-builder/)
- **Local**: See [packages/docs](packages/docs)

Quick links:
- [Getting Started](packages/docs/docs/getting-started/installation.md)
- [Type-Builder Guide](packages/docs/docs/guides/interface-builder.md)
- [DynamicPick Guide](packages/docs/docs/projection/quick-start.md)
- [Functional Programming Guide](packages/docs/docs/functional-programming/quick-start.md)
- [API Reference](packages/docs/docs/api/core-functions.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests (`pnpm test`)
5. Ensure benchmarks pass (`pnpm run benchmark`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 🛠️ Tech Stack

- **TypeScript** - Type-safe development
- **Zod** - Schema validation
- **Turbo** - Monorepo build system
- **tsup** - Bundle builder library
- **Vitest** - Unit testing
- **Benchmark.js** - Performance benchmarks
- **Clinic.js** - Performance profiling
- **Docusaurus** - Documentation site

## 📦 Packages

- **[@noony-serverless/type-builder](packages/builder)** - Core library
- **[benchmarks](packages/benchmarks)** - Performance benchmarks
- **[clinic-tests](packages/clinic-tests)** - Performance profiling tests
- **[docs](packages/docs)** - Documentation site

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Zod](https://github.com/colinhacks/zod) - Schema validation library
- [Clinic.js](https://clinicjs.org/) - Performance analysis tools
- [Turbo](https://turbo.build/) - Monorepo build system
- [Docusaurus](https://docusaurus.io/) - Documentation framework

## 🔗 Links

- **npm**: [@noony-serverless/type-builder](https://www.npmjs.com/package/@noony-serverless/type-builder)
- **GitHub**: [noony-serverless/type-builder](https://github.com/noony-serverless/type-builder)
- **Documentation**: [UltraFastBuilder Docs](https://noony-serverless.github.io/type-builder/)

---

**Built with ❤️ for TypeScript developers who value performance, type safety, and developer experience.**
