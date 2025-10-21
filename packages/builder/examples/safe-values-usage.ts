/**
 * Safe Values Examples
 * Demonstrates Maybe and Either for safe error handling without crashes or exceptions
 *
 * What are Safe Values?
 * Safe Values (implemented as Monads) handle nullable values and errors safely,
 * replacing try/catch and null checks with functional patterns.
 */

import { Maybe, Either, sequenceMaybe, sequenceEither } from '@noony-serverless/type-builder';
import { createImmutableBuilder, pipe } from '@noony-serverless/type-builder';

// Example types
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

interface ValidationError {
  field: string;
  message: string;
}

/**
 * Example 1: Maybe - Handling Nullable Values
 */
export function example1_MaybeBasics() {
  console.log('\n=== Example 1: Maybe Basics ===\n');

  // Database simulation
  const users = new Map<number, User>([
    [1, { id: 1, name: 'Alice', email: 'alice@example.com', age: 30 }],
    [2, { id: 2, name: 'Bob', email: 'bob@example.com', age: 25 }],
  ]);

  // Safe database lookup
  function findUser(id: number): Maybe<User> {
    const user = users.get(id);
    return Maybe.fromNullable(user);
  }

  // Usage with Maybe
  const user1 = findUser(1)
    .map((u) => u.name)
    .map((name) => name.toUpperCase())
    .getOrElse('UNKNOWN');

  const user999 = findUser(999)
    .map((u) => u.name)
    .map((name) => name.toUpperCase())
    .getOrElse('UNKNOWN');

  console.log('User 1 name:', user1); // 'ALICE'
  console.log('User 999 name:', user999); // 'UNKNOWN'
}

/**
 * Example 2: Maybe - Chaining Operations
 */
export function example2_MaybeChaining() {
  console.log('\n=== Example 2: Maybe Chaining ===\n');

  // Nested structures
  interface Address {
    street: string;
    city: string;
    zipCode?: string;
  }

  interface UserWithAddress {
    id: number;
    name: string;
    address?: Address;
  }

  const users: UserWithAddress[] = [
    { id: 1, name: 'Alice', address: { street: '123 Main', city: 'NYC', zipCode: '10001' } },
    { id: 2, name: 'Bob', address: { street: '456 Oak', city: 'LA' } },
    { id: 3, name: 'Charlie' }, // No address
  ];

  // Safe nested access
  function getZipCode(user: UserWithAddress): Maybe<string> {
    return Maybe.fromNullable(user.address).flatMap((addr) => Maybe.fromNullable(addr.zipCode));
  }

  users.forEach((user) => {
    const zipCode = getZipCode(user).getOrElse('No ZIP code');
    console.log(`${user.name}: ${zipCode}`);
  });
}

/**
 * Example 3: Maybe with Builder
 */
export function example3_MaybeWithBuilder() {
  console.log('\n=== Example 3: Maybe with Builder ===\n');

  const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email', 'age']);

  // Build user from Maybe values
  function buildUserFromMaybes(
    id: Maybe<number>,
    name: Maybe<string>,
    email: Maybe<string>,
    age: Maybe<number>
  ): Maybe<User> {
    return id.flatMap((idVal) =>
      name.flatMap((nameVal) =>
        email.flatMap((emailVal) =>
          age.map((ageVal) => {
            const builder = pipe<User>(
              userBuilder.withId(idVal),
              userBuilder.withName(nameVal),
              userBuilder.withEmail(emailVal),
              userBuilder.withAge(ageVal)
            );
            return userBuilder.build(builder(userBuilder.empty()));
          })
        )
      )
    );
  }

  // Success case
  const user1 = buildUserFromMaybes(
    Maybe.of(1),
    Maybe.of('Alice'),
    Maybe.of('alice@example.com'),
    Maybe.of(30)
  );

  // Failure case (missing email)
  const user2 = buildUserFromMaybes(
    Maybe.of(2),
    Maybe.of('Bob'),
    Maybe.none<string>(),
    Maybe.of(25)
  );

  console.log('User 1 (success):', user1.getOrElse({} as User));
  console.log('User 2 (failure):', user2.isSome() ? 'Success' : 'Failed - missing data');
}

/**
 * Example 4: Either - Error Handling
 */
export function example4_EitherBasics() {
  console.log('\n=== Example 4: Either Basics ===\n');

  // Division with error handling
  function divide(a: number, b: number): Either<string, number> {
    if (b === 0) {
      return Either.left('Division by zero');
    }
    return Either.right(a / b);
  }

  // Usage
  const result1 = divide(10, 2)
    .map((n) => n * 2)
    .map((n) => n + 1)
    .fold(
      (error) => `Error: ${error}`,
      (value) => `Result: ${value}`
    );

  const result2 = divide(10, 0)
    .map((n) => n * 2)
    .map((n) => n + 1)
    .fold(
      (error) => `Error: ${error}`,
      (value) => `Result: ${value}`
    );

  console.log(result1); // 'Result: 11'
  console.log(result2); // 'Error: Division by zero'
}

