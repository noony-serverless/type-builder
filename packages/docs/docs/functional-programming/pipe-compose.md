---
sidebar_position: 3
---

# Pipe and Compose

Master function composition to build complex transformations from simple building blocks.

## TL;DR

```typescript
import { pipe, compose } from '@noony-serverless/type-builder';

// Pipe: left-to-right (most intuitive)
const user1 = userBuilder.build(
  pipe<User>(
    userBuilder.withId(1),       // Step 1
    userBuilder.withName('Alice'), // Step 2
    userBuilder.withEmail('alice@example.com') // Step 3
  )(userBuilder.empty())
);

// Compose: right-to-left (mathematical)
const user2 = userBuilder.build(
  compose<User>(
    userBuilder.withEmail('alice@example.com'), // Step 3 (applied LAST)
    userBuilder.withName('Alice'),              // Step 2
    userBuilder.withId(1)                       // Step 1 (applied FIRST)
  )(userBuilder.empty())
);
```

Both produce the same result, just different mental models!

---

## What Is Function Composition?

**Function composition** is combining multiple functions into a single function.

### Mathematical Definition

In mathematics: `(f ∘ g)(x) = f(g(x))`

In code:
```typescript
const f = (x: number) => x * 2;
const g = (x: number) => x + 1;

// compose(f, g)(x) === f(g(x))
const composed = compose(f, g);
composed(5);  // f(g(5)) = f(6) = 12
```

---

## Pipe: Left-to-Right Composition

### Syntax

```typescript
pipe<T>(...fns: Setter<T>[]): Setter<T>
```

### How It Works

`pipe` applies functions **left-to-right** (top-to-bottom):

```typescript
pipe(f1, f2, f3)(x)
// Equivalent to: f3(f2(f1(x)))
// Reads as: start with x, apply f1, then f2, then f3
```

### Example

```typescript
const transform = pipe<User>(
  userBuilder.withId(1),           // Applied first
  userBuilder.withName('Alice'),   // Applied second
  userBuilder.withEmail('alice@example.com') // Applied third
);

const user = userBuilder.build(transform(userBuilder.empty()));
```

**Execution flow:**
```
userBuilder.empty()
  → { }
  → withId(1)
  → { id: 1 }
  → withName('Alice')
  → { id: 1, name: 'Alice' }
  → withEmail('alice@example.com')
  → { id: 1, name: 'Alice', email: 'alice@example.com' }
  → build()
  → User object
```

### Why Use Pipe?

**Readability:** Reads like a story, top-to-bottom:

```typescript
const user = userBuilder.build(
  pipe<User>(
    // Start with empty
    userBuilder.withId(1),       // Then add id
    userBuilder.withName('Alice'), // Then add name
    normalizeEmail,              // Then normalize
    validateAge,                 // Then validate
    logCreation                  // Then log
  )(userBuilder.empty())
);
```

**Composability:** Extract and reuse pieces:

```typescript
const addBasicInfo = pipe<User>(
  userBuilder.withName('Alice'),
  userBuilder.withEmail('alice@example.com')
);

const user = userBuilder.build(
  pipe<User>(
    userBuilder.withId(1),
    addBasicInfo  // Reuse composition
  )(userBuilder.empty())
);
```

---

## Compose: Right-to-Left Composition

### Syntax

```typescript
compose<T>(...fns: Setter<T>[]): Setter<T>
```

### How It Works

`compose` applies functions **right-to-left** (bottom-to-top):

```typescript
compose(f1, f2, f3)(x)
// Equivalent to: f1(f2(f3(x)))
// Reads as: start with x, apply f3, then f2, then f1
```

### Example

```typescript
const transform = compose<User>(
  userBuilder.withEmail('alice@example.com'), // Applied LAST (third)
  userBuilder.withName('Alice'),              // Applied second
  userBuilder.withId(1)                       // Applied FIRST
);

const user = userBuilder.build(transform(userBuilder.empty()));
```

