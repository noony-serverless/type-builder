---
sidebar_position: 6
---

# Partial Application & Currying

Master default values and function transformation techniques for cleaner, more reusable code.

## Partial Application

**Partial application** means pre-filling some properties with default values.

### Basic Usage

```typescript
import { partial } from '@noony-serverless/type-builder';

interface User {
  id: number;
  name: string;
  role: 'admin' | 'user' | 'guest';
  active: boolean;
  age: number;
}

// Define defaults
const defaultUser = partial<User>({
  role: 'user',
  active: true,
  age: 18
});

// Use in pipeline
const user = userBuilder.build(
  pipe<User>(
    defaultUser,  // Apply defaults first
    userBuilder.withId(1),
    userBuilder.withName('Alice')
  )(userBuilder.empty())
);

// Result: { id: 1, name: 'Alice', role: 'user', active: true, age: 18 }
```

---

## Why Use Partial Application?

### 1. DRY (Don't Repeat Yourself)

```typescript
// ❌ Without partial (repetitive)
const admin1 = pipe(
  userBuilder.withRole('admin'),
  userBuilder.withActive(true),
  userBuilder.withId(1)
);

const admin2 = pipe(
  userBuilder.withRole('admin'),
  userBuilder.withActive(true),
  userBuilder.withId(2)
);

// ✅ With partial (reusable)
const adminDefaults = partial<User>({
  role: 'admin',
  active: true
});

const admin1 = pipe(adminDefaults, userBuilder.withId(1));
const admin2 = pipe(adminDefaults, userBuilder.withId(2));
```

### 2. Configuration Management

```typescript
// Development defaults
const devDefaults = partial<Config>({
  env: 'development',
  debug: true,
  logLevel: 'verbose'
});

// Production defaults
const prodDefaults = partial<Config>({
  env: 'production',
  debug: false,
  logLevel: 'error'
});

const devConfig = configBuilder.build(
  pipe(devDefaults, configBuilder.withPort(3000))(configBuilder.empty())
);
```

### 3. Template Objects

```typescript
// Create templates for common user types
const templates = {
  admin: partial<User>({ role: 'admin', active: true }),
  guest: partial<User>({ role: 'guest', active: false }),
  moderator: partial<User>({ role: 'user', active: true })
};

const admin = userBuilder.build(
  pipe(templates.admin, userBuilder.withId(1))(userBuilder.empty())
);
```

---

## Partial Variants

### partialDefaults - Non-Overwriting

Apply defaults **only if property doesn't exist**:

```typescript
import { partialDefaults } from '@noony-serverless/type-builder';

const defaults = partialDefaults<User>({
  age: 18,
  active: true
});

// Property doesn't exist → use default
const state1 = defaults({ name: 'Alice' });
// { name: 'Alice', age: 18, active: true }

// Property exists → keep existing value
const state2 = defaults({ name: 'Bob', age: 30 });
// { name: 'Bob', age: 30, active: true } ← age NOT overwritten
```

**Use case:** Safe defaults that don't overwrite user input.

### partialOverwrite - Always Overwrite

Apply values **even if property exists**:

```typescript
import { partialOverwrite } from '@noony-serverless/type-builder';

const forceInactive = partialOverwrite<User>({
  active: false
});

const state = forceInactive({ id: 1, name: 'Alice', active: true });
// { id: 1, name: 'Alice', active: false } ← active overwritten
```

**Use case:** Forced updates, data sanitization.

### partialTemplates - Multiple Named Templates

Define multiple templates in one object:

```typescript
import { partialTemplates } from '@noony-serverless/type-builder';

const userTemplates = partialTemplates<User>({
  admin: { role: 'admin', active: true },
  guest: { role: 'guest', active: false },
  moderator: { role: 'user', active: true }
});

// Use templates
const admin = userBuilder.build(
  pipe(
    userTemplates.admin,
    userBuilder.withId(1),
    userBuilder.withName('Admin')
  )(userBuilder.empty())
);

const guest = userBuilder.build(
  pipe(
    userTemplates.guest,
    userBuilder.withId(2),
    userBuilder.withName('Guest')
  )(userBuilder.empty())
);
```

**Use case:** Organized defaults for different scenarios.

### partialIf - Conditional Defaults

Apply defaults **only if condition is true**:

```typescript
import { partialIf } from '@noony-serverless/type-builder';

const applyDefaults = partialIf<User>(
  (state) => !state.role,  // Condition: no role set
  { role: 'user', active: true }  // Defaults to apply
);

const state1 = applyDefaults({ id: 1, name: 'Alice' });
// { id: 1, name: 'Alice', role: 'user', active: true } ← defaults applied

const state2 = applyDefaults({ id: 2, name: 'Bob', role: 'admin' });
// { id: 2, name: 'Bob', role: 'admin' } ← defaults NOT applied
```

