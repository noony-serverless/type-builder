# Functional Programming Guide

> Build immutable objects with composable, type-safe functions

Welcome! This guide will show you how to use the functional programming (FP) features in `@noony-serverless/type-builder`. Whether you're a functional programming enthusiast or just curious about a different approach to building objects, you're in the right place.

---

## Table of Contents

### Getting Started

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Your First Functional Builder](#your-first-functional-builder)

### Core Concepts

- [Immutability: Why It Matters](#immutability-why-it-matters)
- [Understanding Builder State](#understanding-builder-state)
- [The Three-Step Pattern](#the-three-step-pattern)

### Essential Techniques

- [Pipe: Build Like a Pipeline](#pipe-build-like-a-pipeline)
- [Compose: Mathematical Style](#compose-mathematical-style)
- [Partial Application: Default Values Done Right](#partial-application-default-values-done-right)
- [Currying: One Argument at a Time](#currying-one-argument-at-a-time)

### Advanced Patterns

- [Higher-Order Functions](#higher-order-functions)
- [Transducers: High-Performance Transforms](#transducers-high-performance-transforms)
- [Conditional Building](#conditional-building)
- [Reusable Builder Templates](#reusable-builder-templates)

### API Reference

- [createImmutableBuilder](#createimmutablebuilder)
- [Composition Functions](#composition-functions)
- [Utility Functions](#utility-functions)

### Practical Guides

- [When to Use FP vs OOP](#when-to-use-fp-vs-oop)
- [Migration from OOP](#migration-from-oop)
- [Performance Considerations](#performance-considerations)
- [Real-World Examples](#real-world-examples)

---

## Quick Start

**TL;DR** — Just show me the code!

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

**That's it!** You've just built an object using functional programming. Let's dig deeper.

---

## Installation

```bash
npm install @noony-serverless/type-builder
```

**Peer dependencies:** If you want Zod validation, install it separately:

```bash
npm install zod
```

### Importing

The functional API lives in a separate import path to keep your bundle small:

```typescript
// Core functional utilities
import {
  createImmutableBuilder,
  pipe,
  compose,
  partial,
  curry2,
} from '@noony-serverless/type-builder';

// For Zod validation (optional)
import { z } from 'zod';
```

---

## Your First Functional Builder

Let's build something together! We'll create a user registration system.

### Step 1: Define Your Type

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  role: 'admin' | 'user' | 'guest';
  active: boolean;
}
```

### Step 2: Create the Builder

```typescript
const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email', 'age', 'role', 'active']);
```

**What just happened?** We created a factory that knows how to build `User` objects. The array tells it which properties exist.

### Step 3: Build Your First User

```typescript
// Start with empty state
const emptyState = userBuilder.empty();

// Add properties one at a time (each returns NEW state)
const withId = userBuilder.withId(1)(emptyState);
const withName = userBuilder.withName('Alice')(withId);
const withEmail = userBuilder.withEmail('alice@example.com')(withName);

// Finally, build the complete user
const user = userBuilder.build(withEmail);
```

**Notice:** Each `withX()` call returns a **new** object. Nothing is mutated. That's the FP way!

---

## Immutability: Why It Matters

### TL;DR

Immutability means once you create an object, you can't change it. You create new versions instead.

### Why Should You Care?

**🔒 Predictability**

```typescript
const state1 = userBuilder.empty();
const state2 = userBuilder.withId(1)(state1);

// state1 is STILL empty! It never changed
console.log(state1); // {}
console.log(state2); // { id: 1 }
```

**🐛 Easier Debugging**

```typescript
// In React or Redux, you can track state changes
const history = [state1, state2, state3, state4];
// Time-travel debugging? Easy!
```

**🧵 No Spooky Action at a Distance**

```typescript
// Mutable (OOP) - scary!
const builder = createBuilder<User>();
builder.withId(1);
someFunction(builder); // Did it change? Who knows!
builder.build(); // What's inside? 😰

// Immutable (FP) - safe!
const state = userBuilder.withId(1)(emptyState);
someFunction(state); // Can't change it!
const user = userBuilder.build(state); // Guaranteed to have id: 1 ✅
```

### Deep Dive: How It Works

Under the hood, each setter uses `Object.freeze()`:

```typescript
// Simplified implementation
function withName(name: string) {
  return (state: BuilderState<User>) => {
    return Object.freeze({ ...state, name });
  };
}
```

The spread operator (`{ ...state, name }`) creates a **new** object. `Object.freeze()` prevents accidental mutations.

---

## Understanding Builder State

### TL;DR

`BuilderState<T>` is just a readonly partial object: `Readonly<Partial<T>>`.

### What Is State?

State represents an object-in-progress:

```typescript
type BuilderState<User> = Readonly<Partial<User>>;

// Examples:
const emptyState: BuilderState<User> = {};
const partialState: BuilderState<User> = { id: 1, name: 'Alice' };
const fullState: BuilderState<User> = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  age: 30,
  role: 'admin',
  active: true,
};
```

### Why Partial?

Because you build objects **step by step**. State starts empty and grows:

```typescript
{}                                    // Step 0: Empty
{ id: 1 }                             // Step 1: Add id
{ id: 1, name: 'Alice' }              // Step 2: Add name
{ id: 1, name: 'Alice', email: '...' } // Step 3: Add email
```

### Why Readonly?

To enforce immutability at compile time:

```typescript
const state: BuilderState<User> = { id: 1 };
state.id = 2; // ❌ TypeScript error: Cannot assign to 'id' because it is a read-only property
```

---

## The Three-Step Pattern

Every functional builder follows this pattern:

### 1. Create Empty State

```typescript
const state = userBuilder.empty();
// Returns: {}
```

### 2. Apply Transformations

```typescript
const transformedState = userBuilder.withId(1)(state);
// Returns: { id: 1 }
```

### 3. Build the Final Object

```typescript
const user = userBuilder.build(transformedState);
// Returns: User (validated and complete)
```

**Pro Tip:** Steps 2 and 3 are where the magic happens. Let's make step 2 beautiful with `pipe`!

---

## Pipe: Build Like a Pipeline

### TL;DR

`pipe()` lets you chain transformations left-to-right (top-to-bottom in code).

```typescript
const user = userBuilder.build(
  pipe<User>(
    userBuilder.withId(1),
    userBuilder.withName('Alice'),
    userBuilder.withEmail('alice@example.com')
  )(userBuilder.empty())
);
```

### Why Pipe?

**Readable:** It reads like a story:

```
Start with empty state →
  Add id →
  Add name →
  Add email →
  Build final user
```

**Composable:** Extract and reuse pieces:

```typescript
const addBasicInfo = pipe<User>(
  userBuilder.withName('Alice'),
  userBuilder.withEmail('alice@example.com')
);

const user1 = userBuilder.build(
  pipe<User>(userBuilder.withId(1), addBasicInfo)(userBuilder.empty())
);
```

### How It Works

`pipe()` takes functions and chains them:

```typescript
pipe(f, g, h)(x) === h(g(f(x)));
```

Think of it like Unix pipes:

```bash
cat file.txt | grep "error" | wc -l
#     f     |      g       |   h
```

### Deep Dive: Type Safety

Pipe is fully typed:

```typescript
pipe<User>(
  userBuilder.withId(1), // (state: BuilderState<User>) => BuilderState<User>
  userBuilder.withName('Bob'), // (state: BuilderState<User>) => BuilderState<User>
  someOtherFunction // (state: BuilderState<User>) => BuilderState<User>
);
// Returns: (state: BuilderState<User>) => BuilderState<User>
```

TypeScript ensures every function in the chain:

1. Accepts `BuilderState<User>`
2. Returns `BuilderState<User>`

### Variations

**pipeWith** — Provide initial state upfront:

```typescript
const user = userBuilder.build(
  pipeWith<User>(
    userBuilder.empty(), // Start here
    userBuilder.withId(1),
    userBuilder.withName('Alice')
  )
);
```

**pipeAsync** — For async operations:

```typescript
const user = await userBuilder.build(
  await pipeAsync<User>(userBuilder.withId(1), async (state) => {
    const email = await fetchEmailFromAPI();
    return { ...state, email };
  })(userBuilder.empty())
);
```

**pipeIf** — Conditional application:

```typescript
const buildUser = pipeIf<User>(
  isAdmin, // Condition
  userBuilder.withRole('admin') // Applied only if true
);
```

**tap** — Debug or side effects without changing state:

```typescript
const user = userBuilder.build(
  pipe<User>(
    userBuilder.withId(1),
    tap((state) => console.log('Current state:', state)), // Logs but doesn't change
    userBuilder.withName('Alice')
  )(userBuilder.empty())
);
```

---

## Compose: Mathematical Style

### TL;DR

`compose()` chains functions **right-to-left** (like math: `f(g(x))`).

```typescript
const buildUser = compose<User>(
  userBuilder.withEmail('alice@example.com'), // Applied LAST
  userBuilder.withName('Alice'), // Applied second
  userBuilder.withId(1) // Applied FIRST
);

const user = userBuilder.build(buildUser(userBuilder.empty()));
```

### When to Use Compose

**Use compose if you:**

- Come from a math or Haskell background
- Think in terms of function composition (`f ∘ g`)
- Prefer working backwards from the result

**Use pipe if you:**

- Want to read code top-to-bottom (most people)
- Come from JavaScript/TypeScript
- Prefer Unix-style pipelines

### Example: Both Approaches

Same result, different order:

```typescript
// Pipe (left-to-right)
pipe<User>(
  userBuilder.withId(1), // Step 1
  userBuilder.withName('Bob'), // Step 2
  userBuilder.withEmail('bob@example.com') // Step 3
);

// Compose (right-to-left)
compose<User>(
  userBuilder.withEmail('bob@example.com'), // Step 3
  userBuilder.withName('Bob'), // Step 2
  userBuilder.withId(1) // Step 1
);
```

### Variations

**composeWith** — Provide initial state:

```typescript
const user = userBuilder.build(
  composeWith<User>(userBuilder.empty(), userBuilder.withId(1), userBuilder.withName('Alice'))
);
```

**composeAsync** — Async composition:

```typescript
const user = await userBuilder.build(
  await composeAsync<User>(userBuilder.withEmail('alice@example.com'), async (state) => ({
    ...state,
    verified: await checkEmail(state.email!),
  }))(userBuilder.empty())
);
```

---

## Partial Application: Default Values Done Right

### TL;DR

Pre-fill properties with default values using `partial()`.

```typescript
const defaultUser = partial<User>({
  role: 'user',
  active: true,
  age: 18,
});

const user = userBuilder.build(
  pipe<User>(
    defaultUser, // Apply defaults first
    userBuilder.withId(1),
    userBuilder.withName('Charlie')
  )(userBuilder.empty())
);

// Result: { id: 1, name: 'Charlie', role: 'user', active: true, age: 18 }
```

### Why Use Partial?

**DRY (Don't Repeat Yourself):**

```typescript
// Without partial (repetitive)
const admin1 = pipe(userBuilder.withRole('admin'), userBuilder.withActive(true));
const admin2 = pipe(userBuilder.withRole('admin'), userBuilder.withActive(true));
const admin3 = pipe(userBuilder.withRole('admin'), userBuilder.withActive(true));

// With partial (reusable)
const adminDefaults = partial<User>({ role: 'admin', active: true });
const admin1 = pipe(adminDefaults, userBuilder.withId(1));
const admin2 = pipe(adminDefaults, userBuilder.withId(2));
const admin3 = pipe(adminDefaults, userBuilder.withId(3));
```

### Variations

**partialDefaults** — Apply only if property doesn't exist:

```typescript
const defaults = partialDefaults<User>({ age: 18, active: true });

const state1 = defaults({ name: 'Alice' });
// { name: 'Alice', age: 18, active: true }

const state2 = defaults({ name: 'Bob', age: 30 });
// { name: 'Bob', age: 30, active: true } — age NOT overwritten
```

**partialOverwrite** — Always overwrite:

```typescript
const overwrite = partialOverwrite<User>({ active: false });

const state = overwrite({ id: 1, name: 'Alice', active: true });
// { id: 1, name: 'Alice', active: false } — active overwritten
```

**partialTemplates** — Multiple named templates:

```typescript
const templates = partialTemplates<User>({
  admin: { role: 'admin', active: true },
  guest: { role: 'guest', active: false },
});

const admin = userBuilder.build(
  pipe<User>(
    templates.admin,
    userBuilder.withId(1),
    userBuilder.withName('Admin')
  )(userBuilder.empty())
);
```

**partialIf** — Conditional defaults:

```typescript
const applyDefaults = partialIf<User>(
  (state) => !state.role, // Condition
  { role: 'user', active: true } // Applied if no role
);
```

### Deep Dive: Merging Strategy

Partial uses shallow merge:

```typescript
const defaults = partial<User>({ role: 'user', active: true });
const state = defaults({ id: 1, name: 'Alice', role: 'admin' });
// { id: 1, name: 'Alice', role: 'admin', active: true }
//                        ^^^^^^^^^ Keeps existing role
```

To force overwrite, use `partialOverwrite()`.

---

## Currying: One Argument at a Time

### TL;DR

Transform multi-argument functions into chains of single-argument functions.

```typescript
// Regular function
const add = (a: number, b: number) => a + b;
add(5, 3); // 8

// Curried version
const curriedAdd = curry2(add);
const add5 = curriedAdd(5);
add5(3); // 8
add5(10); // 15
```

### Why Curry?

**Partial Application:**

```typescript
const multiply = (a: number, b: number) => a * b;
const curriedMultiply = curry2(multiply);

const double = curriedMultiply(2);
const triple = curriedMultiply(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15
```

**Function Composition:**

```typescript
const setField = curry3(<T, K extends keyof T>(key: K, value: T[K], state: BuilderState<T>) => ({
  ...state,
  [key]: value,
}));

const setName = setField('name');
const setNameAlice = setName('Alice');

const state = setNameAlice({}); // { name: 'Alice' }
```

### Curry Helpers

**curry2** — For 2-argument functions:

```typescript
const add = (a: number, b: number) => a + b;
const curriedAdd = curry2(add);
curriedAdd(5)(3); // 8
```

**curry3** — For 3-argument functions:

```typescript
const sum3 = (a: number, b: number, c: number) => a + b + c;
const curriedSum = curry3(sum3);
curriedSum(1)(2)(3); // 6
```

**curry4** — For 4-argument functions:

```typescript
const sum4 = (a: number, b: number, c: number, d: number) => a + b + c + d;
const curriedSum = curry4(sum4);
curriedSum(1)(2)(3)(4); // 10
```

**autoCurry** — Auto-detects arity (uses function.length):

```typescript
const add = (a: number, b: number) => a + b;
const curriedAdd = autoCurry(add);
curriedAdd(5)(3); // 8
```

### Uncurrying

Go backwards — turn curried functions into regular functions:

```typescript
const curriedAdd = (a: number) => (b: number) => a + b;
const regularAdd = uncurry2(curriedAdd);
regularAdd(5, 3); // 8
```

### Flip

Reverse argument order:

```typescript
const divide = (a: number, b: number) => a / b;
const flippedDivide = flip(curry2(divide));

divide(10, 2); // 5
flippedDivide(2)(10); // 5 (arguments flipped)
```

### Deep Dive: Builder Currying

All builder setters are **auto-curried**:

```typescript
const userBuilder = createImmutableBuilder<User>(['id', 'name']);

// withId is curried: (value: number) => (state: BuilderState<User>) => BuilderState<User>
const setId1 = userBuilder.withId(1);
const state = setId1({}); // { id: 1 }
```

This is why they work with `pipe` and `compose`!

---

## Higher-Order Functions

### TL;DR

Functions that operate on other functions or return functions.

### Filter

Keep only certain properties:

```typescript
const onlyIdAndName = filterBuilder<User>((key) => ['id', 'name'].includes(key as string));

const fullState = { id: 1, name: 'Alice', email: 'alice@example.com', age: 30 };
const filtered = userBuilder.build(onlyIdAndName(fullState));
// { id: 1, name: 'Alice }
```

**Use case:** Sanitize data before sending to client.

### Map

Transform values:

```typescript
const doubleAge = mapBuilder<User, number>((key, value) => {
  if (key === 'age') return (value as number) * 2;
  return value as number;
});

const state = { id: 1, name: 'Alice', age: 30 };
const transformed = userBuilder.build(doubleAge(state));
// { id: 1, name: 'Alice', age: 60 }
```

**Use case:** Normalize or transform data.

### Fold (Reduce)

Accumulate values:

```typescript
const countFields = foldBuilder<User, number>(
  (acc, key, value) => acc + 1,
  0 // Initial value
);

const state = { id: 1, name: 'Alice', email: 'alice@example.com' };
const count = countFields(state); // 3
```

**Use case:** Calculate statistics from state.

### Pick

Select specific properties:

```typescript
const pickContact = pick<User>(['name', 'email']);
const state = { id: 1, name: 'Alice', email: 'alice@example.com', age: 30 };
const contact = pickContact(state);
// { name: 'Alice', email: 'alice@example.com' }
```

### Omit

Exclude properties:

```typescript
const omitSensitive = omit<User>(['email', 'age']);
const state = { id: 1, name: 'Alice', email: 'alice@example.com', age: 30 };
const safe = omitSensitive(state);
// { id: 1, name: 'Alice' }
```

### Partition

Split state into two groups:

```typescript
const [numbers, strings] = partition<User>((key, value) => typeof value === 'number', {
  id: 1,
  name: 'Alice',
  age: 30,
});
// numbers: { id: 1, age: 30 }
// strings: { name: 'Alice' }
```

### Compact

Remove undefined/null values:

```typescript
const clean = compact<User>({
  id: 1,
  name: 'Alice',
  email: undefined,
  age: null,
});
// { id: 1, name: 'Alice' }
```

---

## Transducers: High-Performance Transforms

### TL;DR

Transducers compose transformations into a single pass — no intermediate arrays.

```typescript
const transform = transduce<User>(
  filtering((key, value) => value !== undefined),
  mapping('age', (age: number) => age * 2),
  taking(5)
);

const result = transform(state);
```

### Why Transducers?

**Performance:** Single pass, no intermediate allocations:

```typescript
// Without transducers (3 passes, 2 intermediate arrays)
const result = state
  .filter(x => x !== undefined)  // Pass 1 → array 1
  .map(x => transform(x))        // Pass 2 → array 2
  .slice(0, 5);                  // Pass 3 → final array

// With transducers (1 pass, no intermediate arrays)
const transform = transduce(filtering(...), mapping(...), taking(5));
const result = transform(state); // Single pass!
```

### Basic Transducers

**filtering** — Keep matching items:

```typescript
const keepDefined = filtering((key, value) => value !== undefined);
```

**mapping** — Transform specific field:

```typescript
const doubleAge = mapping('age', (age: number) => age * 2);
```

**taking** — Take first N items:

```typescript
const first5 = taking(5);
```

**dropping** — Skip first N items:

```typescript
const skipFirst3 = dropping(3);
```

**deduplicating** — Remove duplicates:

```typescript
const unique = deduplicating();
```

### Composing Transducers

```typescript
const pipeline = transduce<User>(
  filtering((key, value) => value !== undefined), // Step 1: Remove undefined
  mapping('name', (name: string) => name.toUpperCase()), // Step 2: Uppercase names
  taking(10) // Step 3: Take first 10
);
```

**Order matters!** Transducers are applied left-to-right.

### Deep Dive: Performance

Benchmark results (1000 items):

```typescript
// map + filter + slice (traditional)
// 0.25ms, 3 array allocations

// transduce (composable)
// 0.08ms, 0 intermediate allocations
```

**When to use:** Large datasets, hot paths, memory-constrained environments.

---

## Conditional Building

### TL;DR

Build different objects based on conditions.

### Simple Conditionals

```typescript
const buildUser = (isAdmin: boolean) =>
  pipe<User>(
    userBuilder.withId(1),
    userBuilder.withName('Alice'),
    isAdmin ? userBuilder.withRole('admin') : userBuilder.withRole('user')
  );

const admin = userBuilder.build(buildUser(true)(userBuilder.empty()));
const user = userBuilder.build(buildUser(false)(userBuilder.empty()));
```

### Using pipeIf

```typescript
const buildUser = pipe<User>(
  userBuilder.withId(1),
  userBuilder.withName('Alice'),
  pipeIf(isAdmin, userBuilder.withRole('admin')),
  pipeIf(!isAdmin, userBuilder.withRole('user'))
);
```

### Complex Conditions

```typescript
const applyRole = (permissions: string[]) => {
  if (permissions.includes('admin')) {
    return pipe<User>(userBuilder.withRole('admin'), userBuilder.withActive(true));
  } else if (permissions.includes('moderator')) {
    return pipe<User>(userBuilder.withRole('user'), userBuilder.withActive(true));
  } else {
    return pipe<User>(userBuilder.withRole('guest'), userBuilder.withActive(false));
  }
};

const buildUser = pipe<User>(userBuilder.withId(1), applyRole(['moderator']));
```

---

## Reusable Builder Templates

### TL;DR

Create reusable patterns and compose them.

### Named Templates

```typescript
// Define templates
const adminTemplate = pipe<User>(
  userBuilder.withRole('admin'),
  userBuilder.withActive(true),
  userBuilder.withAge(30)
);

const guestTemplate = pipe<User>(
  userBuilder.withRole('guest'),
  userBuilder.withActive(false),
  userBuilder.withAge(18)
);

// Use templates
const admin = userBuilder.build(
  pipe<User>(
    adminTemplate,
    userBuilder.withId(1),
    userBuilder.withName('Admin')
  )(userBuilder.empty())
);
```

### Factory Functions

```typescript
const createUser = (id: number, name: string, template: Setter<User>) => {
  return pipe<User>(template, userBuilder.withId(id), userBuilder.withName(name));
};

const admin1 = userBuilder.build(createUser(1, 'Alice', adminTemplate)(userBuilder.empty()));

const guest1 = userBuilder.build(createUser(2, 'Bob', guestTemplate)(userBuilder.empty()));
```

### Template Composition

```typescript
const verifiedUser = pipe<User>(userBuilder.withActive(true), userBuilder.withRole('user'));

const premiumUser = pipe<User>(
  verifiedUser, // Compose templates!
  userBuilder.withAge(30)
);
```

---

## API Reference

### createImmutableBuilder

Create an immutable builder for type `T`.

**Signature:**

```typescript
function createImmutableBuilder<T>(
  keys: (keyof T & string)[],
  schema?: ZodSchema<T>
): TypedImmutableBuilder<T>;
```

**Parameters:**

- `keys` — Array of property names
- `schema` — (Optional) Zod schema for validation

**Returns:**
Builder with:

- `empty()` — Create empty state
- `build(state)` — Build final object (validates if schema provided)
- `withX(value)` — Curried setters for each property

**Example:**

```typescript
const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email']);
```

**With Zod:**

```typescript
const schema = z.object({
  id: z.number(),
  name: z.string().min(2),
  email: z.string().email(),
});

const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email'], schema);
```

---

### Composition Functions

#### pipe

Compose functions left-to-right (top-to-bottom).

**Signature:**

```typescript
function pipe<T>(...fns: Setter<T>[]): Setter<T>;
```

**Example:**

```typescript
const transform = pipe<User>(userBuilder.withId(1), userBuilder.withName('Alice'));
```

#### pipeWith

Pipe with initial state.

**Signature:**

```typescript
function pipeWith<T>(initial: BuilderState<T>, ...fns: Setter<T>[]): BuilderState<T>;
```

**Example:**

```typescript
const result = pipeWith<User>(
  userBuilder.empty(),
  userBuilder.withId(1),
  userBuilder.withName('Alice')
);
```

#### pipeAsync

Async pipe.

**Signature:**

```typescript
function pipeAsync<T>(...fns: Array<Setter<T> | AsyncSetter<T>>): AsyncSetter<T>;
```

**Example:**

```typescript
const transform = await pipeAsync<User>(userBuilder.withId(1), async (state) => ({
  ...state,
  email: await fetchEmail(),
}));
```

#### pipeIf

Conditional pipe.

**Signature:**

```typescript
function pipeIf<T>(condition: boolean, fn: Setter<T>): Setter<T>;
```

**Example:**

```typescript
const transform = pipeIf(isAdmin, userBuilder.withRole('admin'));
```

#### compose

Compose functions right-to-left.

**Signature:**

```typescript
function compose<T>(...fns: Setter<T>[]): Setter<T>;
```

**Example:**

```typescript
const transform = compose<User>(
  userBuilder.withEmail('alice@example.com'), // Last
  userBuilder.withName('Alice'), // Second
  userBuilder.withId(1) // First
);
```

---

### Utility Functions

#### partial

Apply default values.

**Signature:**

```typescript
function partial<T>(defaults: Partial<T>): Setter<T>;
```

#### curry2, curry3, curry4

Curry functions with 2, 3, or 4 arguments.

**Signature:**

```typescript
function curry2<A, B, R>(fn: (a: A, b: B) => R): (a: A) => (b: B) => R;
function curry3<A, B, C, R>(fn: (a: A, b: B, c: C) => R): (a: A) => (b: B) => (c: C) => R;
function curry4<A, B, C, D, R>(
  fn: (a: A, b: B, c: C, d: D) => R
): (a: A) => (b: B) => (c: C) => (d: D) => R;
```

#### filterBuilder

Filter state properties.

**Signature:**

```typescript
function filterBuilder<T>(predicate: Predicate<T>): Setter<T>;
```

#### mapBuilder

Transform state values.

**Signature:**

```typescript
function mapBuilder<T, U>(transformer: Transformer<T, U>): Setter<T>;
```

#### foldBuilder

Reduce state to a single value.

**Signature:**

```typescript
function foldBuilder<T, R>(reducer: Reducer<T, R>, initial: R): (state: BuilderState<T>) => R;
```

---

## When to Use FP vs OOP

### Use Functional Programming When...

✅ **You need guaranteed immutability**

- React/Redux state management
- Event sourcing systems
- Time-travel debugging

✅ **Building complex transformations**

- Data pipelines
- Multi-step validation
- Composable business logic

✅ **Working with pure functions**

- Easier testing
- Better parallelization
- Predictable behavior

✅ **Team prefers FP style**

- Haskell/Scala/Clojure background
- Functional-first codebase

### Use OOP Pattern When...

✅ **Performance is critical**

- Hot paths in your code
- Building thousands of objects/second
- Memory-constrained environments

✅ **Simple, straightforward objects**

- DTOs
- Configuration objects
- Request/response models

✅ **Team prefers OOP style**

- Java/C# background
- Object-oriented codebase

### Performance Comparison

| Pattern        | Ops/sec  | Memory | Code Style  |
| -------------- | -------- | ------ | ----------- |
| FP (Immutable) | ~150,000 | Higher | Declarative |
| OOP (Mutable)  | ~400,000 | Lower  | Imperative  |

**Bottom line:** FP is 2-3x slower but still **very fast** (150k ops/sec). Choose based on your needs, not dogma.

---

## Migration from OOP

### From createBuilder to createImmutableBuilder

**Before (OOP):**

```typescript
import { createBuilder } from '@noony-serverless/type-builder';

const createUser = createBuilder<User>();

const user = createUser().withId(1).withName('Alice').withEmail('alice@example.com').build();
```

**After (FP):**

```typescript
import { createImmutableBuilder, pipe } from '@noony-serverless/type-builder';

const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email']);

const user = userBuilder.build(
  pipe<User>(
    userBuilder.withId(1),
    userBuilder.withName('Alice'),
    userBuilder.withEmail('alice@example.com')
  )(userBuilder.empty())
);
```

### Step-by-Step Migration

**Step 1:** Install the package (no changes needed).

**Step 2:** Change import:

```typescript
// Old
import { createBuilder } from '@noony-serverless/type-builder';

// New
import { createImmutableBuilder, pipe } from '@noony-serverless/type-builder';
```

**Step 3:** Create builder with keys:

```typescript
// Old
const createUser = createBuilder<User>();

// New
const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email']);
```

**Step 4:** Use pipe instead of method chaining:

```typescript
// Old
createUser().withId(1).withName('Alice').build();

// New
userBuilder.build(
  pipe<User>(userBuilder.withId(1), userBuilder.withName('Alice'))(userBuilder.empty())
);
```

### Can I Use Both?

**Yes!** They're completely independent:

```typescript
// OOP for simple cases
const simpleUser = createBuilder<User>().withId(1).withName('Alice').build();

// FP for complex transformations
const complexUser = userBuilder.build(
  pipe<User>(adminTemplate, normalizeEmail, validateAge, userBuilder.withId(2))(userBuilder.empty())
);
```

---

## Performance Considerations

### What's the Cost?

**Immutability Tax:** ~2-3x slower than mutable operations.

```typescript
// Mutable (fast): ~400,000 ops/sec
const user = { id: 1 };
user.name = 'Alice';
user.email = 'alice@example.com';

// Immutable (slower): ~150,000 ops/sec
let state = { id: 1 };
state = { ...state, name: 'Alice' };
state = { ...state, email: 'alice@example.com' };
```

**But 150k ops/sec is still blazing fast!** That's 6.6 microseconds per operation.

### When to Optimize

**Don't optimize prematurely!** Only optimize if:

1. Profiling shows this is a bottleneck
2. You're building 10,000+ objects/second
3. You're in a memory-constrained environment

### Optimization Tips

**Tip 1: Batch operations**

```typescript
// Slow: Multiple spreads
let state = {};
state = { ...state, id: 1 };
state = { ...state, name: 'Alice' };
state = { ...state, email: 'alice@example.com' };

// Fast: Single spread
const state = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
};
```

**Tip 2: Use partial for defaults**

```typescript
// Slow: Spread defaults every time
const createUser = () => ({ ...defaults, ...specificProps });

// Fast: Use partial
const applyDefaults = partial(defaults);
```

**Tip 3: Avoid deep cloning**

```typescript
// The library uses shallow copy (fast)
{ ...state, name: 'Alice' } // ✅

// Don't do deep clone unless necessary
structuredClone(state) // ❌ (much slower)
```

---

## Real-World Examples

### Example 1: User Registration Flow

```typescript
import { createImmutableBuilder, pipe, partial } from '@noony-serverless/type-builder';
import { z } from 'zod';

// Schema
const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['admin', 'user', 'guest']),
  active: z.boolean(),
  createdAt: z.date(),
});

type User = z.infer<typeof userSchema>;

// Builder
const userBuilder = createImmutableBuilder<User>(
  ['id', 'email', 'name', 'role', 'active', 'createdAt'],
  userSchema
);

// Defaults
const newUserDefaults = partial<User>({
  role: 'user',
  active: false,
  createdAt: new Date(),
});

// Email normalization
const normalizeEmail = (state: BuilderState<User>): BuilderState<User> => {
  if (state.email) {
    return Object.freeze({
      ...state,
      email: state.email.toLowerCase().trim(),
    });
  }
  return state;
};

// Registration
export const registerUser = (email: string, name: string): User => {
  return userBuilder.build(
    pipe<User>(
      newUserDefaults,
      userBuilder.withEmail(email),
      userBuilder.withName(name),
      userBuilder.withId(generateId()),
      normalizeEmail
    )(userBuilder.empty())
  );
};

// Usage
const user = registerUser('ALICE@EXAMPLE.COM  ', 'Alice');
// {
//   id: 12345,
//   email: 'alice@example.com',
//   name: 'Alice',
//   role: 'user',
//   active: false,
//   createdAt: Date
// }
```

### Example 2: E-Commerce Product Builder

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  category: string;
  inStock: boolean;
  discount?: number;
  featured?: boolean;
}

const productBuilder = createImmutableBuilder<Product>([
  'id',
  'name',
  'price',
  'currency',
  'category',
  'inStock',
  'discount',
  'featured',
]);

// Templates
const baseProduct = partial<Product>({
  currency: 'USD',
  inStock: true,
  featured: false,
});

const featuredProduct = pipe<Product>(baseProduct, productBuilder.withFeatured(true));

// Apply discount
const applyDiscount =
  (percent: number) =>
  (state: BuilderState<Product>): BuilderState<Product> => {
    if (state.price) {
      return Object.freeze({
        ...state,
        discount: percent,
        price: state.price * (1 - percent / 100),
      });
    }
    return state;
  };

// Build product
const createProduct = (name: string, price: number, category: string, isFeatured = false) => {
  const template = isFeatured ? featuredProduct : baseProduct;

  return productBuilder.build(
    pipe<Product>(
      template,
      productBuilder.withId(generateId()),
      productBuilder.withName(name),
      productBuilder.withPrice(price),
      productBuilder.withCategory(category)
    )(productBuilder.empty())
  );
};

// With discount
const createSaleProduct = (name: string, price: number, category: string, discount: number) => {
  return productBuilder.build(
    pipe<Product>(
      baseProduct,
      productBuilder.withId(generateId()),
      productBuilder.withName(name),
      productBuilder.withPrice(price),
      productBuilder.withCategory(category),
      applyDiscount(discount)
    )(productBuilder.empty())
  );
};

// Usage
const laptop = createProduct('Gaming Laptop', 1299.99, 'Electronics', true);
const saleLaptop = createSaleProduct('Gaming Laptop', 1299.99, 'Electronics', 20);
// Price: 1039.99 (20% off)
```

### Example 3: API Response Transformation

```typescript
interface APIUser {
  user_id: number;
  user_name: string;
  user_email: string;
  is_active: boolean;
}

interface AppUser {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

const appUserBuilder = createImmutableBuilder<AppUser>(['id', 'name', 'email', 'active']);

// Transform API response to app format
const transformAPIUser = (apiUser: APIUser): AppUser => {
  return appUserBuilder.build(
    pipe<AppUser>(
      appUserBuilder.withId(apiUser.user_id),
      appUserBuilder.withName(apiUser.user_name),
      appUserBuilder.withEmail(apiUser.user_email),
      appUserBuilder.withActive(apiUser.is_active)
    )(appUserBuilder.empty())
  );
};

// Batch transform
const transformUsers = (apiUsers: APIUser[]): AppUser[] => {
  return apiUsers.map(transformAPIUser);
};
```

---

## FAQ

### Why use FP builders instead of plain objects?

**Type safety, composition, and validation.**

```typescript
// Plain object (no validation, no composition)
const user = { id: 1, name: 'Alice', email: 'invalid-email' };

// FP builder (type-safe, composable, validated)
const user = userBuilder.build(
  pipe(
    defaultUser,
    userBuilder.withId(1),
    userBuilder.withName('Alice'),
    userBuilder.withEmail('invalid-email') // ❌ Zod validation catches this
  )(userBuilder.empty())
);
```

### Is this library framework-agnostic?

**Yes!** Works with React, Vue, Angular, Node.js, Deno, Bun, or plain TypeScript.

### Can I mix FP and OOP patterns?

**Absolutely!** Use what makes sense for each use case:

```typescript
// OOP for simple objects
const config = createBuilder<Config>().withPort(3000).build();

// FP for complex transformations
const user = userBuilder.build(
  pipe(adminTemplate, normalizeEmail, validateAge)(userBuilder.empty())
);
```

### What's the bundle size impact?

- **Core library:** ~3KB gzipped
- **Functional module:** +2KB gzipped
- **Tree-shakeable:** Only imports what you use

### Do I need Zod?

**No!** Zod is optional. Use it only if you need runtime validation:

```typescript
// Without Zod (no validation)
const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email']);

// With Zod (validated)
const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email'], userSchema);
```

---

## Next Steps

**🎓 Learn More:**

- [Monads Guide](./MONADS.md) — Error handling with Maybe and Either
- [Optics Guide](./OPTICS.md) — Lenses and Prisms for nested updates
- [Full API Reference](./API.md) — Complete API documentation

**💻 See Examples:**

- [functional-usage.ts](../src/examples/functional-usage.ts) — Core FP patterns
- [functional-monads.ts](../src/examples/functional-monads.ts) — Maybe and Either
- [functional-optics.ts](../src/examples/functional-optics.ts) — Lenses and Prisms

**🚀 Try It:**

```bash
npm install @noony-serverless/type-builder
```

---

**Built with ❤️ by the UltraFastBuilder team**

Have questions? [Open an issue](https://github.com/noony-serverless/type-builder/issues)
