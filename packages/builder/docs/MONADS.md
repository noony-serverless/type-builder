# Monads Guide

Monads provide type-safe error handling and nullable value management without exceptions or null checks.

## Installation

```typescript
import { Maybe, Either } from '@noony-serverless/type-builder/monads';
```

## Table of Contents

1. [Maybe Monad](#maybe-monad)
2. [Either Monad](#either-monad)
3. [Combining with Builder](#combining-with-builder)
4. [Best Practices](#best-practices)

---

## Maybe Monad

The `Maybe` monad handles nullable/optional values safely.

### Basic Usage

```typescript
import { Maybe } from '@noony-serverless/type-builder/monads';

// Create Maybe values
const some = Maybe.of(42);
const none = Maybe.none<number>();

// Safe operations
const result1 = some
  .map((x) => x * 2)
  .map((x) => x + 1)
  .getOrElse(0);
// result1 = 85

const result2 = none
  .map((x) => x * 2)
  .map((x) => x + 1)
  .getOrElse(0);
// result2 = 0 (default)
```

### Creating Maybe Values

```typescript
// From value (allows null/undefined)
const maybe1 = Maybe.of(value);

// From nullable value (explicit)
const maybe2 = Maybe.fromNullable(value);

// Empty Maybe
const maybe3 = Maybe.none<string>();
```

### Transforming Values

```typescript
// map: Transform the value
Maybe.of(5)
  .map((x) => x * 2)
  .map((x) => x.toString())
  .getOrElse('0');
// '10'

// flatMap: Transform and flatten
function findUser(id: number): Maybe<User> {
  const user = database.get(id);
  return Maybe.fromNullable(user);
}

Maybe.of(1)
  .flatMap(findUser)
  .map((user) => user.name)
  .getOrElse('Unknown');
```

### Filtering

```typescript
Maybe.of(25)
  .filter((age) => age >= 18)
  .getOrElse(0);
// 25

Maybe.of(15)
  .filter((age) => age >= 18)
  .getOrElse(0);
// 0 (filtered out)
```

### Extracting Values

```typescript
// Get value or default
maybe.getOrElse(defaultValue);

// Get value or compute default
maybe.getOrElseGet(() => expensiveComputation());

// Get value or throw
maybe.getOrThrow(); // throws if None

// Fold into a value
maybe.fold(
  () => 'No value',
  (value) => `Value: ${value}`
);
```

### Chaining Operations

```typescript
interface Address {
  street: string;
  city: string;
  zipCode?: string;
}

interface User {
  name: string;
  address?: Address;
}

function getZipCode(user: User): Maybe<string> {
  return Maybe.fromNullable(user.address).flatMap((addr) => Maybe.fromNullable(addr.zipCode));
}

const zipCode = getZipCode(user).getOrElse('No ZIP');
```

### Working with Collections

```typescript
import { sequenceMaybe } from '@noony-serverless/type-builder/monads';

// All or nothing
const maybes = [Maybe.of(1), Maybe.of(2), Maybe.of(3)];
const result = sequenceMaybe(maybes);
// Maybe.of([1, 2, 3])

const withNone = [Maybe.of(1), Maybe.none<number>(), Maybe.of(3)];
const result2 = sequenceMaybe(withNone);
// Maybe.none() (one None makes all None)
```

### Utility Functions

```typescript
import { firstSome, allSome, anySome } from '@noony-serverless/type-builder/monads';

// Find first Some
const first = firstSome([Maybe.none(), Maybe.of(5), Maybe.of(10)]);
// Maybe.of(5)

// Check if all are Some
const all = allSome([Maybe.of(1), Maybe.of(2), Maybe.of(3)]);
// true

// Check if any is Some
const any = anySome([Maybe.none(), Maybe.none(), Maybe.of(5)]);
// true
```

---

## Either Monad

The `Either` monad handles computations that can fail with type-safe errors.

### Basic Usage

```typescript
import { Either } from '@noony-serverless/type-builder/monads';

// Create Either values
const success = Either.right<string, number>(42);
const failure = Either.left<string, number>('Error message');

// Safe operations
const result = success
  .map((x) => x * 2)
  .map((x) => x + 1)
  .fold(
    (error) => `Error: ${error}`,
    (value) => `Result: ${value}`
  );
// 'Result: 85'
```

### Creating Either Values

```typescript
// Right (success)
const right = Either.right<string, number>(42);

// Left (error)
const left = Either.left<string, number>('Error');

// Try/Catch wrapper
const result = Either.tryCatch(
  () => JSON.parse(jsonString),
  (error) => `Parse error: ${error.message}`
);

// From predicate
const validated = Either.fromPredicate(value, (v) => v > 0, 'Value must be positive');
```

### Transforming Values

```typescript
// map: Transform Right value (Left passes through)
Either.right<string, number>(5)
  .map((x) => x * 2)
  .map((x) => x + 1);
// Either.right(11)

Either.left<string, number>('error')
  .map((x) => x * 2)
  .map((x) => x + 1);
// Either.left('error') (unchanged)

// mapLeft: Transform Left value
Either.left<string, number>('error').mapLeft((err) => `ERROR: ${err}`);
// Either.left('ERROR: error')

// bimap: Transform both sides
either.bimap(
  (error) => `ERROR: ${error}`,
  (value) => value * 2
);
```

### Error Handling

```typescript
function divide(a: number, b: number): Either<string, number> {
  if (b === 0) {
    return Either.left('Division by zero');
  }
  return Either.right(a / b);
}

divide(10, 2)
  .map((n) => n * 2)
  .fold(
    (error) => console.error(error),
    (result) => console.log(result)
  );
// 10

divide(10, 0)
  .map((n) => n * 2)
  .fold(
    (error) => console.error(error),
    (result) => console.log(result)
  );
// 'Division by zero'
```

### Validation

```typescript
interface ValidationError {
  field: string;
  message: string;
}

function validateEmail(email: string): Either<ValidationError, string> {
  if (!email.includes('@')) {
    return Either.left({ field: 'email', message: 'Invalid email' });
  }
  return Either.right(email);
}

function validateAge(age: number): Either<ValidationError, number> {
  if (age < 18) {
    return Either.left({ field: 'age', message: 'Must be 18+' });
  }
  return Either.right(age);
}

// Chain validations
function validateUser(email: string, age: number) {
  return validateEmail(email).flatMap((validEmail) =>
    validateAge(age).map((validAge) => ({ email: validEmail, age: validAge }))
  );
}

validateUser('alice@example.com', 30);
// Either.right({ email: 'alice@example.com', age: 30 })

validateUser('invalid', 30);
// Either.left({ field: 'email', message: 'Invalid email' })

validateUser('alice@example.com', 15);
// Either.left({ field: 'age', message: 'Must be 18+' })
```

### Working with Collections

```typescript
import { sequenceEither } from '@noony-serverless/type-builder/monads';

// All or nothing (fail fast)
const eithers = [
  Either.right<string, number>(1),
  Either.right<string, number>(2),
  Either.right<string, number>(3),
];
const result = sequenceEither(eithers);
// Either.right([1, 2, 3])

const withError = [
  Either.right<string, number>(1),
  Either.left<string, number>('error'),
  Either.right<string, number>(3),
];
const result2 = sequenceEither(withError);
// Either.left('error') (first error)
```

### Collecting All Errors

```typescript
import { validation } from '@noony-serverless/type-builder/monads';

// Collect ALL errors instead of failing fast
const validations = [
  Either.left<string[], number>(['Error 1']),
  Either.left<string[], number>(['Error 2']),
  Either.right<string[], number>(5),
];

const result = validation(validations);
// Either.left(['Error 1', 'Error 2'])
```

### Utility Functions

```typescript
import {
  lefts,
  rights,
  partitionEithers,
  allRight,
  anyRight,
} from '@noony-serverless/type-builder/monads';

const eithers = [
  Either.right<string, number>(1),
  Either.left<string, number>('error1'),
  Either.right<string, number>(2),
  Either.left<string, number>('error2'),
];

// Extract all errors
const errors = lefts(eithers);
// ['error1', 'error2']

// Extract all successes
const successes = rights(eithers);
// [1, 2]

// Partition into errors and successes
const [errors2, successes2] = partitionEithers(eithers);
// errors2 = ['error1', 'error2']
// successes2 = [1, 2]

// Check if all are Right
allRight(eithers); // false

// Check if any is Right
anyRight(eithers); // true
```

---

## Combining with Builder

### Maybe with Builder

```typescript
import { createImmutableBuilder } from '@noony-serverless/type-builder';
import { Maybe, sequenceMaybe } from '@noony-serverless/type-builder/monads';

const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email']);

function buildUserFromMaybes(
  id: Maybe<number>,
  name: Maybe<string>,
  email: Maybe<string>
): Maybe<User> {
  return id.flatMap((idVal) =>
    name.flatMap((nameVal) =>
      email.map((emailVal) => {
        const builder = pipe<User>(
          userBuilder.withId(idVal),
          userBuilder.withName(nameVal),
          userBuilder.withEmail(emailVal)
        );
        return userBuilder.build(builder(userBuilder.empty()));
      })
    )
  );
}
```

### Either with Builder

```typescript
import { Either } from '@noony-serverless/type-builder/monads';

function buildValidatedUser(
  id: number,
  name: string,
  email: string
): Either<ValidationError, User> {
  return validateName(name).flatMap((validName) =>
    validateEmail(email).map((validEmail) => {
      const builder = pipe<User>(
        userBuilder.withId(id),
        userBuilder.withName(validName),
        userBuilder.withEmail(validEmail)
      );
      return userBuilder.build(builder(userBuilder.empty()));
    })
  );
}
```

---

## Converting Between Maybe and Either

```typescript
// Maybe to Either
const maybe = Maybe.of(42);
const either = maybe.toEither('Value not found');
// Either.right(42)

const none = Maybe.none<number>();
const left = none.toEither('Value not found');
// Either.left('Value not found')

// Either to Maybe
const right = Either.right<string, number>(42);
const some = right.toMaybe();
// Maybe.of(42)

const leftEither = Either.left<string, number>('error');
const noneAgain = leftEither.toMaybe();
// Maybe.none()
```

---

## Best Practices

### 1. Use Maybe for Nullable Values

**Instead of**:

```typescript
function findUser(id: number): User | null {
  return database.get(id) ?? null;
}

const user = findUser(1);
if (user !== null) {
  console.log(user.name);
}
```

**Use**:

```typescript
function findUser(id: number): Maybe<User> {
  return Maybe.fromNullable(database.get(id));
}

findUser(1)
  .map((user) => user.name)
  .forEach((name) => console.log(name));
```

### 2. Use Either for Error Handling

**Instead of**:

```typescript
function parseJSON(json: string): any {
  try {
    return JSON.parse(json);
  } catch (error) {
    throw new Error('Parse failed');
  }
}
```

**Use**:

```typescript
function parseJSON<T>(json: string): Either<string, T> {
  return Either.tryCatch(
    () => JSON.parse(json) as T,
    (error) => `Parse error: ${error.message}`
  );
}

parseJSON<User>(jsonString).fold(
  (error) => console.error(error),
  (user) => console.log(user)
);
```

### 3. Chain Operations

```typescript
// Good: Chained operations
findUser(1)
  .map((user) => user.email)
  .map((email) => email.toLowerCase())
  .filter((email) => email.includes('@'))
  .getOrElse('no-email');

// Avoid: Nested if-checks
const user = findUser(1);
if (user) {
  const email = user.email;
  if (email) {
    const lower = email.toLowerCase();
    if (lower.includes('@')) {
      return lower;
    }
  }
}
return 'no-email';
```

### 4. Fail Fast vs Collect Errors

```typescript
// Fail fast (use sequence)
const results = sequenceEither([validation1, validation2, validation3]);
// Returns first error

// Collect all errors (use validation)
const results = validation([validation1, validation2, validation3]);
// Returns all errors
```

---

## Common Patterns

### Optional Chaining

```typescript
interface Company {
  ceo?: { name: string; email?: string };
}

function getCEOEmail(company: Company): Maybe<string> {
  return Maybe.fromNullable(company.ceo).flatMap((ceo) => Maybe.fromNullable(ceo.email));
}
```

### Error Recovery

```typescript
const result = parseJSON<User>(jsonString).orElse(Either.right(defaultUser)).getOrThrow();
```

### Conditional Logic

```typescript
Maybe.of(age)
  .filter((a) => a >= 18)
  .map((a) => 'Adult')
  .getOrElse('Minor');
```

---

## API Reference

### Maybe Methods

- `of(value)` - Create Maybe from value
- `none()` - Create empty Maybe
- `fromNullable(value)` - Create from nullable
- `map(fn)` - Transform value
- `flatMap(fn)` - Transform and flatten
- `filter(predicate)` - Filter value
- `getOrElse(default)` - Get value or default
- `fold(onNone, onSome)` - Fold into value
- `toEither(left)` - Convert to Either

### Either Methods

- `right(value)` - Create Right (success)
- `left(value)` - Create Left (error)
- `tryCatch(fn, onError)` - Try/catch wrapper
- `map(fn)` - Transform Right value
- `mapLeft(fn)` - Transform Left value
- `bimap(leftFn, rightFn)` - Transform both
- `flatMap(fn)` - Transform and flatten
- `fold(onLeft, onRight)` - Fold into value
- `toMaybe()` - Convert to Maybe

## Examples

See [functional-monads.ts](../src/examples/functional-monads.ts) for comprehensive examples.

## Next Steps

- Learn about [Optics](./OPTICS.md) for nested updates
- Read [Functional Programming Guide](./FUNCTIONAL-PROGRAMMING.md)
- Check out [Best Practices](./BEST-PRACTICES.md)