/**
 * Example 5: Either - Validation
 */
export function example5_EitherValidation() {
  console.log('\n=== Example 5: Either Validation ===\n');

  // Validation functions
  function validateEmail(email: string): Either<ValidationError, string> {
    if (!email.includes('@')) {
      return Either.left({ field: 'email', message: 'Invalid email format' });
    }
    return Either.right(email);
  }

  function validateAge(age: number): Either<ValidationError, number> {
    if (age < 18) {
      return Either.left({ field: 'age', message: 'Must be 18 or older' });
    }
    if (age > 120) {
      return Either.left({ field: 'age', message: 'Invalid age' });
    }
    return Either.right(age);
  }

  function validateName(name: string): Either<ValidationError, string> {
    if (name.trim().length < 2) {
      return Either.left({ field: 'name', message: 'Name too short' });
    }
    return Either.right(name);
  }

  // Validate user data
  function validateUser(name: string, email: string, age: number): Either<ValidationError, User> {
    return validateName(name).flatMap((validName) =>
      validateEmail(email).flatMap((validEmail) =>
        validateAge(age).map((validAge) => ({
          id: 1,
          name: validName,
          email: validEmail,
          age: validAge,
        }))
      )
    );
  }

  // Valid user
  const validResult = validateUser('Alice', 'alice@example.com', 30);
  console.log(
    'Valid user:',
    validResult.fold(
      (err) => `Error in ${err.field}: ${err.message}`,
      (user) => `Success: ${user.name}`
    )
  );

  // Invalid email
  const invalidEmail = validateUser('Bob', 'invalid-email', 25);
  console.log(
    'Invalid email:',
    invalidEmail.fold(
      (err) => `Error in ${err.field}: ${err.message}`,
      (user) => `Success: ${user.name}`
    )
  );

  // Invalid age
  const invalidAge = validateUser('Charlie', 'charlie@example.com', 15);
  console.log(
    'Invalid age:',
    invalidAge.fold(
      (err) => `Error in ${err.field}: ${err.message}`,
      (user) => `Success: ${user.name}`
    )
  );
}

/**
 * Example 6: Either - TryCatch
 */
export function example6_EitherTryCatch() {
  console.log('\n=== Example 6: Either TryCatch ===\n');

  // Parse JSON safely
  function parseJSON<T>(json: string): Either<string, T> {
    return Either.tryCatch(
      () => JSON.parse(json) as T,
      (error) => `Parse error: ${error.message}`
    );
  }

  // Valid JSON
  const valid = parseJSON<User>('{"id":1,"name":"Alice","email":"alice@example.com","age":30}');
  console.log(
    'Valid JSON:',
    valid.fold(
      (error) => `Error: ${error}`,
      (user) => `Parsed user: ${user.name}`
    )
  );

  // Invalid JSON
  const invalid = parseJSON<User>('{invalid json}');
  console.log(
    'Invalid JSON:',
    invalid.fold(
      (error) => `Error: ${error}`,
      (user) => `Parsed user: ${user.name}`
    )
  );
}

/**
 * Example 7: Sequence - All or Nothing
 */
export function example7_Sequence() {
  console.log('\n=== Example 7: Sequence ===\n');

  // Maybe sequence
  const maybes1 = [Maybe.of(1), Maybe.of(2), Maybe.of(3)];
  const maybeResult1 = sequenceMaybe(maybes1);
  console.log('All Some:', maybeResult1.getOrElse([]));

  const maybes2 = [Maybe.of(1), Maybe.none<number>(), Maybe.of(3)];
  const maybeResult2 = sequenceMaybe(maybes2);
  console.log('Has None:', maybeResult2.isSome() ? 'Success' : 'Failed');

  // Either sequence
  const eithers1 = [
    Either.right<string, number>(1),
    Either.right<string, number>(2),
    Either.right<string, number>(3),
  ];
  const eitherResult1 = sequenceEither(eithers1);
  console.log('All Right:', eitherResult1.getOrElse([]));

  const eithers2 = [
    Either.right<string, number>(1),
    Either.left<string, number>('error'),
    Either.right<string, number>(3),
  ];
  const eitherResult2 = sequenceEither(eithers2);
  console.log(
    'Has Left:',
    eitherResult2.fold(
      (error) => `Failed: ${error}`,
      (values) => `Success: ${values}`
    )
  );
}

/**
 * Example 8: Either with Builder
 */