**Use case:** Smart defaults based on state.

---

## Currying

**Currying** transforms a multi-argument function into a chain of single-argument functions.

### What Is Currying?

```typescript
// Regular function
const add = (a: number, b: number) => a + b;
add(5, 3);  // 8

// Curried version
const curriedAdd = curry2(add);
const add5 = curriedAdd(5);  // Returns function
add5(3);  // 8
add5(10);  // 15
```

### Why Curry?

**1. Partial Application**

```typescript
const multiply = (a: number, b: number) => a * b;
const curriedMultiply = curry2(multiply);

const double = curriedMultiply(2);
const triple = curriedMultiply(3);

console.log(double(5));  // 10
console.log(triple(5));  // 15
```

**2. Function Composition**

```typescript
const setField = curry3(
  <T, K extends keyof T>(key: K, value: T[K], state: BuilderState<T>) =>
    ({ ...state, [key]: value } as BuilderState<T>)
);

const setName = setField('name');
const setNameAlice = setName('Alice');

const state = setNameAlice({});  // { name: 'Alice' }
```

**3. Reusable Transformations**

```typescript
const validateField = curry2(
  <T>(validator: (v: any) => boolean, state: BuilderState<T>) => {
    // Validation logic
    return state;
  }
);

const isEmail = (v: string) => /\S+@\S+\.\S+/.test(v);
const isAdult = (v: number) => v >= 18;

const validateEmail = validateField(isEmail);
const validateAge = validateField(isAdult);

// Reuse validators
const validUser1 = validateEmail(user1);
const validUser2 = validateAge(user2);
```

---

## Curry Helpers

### curry2 - Two Arguments

```typescript
import { curry2 } from '@noony-serverless/type-builder';

const add = (a: number, b: number) => a + b;
const curriedAdd = curry2(add);

curriedAdd(5)(3);  // 8

// Or partially apply
const add5 = curriedAdd(5);
add5(3);  // 8
add5(10);  // 15
```

### curry3 - Three Arguments

```typescript
import { curry3 } from '@noony-serverless/type-builder';

const sum3 = (a: number, b: number, c: number) => a + b + c;
const curriedSum = curry3(sum3);

curriedSum(1)(2)(3);  // 6

// Or partially apply
const add1 = curriedSum(1);
const add1and2 = add1(2);
add1and2(3);  // 6
```

### curry4 - Four Arguments

```typescript
import { curry4 } from '@noony-serverless/type-builder';

const sum4 = (a: number, b: number, c: number, d: number) => a + b + c + d;
const curriedSum = curry4(sum4);

curriedSum(1)(2)(3)(4);  // 10
```

### autoCurry - Auto-Detect Arity

```typescript
import { autoCurry } from '@noony-serverless/type-builder';

const add = (a: number, b: number) => a + b;
const curriedAdd = autoCurry(add);  // Uses function.length

curriedAdd(5)(3);  // 8
```

**Note:** `autoCurry` uses `function.length`, which doesn't work with rest parameters or default arguments.

---

## Uncurrying

Convert curried functions back to regular functions:

```typescript
import { uncurry2 } from '@noony-serverless/type-builder';

const curriedAdd = (a: number) => (b: number) => a + b;
const regularAdd = uncurry2(curriedAdd);

regularAdd(5, 3);  // 8
```

---

## Flip

Reverse argument order:

```typescript
import { flip, curry2 } from '@noony-serverless/type-builder';

const divide = (a: number, b: number) => a / b;
const curriedDivide = curry2(divide);
const flippedDivide = flip(curriedDivide);

divide(10, 2);  // 5
flippedDivide(2)(10);  // 5 (arguments flipped)
```

**Use case:** Adapting function signatures for composition.

---

## Real-World Examples

### Example 1: Form Validators

```typescript
// Define reusable validators
const validateMin = curry2(
  (min: number, value: number) => value >= min
);

const validateMax = curry2(
  (max: number, value: number) => value <= max
);

const validateRange = curry3(
  (min: number, max: number, value: number) =>
    value >= min && value <= max
);

// Create specific validators
const isAdult = validateMin(18);
const isSenior = validateMin(65);
const isChild = validateMax(12);
const isWorkingAge = validateRange(18, 65);

// Use in validation
if (!isAdult(user.age)) {
  throw new Error('Must be 18 or older');
}
```

### Example 2: Data Transformation Pipeline

