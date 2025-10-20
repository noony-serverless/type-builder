---
sidebar_position: 2
---

# Immutable Builder

Deep dive into immutable state and how the functional builder works under the hood.

## What Is Immutability?

**Immutability** means once you create an object, you can't change it. To "change" it, you create a new object with the modifications.

### Mutable vs Immutable

```typescript
// Mutable (changes the original)
const user = { name: 'Alice' };
user.name = 'Bob'; // Original object is modified
console.log(user); // { name: 'Bob' }

// Immutable (creates new object)
const user1 = { name: 'Alice' };
const user2 = { ...user1, name: 'Bob' }; // New object
console.log(user1); // { name: 'Alice' } - unchanged!
console.log(user2); // { name: 'Bob' }
```

---

## Creating an Immutable Builder

### Syntax

```typescript
const builder = createImmutableBuilder<T>(keys, schema?);
```

**Parameters:**

- `keys` - Array of property names (required)
- `schema` - Optional Zod schema for validation

### Basic Example

```typescript
import { createImmutableBuilder } from '@noony-serverless/type-builder';

interface User {
  id: number;
  name: string;
  email: string;
}

const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email']);
```

### With Zod Validation

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(2),
  email: z.string().email(),
});

const userBuilder = createImmutableBuilder<User>(
  ['id', 'name', 'email'],
  UserSchema // Validates on build()
);
```

---

## Builder API

Every immutable builder has three core methods:

### 1. `empty()` - Create Empty State

Returns an empty builder state (empty object).

```typescript
const state = userBuilder.empty();
// Returns: {}
```

### 2. `withX(value)` - Curried Setters

For each property, you get a `withX` method that's **curried** (takes value, returns function).

```typescript
// withId is curried: (value: number) => (state) => newState
const setId1 = userBuilder.withId(1); // Returns a function

const state1 = userBuilder.empty();
const state2 = setId1(state1); // Apply the function

console.log(state1); // {} - unchanged
console.log(state2); // { id: 1 }
```

**All-in-one:**

```typescript
const state = userBuilder.withId(1)(userBuilder.empty());
// { id: 1 }
```

### 3. `build(state)` - Create Final Object

Validates (if schema provided) and returns the final object.

```typescript
const state = { id: 1, name: 'Alice', email: 'alice@example.com' };
const user = userBuilder.build(state);
// Returns: User (validated if schema provided)
```

---

## Understanding Builder State

### What Is BuilderState?

```typescript
type BuilderState<T> = Readonly<Partial<T>>;
```

It's just a readonly partial object. For `User`:

```typescript
type BuilderState<User> = Readonly<
  Partial<{
    id: number;
    name: string;
    email: string;
  }>
>;
```

**Examples:**

```typescript
const state1: BuilderState<User> = {};
const state2: BuilderState<User> = { id: 1 };
const state3: BuilderState<User> = { id: 1, name: 'Alice' };
const state4: BuilderState<User> = { id: 1, name: 'Alice', email: 'alice@example.com' };
```

### Why Readonly?

To enforce immutability at compile time:

```typescript
const state: BuilderState<User> = { id: 1 };
state.id = 2; // ❌ TypeScript error: Cannot assign to 'id' because it is read-only
```

---

## Step-by-Step Building

Let's build a user object step by step, inspecting state at each step:

```typescript
const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email']);

// Step 1: Empty state
const state1 = userBuilder.empty();
console.log('State 1:', state1); // {}

// Step 2: Add id
const state2 = userBuilder.withId(1)(state1);
console.log('State 2:', state2); // { id: 1 }
console.log('State 1 unchanged:', state1); // {} - still empty!

// Step 3: Add name
const state3 = userBuilder.withName('Alice')(state2);
console.log('State 3:', state3); // { id: 1, name: 'Alice' }

// Step 4: Add email
const state4 = userBuilder.withEmail('alice@example.com')(state3);
console.log('State 4:', state4); // { id: 1, name: 'Alice', email: '...' }

// Step 5: Build
const user = userBuilder.build(state4);
console.log('Final user:', user);
```

**Output:**

```
State 1: {}
State 2: { id: 1 }
State 1 unchanged: {}
State 3: { id: 1, name: 'Alice' }
State 4: { id: 1, name: 'Alice', email: 'alice@example.com' }
Final user: { id: 1, name: 'Alice', email: 'alice@example.com' }
```

**Key Observation:** Every state is a different object. `state1 !== state2 !== state3 !== state4`.

---

## How Setters Work (Under the Hood)

When you call `withX(value)`, here's what happens:

```typescript
// Simplified implementation
function withName(name: string) {
  return (state: BuilderState<User>) => {
    // Create new object with spread operator
    const newState = { ...state, name };

    // Freeze to prevent mutations
    return Object.freeze(newState);
  };
}
```

**The Magic:**

1. `{ ...state, name }` creates a **new** object
2. `Object.freeze()` makes it **immutable**
3. Returns a **function** (curried)

---

## Why Currying?

Setters are curried so they work with `pipe` and `compose`:

```typescript
import { pipe } from '@noony-serverless/type-builder';

