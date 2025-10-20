---
sidebar_position: 8
---

# API Reference

Complete reference for all functional programming utilities in UltraFastBuilder.

## Core Functions

### createImmutableBuilder

Create an immutable builder for type `T`.

**Signature:**
```typescript
function createImmutableBuilder<T>(
  keys: (keyof T & string)[],
  schema?: ZodSchema<T>
): TypedImmutableBuilder<T>
```

**Parameters:**
- `keys: (keyof T & string)[]` - Array of property names
- `schema?: ZodSchema<T>` - Optional Zod schema for validation

**Returns:** `TypedImmutableBuilder<T>` with:
- `empty(): BuilderState<T>` - Create empty state
- `build(state: BuilderState<T>): T` - Build final object (validates if schema provided)
- `withX(value): Setter<T>` - Curried setters for each property in `keys`

**Example:**
```typescript
const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email']);

// With Zod validation
const schema = z.object({
  id: z.number(),
  name: z.string().min(2),
  email: z.string().email()
});
const validatedBuilder = createImmutableBuilder<User>(
  ['id', 'name', 'email'],
  schema
);
```

---

## Composition Functions

### pipe

Compose functions left-to-right (top-to-bottom).

**Signature:**
```typescript
function pipe<T>(...fns: Setter<T>[]): Setter<T>
```

**Example:**
```typescript
const transform = pipe<User>(
  userBuilder.withId(1),
  userBuilder.withName('Alice'),
  userBuilder.withEmail('alice@example.com')
);

const user = userBuilder.build(transform(userBuilder.empty()));
```

### pipeWith

Pipe with initial state provided.

**Signature:**
```typescript
function pipeWith<T>(
  initial: BuilderState<T>,
  ...fns: Setter<T>[]
): BuilderState<T>
```

**Example:**
```typescript
const user = userBuilder.build(
  pipeWith<User>(
    userBuilder.empty(),
    userBuilder.withId(1),
    userBuilder.withName('Alice')
  )
);
```

### pipeAsync

Async pipe supporting Promise-returning functions.

**Signature:**
```typescript
function pipeAsync<T>(
  ...fns: Array<Setter<T> | AsyncSetter<T>>
): AsyncSetter<T>
```

**Example:**
```typescript
const user = await userBuilder.build(
  await pipeAsync<User>(
    userBuilder.withId(1),
    async (state) => ({
      ...state,
      email: await fetchEmailFromAPI(state.id!)
    })
  )(userBuilder.empty())
);
```

### pipeIf

Conditional pipe - applies transformation only if condition is true.

**Signature:**
```typescript
function pipeIf<T>(condition: boolean, fn: Setter<T>): Setter<T>
```

**Example:**
```typescript
const user = userBuilder.build(
  pipe<User>(
    userBuilder.withId(1),
    pipeIf(isAdmin, userBuilder.withRole('admin')),
    pipeIf(!isAdmin, userBuilder.withRole('user'))
  )(userBuilder.empty())
);
```

### pipeWhen

Conditional pipe based on state predicate.

**Signature:**
```typescript
function pipeWhen<T>(
  predicate: (state: BuilderState<T>) => boolean,
  fn: Setter<T>
): Setter<T>
```

**Example:**
```typescript
const user = userBuilder.build(
  pipe<User>(
    userBuilder.withAge(16),
    pipeWhen(
      (state) => state.age !== undefined && state.age < 18,
      (state) => ({ ...state, age: 18 })
    )
  )(userBuilder.empty())
);
```

### compose

Compose functions right-to-left (mathematical composition).

**Signature:**
```typescript
function compose<T>(...fns: Setter<T>[]): Setter<T>
```

**Example:**
```typescript
const transform = compose<User>(
  userBuilder.withEmail('alice@example.com'), // Applied LAST
  userBuilder.withName('Alice'),              // Applied second
  userBuilder.withId(1)                       // Applied FIRST
);
```

### composeWith

Compose with initial state provided.

**Signature:**
```typescript
function composeWith<T>(
  initial: BuilderState<T>,
  ...fns: Setter<T>[]
): BuilderState<T>
```

### composeAsync

Async compose supporting Promise-returning functions.

**Signature:**
```typescript
function composeAsync<T>(
  ...fns: Array<Setter<T> | AsyncSetter<T>>
): AsyncSetter<T>
```

### tap

Execute side effects without changing state (for debugging/logging).

**Signature:**
```typescript
function tap<T>(fn: (state: BuilderState<T>) => void): Setter<T>
```

**Example:**
```typescript
const user = userBuilder.build(
  pipe<User>(
    userBuilder.withId(1),
    tap((state) => console.log('After withId:', state)),
    userBuilder.withName('Alice'),
    tap((state) => console.log('After withName:', state))
  )(userBuilder.empty())
);
```

---

## Partial Application

### partial