```typescript
// Curried transformers
const normalizeField = curry2(
  <T, K extends keyof T>(key: K, state: BuilderState<T>) => {
    const value = state[key];
    if (typeof value === 'string') {
      return { ...state, [key]: value.trim().toLowerCase() } as BuilderState<T>;
    }
    return state;
  }
);

const validateField = curry3(
  <T, K extends keyof T>(
    key: K,
    validator: (v: T[K]) => boolean,
    state: BuilderState<T>
  ) => {
    const value = state[key];
    if (value && !validator(value)) {
      throw new Error(`Invalid ${String(key)}`);
    }
    return state;
  }
);

// Create specific transformations
const normalizeEmail = normalizeField('email');
const normalizeName = normalizeField('name');
const validateEmail = validateField('email', (v: string) => v.includes('@'));
const validateAge = validateField('age', (v: number) => v >= 0);

// Compose into pipeline
const processUser = pipe<User>(
  normalizeEmail,
  normalizeName,
  validateEmail,
  validateAge
);
```

### Example 3: Configuration Builder

```typescript
// Curried config setters
const setEnv = curry2(
  (env: string, config: Config) => ({ ...config, env })
);

const setDebug = curry2(
  (debug: boolean, config: Config) => ({ ...config, debug })
);

const setPort = curry2(
  (port: number, config: Config) => ({ ...config, port })
);

// Create environment-specific configs
const toDevelopment = pipe(
  setEnv('development'),
  setDebug(true),
  setPort(3000)
);

const toProduction = pipe(
  setEnv('production'),
  setDebug(false),
  setPort(80)
);

const devConfig = toDevelopment(baseConfig);
const prodConfig = toProduction(baseConfig);
```

---

## Combining Partial and Currying

Partial application and currying work great together:

```typescript
// Curried factory function
const createUser = curry3(
  (defaults: Partial<User>, id: number, name: string) =>
    userBuilder.build(
      pipe(
        partial(defaults),
        userBuilder.withId(id),
        userBuilder.withName(name)
      )(userBuilder.empty())
    )
);

// Create specialized factories
const createAdmin = createUser({ role: 'admin', active: true });
const createGuest = createUser({ role: 'guest', active: false });

// Use factories
const admin1 = createAdmin(1, 'Admin User');
const admin2 = createAdmin(2, 'Another Admin');
const guest1 = createGuest(3, 'Guest User');
```

---

## Performance Tips

### 1. Curry Outside Loops

```typescript
// ❌ Bad - curries inside loop
users.map(user => curry2(transform)(user.id)(user));

// ✅ Good - curry once
const curriedTransform = curry2(transform);
users.map(user => curriedTransform(user.id)(user));
```

### 2. Reuse Partial Applications

```typescript
// ❌ Bad - creates new partial every time
function processUsers(users: User[]) {
  return users.map(u =>
    pipe(
      partial({ active: true }),
      userBuilder.withId(u.id)
    )(userBuilder.empty())
  );
}

// ✅ Good - create partial once
const activeDefaults = partial<User>({ active: true });
function processUsers(users: User[]) {
  return users.map(u =>
    pipe(activeDefaults, userBuilder.withId(u.id))(userBuilder.empty())
  );
}
```

---

## Summary

### Partial Application

| Function | Behavior | Use Case |
|----------|----------|----------|
| `partial` | Merge defaults | Basic defaults |
| `partialDefaults` | Apply only if missing | Safe defaults |
| `partialOverwrite` | Always overwrite | Forced updates |
| `partialTemplates` | Named templates | Organized configs |
| `partialIf` | Conditional defaults | Smart defaults |

### Currying

| Function | Purpose | Example |
|----------|---------|---------|
| `curry2` | Curry 2-arg function | `curry2((a, b) => a + b)` |
| `curry3` | Curry 3-arg function | `curry3((a, b, c) => a + b + c)` |
| `curry4` | Curry 4-arg function | `curry4((a, b, c, d) => ...)` |
| `autoCurry` | Auto-detect arity | `autoCurry(fn)` |
| `uncurry2` | Uncurry function | `uncurry2(curried)` |
| `flip` | Reverse arguments | `flip(curried)` |

### Quick Reference

```typescript
// Partial application
const defaults = partial<T>({ key: value });
const user = pipe(defaults, ...)(empty());

// Currying
const curried = curry2((a, b) => a + b);
const add5 = curried(5);
add5(3);  // 8
```

---

## Next Steps

- 🎨 [Higher-Order Functions](./higher-order-functions) - Map, filter, fold
- 🔄 [Conditional Building](./conditional-templates) - Dynamic object construction
- 📚 [Real-World Examples](./real-world-examples) - Practical applications
