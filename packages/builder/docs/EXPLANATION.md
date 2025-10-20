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
  .withFoo('bar') // ❌ TypeScript error: Property doesn't exist
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

- Catches `email: "not-an-email"` before it hits your database
- Validates `password: "123"` doesn't meet minimum length
- Returns helpful error messages for the user
- Prevents security vulnerabilities

### Mode 2: Class - Behavior First

**When:** Domain models with business logic

**Why:** You need methods, not just data.

**Trade-off:**

- ✅ Full OOP (methods, inheritance, `instanceof`)
- ✅ Encapsulation of business logic
- ❌ Slower than interface mode (~300k ops/sec due to class instantiation)

**Example:**

```typescript
class Order {
  total!: number;
  status!: 'pending' | 'completed' | 'cancelled';

  // Business logic lives here
  canBeCancelled(): boolean {
    return this.status === 'pending';
  }

  applyDiscount(percent: number): void {
    if (!this.canBeCancelled()) {
      throw new Error('Cannot modify completed order');
    }
    this.total *= 1 - percent / 100;
  }
}

const order = createOrder().withTotal(100).withStatus('pending').build();

// Use the methods
if (order.canBeCancelled()) {
  order.applyDiscount(10);
}
```

**Why Classes?**

- Business logic stays with the data (not scattered in services)
- Easy to test (just test the class methods)
- Type-safe method calls
- Standard OOP patterns

### Mode 3: Interface - Speed First

**When:** Internal transformations, high-throughput scenarios

**Why:** You've already validated upstream, now you need speed.

**Trade-off:**

- ✅ Blazing fast (~400k ops/sec - no validation, no class instantiation)
- ✅ Minimal memory usage
- ❌ No validation (you must trust the data)
- ❌ No methods (plain objects only)

**Example:**

```typescript
interface UserDTO {
  id: number;
  name: string;
  email: string;
}

const createDTO = builder<UserDTO>(['id', 'name', 'email']);

// Transform 10,000 database records in ~25ms
app.get('/api/users', async (req, res) => {
  const users = await db.users.findMany(); // Already validated

  const dtos = users.map((user) =>
    createDTO()
      .withId(user.id)
      .withName(`${user.firstName} ${user.lastName}`)
      .withEmail(user.email)
      .build()
  );

  res.json(dtos); // ⚡ Lightning fast
});
```

**Why Interfaces?**

- Data already validated (from database)
- No need for methods (just transforming data)
- Maximum throughput for APIs
- Minimal GC pressure

### The Combined Pattern

**Best Practice:** Use all three modes together.

```typescript
// 1️⃣ API Boundary: Validate with Zod
const validateInput = builder(CreateUserSchema);

app.post('/api/users', async (req) => {
  // ✅ External input → Validate
  const input = validateInput().withEmail(req.body.email).withPassword(req.body.password).build();

  // 2️⃣ Domain Layer: Use class with business logic
  const user = createUser()
    .withId(generateId())
    .withEmail(input.email)
    .withPasswordHash(await hash(input.password))
    .build();

  // ✅ Business logic in the class
  user.sendWelcomeEmail();

  await db.users.create(user);

  // 3️⃣ Response: Fast DTO transformation
  const dto = createUserDTO().withId(user.id).withEmail(user.email).withName(user.name).build();

  res.json(dto); // ✅ Clean response
});
```

**The Flow:**

1. **Input:** Zod validation (safety)
2. **Processing:** Class with methods (business logic)
3. **Output:** Interface DTO (speed)

### Why This Matters

**Single-mode libraries force compromises:**

- Validate everything → slow
- Skip validation → unsafe
- Use plain objects → no business logic

**Three modes = choose the right tool:**

- Validation when you need it
- Classes when you need behavior
- Interfaces when you need speed

---

## The Functional Programming Extension

### Why Add Functional Programming?

The OOP builder pattern (method chaining with mutable state) is great for many use cases. But as applications grow more complex, you start hitting limitations:

**Problem 1: State Management Complexity**

```typescript
// OOP builder - mutable state
const builder = createBuilder<User>();
builder.withName('Alice');
someFunction(builder); // Did it modify the builder? 🤔
builder.withEmail('alice@example.com');
const user = builder.build(); // What's in here? 😰
```

**Problem 2: Composability Challenges**

```typescript
// Hard to compose builder patterns
const withAdminDefaults = (builder) => {
  builder.withRole('admin');
  builder.withActive(true);
  return builder; // Mutated!
};

const builder = createBuilder<User>();
withAdminDefaults(builder); // Builder is now mutated
// Can't reuse builder for non-admin users
```

