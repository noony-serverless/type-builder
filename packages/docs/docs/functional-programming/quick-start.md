---
sidebar_position: 1
---

# Quick Start: Functional Programming

Get started with immutable builders and functional programming in just 5 minutes!

## TL;DR - Show Me the Code!

```typescript
import { createImmutableBuilder, pipe } from '@noony-serverless/type-builder';

interface User {
  id: number;
  name: string;
  email: string;
}

// 1. Create the builder
const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email']);

// 2. Build using pipe
const user = userBuilder.build(
  pipe<User>(
    userBuilder.withId(1),
    userBuilder.withName('Alice'),
    userBuilder.withEmail('alice@example.com')
  )(userBuilder.empty())
);

console.log(user);
// { id: 1, name: 'Alice', email: 'alice@example.com' }
```

**That's it!** You just built an object using functional programming.

---

## What's Different from OOP?

### OOP Builder (Mutable)

```typescript
import { builder } from '@noony-serverless/type-builder';

const createUser = builder<User>(['name', 'email']);
const user = createUser().withName('Alice').withEmail('alice@example.com').build();
```

**Characteristics:**

- ✅ Simple and fast
- ✅ Familiar method chaining
- ❌ Mutable state
- ❌ Hard to compose

### FP Builder (Immutable)

```typescript
import { createImmutableBuilder, pipe } from '@noony-serverless/type-builder';

const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email']);

const user = userBuilder.build(
  pipe<User>(
    userBuilder.withName('Alice'),
    userBuilder.withEmail('alice@example.com')
  )(userBuilder.empty())
);
```

**Characteristics:**

- ✅ Immutable state (safer)
- ✅ Composable functions
- ✅ Easy to test
- ⚠️ Slightly more verbose
- ⚠️ 2-3x slower (still very fast!)

---

## Why Use Functional Programming?

### 1. Guaranteed Immutability

Every transformation returns a **new** object. The original never changes.

```typescript
const state1 = userBuilder.empty(); // {}
const state2 = userBuilder.withName('Alice')(state1); // { name: 'Alice' }

console.log(state1); // Still {} - never changed!
console.log(state2); // { name: 'Alice' }
console.log(state1 !== state2); // true - different objects
```

**Why this matters:**

- ✅ No accidental mutations
- ✅ Easier debugging (inspect any state)
- ✅ Safe for React/Redux
- ✅ Time-travel debugging possible

### 2. Composability

Extract and reuse transformation patterns:

```typescript
// Define reusable patterns
const adminDefaults = pipe<User>(userBuilder.withRole('admin'), userBuilder.withActive(true));

const guestDefaults = pipe<User>(userBuilder.withRole('guest'), userBuilder.withActive(false));

// Compose with specific data
const admin = userBuilder.build(
  pipe<User>(
    adminDefaults, // Reuse pattern
    userBuilder.withId(1),
    userBuilder.withName('Admin User')
  )(userBuilder.empty())
);

const guest = userBuilder.build(
  pipe<User>(
    guestDefaults, // Reuse pattern
    userBuilder.withId(2),
    userBuilder.withName('Guest User')
  )(userBuilder.empty())
);
```

### 3. Testability

Pure functions are incredibly easy to test:

```typescript
// Custom transformation
const normalizeEmail = (state: BuilderState<User>) => {
  if (state.email) {
    return Object.freeze({
      ...state,
      email: state.email.toLowerCase().trim(),
    });
  }
  return state;
};

// Test it (no mocks needed!)
describe('normalizeEmail', () => {
  it('should lowercase and trim', () => {
    const input = { email: '  ALICE@EXAMPLE.COM  ' };
    const result = normalizeEmail(input);
    expect(result.email).toBe('alice@example.com');
  });

  it('should not mutate original', () => {
    const input = { email: '  TEST  ' };
    const result = normalizeEmail(input);
    expect(input).not.toBe(result);
    expect(input.email).toBe('  TEST  '); // Original unchanged
  });
});
```

---

## Installation

```bash
npm install @noony-serverless/type-builder
```

The functional API is included in the main package with unified imports:

```typescript
import {
  createImmutableBuilder,
  pipe,
  compose,
  partialApply,
} from '@noony-serverless/type-builder';
```

---

## Basic Workflow

Every functional builder follows this pattern:

### Step 1: Create the Builder

```typescript
const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email']);
```

### Step 2: Apply Transformations

```typescript
const transform = pipe<User>(
  userBuilder.withId(1),
  userBuilder.withName('Alice'),
  userBuilder.withEmail('alice@example.com')
);
```

### Step 3: Build the Final Object

```typescript
const user = userBuilder.build(transform(userBuilder.empty()));
```

**Or combine steps 2 and 3:**

```typescript
const user = userBuilder.build(
  pipe<User>(
    userBuilder.withId(1),
    userBuilder.withName('Alice'),
    userBuilder.withEmail('alice@example.com')
  )(userBuilder.empty())
);
```

