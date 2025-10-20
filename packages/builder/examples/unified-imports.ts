/**
 * Unified Imports Example
 *
 * This example demonstrates how to use all functionality from a single import
 * instead of multiple subpath imports.
 *
 * Before (multiple imports):
 * ```typescript
 * import { builder } from '@noony-serverless/type-builder';
 * import { pipe, compose } from '@noony-serverless/type-builder';
 * import { Maybe, Either } from '@noony-serverless/type-builder/monads';
 * import { lens, prism } from '@noony-serverless/type-builder/optics';
 * ```
 *
 * After (single import):
 * ```typescript
 * import {
 *   builder, pipe, compose, Maybe, Either, lens, prism
 * } from '@noony-serverless/type-builder';
 * ```
 */

import { z } from 'zod';
import {
  // Core Builder Functions
  builder,
  builderAsync,

  // Functional Programming
  pipe,
  compose,
  createImmutableBuilder,
  partialApply,
  curriedBuilder,
  filterBuilder,
  mapBuilder,

  // Monads
  Maybe,
  Either,
  sequenceMaybe,
  sequenceEither,

  // Optics
  lens,
  prism,
  partialPrism,
  prop,
  path,

  // Types
  MaybeType,
  EitherType,
  LensType,
} from '@noony-serverless/type-builder';

// ============================================================================
// OOP Builder Example
// ============================================================================

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

// Traditional OOP builder
const createUser = builder(UserSchema);
const user = createUser().withId(1).withName('John Doe').withEmail('john@example.com').build();

console.log('OOP User:', user);

// ============================================================================
// Functional Programming Example
// ============================================================================

// Functional immutable builder
const userBuilder = createImmutableBuilder<typeof user>(['id', 'name', 'email']);

const functionalUser = pipe(
  userBuilder.withId(2),
  userBuilder.withName('Jane Doe'),
  userBuilder.withEmail('jane@example.com')
)(userBuilder.empty());

const finalUser = userBuilder.build(functionalUser);
console.log('Functional User:', finalUser);

// Function composition
const processUser = compose(
  (u: any) => ({ ...u, processed: true }),
  (u: any) => ({ ...u, timestamp: Date.now() })
);

const processedUser = processUser(user);
console.log('Processed User:', processedUser);

// ============================================================================
// Monads Example
// ============================================================================

// Maybe monad for optional values
const maybeName = Maybe.of(user.name);
const upperName = maybeName.map((name) => name.toUpperCase());
console.log('Maybe name:', upperName.getOrElse('No name'));

// Either monad for error handling
const eitherUser = Either.right(user);
const validatedUser = eitherUser.chain((u) =>
  u.email.includes('@') ? Either.right(u) : Either.left('Invalid email')
);
console.log('Either user:', validatedUser);

// ============================================================================
// Optics Example
// ============================================================================

// Lens for accessing nested properties
const nameLens = lens(prop('name'));
const userName = nameLens.view(user);
console.log('User name via lens:', userName);

// Prism for safe access to optional properties
const emailPrism = prism(prop('email'));
const userEmail = emailPrism.getOption(user);
console.log('User email via prism:', userEmail);

// ============================================================================
// Advanced Functional Composition
// ============================================================================

// Curried builder
const curriedUserBuilder = curriedBuilder((id: number, name: string, email: string) => ({
  id,
  name,
  email,
}));

const curriedUser = curriedUserBuilder(3)('Bob Doe')('bob@example.com');
console.log('Curried user:', curriedUser);

// Partial application
const partialUserBuilder = partialApply(
  (id: number, name: string, email: string, age: number) => ({
    id,
    name,
    email,
    age,
  }),
  [1, 'Alice']
);

const partialUser = partialUserBuilder('alice@example.com', 25);
console.log('Partial user:', partialUser);

// ============================================================================
// Higher-Order Functions
// ============================================================================

const users = [user, finalUser, curriedUser];

// Filter and map with builders
const filteredUsers = filterBuilder(users, (u) => u.id > 1);
const mappedUsers = mapBuilder(filteredUsers, (u) => ({ ...u, active: true }));

console.log('Filtered and mapped users:', mappedUsers);

// ============================================================================
// Async Example
// ============================================================================

async function asyncExample() {
  const asyncUserBuilder = builderAsync(UserSchema);

  const asyncUser = await asyncUserBuilder()
    .withId(4)
    .withName('Async User')
    .withEmail('async@example.com')
    .buildAsync();

  console.log('Async user:', asyncUser);
}

// ============================================================================
// Type Safety
// ============================================================================

// All functions are fully typed
const typedUser: typeof user = createUser()
  .withId(5)
  .withName('Typed User')
  .withEmail('typed@example.com')
  .build();

// TypeScript will catch errors at compile time
// const invalidUser = createUser().withId('not-a-number'); // ❌ Error

console.log('✅ All examples completed successfully!');
console.log('🎉 You can now import everything from a single package entry point!');