**Problem 3: Testing and Debugging**

```typescript
// Mutable state makes testing harder
const builder = createBuilder<User>();
builder.withId(1);
builder.withName('Alice');

// Debug: What's the current state?
// No way to inspect without calling build() (which consumes the builder)
```

**Problem 4: Concurrency and Parallelism**

```typescript
// Shared mutable state is dangerous
const builder = createBuilder<User>();

Promise.all([
  async () => builder.withId(await fetchId()),
  async () => builder.withName(await fetchName()),
]);
// Race condition! Which value wins?
```

### The Functional Programming Solution

We added a **functional programming extension** that solves these problems through **immutability and pure functions**.

### Core Concept: Immutable State

**The Insight:** Instead of mutating a builder, return a new state object every time.

```typescript
// OOP (mutable)
const builder = createBuilder<User>();
builder.withName('Alice'); // Mutates builder
builder.withEmail('alice@example.com'); // Mutates builder again

// FP (immutable)
const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email']);

const state1 = userBuilder.empty(); // {}
const state2 = userBuilder.withName('Alice')(state1); // { name: 'Alice' }
const state3 = userBuilder.withEmail('alice@example.com')(state2); // { name: 'Alice', email: '...' }

// state1 !== state2 !== state3 (all different objects)
// state1 is STILL {} - it never changed!
```

**Benefits:**

- ✅ **Predictable:** No hidden mutations
- ✅ **Composable:** Chain transformations safely
- ✅ **Debuggable:** Inspect any intermediate state
- ✅ **Testable:** Pure functions = easier testing
- ✅ **Safe:** No race conditions with shared state

### Composability Through Pipe

**The Problem with OOP:**

```typescript
// Hard to extract and reuse builder patterns
function buildAdmin() {
  const builder = createBuilder<User>();
  builder.withRole('admin');
  builder.withActive(true);
  builder.withAge(30);
  return builder;
}

function buildUser(id: number, name: string) {
  const builder = buildAdmin(); // Gets a mutated builder
  builder.withId(id);
  builder.withName(name);
  return builder.build();
}
```

**The FP Solution:**

```typescript
// Composable transformations
const adminDefaults = pipe<User>(
  userBuilder.withRole('admin'),
  userBuilder.withActive(true),
  userBuilder.withAge(30)
);

const buildUser = (id: number, name: string) =>
  pipe<User>(
    adminDefaults, // Compose reusable patterns!
    userBuilder.withId(id),
    userBuilder.withName(name)
  );

// Each is a pure function - no side effects
const admin1 = userBuilder.build(buildUser(1, 'Alice')(userBuilder.empty()));
const admin2 = userBuilder.build(buildUser(2, 'Bob')(userBuilder.empty()));
// adminDefaults is reused safely - no mutations!
```

### Function Composition: The Power of Pipe and Compose

**Pipe (Left-to-Right):**

```typescript
// Reads naturally like a pipeline
const transform = pipe<User>(
  userBuilder.withId(1), // Step 1
  userBuilder.withName('Alice'), // Step 2
  normalizeEmail, // Step 3: Custom function
  validateAge // Step 4: Custom function
);

const user = userBuilder.build(transform(userBuilder.empty()));
```

**Compose (Right-to-Left):**

```typescript
// Mathematical composition f(g(h(x)))
const transform = compose<User>(
  validateAge, // Applied LAST
  normalizeEmail, // Applied third
  userBuilder.withName('Alice'), // Applied second
  userBuilder.withId(1) // Applied FIRST
);
```

**Why This Matters:**

**1. Reusability**

```typescript
// Extract common patterns
const normalizeEmail = (state: BuilderState<User>) => {
  if (state.email) {
    return Object.freeze({ ...state, email: state.email.toLowerCase().trim() });
  }
  return state;
};

const ensureAdult = (state: BuilderState<User>) => {
  if (state.age && state.age < 18) {
    return Object.freeze({ ...state, age: 18 });
  }
  return state;
};

// Use in ANY pipeline
const transform1 = pipe(normalizeEmail, ensureAdult);
const transform2 = pipe(ensureAdult); // Just age validation
const transform3 = pipe(normalizeEmail); // Just email normalization
```

**2. Testability**

```typescript
// Test each transformation independently
describe('normalizeEmail', () => {
  it('should lowercase and trim email', () => {
    const state = { email: '  ALICE@EXAMPLE.COM  ' };
    const result = normalizeEmail(state);
    expect(result.email).toBe('alice@example.com');
  });

  it('should not mutate original state', () => {
    const state = { email: '  ALICE@EXAMPLE.COM  ' };
    const result = normalizeEmail(state);
    expect(state).not.toBe(result); // Different objects
    expect(state.email).toBe('  ALICE@EXAMPLE.COM  '); // Original unchanged
  });
});
```