**Execution flow:**
```
userBuilder.empty()
  → { }
  → withId(1)  (bottom function, applied first)
  → { id: 1 }
  → withName('Alice')  (middle function, applied second)
  → { id: 1, name: 'Alice' }
  → withEmail('alice@example.com')  (top function, applied last)
  → { id: 1, name: 'Alice', email: 'alice@example.com' }
  → build()
  → User object
```

### Why Use Compose?

**Mathematical thinking:** If you come from Haskell, Scala, or math:

```typescript
// Mathematical composition
const f = (x: number) => x * 2;
const g = (x: number) => x + 1;

compose(f, g)(5);  // f(g(5)) = f(6) = 12
```

**Type inference:** In some cases, compose has better type inference:

```typescript
// TypeScript infers types bottom-to-top
const transform = compose(
  finalTransform,   // TypeScript knows this receives intermediate result
  middleTransform,  // TypeScript knows this receives initial input
  initialTransform
);
```

---

## Pipe vs Compose: When to Use Which?

### Use `pipe` When:

✅ **You want to read code top-to-bottom**
```typescript
pipe(
  step1,  // First step (reads naturally)
  step2,  // Second step
  step3   // Third step
)
```

✅ **You come from JavaScript/TypeScript background**
- Most JS developers find pipe more intuitive
- Matches the order you think about the problem

✅ **Building data pipelines**
```typescript
pipe(
  fetchData,       // 1. Get data
  validateData,    // 2. Validate
  transformData,   // 3. Transform
  saveData         // 4. Save
)
```

### Use `compose` When:

✅ **You prefer mathematical notation**
```typescript
compose(f, g, h)(x) === f(g(h(x)))  // Mathematical
```

✅ **You come from functional programming languages**
- Haskell, Scala, OCaml use right-to-left composition
- Matches `(f ∘ g)` notation

✅ **You need specific type inference patterns**
```typescript
// TypeScript infers types from right to left
compose(
  finalType,    // Known type
  inferredType, // TypeScript infers from finalType
  inputType     // Known type
)
```

### Recommendation

**For most TypeScript developers: Use `pipe`.**

It's more intuitive and matches how we think about sequential operations.

---

## Advanced Pipe/Compose Patterns

### Pattern 1: Reusable Transformations

```typescript
// Define reusable transformations
const normalizeEmail = (state: BuilderState<User>) => ({
  ...state,
  email: state.email?.toLowerCase().trim()
});

const ensureAdult = (state: BuilderState<User>) => ({
  ...state,
  age: state.age && state.age < 18 ? 18 : state.age
});

// Compose them
const sanitizeUser = pipe(normalizeEmail, ensureAdult);

// Use anywhere
const user = userBuilder.build(
  pipe(
    userBuilder.withEmail('  ALICE@EXAMPLE.COM  '),
    userBuilder.withAge(16),
    sanitizeUser  // Apply both transformations
  )(userBuilder.empty())
);
// email: 'alice@example.com', age: 18
```

### Pattern 2: Conditional Composition

```typescript
const buildUser = (isAdmin: boolean) => pipe<User>(
  userBuilder.withId(generateId()),
  userBuilder.withName('User'),
  ...(isAdmin
    ? [userBuilder.withRole('admin'), userBuilder.withActive(true)]
    : [userBuilder.withRole('user')]
  )
);

const admin = userBuilder.build(buildUser(true)(userBuilder.empty()));
const regular = userBuilder.build(buildUser(false)(userBuilder.empty()));
```

### Pattern 3: Nested Composition

```typescript
// Low-level transformations
const trimStrings = pipe(
  normalizeEmail,
  normalizeName
);

// Mid-level transformations
const validateUser = pipe(
  ensureAdult,
  checkRequiredFields
);

// High-level transformation
const processUser = pipe(
  trimStrings,     // First: clean data
  validateUser,    // Then: validate
  logUserCreation  // Finally: log
);

// Use
const user = userBuilder.build(
  pipe(
    userBuilder.withEmail('  ALICE@EXAMPLE.COM  '),
    userBuilder.withAge(16),
    processUser  // Apply entire pipeline
  )(userBuilder.empty())
);
```

---

## Pipe/Compose Variants

### pipeWith - Pipe with Initial State

