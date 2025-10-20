---
sidebar_position: 4
---

# Higher-Order Functions

Transform and manipulate builder state with powerful functional programming utilities.

## What Are Higher-Order Functions?

**Higher-order functions** are functions that either:
1. Take functions as arguments, or
2. Return functions as results

They're essential for functional programming and enable powerful composition patterns.

## Filter

Keep only properties that match a condition.

### Syntax

```typescript
filterBuilder<T>(predicate: Predicate<T>): Setter<T>
```

### Example

```typescript
import { filterBuilder } from '@noony-serverless/type-builder';

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

// Keep only safe properties (exclude password)
const sanitizeUser = filterBuilder<User>(
  (key) => key !== 'password'
);

const fullUser = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  password: 'secret123'
};

const safeUser = userBuilder.build(sanitizeUser(fullUser));
// { id: 1, name: 'Alice', email: 'alice@example.com' }
```

### Use Cases

**1. Data Sanitization**
```typescript
// Remove sensitive data before sending to client
const removeSecrets = filterBuilder<User>(
  (key) => !['password', 'ssn', 'creditCard'].includes(key as string)
);
```

**2. Partial Updates**
```typescript
// Keep only changed fields
const changedOnly = filterBuilder<User>(
  (key, value) => value !== undefined
);
```

---

## Map

Transform values while preserving structure.

### Syntax

```typescript
mapBuilder<T, U>(transformer: Transformer<T, U>): Setter<T>
```

### Example

```typescript
import { mapBuilder } from '@noony-serverless/type-builder';

// Double all numeric values
const doubleNumbers = mapBuilder<User, number>((key, value) => {
  if (typeof value === 'number') {
    return (value as number) * 2;
  }
  return value as number;
});

const user = { id: 1, age: 30, name: 'Alice' };
const transformed = userBuilder.build(doubleNumbers(user));
// { id: 2, age: 60, name: 'Alice' }
```

### Use Cases

**1. Data Normalization**
```typescript
// Lowercase all strings
const lowercaseStrings = mapBuilder<User, string>((key, value) => {
  if (typeof value === 'string') {
    return (value as string).toLowerCase();
  }
  return value as string;
});
```

**2. Unit Conversion**
```typescript
// Convert prices from cents to dollars
const centsToDollars = mapBuilder<Product, number>((key, value) => {
  if (key === 'price' && typeof value === 'number') {
    return (value as number) / 100;
  }
  return value as number;
});
```

---

## Fold (Reduce)

Reduce builder state to a single value.

### Syntax

```typescript
foldBuilder<T, R>(
  reducer: Reducer<T, R>,
  initial: R
): (state: BuilderState<T>) => R
```

### Example

```typescript
import { foldBuilder } from '@noony-serverless/type-builder';

// Count number of properties
const countFields = foldBuilder<User, number>(
  (acc, key, value) => acc + 1,
  0  // Initial value
);

const user = { id: 1, name: 'Alice', email: 'alice@example.com' };
const fieldCount = countFields(user);  // 3
```

### Use Cases

**1. Statistics**
```typescript
// Sum all numeric values
const sumNumbers = foldBuilder<User, number>(
  (acc, key, value) => {
    if (typeof value === 'number') {
      return acc + (value as number);
    }
    return acc;
  },
  0
);
```

**2. Data Aggregation**
```typescript
// Collect all string values
const collectStrings = foldBuilder<User, string[]>(
  (acc, key, value) => {
    if (typeof value === 'string') {
      return [...acc, value as string];
    }
    return acc;
  },
  []
);
```

---

## Pick

Select specific properties from state.

### Syntax

```typescript
pick<T>(keys: (keyof T)[]): Setter<T>
```

### Example

```typescript
import { pick } from '@noony-serverless/type-builder';

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  ssn: string;
}

// Pick only public fields
const publicFields = pick<User>(['id', 'name', 'email']);

const fullUser = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  password: 'secret',
  ssn: '123-45-6789'
};

const publicUser = publicFields(fullUser);
// { id: 1, name: 'Alice', email: 'alice@example.com' }
```

### Use Cases

**1. API Responses**
```typescript
// Return only necessary fields to client
const userResponse = pick<User>(['id', 'name', 'email']);
```

**2. Database Queries**
```typescript
// Select specific columns
const userIdentity = pick<User>(['id', 'email']);
```

---

## Omit

Exclude specific properties from state.

### Syntax

```typescript
omit<T>(keys: (keyof T)[]): Setter<T>
```

### Example

```typescript
import { omit } from '@noony-serverless/type-builder';

// Omit sensitive fields
const removeSensitive = omit<User>(['password', 'ssn', 'creditCard']);

const fullUser = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  password: 'secret',
  ssn: '123-45-6789'
};

const safeUser = removeSensitive(fullUser);
// { id: 1, name: 'Alice', email: 'alice@example.com' }
```

### Pick vs Omit

```typescript
// Pick: Specify what to KEEP
const keep = pick<User>(['id', 'name']);

// Omit: Specify what to REMOVE
const remove = omit<User>(['password', 'ssn']);
```

Use **pick** when you know exactly what you want.
Use **omit** when it's easier to list what to exclude.

---

## Partition

Split state into two groups based on a predicate.

### Syntax

```typescript
partition<T>(
  predicate: (key: keyof T, value: T[keyof T]) => boolean,
  state: BuilderState<T>
): [BuilderState<T>, BuilderState<T>]
```