**3. Debugging**

```typescript
// Use tap() to inspect state at any point
const transform = pipe<User>(
  userBuilder.withId(1),
  tap((state) => console.log('After withId:', state)),
  userBuilder.withName('Alice'),
  tap((state) => console.log('After withName:', state)),
  normalizeEmail,
  tap((state) => console.log('After normalize:', state))
);
```

### Higher-Order Functions: Map, Filter, Fold

**The FP Toolkit:**

```typescript
// Filter: Keep only certain properties
const onlyPublicFields = filterBuilder<User>((key) => !['password', 'ssn'].includes(key as string));

// Map: Transform values
const sanitizeStrings = mapBuilder<User, string>((key, value) => {
  if (typeof value === 'string') {
    return value.trim();
  }
  return value as string;
});

// Fold: Reduce to a value
const countFields = foldBuilder<User, number>((acc, key, value) => acc + 1, 0);

// Compose transformations
const sanitizedUser = userBuilder.build(
  pipe<User>(
    userBuilder.withName('  Alice  '),
    userBuilder.withEmail('  alice@example.com  '),
    userBuilder.withPassword('secret'),
    sanitizeStrings, // Trim all strings
    onlyPublicFields // Remove password
  )(userBuilder.empty())
);
// { name: 'Alice', email: 'alice@example.com' }
```

### Transducers: High-Performance Composition

**The Problem:** Chaining array operations creates intermediate arrays.

```typescript
// Inefficient (3 passes, 2 intermediate arrays)
const result = data
  .filter((x) => x.active) // Pass 1 → intermediate array 1
  .map((x) => x.name) // Pass 2 → intermediate array 2
  .slice(0, 10); // Pass 3 → final array
```

**The Solution:** Transducers compose transformations into a single pass.

```typescript
// Efficient (1 pass, no intermediate arrays)
const transform = transduce<User>(
  filtering((key, value) => value !== undefined),
  mapping('name', (name: string) => name.toUpperCase()),
  taking(10)
);

const result = transform(state); // Single pass!
```

**Performance Impact:**

```typescript
// Benchmark: 10,000 items
// Traditional: 3 passes, 2 intermediate arrays, ~15ms
// Transducers: 1 pass, 0 intermediate arrays, ~5ms
// 3x faster!
```

### Partial Application: Smart Defaults

**The Problem:** Repeating default values.

```typescript
// OOP - repetitive
const admin1 = createBuilder<User>()
  .withRole('admin')
  .withActive(true)
  .withAge(30)
  .withId(1)
  .withName('Alice')
  .build();

const admin2 = createBuilder<User>()
  .withRole('admin') // Duplicate
  .withActive(true) // Duplicate
  .withAge(30) // Duplicate
  .withId(2)
  .withName('Bob')
  .build();
```

**The FP Solution:**

```typescript
// Define defaults once
const adminDefaults = partial<User>({
  role: 'admin',
  active: true,
  age: 30,
});

// Reuse everywhere
const admin1 = userBuilder.build(
  pipe<User>(
    adminDefaults,
    userBuilder.withId(1),
    userBuilder.withName('Alice')
  )(userBuilder.empty())
);

const admin2 = userBuilder.build(
  pipe<User>(
    adminDefaults, // Same defaults, no duplication
    userBuilder.withId(2),
    userBuilder.withName('Bob')
  )(userBuilder.empty())
);
```

**Advanced: Conditional Defaults**

```typescript
const applyDefaults = partialIf<User>(
  (state) => !state.role, // Only if no role set
  { role: 'user', active: true }
);

const user1 = pipe(applyDefaults, userBuilder.withId(1))(userBuilder.empty());
// { id: 1, role: 'user', active: true } - defaults applied

const user2 = pipe(
  userBuilder.withRole('admin'),
  applyDefaults, // No-op (role already set)
  userBuilder.withId(2)
)(userBuilder.empty());
// { id: 2, role: 'admin' } - defaults NOT applied
```

### When to Use Functional Programming

**Use FP When:**

✅ **Building Complex State Transformations**

```typescript
// Multi-step pipelines with custom logic
const buildVerifiedUser = pipe<User>(
  userBuilder.withId(generateId()),
  userBuilder.withEmail(req.body.email),
  normalizeEmail,
  validateEmailDomain,
  checkEmailBlacklist,
  userBuilder.withVerified(true),
  logUserCreation
);
```