Apply initial state directly:

```typescript
const user = userBuilder.build(
  pipeWith<User>(
    userBuilder.empty(),  // Initial state provided here
    userBuilder.withId(1),
    userBuilder.withName('Alice')
  )
);
```

**vs regular pipe:**
```typescript
const user = userBuilder.build(
  pipe<User>(
    userBuilder.withId(1),
    userBuilder.withName('Alice')
  )(userBuilder.empty())  // Initial state provided here
);
```

### composeWith - Compose with Initial State

```typescript
const user = userBuilder.build(
  composeWith<User>(
    userBuilder.empty(),
    userBuilder.withId(1),
    userBuilder.withName('Alice')
  )
);
```

### pipeAsync - Async Pipe

For async transformations:

```typescript
const user = await userBuilder.build(
  await pipeAsync<User>(
    userBuilder.withId(1),
    async (state) => ({
      ...state,
      email: await fetchEmailFromAPI(state.id!)
    }),
    userBuilder.withName('Alice')
  )(userBuilder.empty())
);
```

### composeAsync - Async Compose

```typescript
const user = await userBuilder.build(
  await composeAsync<User>(
    userBuilder.withName('Alice'),
    async (state) => ({
      ...state,
      verified: await verifyEmail(state.email!)
    }),
    userBuilder.withEmail('alice@example.com')
  )(userBuilder.empty())
);
```

### pipeIf - Conditional Pipe

Apply transformation only if condition is true:

```typescript
const user = userBuilder.build(
  pipe<User>(
    userBuilder.withId(1),
    pipeIf(isAdmin, userBuilder.withRole('admin')),  // Only if isAdmin
    pipeIf(!isAdmin, userBuilder.withRole('user'))   // Only if !isAdmin
  )(userBuilder.empty())
);
```

### pipeWhen - Conditional with Predicate

Apply transformation based on state:

```typescript
const user = userBuilder.build(
  pipe<User>(
    userBuilder.withAge(16),
    pipeWhen(
      (state) => state.age !== undefined && state.age < 18,  // Condition
      (state) => ({ ...state, age: 18 })  // Transformation if true
    )
  )(userBuilder.empty())
);
```

### tap - Side Effects Without Changing State

Debug or log without changing state:

```typescript
const user = userBuilder.build(
  pipe<User>(
    userBuilder.withId(1),
    tap((state) => console.log('After withId:', state)),
    userBuilder.withName('Alice'),
    tap((state) => console.log('After withName:', state)),
    tap((state) => {
      // Can do anything here
      logToAnalytics(state);
      saveToCache(state);
      notifyWebhook(state);
    })
  )(userBuilder.empty())
);
```

---

## Real-World Examples

### Example 1: User Registration Pipeline

```typescript
const registerUser = pipe<User>(
  // 1. Generate ID
  userBuilder.withId(generateId()),

  // 2. Normalize input
  normalizeEmail,
  trimName,

  // 3. Set defaults
  userBuilder.withRole('user'),
  userBuilder.withActive(false),
  userBuilder.withCreatedAt(new Date()),

  // 4. Validate
  ensureAdult,
  validateEmailDomain,

  // 5. Side effects
  tap((state) => logUserCreation(state)),
  tap((state) => sendWelcomeEmail(state.email!))
);

const user = userBuilder.build(
  pipe(
    userBuilder.withEmail(req.body.email),
    userBuilder.withName(req.body.name),
    userBuilder.withAge(req.body.age),
    registerUser  // Apply entire pipeline
  )(userBuilder.empty())
);
```

### Example 2: Data Transformation Pipeline

```typescript
// Transform API response to internal format
const transformAPIUser = pipe<User>(
  // Map fields
  (apiUser: APIUser) => ({
    id: apiUser.user_id,
    name: apiUser.user_name,
    email: apiUser.user_email,
    active: apiUser.is_active
  }),

  // Normalize
  normalizeEmail,

  // Add computed fields
  (state) => ({
    ...state,
    displayName: formatDisplayName(state.name!)
  }),

  // Sanitize
  removeNullFields,
  trimAllStrings
);

const internalUser = transformAPIUser(apiResponseData);
```