export function example8_EitherWithBuilder() {
  console.log('\n=== Example 8: Either with Builder ===\n');

  const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email', 'age']);

  // Build user with validation
  function buildValidatedUser(
    id: number,
    name: string,
    email: string,
    age: number
  ): Either<ValidationError, User> {
    return validateName(name).flatMap((validName) =>
      validateEmail(email).flatMap((validEmail) =>
        validateAge(age).map((validAge) => {
          const builder = pipe<User>(
            userBuilder.withId(id),
            userBuilder.withName(validName),
            userBuilder.withEmail(validEmail),
            userBuilder.withAge(validAge)
          );
          return userBuilder.build(builder(userBuilder.empty()));
        })
      )
    );
  }

  // Helper functions from example 5
  function validateEmail(email: string): Either<ValidationError, string> {
    if (!email.includes('@')) {
      return Either.left({ field: 'email', message: 'Invalid email format' });
    }
    return Either.right(email);
  }

  function validateAge(age: number): Either<ValidationError, number> {
    if (age < 18) {
      return Either.left({ field: 'age', message: 'Must be 18 or older' });
    }
    return Either.right(age);
  }

  function validateName(name: string): Either<ValidationError, string> {
    if (name.trim().length < 2) {
      return Either.left({ field: 'name', message: 'Name too short' });
    }
    return Either.right(name);
  }

  // Build users
  const user1 = buildValidatedUser(1, 'Alice', 'alice@example.com', 30);
  const user2 = buildValidatedUser(2, 'B', 'bob@example.com', 25);

  console.log(
    'User 1:',
    user1.fold(
      (err) => `Error: ${err.message}`,
      (user) => `Success: ${user.name}`
    )
  );

  console.log(
    'User 2:',
    user2.fold(
      (err) => `Error: ${err.message}`,
      (user) => `Success: ${user.name}`
    )
  );
}

/**
 * Example 9: Converting Between Maybe and Either
 */
export function example9_MaybeEitherConversion() {
  console.log('\n=== Example 9: Maybe/Either Conversion ===\n');

  // Maybe to Either
  const maybe1 = Maybe.of(42);
  const either1 = maybe1.toEither('Value not found');
  console.log(
    'Maybe.Some to Either:',
    either1.fold(
      (err) => `Left: ${err}`,
      (val) => `Right: ${val}`
    )
  );

  const maybe2 = Maybe.none<number>();
  const either2 = maybe2.toEither('Value not found');
  console.log(
    'Maybe.None to Either:',
    either2.fold(
      (err) => `Left: ${err}`,
      (val) => `Right: ${val}`
    )
  );

  // Either to Maybe
  const either3 = Either.right<string, number>(42);
  const maybe3 = either3.toMaybe();
  console.log('Either.Right to Maybe:', maybe3.getOrElse(0));

  const either4 = Either.left<string, number>('error');
  const maybe4 = either4.toMaybe();
  console.log('Either.Left to Maybe:', maybe4.isSome() ? 'Some' : 'None');
}

/**
 * Example 10: Real-World API Fetching
 */
export function example10_RealWorldAPI() {
  console.log('\n=== Example 10: Real-World API ===\n');

  // Simulate API response
  type APIResponse<T> = { success: true; data: T } | { success: false; error: string };

  function fetchUser(id: number): APIResponse<User> {
    if (id === 1) {
      return {
        success: true,
        data: { id: 1, name: 'Alice', email: 'alice@example.com', age: 30 },
      };
    }
    return { success: false, error: 'User not found' };
  }

  // Convert to Either
  function fetchUserEither(id: number): Either<string, User> {
    const response = fetchUser(id);
    if (response.success) {
      return Either.right(response.data);
    }
    return Either.left(response.error);
  }

  // Process with Either
  const result1 = fetchUserEither(1)
    .map((user) => user.name)
    .map((name) => name.toUpperCase())
    .fold(
      (error) => `Error: ${error}`,
      (name) => `User name: ${name}`
    );

  const result2 = fetchUserEither(999)
    .map((user) => user.name)
    .map((name) => name.toUpperCase())
    .fold(
      (error) => `Error: ${error}`,
      (name) => `User name: ${name}`
    );

  console.log(result1); // 'User name: ALICE'
  console.log(result2); // 'Error: User not found'
}

// Run all examples
export function runAllMonadExamples() {
  example1_MaybeBasics();
  example2_MaybeChaining();
  example3_MaybeWithBuilder();
  example4_EitherBasics();
  example5_EitherValidation();
  example6_EitherTryCatch();
  example7_Sequence();
  example8_EitherWithBuilder();
  example9_MaybeEitherConversion();
  example10_RealWorldAPI();
}

// Uncomment to run
// runAllMonadExamples();