✅ **Need Guaranteed Immutability**

```typescript
// React/Redux state management
const userReducer = (state: User, action: Action) => {
  switch (action.type) {
    case 'UPDATE_NAME':
      return pipe<User>(userBuilder.withName(action.payload))(state); // Returns NEW state, never mutates
  }
};
```

✅ **Reusable Transformation Patterns**

```typescript
// Extract and compose patterns
const sanitizeUser = pipe(normalizeEmail, trimStrings, removeEmpty);
const validateUser = pipe(ensureAdult, validateEmail, checkRequired);
const completeFlow = pipe(sanitizeUser, validateUser);
```

✅ **Functional Codebase**

```typescript
// Team uses Ramda, fp-ts, or functional patterns
// FP builder fits naturally
```

**Use OOP When:**

✅ **Simple, Straightforward Objects**

```typescript
// One-liners are fine with OOP
const user = createBuilder<User>().withId(1).withName('Alice').build();
```

✅ **Maximum Performance**

```typescript
// FP is ~2-3x slower due to immutability
// OOP: ~400k ops/sec
// FP: ~150k ops/sec (still very fast!)
```

✅ **OOP Codebase**

```typescript
// Team uses classes, services, repositories
// OOP builder fits naturally
```

### Performance Trade-offs: FP vs OOP

**Immutability Cost:**

| Operation         | OOP (Mutable)    | FP (Immutable)   | Difference           |
| ----------------- | ---------------- | ---------------- | -------------------- |
| Builder creation  | ~400,000 ops/sec | ~150,000 ops/sec | **2.6x slower**      |
| Memory per object | ~60 bytes        | ~120 bytes       | **2x more**          |
| GC pressure       | Low              | Medium           | More objects created |

**Why the difference?**

```typescript
// OOP - mutates in place (fast)
builder.data.name = 'Alice'; // Direct mutation

// FP - creates new object (slower)
const newState = Object.freeze({ ...state, name: 'Alice' }); // Spread + freeze
```

**Is 150k ops/sec slow?** No! That's **6.6 microseconds per operation**. For most applications, this is plenty fast.

**When performance matters:**

- **Use OOP** for hot paths (called 10,000+ times/second)
- **Use FP** for business logic (called 10-100 times/second)

### Design Philosophy: Two Paths, Same Destination

We provide **both OOP and FP** because different problems need different tools.

**The Spectrum:**

```
Simple ←──────────────────────────────────────────→ Complex

OOP Builder          Hybrid                    FP Builder
(fast, imperative)   (mix both)                (composable, pure)

Use for:             Use for:                  Use for:
- DTOs               - API validation          - Complex pipelines
- Config objects     - Domain models           - State machines
- Request/response   - Medium complexity       - Transformations
```

**The Hybrid Approach:**

```typescript
// 1. Validate with FP (composable validation)
const validateInput = pipe<User>(normalizeEmail, ensureAdult, validateRequired);

const validatedState = validateInput(rawInput);

// 2. Build with OOP (fast final construction)
const user = createBuilder<User>()
  .withId(validatedState.id!)
  .withName(validatedState.name!)
  .withEmail(validatedState.email!)
  .build();
```

**Both approaches:**

- ✅ Are fully type-safe
- ✅ Support Zod validation
- ✅ Use object pooling
- ✅ Have zero runtime type overhead
- ✅ Generate full autocomplete

**The difference:** OOP mutates, FP doesn't. Choose based on your needs.

---

## Trade-offs and Design Decisions

### Design Decision 1: Runtime Detection vs. Explicit Configuration

**The Choice:**

- ❌ Explicit: `builder.forZod(schema)`, `builder.forClass(MyClass)`
- ✅ Auto-detection: `builder(anything)`

**Why Auto-detection?**

**Developer Experience:**

```typescript
// Auto-detection (our choice)
const create = builder(UserSchema);

// Explicit (alternative)
const create = builder.forZod(UserSchema);
```

**Pros:**

- ✅ Less typing
- ✅ Feels magical
- ✅ Works with any input type

**Cons:**