### Example 3: Form Validation Pipeline

```typescript
const validateForm = pipe<User>(
  // Required fields
  checkRequired(['email', 'name']),

  // Format validation
  validateEmailFormat,
  validateNameLength,

  // Business rules
  ensureAdult,
  checkEmailNotInUse,

  // Sanitization
  normalizeEmail,
  trimName,

  // Logging
  tap((state) => logValidationSuccess(state))
);

try {
  const validatedUser = validateForm(formData);
  const user = userBuilder.build(validatedUser);
} catch (error) {
  showFormErrors(error);
}
```

---

## Debugging Composition

### Use tap() to Inspect

```typescript
const user = userBuilder.build(
  pipe<User>(
    tap((s) => console.log('Start:', s)),
    userBuilder.withId(1),
    tap((s) => console.log('After withId:', s)),
    normalizeEmail,
    tap((s) => console.log('After normalize:', s)),
    ensureAdult,
    tap((s) => console.log('After ensureAdult:', s))
  )(userBuilder.empty())
);
```

### Extract Steps for Testing

```typescript
// Extract each step
const step1 = userBuilder.withId(1);
const step2 = normalizeEmail;
const step3 = ensureAdult;

// Test individually
describe('pipeline', () => {
  it('step1 adds id', () => {
    const result = step1({});
    expect(result).toEqual({ id: 1 });
  });

  it('step2 normalizes email', () => {
    const result = step2({ email: '  ALICE@EXAMPLE.COM  ' });
    expect(result.email).toBe('alice@example.com');
  });

  it('step3 ensures adult', () => {
    const result = step3({ age: 16 });
    expect(result.age).toBe(18);
  });
});

// Then compose
const pipeline = pipe(step1, step2, step3);
```

---

## Performance Tips

### 1. Avoid Creating Functions in Loops

```typescript
// ❌ Bad - creates new pipe function every iteration
users.map(user =>
  pipe(
    userBuilder.withActive(true),
    normalizeEmail
  )(user)
);

// ✅ Good - create once, reuse
const activateUser = pipe(
  userBuilder.withActive(true),
  normalizeEmail
);

users.map(user => activateUser(user));
```

### 2. Minimize Function Calls

```typescript
// ❌ Less efficient - many function calls
pipe(
  f1, f2, f3, f4, f5, f6, f7, f8, f9, f10
)

// ✅ More efficient - group related operations
const groupA = pipe(f1, f2, f3);
const groupB = pipe(f4, f5, f6);
const groupC = pipe(f7, f8, f9, f10);

pipe(groupA, groupB, groupC)  // Fewer intermediate calls
```

### 3. Use Transducers for Large Datasets

For heavy transformations on many items, use transducers:

```typescript
import { transduce } from '@noony-serverless/type-builder';

// Instead of pipe for large datasets
const transform = transduce(
  filtering(...),
  mapping(...),
  taking(...)
);
```

See [Transducers Guide](./transducers) for details.

---

## Summary

### Key Takeaways

1. **Pipe** - Left-to-right composition (most intuitive)
2. **Compose** - Right-to-left composition (mathematical)
3. **Both produce identical results** - choose based on mental model
4. **Composability** - Build complex transformations from simple ones
5. **Reusability** - Extract and reuse patterns

### Quick Reference

```typescript
// Pipe (left-to-right)
pipe(f1, f2, f3)(x) === f3(f2(f1(x)))

// Compose (right-to-left)
compose(f1, f2, f3)(x) === f1(f2(f3(x)))

// Variants
pipeWith(initial, f1, f2)       // With initial state
pipeAsync(f1, asyncF, f2)       // Async support
pipeIf(condition, f)            // Conditional
pipeWhen(predicate, f)          // Conditional with predicate
tap(fn)                         // Side effects
```

---

## Next Steps

- 🎨 [Higher-Order Functions](./higher-order-functions) - Map, filter, fold operations
- ⚡ [Transducers](./transducers) - High-performance composition
- 📚 [Real-World Examples](./real-world-examples) - Practical applications