---

## Common Patterns

### Pattern 1: Simple Object Construction

```typescript
const product = productBuilder.build(
  pipe<Product>(
    productBuilder.withId('p1'),
    productBuilder.withName('Laptop'),
    productBuilder.withPrice(999.99)
  )(productBuilder.empty())
);
```

### Pattern 2: With Custom Transformations

```typescript
const normalizeEmail = (state: BuilderState<User>) => ({
  ...state,
  email: state.email?.toLowerCase().trim(),
});

const user = userBuilder.build(
  pipe<User>(
    userBuilder.withEmail('  ALICE@EXAMPLE.COM  '),
    normalizeEmail // Custom transformation
  )(userBuilder.empty())
);
// email: 'alice@example.com'
```

### Pattern 3: With Defaults

```typescript
import { partialApply } from '@noony-serverless/type-builder';

const defaults = partialApply<User>({
  role: 'user',
  active: true,
});

const user = userBuilder.build(
  pipe<User>(
    defaults, // Apply defaults first
    userBuilder.withId(1),
    userBuilder.withName('Alice')
  )(userBuilder.empty())
);
// { id: 1, name: 'Alice', role: 'user', active: true }
```

### Pattern 4: Conditional Building

```typescript
const buildUser = (isAdmin: boolean) =>
  pipe<User>(
    userBuilder.withId(1),
    userBuilder.withName('Alice'),
    isAdmin ? userBuilder.withRole('admin') : userBuilder.withRole('user')
  );

const admin = userBuilder.build(buildUser(true)(userBuilder.empty()));
const regular = userBuilder.build(buildUser(false)(userBuilder.empty()));
```

---

## Performance Considerations

### How Fast Is It?

```typescript
// Benchmark results (operations per second)
Interface Builder (OOP):     ~400,000 ops/sec  ← Fastest
Class Builder (OOP):          ~300,000 ops/sec
Immutable Builder (FP):       ~150,000 ops/sec  ← Still very fast!
Zod Builder (OOP):            ~100,000 ops/sec
```

**Is 150k ops/sec slow?** No! That's **6.6 microseconds** per operation.

### When to Use FP vs OOP

**Use Functional Programming:**

- ✅ Complex state transformations
- ✅ React/Redux state management
- ✅ Reusable transformation patterns
- ✅ Guaranteed immutability needed

**Use OOP Builder:**

- ✅ Simple object construction
- ✅ Maximum performance critical
- ✅ Hot paths (10,000+ calls/sec)

**Use Both:**

```typescript
// FP for complex validation
const validated = pipe(normalizeEmail, validateAge, checkRequired)(input);

// OOP for fast construction
const createUser = builder<User>(['id', 'name']);
const user = createUser().withId(validated.id!).withName(validated.name!).build();
```

---

## Next Steps

Now that you understand the basics, explore:

- 📖 [Immutable Builder Guide](./immutable-builder) - Deep dive into immutable state
- 🔄 [Pipe and Compose](./pipe-compose) - Function composition patterns
- 🎨 [Higher-Order Functions](./higher-order-functions) - Map, filter, fold, and more
- ⚡ [Transducers](./transducers) - High-performance transformations
- 🎯 [Real-World Examples](./real-world-examples) - Practical use cases

---

## Frequently Asked Questions

### Can I mix FP and OOP?

**Yes!** They work great together:

```typescript
// FP for validation
const validated = pipe(normalizeEmail, ensureAdult)(rawInput);

// OOP for construction
const createUser = builder<User>(['email', 'age']);
const user = createUser().withEmail(validated.email!).withAge(validated.age!).build();
```

### Do I need to learn all FP concepts?

**No!** Start with:

1. `createImmutableBuilder` - Create builders
2. `pipe` - Chain transformations
3. `partial` - Set defaults

That covers 80% of use cases.

### What about TypeScript types?

**Full type safety!** All FP functions are fully typed:

```typescript
const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email']);

// TypeScript knows all available methods
userBuilder.withName('Alice'); // ✅ OK
userBuilder.withFoo('bar'); // ❌ Error: Property 'withFoo' doesn't exist

// Pipe is fully typed
pipe<User>(
  userBuilder.withId(1), // ✅ OK
  userBuilder.withName(123) // ❌ Error: Expected string
);
```

### Is this compatible with Zod?

**Yes!** Pass a Zod schema for validation:

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
});

const userBuilder = createImmutableBuilder<User>(
  ['id', 'email'],
  UserSchema // Validates on build()
);

const user = userBuilder.build(
  pipe<User>(
    userBuilder.withId(1),
    userBuilder.withEmail('invalid') // ❌ Throws on build()
  )(userBuilder.empty())
);
```

---

**Ready to dive deeper?** Check out the [Immutable Builder Guide](./immutable-builder) next!