- ❌ Slightly slower (runtime type checking)
- ❌ Less explicit (harder to understand what's happening)

**Our Decision:** DX wins. The runtime detection is **negligible** (~0.01ms), and the cleaner API is worth it.

---

### Design Decision 2: Object Pooling vs. Simple Factory

**The Choice:**

- ❌ Simple factory: `new Builder()` every time
- ✅ Object pooling: Reuse builder instances

**Why Pooling?**

**Performance Data:**

```typescript
// Simple factory (alternative)
function createUser() {
  return new UserBuilder(); // New allocation every time
}

// Ops/sec: ~200,000
// GC pressure: High

// Object pooling (our choice)
const pool = new BuilderPool(() => new UserBuilder());
function createUser() {
  return pool.get(); // Reuse existing
}

// Ops/sec: ~400,000 (2x faster)
// GC pressure: Low
```

**Pros:**

- ✅ 2x faster
- ✅ Consistent performance (no GC pauses)
- ✅ Lower memory usage

**Cons:**

- ❌ More complex implementation
- ❌ Harder to debug (builders are reused)
- ❌ Must ensure builders are reset properly

**Our Decision:** Performance wins. The complexity is hidden from users, and the speed boost is significant.

---

### Design Decision 3: Fluent API vs. Single Method

**The Choice:**

- ❌ Single method: `builder.set('name', 'John').set('email', 'j@x.com')`
- ✅ Fluent API: `builder.withName('John').withEmail('j@x.com')`

**Why Fluent API?**

**Developer Experience:**

```typescript
// Single method (alternative)
createUser().set('name', 'John').set('email', 'john@example.com').build();

// Fluent API (our choice)
createUser().withName('John').withEmail('john@example.com').build();
```

**Pros:**

- ✅ Better autocomplete (`.withN...` suggests `withName`)
- ✅ Type-safe (`.withName(123)` is a compile error)
- ✅ More readable
- ✅ Industry standard (matches builder pattern conventions)

**Cons:**

- ❌ More methods generated (larger type definitions)
- ❌ Slightly larger bundle size (~0.5KB difference)

**Our Decision:** DX wins. Autocomplete + type safety > bundle size.

---

### Design Decision 4: Async Support

**The Choice:**

- ❌ Sync only: `builder(schema).build()`
- ✅ Async option: `builderAsync(schema).buildAsync()`

**Why Both?**

**Use Case:**

```typescript
// High-concurrency server
app.post('/api/users', async (req, res) => {
  // Sync validation blocks event loop
  const user = builder(UserSchema).withEmail(req.body.email).build(); // ❌ Blocks for ~10ms (Zod validation)

  // 10ms × 1000 concurrent requests = event loop blocked
});
```

**Solution:**

```typescript
// Async validation doesn't block
const user = await builderAsync(UserSchema).withEmail(req.body.email).buildAsync(); // ✅ Yields to event loop during validation
```

**Pros:**

- ✅ Better for high-concurrency
- ✅ Non-blocking validation
- ✅ Scales better under load

**Cons:**

- ❌ Slightly more complex API
- ❌ Requires `await` (more typing)
- ❌ Only works with Zod (not classes/interfaces)

**Our Decision:** Provide both. Sync for simplicity, async for scale.

---

### Design Decision 5: Interface Mode Requires Explicit Keys

**The Choice:**

- ❌ Try to infer from interface (impossible)
- ✅ Require explicit key array

**Why Explicit?**

**The Limitation:**

```typescript
// TypeScript
interface User {
  name: string;
  email: string;
}

// Compiles to JavaScript
// (nothing - interface is erased)
```

Interfaces **don't exist at runtime**. We literally cannot detect them.

**Options:**

1. Reflection (requires `reflect-metadata` + decorators) ❌ Too heavy
2. Code generation (build-time step) ❌ Too complex
3. Explicit keys ✅ Simple, works today

**Our Decision:** Explicit keys. It's a small inconvenience for massive speed gains.

---

## When to Use (and Not Use) This Library

### ✅ Use This Library When...

#### 1. You Have Multiple Builder Patterns

**Scenario:** You're writing 5+ builder classes.

**Before:**

```typescript
// 50 lines per builder × 20 types = 1000 lines of boilerplate
class UserBuilder {
  /* ... */
}
class ProductBuilder {
  /* ... */
}
class OrderBuilder {
  /* ... */
}
// ... 17 more
```

**After:**

```typescript
// 1 line per type = 20 lines total
const createUser = builder(UserSchema);
const createProduct = builder(Product);
const createOrder = builder<Order>(['id', 'total']);
// ... 17 more
```

**Savings:** 980 lines of code eliminated.

---

#### 2. You Need Runtime Validation

**Scenario:** API endpoints that accept user input.

**Why:** Zod integration gives you validation + builder API in one.

```typescript
const createUser = builder(UserSchema);

app.post('/api/users', (req) => {
  const user = createUser().withEmail(req.body.email).build(); // ✅ Throws if invalid
});
```

---

#### 3. You're Building High-Throughput Systems

**Scenario:** Processing 10,000+ objects per second.

**Why:** Object pooling reduces GC pressure.

**Performance:**

- Traditional builders: ~200k ops/sec
- This library: ~400k ops/sec

**Impact:** Handle 2x more requests with the same hardware.

---

#### 4. You Value Type Safety + DX

**Scenario:** Large TypeScript codebase with many developers.

**Why:** Autocomplete prevents bugs, refactoring is safer.

**Before:**

```typescript
// Generic builder - no autocomplete
const user = createUser()
  .set('name', 'John')
  .set('emial', 'john@example.com') // ❌ Typo: "emial"
  .build();
```

**After:**

```typescript
// Generated methods - full autocomplete
const user = createUser()
  .withName('John')
  .withEmial // ❌ TypeScript error: Property doesn't exist
  .build();
```

---

### ❌ Don't Use This Library When...

#### 1. You Only Have 1-2 Builders

**Scenario:** Small project with minimal builder usage.

**Why:** Overkill. Just write a simple builder class.

```typescript
// For 1-2 types, this is fine:
class UserBuilder {
  withName(name: string) {
    /* ... */
  }
  build() {
    /* ... */
  }
}
```

**Our library adds a dependency for minimal gain.**

---

#### 2. You Need Complex Validation Logic

**Scenario:** Business rules that go beyond Zod's capabilities.

**Example:**

```typescript
// Complex validation
function validateUser(user: User): ValidationResult {
  if (user.age < 18 && user.plan === 'premium') {
    return { valid: false, error: 'Minors cannot purchase premium' };
  }
  if (user.email.includes('+') && user.domain === 'corporate') {
    return { valid: false, error: 'No email aliases in corporate accounts' };
  }
  // ... 10 more custom rules
}
```

**Why Not Use This Library:**

- Zod can't express these rules easily
- Custom validation logic is simpler outside the builder

**Alternative:** Use plain Zod or hand-written validation.

---

#### 3. You're Building for Browsers with Strict Bundle Size

**Scenario:** Every kilobyte counts (e.g., mobile web).

**Bundle Size:**

- This library: ~6KB (minified + gzipped)
- Hand-written builder: ~0.5KB

**Trade-off:** Our library adds 5.5KB for convenience.

**When It's Worth It:**

- ✅ If you have 10+ builders (saves code size overall)
- ❌ If you have 1-2 builders (adds unnecessary weight)

---

#### 4. You're Working in Plain JavaScript (No TypeScript)

**Scenario:** JavaScript-only project.

**Why Not Use This Library:**

- You lose type inference (the main benefit)
- No autocomplete
- No compile-time error checking

**Example:**

```javascript
// JavaScript (no types)
const createUser = builder(UserSchema);

// No autocomplete, no errors
createUser()
  .withName('John')
  .withFoo('bar') // ✅ No error (but method doesn't exist)
  .build();
```

**Alternative:** Use Zod directly for validation, skip the builder.

---

## Comparison with Alternatives

### vs. Hand-Written Builders

| Feature        | Hand-Written                | This Library             |
| -------------- | --------------------------- | ------------------------ |
| Type Safety    | ✅ Full                     | ✅ Full                  |
| Autocomplete   | ✅ Perfect                  | ✅ Perfect               |
| Boilerplate    | ❌ High (50+ lines/type)    | ✅ Minimal (1 line/type) |
| Performance    | ⚠️ Medium (~200k ops/sec)   | ✅ Fast (~400k ops/sec)  |
| Maintenance    | ❌ Manual (update 3 places) | ✅ Automatic             |
| Learning Curve | ✅ Simple                   | ⚠️ Medium                |

**When to Use Hand-Written:**

- 1-2 builders total
- Custom validation logic
- No TypeScript

**When to Use This Library:**

- 5+ builders
- Standard validation (Zod)
- TypeScript project

---

### vs. Generic Builder Libraries

**Example:** `ts-generic-builder`, `fluent-builder`

```typescript
// Generic builder (alternative)
class GenericBuilder<T> {
  with<K extends keyof T>(key: K, value: T[K]): this {
    this.data[key] = value;
    return this;
  }
  build(): T {
    return this.data as T;
  }
}

const createUser = () => new GenericBuilder<User>();
createUser().with('name', 'John').build();
```

| Feature      | Generic Libraries         | This Library             |
| ------------ | ------------------------- | ------------------------ |
| Autocomplete | ❌ Poor (`.with('name')`) | ✅ Great (`.withName()`) |
| Type Safety  | ⚠️ Partial                | ✅ Full                  |
| Performance  | ⚠️ Medium (~200k ops/sec) | ✅ Fast (~400k ops/sec)  |
| Validation   | ❌ None                   | ✅ Built-in (Zod)        |
| Bundle Size  | ✅ Small (~1KB)           | ⚠️ Medium (~6KB)         |

**When to Use Generic:**

- Bundle size critical
- Don't need validation
- Okay with `.with('key')` syntax

**When to Use This Library:**

- Want `.withKey()` autocomplete
- Need validation (Zod)
- Performance matters

---

### vs. Plain Zod

**Example:** Using Zod without builder pattern

```typescript
// Plain Zod
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

const user = UserSchema.parse({
  name: 'John',
  email: 'john@example.com',
});
```

| Feature      | Plain Zod         | This Library (Zod Mode) |
| ------------ | ----------------- | ----------------------- |
| Validation   | ✅ Full           | ✅ Full (same)          |
| Syntax       | ⚠️ Object literal | ✅ Fluent API           |
| Autocomplete | ❌ None           | ✅ Full                 |
| Type Safety  | ✅ Full           | ✅ Full                 |
| Performance  | ✅ ~100k ops/sec  | ✅ ~100k ops/sec (same) |
| Bundle Size  | ✅ Zod only       | ⚠️ Zod + 6KB            |

**When to Use Plain Zod:**

- Simple validation
- No need for builder pattern
- Minimal bundle size

**When to Use This Library:**

- Want fluent API
- Building complex objects
- Need autocomplete

---

### vs. Factory Functions

**Example:** Simple factory pattern

```typescript
// Factory function
function createUser(data: Partial<User>): User {
  return {
    name: data.name || 'Anonymous',
    email: data.email || '',
    age: data.age || 0,
  };
}

const user = createUser({ name: 'John', email: 'j@x.com' });
```

| Feature      | Factory Functions | This Library      |
| ------------ | ----------------- | ----------------- |
| Simplicity   | ✅ Very simple    | ⚠️ Medium         |
| Chainability | ❌ No             | ✅ Yes            |
| Validation   | ❌ Manual         | ✅ Built-in (Zod) |
| Type Safety  | ⚠️ Partial        | ✅ Full           |
| Performance  | ✅ ~500k ops/sec  | ✅ ~400k ops/sec  |

**When to Use Factory:**

- Very simple objects
- No validation needed
- Maximum simplicity

**When to Use This Library:**

- Complex construction
- Need validation
- Want fluent API

---

### vs. Functional Libraries (Ramda, fp-ts, Lodash/fp)

**Example:** Using Ramda for object construction

```typescript
// Ramda
import * as R from 'ramda';

const createUser = R.pipe(
  R.assoc('id', 1),
  R.assoc('name', 'Alice'),
  R.assoc('email', 'alice@example.com')
);

const user = createUser({});
```

| Feature         | Ramda/fp-ts                | This Library (FP Mode)       |
| --------------- | -------------------------- | ---------------------------- |
| Type Safety     | ⚠️ Partial (complex types) | ✅ Full (generated types)    |
| Autocomplete    | ❌ Generic (.assoc('key')) | ✅ Specific (.withKey())     |
| Builder Pattern | ❌ No (use pipes)          | ✅ Yes (native support)      |
| Validation      | ❌ None                    | ✅ Built-in (Zod)            |
| Learning Curve  | ❌ High (FP concepts)      | ⚠️ Medium (familiar builder) |
| Bundle Size     | ⚠️ Large (20KB+)           | ✅ Small (~8KB with FP)      |
| Performance     | ✅ Fast                    | ✅ Fast (similar)            |

**When to Use Ramda/fp-ts:**

- Already using functional libraries
- Need advanced FP features (Maybe, Either, Task, etc.)
- Prefer generic FP approach

**When to Use This Library (FP Mode):**

- Want builder pattern with FP benefits
- Need type-safe autocomplete
- Want validation built-in
- Prefer TypeScript-first approach

---

### vs. Immer (Immutable Updates)

**Example:** Using Immer for immutable updates

```typescript
// Immer
import { produce } from 'immer';

const user = produce({}, (draft) => {
  draft.id = 1;
  draft.name = 'Alice';
  draft.email = 'alice@example.com';
});
```

| Feature       | Immer                   | This Library (FP Mode)      |
| ------------- | ----------------------- | --------------------------- |
| Immutability  | ✅ Full                 | ✅ Full                     |
| Type Safety   | ✅ Full                 | ✅ Full                     |
| API Style     | ⚠️ Imperative (draft)   | ✅ Declarative (pipe)       |
| Validation    | ❌ None                 | ✅ Built-in (Zod)           |
| Composability | ⚠️ Limited              | ✅ Excellent (pipe/compose) |
| Performance   | ✅ Fast (~200k ops/sec) | ✅ Fast (~150k ops/sec)     |
| Bundle Size   | ✅ Small (~6KB)         | ✅ Small (~8KB)             |
| Use Case      | React state updates     | Object construction         |

**When to Use Immer:**

- React state management
- Nested object updates
- Prefer imperative style with immutability

**When to Use This Library (FP Mode):**

- Building new objects
- Complex transformation pipelines
- Need validation
- Want fluent builder API

**Can You Use Both?** Yes!

```typescript
// Immer for state updates
const nextState = produce(state, (draft) => {
  draft.users.push(newUser);
});

// FP Builder for object creation
const newUser = userBuilder.build(
  pipe(
    userBuilder.withId(generateId()),
    userBuilder.withName('Alice'),
    normalizeEmail
  )(userBuilder.empty())
);
```

---

### vs. Class-Transformer / TypeORM

**Example:** Using class-transformer for DTOs

```typescript
// class-transformer
import { plainToClass } from 'class-transformer';

class User {
  @Type(() => Number)
  id: number;

  @Type(() => String)
  name: string;
}

const user = plainToClass(User, { id: 1, name: 'Alice' });
```

| Feature         | class-transformer         | This Library                |
| --------------- | ------------------------- | --------------------------- |
| Type Safety     | ⚠️ Runtime decorators     | ✅ Compile-time             |
| Boilerplate     | ❌ High (decorators)      | ✅ Minimal                  |
| Validation      | ⚠️ Via class-validator    | ✅ Via Zod                  |
| Performance     | ⚠️ Medium (~100k ops/sec) | ✅ Fast (~400k ops/sec OOP) |
| Builder Pattern | ❌ No                     | ✅ Yes                      |
| FP Support      | ❌ No                     | ✅ Yes                      |
| Bundle Size     | ⚠️ Large (~15KB)          | ✅ Small (~6-8KB)           |

**When to Use class-transformer:**

- Using TypeORM or NestJS
- Need advanced transformation (Date parsing, nested objects)
- Already using decorators

**When to Use This Library:**

- Want builder pattern
- Prefer Zod validation
- Better performance needed
- Functional programming support

---

## Conclusion

### The Core Philosophy

**@noony-serverless/type-builder** is built on four principles:

1. **Developer Experience First**
   - Zero boilerplate
   - Full autocomplete
   - Automatic type inference

2. **Performance Matters**
   - Object pooling (2x faster)
   - Three optimized modes
   - Minimal GC pressure

3. **Type Safety Without Cost**
   - Compile-time checking
   - Zero runtime overhead
   - Industry-standard patterns

4. **Flexibility Through Choice**
   - OOP builder for simplicity and speed
   - FP builder for composability and immutability
   - Mix both approaches as needed

### The Sweet Spot

This library shines when you:

- Have 5+ builder patterns
- Need runtime validation (APIs)
- Value type safety + DX
- Build high-throughput systems
- Want composable transformations (FP)
- Need guaranteed immutability (React/Redux)

It's not for everyone, and that's okay. Use the right tool for the job.

### Final Thoughts

**The Builder Pattern is 30 years old.** It's a proven solution to a real problem. But it's always been held back by boilerplate.

**TypeScript gave us type-level programming.** We can now generate types automatically.

**Modern JavaScript gave us Proxies and Symbols.** We can now intercept object creation at runtime.

**Functional Programming brought us immutability and composability.** We can now build complex transformations safely.

**This library combines these four innovations** to create something that wasn't possible before: builders with zero boilerplate, full type safety, exceptional performance, and a choice between imperative (OOP) and declarative (FP) styles.

**Whether you prefer mutation or immutability, method chaining or function composition, this library has you covered.**

**That's why you should use @noony-serverless/type-builder.**

---

## Further Reading

- **Tutorial:** [Getting Started Guide](./TUTORIAL.md)
- **How-to:** [Common Recipes](./HOW-TO.md)
- **Reference:** [API Documentation](./REFERENCE.md)
- **Functional Programming:** [FP Guide](./FUNCTIONAL-PROGRAMMING-V2.md)
- **Coverage:** [Test Coverage Analysis](../COVERAGE-ANALYSIS.md)
- **Performance:** [Benchmark Results](../PERFORMANCE.md)

---

**Questions or feedback?** Open an issue on [GitHub](https://github.com/your-org/typescript-bulder-lib/issues).
