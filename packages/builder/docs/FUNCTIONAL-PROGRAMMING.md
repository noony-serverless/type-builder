# Functional Programming Guide

The `@noony-serverless/type-builder` library now includes comprehensive functional programming (FP) utilities alongside the existing OOP builder pattern. This guide demonstrates how to use the functional features.

## Installation & Imports

```typescript
// OOP Builder (existing)
import { createBuilder } from '@noony-serverless/type-builder';

// Functional Programming
import {
  createImmutableBuilder,
  pipe,
  compose,
  curry2,
  partial,
} from '@noony-serverless/type-builder';

// Monads
import { Maybe, Either } from '@noony-serverless/type-builder/monads';

// Optics (Lenses & Prisms)
import { lens, prop, prism } from '@noony-serverless/type-builder/optics';
```

## Table of Contents

1. [Immutable Builder](#immutable-builder)
2. [Function Composition](#function-composition)
3. [Currying & Partial Application](#currying--partial-application)
4. [Higher-Order Functions](#higher-order-functions)
5. [Transducers](#transducers)
6. [Why Functional Programming?](#why-functional-programming)
7. [Migration Guide](#migration-guide)

---

## Immutable Builder

The immutable builder creates new state objects instead of mutating existing ones.

### Basic Usage

```typescript
import { createImmutableBuilder } from '@noony-serverless/type-builder';

interface User {
  id: number;
  name: string;
  email: string;
}

// Create builder
const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email']);

// Each step returns a NEW state (immutable)
const state1 = userBuilder.empty();
const state2 = userBuilder.withId(1)(state1);
const state3 = userBuilder.withName('Alice')(state2);
const state4 = userBuilder.withEmail('alice@example.com')(state3);

const user = userBuilder.build(state4);

// state1 !== state2 !== state3 !== state4 (all different objects)
```

### With Validation

```typescript
import { z } from 'zod';

const userSchema = z.object({
  id: z.number(),
  name: z.string().min(2),
  email: z.string().email(),
});

const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email'], userSchema);

// build() will validate with Zod
const user = userBuilder.build(state);
```

---

## Function Composition

Combine multiple operations into a single function.

### Pipe (Left-to-Right)

```typescript
import { pipe } from '@noony-serverless/type-builder';

const buildUser = pipe<User>(
  userBuilder.withId(1), // Step 1
  userBuilder.withName('Alice'), // Step 2
  userBuilder.withEmail('alice@example.com') // Step 3
);

const user = userBuilder.build(buildUser(userBuilder.empty()));
```

**Reads naturally**: Start with empty state → apply step 1 → apply step 2 → apply step 3

### Compose (Right-to-Left)

```typescript
import { compose } from '@noony-serverless/type-builder';

const buildUser = compose<User>(
  userBuilder.withEmail('alice@example.com'), // Applied LAST
  userBuilder.withName('Alice'), // Applied second
  userBuilder.withId(1) // Applied FIRST
);

const user = userBuilder.build(buildUser(userBuilder.empty()));
```

**Mathematical composition**: `compose(f, g, h)(x) === f(g(h(x)))`

### When to Use Each

- **Use `pipe`** when you want to read code top-to-bottom (more intuitive)
- **Use `compose`** when thinking in mathematical terms or composing functions

---

## Currying & Partial Application

### Currying

Transform multi-argument functions into chains of single-argument functions.

```typescript
import { curry2, curry3 } from '@noony-serverless/type-builder';

// Regular function
function add(a: number, b: number): number {
  return a + b;
}

// Curried version
const curriedAdd = curry2(add);
const add5 = curriedAdd(5);

console.log(add5(3)); // 8
console.log(add5(10)); // 15
```

### Partial Application

Pre-fill some arguments of a function.

```typescript
import { partial } from '@noony-serverless/type-builder';

// Create template with defaults
const defaultUser = partial<User>({
  role: 'user',
  active: true,
  age: 18,
});

const buildUser = pipe<User>(
  defaultUser, // Apply defaults
  userBuilder.withId(1),
  userBuilder.withName('Charlie')
);

const charlie = userBuilder.build(buildUser(userBuilder.empty()));
// { id: 1, name: 'Charlie', role: 'user', active: true, age: 18 }
```

---

## Higher-Order Functions

Functions that operate on other functions.

### Filter

```typescript
import { filterBuilder } from '@noony-serverless/type-builder';

const onlyIdAndName = filterBuilder<User>((key) => ['id', 'name'].includes(key as string));

const state = buildFullUser(userBuilder.empty());
const filtered = userBuilder.build(onlyIdAndName(state));
// Only has id and name properties
```

### Map

```typescript
import { mapBuilder } from '@noony-serverless/type-builder';

const doubleAge = mapBuilder<User, number>((key, value) => {
  if (key === 'age') {
    return (value as number) * 2;
  }
  return value as number;
});
```

### Fold (Reduce)

```typescript
import { foldBuilder } from '@noony-serverless/type-builder';

const countFields = foldBuilder<User, number>((acc, key, value) => acc + 1, 0);

const count = countFields(state); // Number of fields
```

---

## Transducers

Composable, efficient transformations that avoid intermediate allocations.

```typescript
import { transduce, mapping, filtering, taking } from '@noony-serverless/type-builder';

// Compose transformations
const transform = transduce<User>(
  mapping('name', (name: string) => name.toUpperCase()),
  filtering((key, value) => value !== undefined),
  taking(5)
);

const transformed = transform(state);
```

**Benefits**:

- Single pass through data
- No intermediate arrays
- Composable transformations
- Better performance for large datasets

---

## Why Functional Programming?

### Advantages

1. **Immutability**: No accidental mutations, easier debugging
2. **Composability**: Build complex operations from simple functions
3. **Testability**: Pure functions are easy to test
4. **Predictability**: Same input always produces same output
5. **Type Safety**: Full TypeScript inference support

### Trade-offs

1. **Performance**: 2-3x slower than mutable operations (still very fast)
2. **Memory**: Creates more objects (mitigated by modern GC)
3. **Learning Curve**: Requires FP thinking

### When to Use FP vs OOP

**Use Functional Approach When**:

- Building complex state transformations
- Need guaranteed immutability
- Working with React/Redux/state management
- Composing reusable transformations

**Use OOP Approach When**:

- Need maximum performance
- Building simple objects
- Memory is constrained
- Team is familiar with OOP patterns

---

## Migration Guide

### From OOP to Functional

**OOP Style**:

```typescript
import { createBuilder } from '@noony-serverless/type-builder';

const user = createBuilder<User>()
  .withId(1)
  .withName('Alice')
  .withEmail('alice@example.com')
  .build();
```

**Functional Style**:

```typescript
import { createImmutableBuilder, pipe } from '@noony-serverless/type-builder';

const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email']);

const buildUser = pipe<User>(
  userBuilder.withId(1),
  userBuilder.withName('Alice'),
  userBuilder.withEmail('alice@example.com')
);

const user = userBuilder.build(buildUser(userBuilder.empty()));
```

**Or using compose**:

```typescript
import { composeWith } from '@noony-serverless/type-builder';

const user = userBuilder.build(
  composeWith<User>(
    {},
    userBuilder.withId(1),
    userBuilder.withName('Alice'),
    userBuilder.withEmail('alice@example.com')
  )
);
```

---

## Advanced Patterns

### Reusable Builders

```typescript
// Define reusable patterns
const defaultAdmin = pipe<User>(userBuilder.withRole('admin'), userBuilder.withActive(true));

const defaultGuest = pipe<User>(userBuilder.withRole('guest'), userBuilder.withActive(false));

// Use patterns
const admin = userBuilder.build(
  pipe<User>(
    defaultAdmin,
    userBuilder.withId(1),
    userBuilder.withName('Admin')
  )(userBuilder.empty())
);
```

### Conditional Building

```typescript
const buildUser = (isAdmin: boolean) =>
  pipe<User>(
    userBuilder.withId(1),
    userBuilder.withName('User'),
    isAdmin ? userBuilder.withRole('admin') : userBuilder.withRole('user')
  );
```

### Custom Transformations

```typescript
// Normalize email
const normalizeEmail = (state: BuilderState<User>) => {
  if (state.email) {
    return Object.freeze({
      ...state,
      email: state.email.toLowerCase().trim(),
    });
  }
  return state;
};

// Use in pipeline
const buildUser = pipe<User>(
  userBuilder.withEmail('  ALICE@EXAMPLE.COM  '),
  normalizeEmail // Custom transformation
);
```

---

## API Reference

See the [complete API documentation](./API.md) for detailed information about all functions and types.

## Examples

Check the [examples directory](../src/examples/) for more comprehensive examples:

- [functional-usage.ts](../src/examples/functional-usage.ts) - Core FP patterns
- [functional-monads.ts](../src/examples/functional-monads.ts) - Maybe and Either
- [functional-optics.ts](../src/examples/functional-optics.ts) - Lenses and Prisms

## Next Steps

- Learn about [Monads](./MONADS.md) for error handling
- Learn about [Optics](./OPTICS.md) for nested updates
- Check out [Performance Tips](./PERFORMANCE.md)