Apply default values that merge with existing state.

**Signature:**
```typescript
function partial<T>(defaults: Partial<T>): Setter<T>
```

**Example:**
```typescript
const defaults = partial<User>({
  role: 'user',
  active: true
});

const user = userBuilder.build(
  pipe<User>(
    defaults,
    userBuilder.withId(1),
    userBuilder.withName('Alice')
  )(userBuilder.empty())
);
```

### partialDefaults

Apply defaults only if property doesn't exist (non-overwriting).

**Signature:**
```typescript
function partialDefaults<T>(defaults: Partial<T>): Setter<T>
```

**Example:**
```typescript
const defaults = partialDefaults<User>({ age: 18, active: true });
const state = defaults({ name: 'Alice', age: 30 });
// { name: 'Alice', age: 30, active: true } ← age NOT overwritten
```

### partialOverwrite

Apply values always, even if property exists (overwriting).

**Signature:**
```typescript
function partialOverwrite<T>(values: Partial<T>): Setter<T>
```

**Example:**
```typescript
const forceInactive = partialOverwrite<User>({ active: false });
const state = forceInactive({ id: 1, name: 'Alice', active: true });
// { id: 1, name: 'Alice', active: false } ← active overwritten
```

### partialTemplates

Create multiple named templates.

**Signature:**
```typescript
function partialTemplates<T>(
  templates: Record<string, Partial<T>>
): Record<string, Setter<T>>
```

**Example:**
```typescript
const templates = partialTemplates<User>({
  admin: { role: 'admin', active: true },
  guest: { role: 'guest', active: false }
});

const admin = userBuilder.build(
  pipe<User>(templates.admin, userBuilder.withId(1))(userBuilder.empty())
);
```

### partialIf

Conditional partial application.

**Signature:**
```typescript
function partialIf<T>(
  condition: (state: BuilderState<T>) => boolean,
  defaults: Partial<T>
): Setter<T>
```

**Example:**
```typescript
const applyDefaults = partialIf<User>(
  (state) => !state.role,
  { role: 'user', active: true }
);
```

---

## Currying

### curry2

Curry a 2-argument function.

**Signature:**
```typescript
function curry2<A, B, R>(
  fn: (a: A, b: B) => R
): (a: A) => (b: B) => R
```

**Example:**
```typescript
const add = (a: number, b: number) => a + b;
const curriedAdd = curry2(add);
const add5 = curriedAdd(5);
add5(3);  // 8
```

### curry3

Curry a 3-argument function.

**Signature:**
```typescript
function curry3<A, B, C, R>(
  fn: (a: A, b: B, c: C) => R
): (a: A) => (b: B) => (c: C) => R
```

### curry4

Curry a 4-argument function.

**Signature:**
```typescript
function curry4<A, B, C, D, R>(
  fn: (a: A, b: B, c: C, d: D) => R
): (a: A) => (b: B) => (c: C) => (d: D) => R
```

### autoCurry

Auto-curry based on function arity (uses `function.length`).

**Signature:**
```typescript
function autoCurry<T extends (...args: any[]) => any>(fn: T): Curried<T>
```

**Note:** Doesn't work with rest parameters or default arguments.

### uncurry2

Convert curried function back to regular 2-argument function.

**Signature:**
```typescript
function uncurry2<A, B, R>(
  fn: (a: A) => (b: B) => R
): (a: A, b: B) => R
```

### flip

Reverse argument order of curried function.

**Signature:**
```typescript
function flip<A, B, R>(
  fn: (a: A) => (b: B) => R
): (b: B) => (a: A) => R
```

---

## Higher-Order Functions

### filterBuilder

Filter state properties based on predicate.

**Signature:**
```typescript
function filterBuilder<T>(
  predicate: (key: keyof T, value: T[keyof T]) => boolean
): Setter<T>
```

**Example:**
```typescript
const removePasswords = filterBuilder<User>(
  (key) => key !== 'password'
);
```

### mapBuilder

Transform state values.

**Signature:**
```typescript
function mapBuilder<T, U>(
  transformer: (key: keyof T, value: T[keyof T]) => U
): Setter<T>
```

**Example:**
```typescript
const doubleNumbers = mapBuilder<User, number>((key, value) => {
  if (typeof value === 'number') {
    return (value as number) * 2;
  }
  return value as number;
});
```

### foldBuilder

Reduce state to a single value.

**Signature:**
```typescript
function foldBuilder<T, R>(
  reducer: (acc: R, key: keyof T, value: T[keyof T]) => R,
  initial: R
): (state: BuilderState<T>) => R
```

**Example:**
```typescript
const countFields = foldBuilder<User, number>(
  (acc, key, value) => acc + 1,
  0
);
```

### pick

Select specific properties.

**Signature:**
```typescript
function pick<T>(keys: (keyof T)[]): Setter<T>
```

**Example:**
```typescript
const publicFields = pick<User>(['id', 'name', 'email']);
```

### omit

Exclude specific properties.

**Signature:**
```typescript
function omit<T>(keys: (keyof T)[]): Setter<T>
```

**Example:**
```typescript
const removeSensitive = omit<User>(['password', 'ssn']);
```

### partition

Split state into two groups based on predicate.

**Signature:**
```typescript
function partition<T>(
  predicate: (key: keyof T, value: T[keyof T]) => boolean,
  state: BuilderState<T>
): [BuilderState<T>, BuilderState<T>]
```

**Example:**
```typescript
const [numbers, strings] = partition<User>(
  (key, value) => typeof value === 'number',
  userData
);
```

### compact

Remove null and undefined values.

**Signature:**
```typescript
function compact<T>(state: BuilderState<T>): BuilderState<T>
```

**Example:**
```typescript
const clean = compact({ id: 1, name: 'Alice', email: undefined });
// { id: 1, name: 'Alice' }
```

---

## Transducers

### transduce

Compose transducers into a single transformation.

**Signature:**
```typescript
function transduce<T>(
  ...transducers: Transducer<T>[]
): (state: BuilderState<T>) => BuilderState<T>
```

**Example:**
```typescript
const transform = transduce<User>(
  filtering((key, value) => value !== undefined),
  mapping('age', (age: number) => age * 2),
  taking(10)
);
```

### filtering

Transducer that filters values.

**Signature:**
```typescript
function filtering<T>(
  predicate: (key: keyof T, value: T[keyof T]) => boolean
): Transducer<T>
```

### mapping

Transducer that maps values for a specific key.

**Signature:**
```typescript
function mapping<T, K extends keyof T>(
  key: K,
  transformer: (value: T[K]) => T[K]
): Transducer<T>
```

### taking

Transducer that takes first N items.

**Signature:**
```typescript
function taking(n: number): Transducer<any>
```

### dropping

Transducer that skips first N items.

**Signature:**
```typescript
function dropping(n: number): Transducer<any>
```

### deduplicating

Transducer that removes duplicate values.

**Signature:**
```typescript
function deduplicating(): Transducer<any>
```

---

## Type Definitions

### BuilderState

Readonly partial state representing object-in-progress.

```typescript
type BuilderState<T> = Readonly<Partial<T>>
```

### Setter

Function that transforms builder state.

```typescript
type Setter<T> = (state: BuilderState<T>) => BuilderState<T>
```

### AsyncSetter

Async function that transforms builder state.

```typescript
type AsyncSetter<T> = (state: BuilderState<T>) => Promise<BuilderState<T>>
```

### TypedImmutableBuilder

The builder interface returned by `createImmutableBuilder`.

```typescript
interface TypedImmutableBuilder<T> {
  empty(): BuilderState<T>;
  build(state: BuilderState<T>): T;
  // Plus withX methods for each key
}
```

### Transducer

A composable transformation function.

```typescript
type Transducer<T> = (state: BuilderState<T>) => BuilderState<T>
```

---

## Import Paths

All functional utilities are available from the `/functional` export:

```typescript
// Core
import {
  createImmutableBuilder,
  pipe,
  compose,
  partial
} from '@noony-serverless/type-builder';

// Composition
import {
  pipeWith,
  pipeAsync,
  pipeIf,
  pipeWhen,
  composeWith,
  composeAsync,
  tap
} from '@noony-serverless/type-builder';

// Partial
import {
  partialDefaults,
  partialOverwrite,
  partialTemplates,
  partialIf
} from '@noony-serverless/type-builder';

// Currying
import {
  curry2,
  curry3,
  curry4,
  autoCurry,
  uncurry2,
  flip
} from '@noony-serverless/type-builder';

// Higher-order
import {
  filterBuilder,
  mapBuilder,
  foldBuilder,
  pick,
  omit,
  partition,
  compact
} from '@noony-serverless/type-builder';

// Transducers
import {
  transduce,
  filtering,
  mapping,
  taking,
  dropping,
  deduplicating
} from '@noony-serverless/type-builder';
```

---

## Summary

### Most Commonly Used

```typescript
// Essential (80% of use cases)
createImmutableBuilder  // Create builder
pipe                    // Compose transformations
partial                 // Apply defaults

// Common (15% of use cases)
pipeIf                  // Conditional
tap                     // Debug
pick / omit             // Property selection

// Advanced (5% of use cases)
transduce               // Performance optimization
curry2/3/4              // Function transformation
filterBuilder/mapBuilder// Custom transformations
```

---

## Next Steps

- 📚 [Real-World Examples](./real-world-examples) - Practical use cases
- 🎯 [Quick Start](./quick-start) - Get started quickly
- 🔄 [Pipe and Compose](./pipe-compose) - Composition patterns