### Example

```typescript
import { partition } from '@noony-serverless/type-builder';

// Split into numbers and strings
const [numbers, strings] = partition<User>(
  (key, value) => typeof value === 'number',
  { id: 1, name: 'Alice', age: 30, email: 'alice@example.com' }
);

console.log(numbers);  // { id: 1, age: 30 }
console.log(strings);  // { name: 'Alice', email: 'alice@example.com' }
```

### Use Cases

**1. Data Validation**
```typescript
// Split valid and invalid fields
const [valid, invalid] = partition<User>(
  (key, value) => validateField(key, value),
  userData
);
```

**2. Feature Flags**
```typescript
// Split enabled and disabled features
const [enabled, disabled] = partition<Features>(
  (key, value) => value === true,
  featureFlags
);
```

---

## Compact

Remove undefined and null values.

### Syntax

```typescript
compact<T>(state: BuilderState<T>): BuilderState<T>
```

### Example

```typescript
import { compact } from '@noony-serverless/type-builder';

const messy = {
  id: 1,
  name: 'Alice',
  email: undefined,
  age: null,
  active: true
};

const clean = compact(messy);
// { id: 1, name: 'Alice', active: true }
```

### Use Cases

**1. API Cleanup**
```typescript
// Remove null/undefined before sending to API
const cleanData = pipe<User>(
  compact,
  removeEmptyStrings
);
```

**2. Form Data**
```typescript
// Remove empty form fields
const validFormData = compact(formState);
```

---

## Composing Higher-Order Functions

The real power comes from combining these functions:

### Example: Data Sanitization Pipeline

```typescript
import { pipe, pick, omit, compact, mapBuilder } from '@noony-serverless/type-builder';

// Complex sanitization pipeline
const sanitizeUser = pipe<User>(
  // 1. Remove sensitive fields
  omit(['password', 'ssn']),

  // 2. Remove null/undefined
  compact,

  // 3. Normalize strings
  mapBuilder((key, value) => {
    if (typeof value === 'string') {
      return value.trim().toLowerCase();
    }
    return value;
  }),

  // 4. Pick only allowed fields
  pick(['id', 'name', 'email'])
);

const user = sanitizeUser({
  id: 1,
  name: '  ALICE  ',
  email: '  ALICE@EXAMPLE.COM  ',
  password: 'secret',
  ssn: '123-45-6789',
  deletedAt: null
});

// Result:
// {
//   id: 1,
//   name: 'alice',
//   email: 'alice@example.com'
// }
```

---

## Real-World Examples

### Example 1: User Privacy Filter

```typescript
// Remove PII before logging
const removePII = pipe<User>(
  omit(['email', 'phone', 'address', 'ssn']),
  mapBuilder((key, value) => {
    // Hash user ID for privacy
    if (key === 'id') {
      return hashId(value as number);
    }
    return value;
  })
);

const safeForLogging = removePII(user);
logger.info('User action', safeForLogging);
```

### Example 2: Form Validation

```typescript
// Validate form data
const validateForm = (formData: Partial<User>) => {
  // Partition into valid and invalid fields
  const [valid, invalid] = partition<User>(
    (key, value) => validateField(key, value),
    formData
  );

  if (Object.keys(invalid).length > 0) {
    throw new ValidationError('Invalid fields', invalid);
  }

  return valid;
};
```

### Example 3: API Response Transformer

```typescript
// Transform API response
const transformAPIResponse = pipe<User>(
  // Map API fields to internal format
  mapBuilder((key, value) => {
    const mapping: Record<string, string> = {
      user_id: 'id',
      user_name: 'name',
      user_email: 'email'
    };
    return mapping[key as string] || key;
  }),

  // Remove null values
  compact,

  // Pick only needed fields
  pick(['id', 'name', 'email', 'active'])
);
```

---

## Performance Considerations

### Filter vs Pick/Omit

```typescript
// ✅ Fast: Use pick/omit for known keys
const fast = pick<User>(['id', 'name']);

// ⚠️ Slower: Use filter for dynamic conditions
const slower = filterBuilder<User>(
  (key, value) => someComplexCondition(key, value)
);
```

### Map Performance

```typescript
// ✅ Fast: Check type once
const fast = mapBuilder<User, string>((key, value) => {
  const str = value as string;
  return typeof value === 'string' ? str.toLowerCase() : str;
});

// ❌ Slow: Multiple operations per field
const slow = mapBuilder<User, string>((key, value) => {
  const str = value as string;
  return str.toLowerCase().trim().replace(/\s+/g, ' ');  // Many operations
});
```

---

## Summary

### Key Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `filterBuilder` | Keep matching properties | New state |
| `mapBuilder` | Transform values | New state |
| `foldBuilder` | Reduce to single value | Any type |
| `pick` | Select specific keys | New state |
| `omit` | Exclude specific keys | New state |
| `partition` | Split into two groups | Tuple of states |
| `compact` | Remove null/undefined | New state |

### When to Use

- **Filter**: Dynamic property selection
- **Map**: Value transformations
- **Fold**: Aggregations and statistics
- **Pick**: Known keys to keep
- **Omit**: Known keys to remove
- **Partition**: Split data into categories
- **Compact**: Clean up optional fields

---

## Next Steps

- ⚡ [Transducers](./transducers) - High-performance transformations
- 🔧 [Partial Application](./partial-currying) - Default values and currying
- 📚 [Real-World Examples](./real-world-examples) - Practical use cases
