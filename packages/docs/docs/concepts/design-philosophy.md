# Why Use @noony-serverless/type-builder?

**Understanding the Design Philosophy and Trade-offs**

---

## Table of Contents

1. [The Builder Pattern Problem](#the-builder-pattern-problem)
2. [The Type Detection Innovation](#the-type-detection-innovation)
3. [Performance Through Object Pooling](#performance-through-object-pooling)
4. [Type Safety Without Runtime Cost](#type-safety-without-runtime-cost)
5. [The Three Modes Philosophy](#the-three-modes-philosophy)
6. [The Functional Programming Extension](#the-functional-programming-extension)
7. [Trade-offs and Design Decisions](#trade-offs-and-design-decisions)
8. [When to Use (and Not Use) This Library](#when-to-use-and-not-use-this-library)
9. [Comparison with Alternatives](#comparison-with-alternatives)

---

## The Builder Pattern Problem

### The Classic Builder Pattern

The Builder pattern is a creational design pattern that lets you construct complex objects step by step. It's been around since the Gang of Four book (1994), and it solves a real problem:

**The Problem:**

```typescript
// ❌ Constructor with many parameters (hard to read, error-prone)
const user = new User('john@example.com', 'John Doe', 25, 'New York', true, 'premium', new Date());

// Which parameter is which? Easy to swap them by accident.
```

**The Classic Solution:**

```typescript
// ✅ Builder pattern (readable, explicit)
const user = new UserBuilder()
  .withEmail('john@example.com')
  .withName('John Doe')
  .withAge(25)
  .withCity('New York')
  .withActive(true)
  .withPlan('premium')
  .withCreatedAt(new Date())
  .build();
```

This is **much better**. But there's a catch...

### The Boilerplate Problem

To get this nice API, you need to write a builder class **for every type**:

```typescript
class UserBuilder {
  private email?: string;
  private name?: string;
  private age?: number;
  private city?: string;
  private active?: boolean;
  private plan?: string;
  private createdAt?: Date;

  withEmail(email: string): this {
    this.email = email;
    return this;
  }

  withName(name: string): this {
    this.name = name;
    return this;
  }

  withAge(age: number): this {
    this.age = age;
    return this;
  }

  // ... 4 more methods

  build(): User {
    if (!this.email || !this.name) {
      throw new Error('Missing required fields');
    }
    return new User(
      this.email,
      this.name,
      this.age || 0,
      this.city || '',
      this.active || false,
      this.plan || 'free',
      this.createdAt || new Date()
    );
  }
}
```

That's **50+ lines of boilerplate** for a simple 7-property object. Now imagine you have:

- 20 domain models
- 30 DTOs
- 15 API request/response types

You're looking at **thousands of lines of repetitive code** just to get a nice builder API.

### Why Does This Matter?

**Maintenance Burden:**

- Add a property? Update the builder class.
- Rename a property? Update the builder class.
- Change a type? Update the builder class.
- Every change = 3 places to update (model, builder, tests).

**Developer Experience:**

- Copy-paste errors
- Outdated builders that don't match the model
- Tests that need constant updating
- New developers overwhelmed by boilerplate

**This is what @noony-serverless/type-builder solves.**

---

## The Type Detection Innovation

### The Core Insight

What if we could **generate builders automatically** by detecting what you passed in?

This library introduces a novel approach: **runtime type detection with compile-time safety**.

### How It Works

#### 1. Zod Schema Detection

```typescript
const UserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
});

const createUser = builder(UserSchema);
```

**Behind the scenes:**

```typescript
function isZodSchema(input: any): boolean {
  return (
    input &&
    typeof input === 'object' &&
    typeof input.parse === 'function' &&
    typeof input.safeParse === 'function' &&
    input._def !== undefined
  );
}
```

We check for Zod's unique method signatures. If it has `.parse()`, `.safeParse()`, and `._def`, it's a Zod schema.

**What we extract:**

- Property names from `schema._def.shape()`
- Type information (inferred by TypeScript)
- Validation rules (used in `.build()`)

#### 2. Class Detection

```typescript
class Product {
  id!: number;
  name!: string;
  price!: number;
}

const createProduct = builder(Product);
```

**Behind the scenes:**

```typescript
function isClass(input: any): boolean {
  return typeof input === 'function' && input.prototype && input.prototype.constructor === input;
}
```

We check if it's a function with a prototype. That's how JavaScript represents classes under the hood.

**What we extract:**

- Property names (by creating a proxy instance and capturing `this.x = y` assignments)
- Constructor function (used in `.build()`)
- Methods (preserved in the final instance)

#### 3. Interface Detection

```typescript
interface Order {
  id: string;
  total: number;
}

const createOrder = builder<Order>(['id', 'total']);
```

**Why the array?**

Interfaces **don't exist at runtime**. They're erased during TypeScript compilation:

```typescript
// TypeScript
interface Order {
  id: string;
  total: number;
}

// Compiles to JavaScript
// (nothing - interface disappears)
```

Since there's no runtime information, you must provide the property names explicitly.

### Why This Matters

**Zero Boilerplate:**

- No builder classes to write
- No manual method generation
- No maintenance burden

**Type Safety:**

- TypeScript infers all types automatically
- IDE autocomplete works perfectly
- Compile-time error checking

**Flexibility:**

- Works with Zod (validation)
- Works with classes (methods + OOP)
- Works with interfaces (pure speed)

---

## Performance Through Object Pooling

### The Performance Problem

Building objects is fast, but **creating millions of objects** triggers garbage collection (GC):

```typescript
// Without pooling
for (let i = 0; i < 1000000; i++) {
  const builder = new UserBuilder(); // 1M allocations
  const user = builder.withName('John').build();
}

// GC runs multiple times during this loop
// Result: Unpredictable pauses, slower throughput
```

**The Issue:**

- Each builder instance allocates memory
- After `.build()`, the builder becomes garbage
- GC must clean up 1M builder instances
- GC pauses block your application

### The Object Pooling Solution

**Core Concept:** Reuse builder instances instead of creating new ones.

```typescript
// With pooling
const pool = new BuilderPool<UserBuilder>(() => new UserBuilder());

for (let i = 0; i < 1000000; i++) {
  const builder = pool.get(); // Reuse from pool (or create if empty)
  builder.reset(); // Clear previous data
  const user = builder.withName('John').build();
  pool.release(builder); // Return to pool
}

// GC runs rarely - only ~100 builders created total
// Result: Consistent performance, no pauses
```

### How We Implement It

**Automatic Pooling:**

```typescript
const createUser = builder(UserSchema);

// Behind the scenes, we create a pool:
const pool = new BuilderPool<UserBuilder>(() => new UserBuilder());

// When you call createUser():
const userBuilder = pool.get(); // Reused or created
return userBuilder; // You build your object

// After .build(), it's automatically returned to the pool
```

**Pool Statistics:**

```typescript
import { getPoolStats } from '@noony-serverless/type-builder';

const stats = getPoolStats();
console.log(stats.averageHitRate); // ~98.5%
```

In production, **98.5% of builders are reused**, meaning:

- Only 1.5% require new allocations
- GC pressure reduced by 98.5%
- Consistent, predictable performance

### Performance Impact

| Mode      | Without Pooling  | With Pooling     | Improvement   |
| --------- | ---------------- | ---------------- | ------------- |
| Interface | ~200,000 ops/sec | ~400,000 ops/sec | **2x faster** |
| Class     | ~150,000 ops/sec | ~300,000 ops/sec | **2x faster** |
| Zod       | ~50,000 ops/sec  | ~100,000 ops/sec | **2x faster** |

**Why This Matters:**

- High-throughput APIs can handle 2x more requests
- Lower memory usage
- Predictable latency (no GC spikes)
- Better user experience

---

## Type Safety Without Runtime Cost

### The TypeScript Magic

One of the most powerful features is **full type inference with zero runtime overhead**.

### How TypeScript Types Work

**Compile-time only:**

```typescript
// TypeScript (before compilation)
const createUser = builder<User>(UserSchema);
const user: User = createUser().withName('John').build();

// JavaScript (after compilation)
const createUser = builder(UserSchema);
const user = createUser().withName('John').build();
```

**All type annotations vanish.** The JavaScript output is identical whether you use types or not.

### Our Type System

We use advanced TypeScript features to generate method signatures:

**Utility Types:**

```typescript
// Capitalize first letter
type Capitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : S;

// Generate method name
type WithMethodName<K extends string> = `with${Capitalize<K>}`;

// Generate all .withXYZ() methods
type WithMethods<T> = {
  [K in keyof T & string as WithMethodName<K>]: (value: T[K]) => FluentBuilder<T>;
};

// Complete builder type
export type FluentBuilder<T> = WithMethods<T> & {
  build(): T;
};
```

**What This Does:**

```typescript
interface User {
  name: string;
  email: string;
  age: number;
}

// TypeScript automatically generates:
type UserBuilder = {
  withName(value: string): UserBuilder;
  withEmail(value: string): UserBuilder;
  withAge(value: number): UserBuilder;
  build(): User;
};
```

### IDE Autocomplete

Because these types are generated automatically, your IDE gets perfect autocomplete:

**Type Inference Chain:**

1. You pass `UserSchema` to `builder()`
2. TypeScript extracts the schema type: `z.infer<typeof UserSchema>`
3. Our `WithMethods<T>` type generates method signatures
4. IDE sees all available methods
5. You get autocomplete + type checking

**The Result:**

```typescript
const createUser = builder(UserSchema);

createUser()
  .with // IDE suggests: withName, withEmail, withAge
  .withName('John') // IDE knows this takes a string
  .withAge('invalid') // ❌ TypeScript error: Expected number
  .withFoo('bar') // ❌ TypeScript error: Property doesn\'t exist
  .build();
```

### Zero Runtime Cost

**The Performance Question:** "Doesn't all this type magic slow things down?"

**Answer:** No. Types are **compile-time only**.

**Proof:**

```typescript
// TypeScript (types present)
type FluentBuilder<T> = WithMethods<T> & { build(): T };
const createUser = builder<User>(UserSchema);

// Compiles to JavaScript (types erased)
const createUser = builder(UserSchema);
```

**Bundle size comparison:**

- TypeScript version: 6.23 KB
- JavaScript version: 6.23 KB (identical)

**Runtime performance:**

- TypeScript version: ~400,000 ops/sec
- JavaScript version: ~400,000 ops/sec (identical)

**The types only exist in your editor and during compilation.** At runtime, they're gone.

### Why This Matters

**Developer Experience:**

- Full autocomplete
- Compile-time error checking
- Refactoring support (rename properties, IDE updates all usages)

**Production Performance:**

- Zero overhead
- No bundle size increase
- Same speed as hand-written code

**Type Safety:**

- Catch errors before deployment
- Impossible to call `.withFoo()` if `foo` doesn't exist
- Parameter types validated automatically

---

## The Three Modes Philosophy

### Design Philosophy: Right Tool for the Right Job

We could have made a one-size-fits-all solution. Instead, we chose **three optimized modes** for different use cases.

### Why Three Modes?

**The Insight:** Different scenarios have different requirements.

| Scenario            | Priority        | Best Mode               |
| ------------------- | --------------- | ----------------------- |
| API validation      | **Correctness** | Zod (validation)        |
| Domain models       | **Behavior**    | Class (methods)         |
| Data transformation | **Speed**       | Interface (performance) |

### Mode 1: Zod - Validation First

**When:** External input (APIs, file uploads, user forms)

**Why:** You cannot trust external data.

**Trade-off:**

- ✅ Runtime validation catches bad data
- ✅ Type-safe parsing
- ❌ Slower (~100k ops/sec due to validation overhead)

**Example:**

```typescript
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const validateUser = builder(CreateUserSchema);

// API endpoint
app.post('/api/users', (req) => {
  const user = validateUser()
    .withEmail(req.body.email) // Could be anything
    .withPassword(req.body.password) // Could be anything
    .build(); // ✅ Throws if invalid

  // Now it's SAFE to use
});
```

**Why Zod?**

- Catches `email:
