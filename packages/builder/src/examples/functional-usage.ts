/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Functional Programming Examples
 * Demonstrates core FP patterns with the builder
 */

import {
  createImmutableBuilder,
  pipe,
  compose,
  curry2,
  partial,
  filterBuilder,
  mapBuilder,
  type BuilderState,
} from '../functional';

// Example types
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  role: 'admin' | 'user' | 'guest';
  active: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

/**
 * Example 1: Immutable Builder
 */
export function example1_ImmutableBuilder() {
  console.log('\n=== Example 1: Immutable Builder ===\n');

  // Create builder
  const userBuilder = createImmutableBuilder<User>([
    'id',
    'name',
    'email',
    'age',
    'role',
    'active',
  ]);

  // Build step by step (each step returns new state)
  const state1 = userBuilder.empty();
  const state2 = userBuilder.withId(1)(state1);
  const state3 = userBuilder.withName('Alice')(state2);
  const state4 = userBuilder.withEmail('alice@example.com')(state3);
  const state5 = userBuilder.withAge(30)(state4);
  const state6 = userBuilder.withRole('admin')(state5);
  const state7 = userBuilder.withActive(true)(state6);

  const user = userBuilder.build(state7);

  console.log('Built user:', user);
  console.log('All states are different objects (immutable)');
  console.log('state1 !== state2:', state1 !== state2);
  console.log('state2 !== state3:', state2 !== state3);
}

/**
 * Example 2: Pipe (Left-to-Right Composition)
 */
export function example2_Pipe() {
  console.log('\n=== Example 2: Pipe ===\n');

  const userBuilder = createImmutableBuilder<User>([
    'id',
    'name',
    'email',
    'age',
    'role',
    'active',
  ]);

  // Pipe reads naturally: start -> step1 -> step2 -> step3
  const buildAdmin = pipe<User>(
    userBuilder.withId(999),
    userBuilder.withName('Admin'),
    userBuilder.withEmail('admin@example.com'),
    userBuilder.withAge(35),
    userBuilder.withRole('admin'),
    userBuilder.withActive(true)
  );

  const admin = userBuilder.build(buildAdmin(userBuilder.empty()));

  console.log('Admin user:', admin);
}

/**
 * Example 3: Compose (Right-to-Left Composition)
 */
export function example3_Compose() {
  console.log('\n=== Example 3: Compose ===\n');

  const userBuilder = createImmutableBuilder<User>([
    'id',
    'name',
    'email',
    'age',
    'role',
    'active',
  ]);

  // Compose is right-to-left (mathematical composition)
  const buildGuest = compose<User>(
    userBuilder.withActive(false), // Applied last
    userBuilder.withRole('guest'),
    userBuilder.withAge(18),
    userBuilder.withEmail('guest@example.com'),
    userBuilder.withName('Guest'),
    userBuilder.withId(0) // Applied first
  );

  const guest = userBuilder.build(buildGuest(userBuilder.empty()));

  console.log('Guest user:', guest);
}

/**
 * Example 4: Currying
 */
export function example4_Currying() {
  console.log('\n=== Example 4: Currying ===\n');

  // Curried function for building users
  const createUser = (id: number) => (name: string) => (email: string) => ({
    id,
    name,
    email,
    age: 0,
    role: 'user' as const,
    active: true,
  });

  // Partially apply
  const createUserWithId1 = createUser(1);
  const createAlice = createUserWithId1('Alice');
  const alice = createAlice('alice@example.com');

  console.log('Curried user creation:', alice);

  // Using curry2 helper
  const setField = curry2(<T, K extends keyof T>(state: BuilderState<T>, key: K, value: T[K]) =>
    Object.freeze({ ...state, [key]: value } as BuilderState<T>)
  );

  const setName = setField({} as BuilderState<User>)('name');
  const state = setName('Bob');

  console.log('Curried field setter:', state);
}

/**
 * Example 5: Partial Application
 */
export function example5_PartialApplication() {
  console.log('\n=== Example 5: Partial Application ===\n');

  const userBuilder = createImmutableBuilder<User>([
    'id',
    'name',
    'email',
    'age',
    'role',
    'active',
  ]);

  // Create template with defaults
  const defaultUser = partial<User>({
    role: 'user',
    active: true,
    age: 18,
  });

  // Build users with defaults
  const buildUser = pipe<User>(
    defaultUser, // Apply defaults first
    userBuilder.withId(1),
    userBuilder.withName('Charlie'),
    userBuilder.withEmail('charlie@example.com')
  );

  const charlie = userBuilder.build(buildUser(userBuilder.empty()));

  console.log('User with defaults:', charlie);
  console.log('Role (from default):', charlie.role);
  console.log('Active (from default):', charlie.active);
}

/**
 * Example 6: Higher-Order Functions
 */
export function example6_HigherOrder() {
  console.log('\n=== Example 6: Higher-Order Functions ===\n');

  const productBuilder = createImmutableBuilder<Product>([
    'id',
    'name',
    'price',
    'category',
    'inStock',
  ]);

  // Build a product
  const buildProduct = pipe<Product>(
    productBuilder.withId('p1'),
    productBuilder.withName('Laptop'),
    productBuilder.withPrice(999.99),
    productBuilder.withCategory('Electronics'),
    productBuilder.withInStock(true)
  );

  let state = buildProduct(productBuilder.empty());

  // Filter: Keep only certain fields
  const onlyPriceAndStock = filterBuilder<Product>((key) =>
    ['price', 'inStock'].includes(key as string)
  );

  const filtered = productBuilder.build(onlyPriceAndStock(state));
  console.log('Filtered product (price & stock only):', filtered);

  // Map: Transform values
  const doublePrice = mapBuilder<Product, number>((key, value) => {
    if (key === 'price') {
      return (value as number) * 2;
    }
    return value as number;
  });

  state = buildProduct(productBuilder.empty());
  const doubled = productBuilder.build(doublePrice(state));
  console.log('Product with doubled price:', doubled);
}

/**
 * Example 7: Function Composition with Transformations
 */
export function example7_ComposedTransformations() {
  console.log('\n=== Example 7: Composed Transformations ===\n');

  const userBuilder = createImmutableBuilder<User>([
    'id',
    'name',
    'email',
    'age',
    'role',
    'active',
  ]);

  // Custom transformation: Normalize email
  const normalizeEmail = (state: BuilderState<User>): BuilderState<User> => {
    if (state.email) {
      return Object.freeze({
        ...state,
        email: state.email.toLowerCase().trim(),
      });
    }
    return state;
  };

  // Custom transformation: Ensure adult
  const ensureAdult = (state: BuilderState<User>): BuilderState<User> => {
    if (state.age && state.age < 18) {
      return Object.freeze({ ...state, age: 18 });
    }
    return state;
  };

  // Compose transformations
  const buildValidUser = pipe<User>(
    userBuilder.withId(2),
    userBuilder.withName('David'),
    userBuilder.withEmail('  DAVID@EXAMPLE.COM  '), // Will be normalized
    userBuilder.withAge(16), // Will be set to 18
    userBuilder.withRole('user'),
    userBuilder.withActive(true),
    normalizeEmail, // Apply normalization
    ensureAdult // Apply validation
  );

  const david = userBuilder.build(buildValidUser(userBuilder.empty()));

  console.log('User with transformations:', david);
  console.log('Email (normalized):', david.email);
  console.log('Age (ensured adult):', david.age);
}

/**
 * Example 8: Building Collections
 */
export function example8_Collections() {
  console.log('\n=== Example 8: Building Collections ===\n');

  const userBuilder = createImmutableBuilder<User>([
    'id',
    'name',
    'email',
    'age',
    'role',
    'active',
  ]);

  // Factory function for creating users
  const createUser = (id: number, name: string, email: string, role: User['role']) => {
    return pipe<User>(
      userBuilder.withId(id),
      userBuilder.withName(name),
      userBuilder.withEmail(email),
      userBuilder.withAge(25),
      userBuilder.withRole(role),
      userBuilder.withActive(true)
    );
  };

  // Build multiple users
  const users = [
    createUser(1, 'Alice', 'alice@example.com', 'admin'),
    createUser(2, 'Bob', 'bob@example.com', 'user'),
    createUser(3, 'Charlie', 'charlie@example.com', 'user'),
    createUser(4, 'Diana', 'diana@example.com', 'guest'),
  ].map((builder) => userBuilder.build(builder(userBuilder.empty())));

  console.log('Created users:', users);
  console.log('Total users:', users.length);
}

/**
 * Example 9: Conditional Building
 */
export function example9_ConditionalBuilding() {
  console.log('\n=== Example 9: Conditional Building ===\n');

  const userBuilder = createImmutableBuilder<User>([
    'id',
    'name',
    'email',
    'age',
    'role',
    'active',
  ]);

  // Conditional setter
  const setRoleIfAdmin = (isAdmin: boolean) => {
    return isAdmin ? userBuilder.withRole('admin') : userBuilder.withRole('user');
  };

  // Build with condition
  const buildConditionalUser = (isAdmin: boolean) => {
    return pipe<User>(
      userBuilder.withId(5),
      userBuilder.withName('Eve'),
      userBuilder.withEmail('eve@example.com'),
      userBuilder.withAge(28),
      setRoleIfAdmin(isAdmin), // Conditional
      userBuilder.withActive(true)
    );
  };

  const adminEve = userBuilder.build(buildConditionalUser(true)(userBuilder.empty()));
  const userEve = userBuilder.build(buildConditionalUser(false)(userBuilder.empty()));

  console.log('Eve as admin:', adminEve);
  console.log('Eve as user:', userEve);
}

/**
 * Example 10: Reusable Builder Patterns
 */
export function example10_ReusablePatterns() {
  console.log('\n=== Example 10: Reusable Patterns ===\n');

  const userBuilder = createImmutableBuilder<User>([
    'id',
    'name',
    'email',
    'age',
    'role',
    'active',
  ]);

  // Reusable pattern: Default admin
  const defaultAdmin = pipe<User>(
    userBuilder.withRole('admin'),
    userBuilder.withActive(true),
    userBuilder.withAge(30)
  );

  // Reusable pattern: Default guest
  const defaultGuest = pipe<User>(
    userBuilder.withRole('guest'),
    userBuilder.withActive(false),
    userBuilder.withAge(18)
  );

  // Build specific admins
  const admin1 = userBuilder.build(
    pipe<User>(
      defaultAdmin, // Apply admin defaults
      userBuilder.withId(100),
      userBuilder.withName('Admin 1'),
      userBuilder.withEmail('admin1@example.com')
    )(userBuilder.empty())
  );

  const admin2 = userBuilder.build(
    pipe<User>(
      defaultAdmin, // Apply admin defaults
      userBuilder.withId(101),
      userBuilder.withName('Admin 2'),
      userBuilder.withEmail('admin2@example.com')
    )(userBuilder.empty())
  );

  console.log('Admin 1:', admin1);
  console.log('Admin 2:', admin2);
  console.log('Both have admin role and active=true from pattern');
}

// Run all examples
export function runAllExamples() {
  example1_ImmutableBuilder();
  example2_Pipe();
  example3_Compose();
  example4_Currying();
  example5_PartialApplication();
  example6_HigherOrder();
  example7_ComposedTransformations();
  example8_Collections();
  example9_ConditionalBuilding();
  example10_ReusablePatterns();
}

// Uncomment to run
// runAllExamples();