// Without currying (doesn't work)
const state = pipe(
  userBuilder.withId(1, state), // ❌ Doesn't work - needs state!
  userBuilder.withName('Alice', state) // ❌ Doesn't work
);

// With currying (works!)
const transform = pipe(
  userBuilder.withId(1), // Returns function
  userBuilder.withName('Alice') // Returns function
);

const state = transform(userBuilder.empty()); // Apply to empty state
```

**Currying makes composition possible.**

---

## Validation with Zod

When you provide a Zod schema, `build()` validates the state:

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(2),
  email: z.string().email(),
});

const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email'], UserSchema);

// ✅ Valid - build succeeds
const validUser = userBuilder.build({
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
});

// ❌ Invalid - build throws
try {
  const invalidUser = userBuilder.build({
    id: -1, // Negative (fails .positive())
    name: 'A', // Too short (fails .min(2))
    email: 'not-an-email', // Invalid (fails .email())
  });
} catch (error) {
  console.error('Validation failed:', error);
}
```

**Benefits:**

- ✅ Catches invalid data before object creation
- ✅ Same Zod error messages
- ✅ Type-safe validation

---

## Immutability Guarantees

### 1. State Never Mutates

```typescript
const state1 = userBuilder.empty();
const state2 = userBuilder.withId(1)(state1);

console.log(state1 === state2); // false (different objects)
console.log(state1); // {} (unchanged)
```

### 2. Frozen Objects

```typescript
const state = userBuilder.withId(1)(userBuilder.empty());

try {
  state.id = 2; // ❌ Error in strict mode
  state.name = 'Alice'; // ❌ Error in strict mode
} catch (error) {
  console.error('Cannot mutate frozen object');
}
```

### 3. Safe Sharing

```typescript
const state = userBuilder.withId(1)(userBuilder.empty());

function someFunction(s: BuilderState<User>) {
  // Can't modify s, can only create new state
  return userBuilder.withName('Alice')(s);
}

const newState = someFunction(state);
console.log(state); // { id: 1 } - unchanged
console.log(newState); // { id: 1, name: 'Alice' }
```

---

## Performance Considerations

### Memory Usage

Each setter creates a **new** object, which uses more memory:

```typescript
// OOP (1 builder object, mutated)
const builder = createBuilder<User>();
builder.withId(1); // Mutates existing object
builder.withName('Alice'); // Mutates existing object
builder.withEmail('alice@example.com'); // Mutates existing object
// Memory: 1 object allocated

// FP (4 state objects)
const state1 = userBuilder.empty(); // Object 1
const state2 = userBuilder.withId(1)(state1); // Object 2
const state3 = userBuilder.withName('Alice')(state2); // Object 3
const state4 = userBuilder.withEmail('alice@example.com')(state3); // Object 4
// Memory: 4 objects allocated
```

**Impact:**

- ~2x more memory per build
- Modern garbage collectors handle this well
- Not an issue for most applications

### Speed Comparison

```typescript
// Benchmark: Building 10,000 users

// OOP Builder:      ~2.5ms  (400,000 ops/sec)
// FP Builder:       ~6.7ms  (150,000 ops/sec)
// Difference:       2.6x slower
```

**Is this slow?** No! 150k ops/sec is **6.6 microseconds** per operation.

### When to Optimize

Only optimize if:

1. Profiling shows this is a bottleneck
2. You're building 10,000+ objects/second
3. Memory is severely constrained

**For 99% of use cases, the immutability benefits outweigh the cost.**

---

## Best Practices

### 1. Reuse Builder Instances

```typescript
// ✅ Good - create once, reuse
const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email']);

function createUser1() {
  return userBuilder.build(
    pipe(userBuilder.withId(1), userBuilder.withName('Alice'))(userBuilder.empty())
  );
}

function createUser2() {
  return userBuilder.build(
    pipe(userBuilder.withId(2), userBuilder.withName('Bob'))(userBuilder.empty())
  );
}

// ❌ Bad - creates new builder every time
function createUser() {
  const builder = createImmutableBuilder<User>(['id', 'name', 'email']); // Wasteful!
  return builder.build(pipe(builder.withId(1), builder.withName('Alice'))(builder.empty()));
}
```

### 2. Use Pipe for Readability

```typescript
// ❌ Hard to read
const user = userBuilder.build(
  userBuilder.withEmail('alice@example.com')(
    userBuilder.withName('Alice')(userBuilder.withId(1)(userBuilder.empty()))
  )
);

// ✅ Clear and readable
const user = userBuilder.build(
  pipe(
    userBuilder.withId(1),
    userBuilder.withName('Alice'),
    userBuilder.withEmail('alice@example.com')
  )(userBuilder.empty())
);
```

### 3. Extract Common Patterns

```typescript
// ✅ Reusable defaults
const adminDefaults = pipe(userBuilder.withRole('admin'), userBuilder.withActive(true));

const admin = userBuilder.build(
  pipe(adminDefaults, userBuilder.withId(1), userBuilder.withName('Admin'))(userBuilder.empty())
);
```

### 4. Custom Transformations

```typescript
// ✅ Extract custom logic
const normalizeEmail = (state: BuilderState<User>) => {
  if (state.email) {
    return Object.freeze({
      ...state,
      email: state.email.toLowerCase().trim(),
    });
  }
  return state;
};

const user = userBuilder.build(
  pipe(
    userBuilder.withEmail('  ALICE@EXAMPLE.COM  '),
    normalizeEmail // Clean transformation
  )(userBuilder.empty())
);
```

---

## Common Patterns

### Pattern 1: Factory Functions

```typescript
function createUser(id: number, name: string, email: string): User {
  return userBuilder.build(
    pipe(
      userBuilder.withId(id),
      userBuilder.withName(name),
      userBuilder.withEmail(email)
    )(userBuilder.empty())
  );
}

const alice = createUser(1, 'Alice', 'alice@example.com');
const bob = createUser(2, 'Bob', 'bob@example.com');
```

### Pattern 2: Partial Updates

```typescript
function updateEmail(user: User, newEmail: string): User {
  return userBuilder.build(
    pipe(
      // Start with existing user data
      () => ({ ...user }),
      userBuilder.withEmail(newEmail)
    )()
  );
}

const user = { id: 1, name: 'Alice', email: 'old@example.com' };
const updated = updateEmail(user, 'new@example.com');

console.log(user); // { id: 1, name: 'Alice', email: 'old@example.com' } - unchanged
console.log(updated); // { id: 1, name: 'Alice', email: 'new@example.com' }
```

### Pattern 3: Conditional Building

```typescript
function createUser(data: { name: string; isAdmin: boolean }): User {
  return userBuilder.build(
    pipe(
      userBuilder.withId(generateId()),
      userBuilder.withName(data.name),
      data.isAdmin ? userBuilder.withRole('admin') : userBuilder.withRole('user')
    )(userBuilder.empty())
  );
}
```

---

## Debugging

### Inspect State at Any Point

```typescript
import { tap } from '@noony-serverless/type-builder';

const user = userBuilder.build(
  pipe(
    userBuilder.withId(1),
    tap((state) => console.log('After withId:', state)),
    userBuilder.withName('Alice'),
    tap((state) => console.log('After withName:', state)),
    userBuilder.withEmail('alice@example.com'),
    tap((state) => console.log('After withEmail:', state))
  )(userBuilder.empty())
);

// Output:
// After withId: { id: 1 }
// After withName: { id: 1, name: 'Alice' }
// After withEmail: { id: 1, name: 'Alice', email: 'alice@example.com' }
```

### Time-Travel Debugging

```typescript
const history: BuilderState<User>[] = [];

const user = userBuilder.build(
  pipe(
    userBuilder.withId(1),
    tap((s) => history.push(s)),
    userBuilder.withName('Alice'),
    tap((s) => history.push(s)),
    userBuilder.withEmail('alice@example.com'),
    tap((s) => history.push(s))
  )(userBuilder.empty())
);

console.log('State history:', history);
// [
//   { id: 1 },
//   { id: 1, name: 'Alice' },
//   { id: 1, name: 'Alice', email: 'alice@example.com' }
// ]
```

---

## Summary

### Key Takeaways

1. **Immutability** - Every transformation returns a new object
2. **Currying** - Setters return functions for composability
3. **Type Safety** - Full TypeScript support with readonly guarantees
4. **Validation** - Optional Zod schema validation
5. **Performance** - 2-3x slower than OOP, but still very fast (150k ops/sec)

### When to Use

✅ **Use Immutable Builder when:**

- Building complex state transformations
- Need guaranteed immutability (React/Redux)
- Want reusable transformation patterns
- Testing is important

⚠️ **Consider OOP Builder when:**

- Simple object construction
- Maximum performance critical
- Hot paths (10,000+ calls/sec)

---

## Next Steps

- 🔄 [Pipe and Compose](./pipe-compose) - Learn function composition
- 🎨 [Higher-Order Functions](./higher-order-functions) - Map, filter, fold operations
- 📚 [Real-World Examples](./real-world-examples) - Practical applications
