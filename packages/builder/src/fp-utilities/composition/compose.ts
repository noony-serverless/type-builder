/* eslint-disable @typescript-eslint/no-explicit-any, no-redeclare, @typescript-eslint/no-unused-vars */
/**
 * Function Composition (Right-to-Left)
 * Combines multiple functions into a single function
 */

import { BuilderState, Setter } from '../types';

/**
 * Compose functions right-to-left
 * compose(f, g, h)(x) === f(g(h(x)))
 *
 * @example
 * ```typescript
 * const buildAdmin = compose<User>(
 *   userBuilder.withRole('admin'),
 *   userBuilder.withName('Admin'),
 *   userBuilder.withId(999)
 * );
 *
 * const admin = userBuilder.build(buildAdmin(userBuilder.empty()));
 * ```
 *
 * @param fns - Functions to compose (applied right-to-left)
 * @returns Composed function
 */
export function compose<T>(...fns: Array<Setter<T>>): Setter<T> {
  return (initial: BuilderState<T>): BuilderState<T> => {
    return fns.reduceRight((acc, fn) => fn(acc), initial);
  };
}

/**
 * Compose with explicit initial value
 *
 * @example
 * ```typescript
 * const admin = composeWith<User>(
 *   {},
 *   userBuilder.withId(999),
 *   userBuilder.withName('Admin')
 * );
 * ```
 */
export function composeWith<T>(
  initial: BuilderState<T>,
  ...fns: Array<Setter<T>>
): BuilderState<T> {
  return compose(...fns)(initial);
}

/**
 * Compose functions with different types (generic composition)
 *
 * @example
 * ```typescript
 * const processUser = composeGeneric(
 *   buildUser,      // Partial<User> -> User
 *   normalizeEmail, // Partial<User> -> Partial<User>
 *   validateAge     // Partial<User> -> Partial<User>
 * );
 * ```
 */
export function composeGeneric<A, B, C>(f: (b: B) => C, g: (a: A) => B): (a: A) => C;

export function composeGeneric<A, B, C, D>(
  f: (c: C) => D,
  g: (b: B) => C,
  h: (a: A) => B
): (a: A) => D;

export function composeGeneric<A, B, C, D, E>(
  f: (d: D) => E,
  g: (c: C) => D,
  h: (b: B) => C,
  i: (a: A) => B
): (a: A) => E;

export function composeGeneric(...fns: Array<(x: any) => any>): (x: any) => any {
  return (initial: any): any => {
    return fns.reduceRight((acc, fn) => fn(acc), initial);
  };
}

/**
 * Compose with async functions
 *
 * @example
 * ```typescript
 * const buildUserAsync = composeAsync<User>(
 *   validateEmailAsync,
 *   userBuilder.withEmail('test@example.com'),
 *   userBuilder.withName('Test')
 * );
 *
 * const user = await buildUserAsync(userBuilder.empty());
 * ```
 */
export function composeAsync<T>(
  ...fns: Array<(x: BuilderState<T>) => Promise<BuilderState<T>>>
): (initial: BuilderState<T>) => Promise<BuilderState<T>> {
  return async (initial: BuilderState<T>): Promise<BuilderState<T>> => {
    let result = initial;
    // Apply functions right-to-left
    for (let i = fns.length - 1; i >= 0; i--) {
      const fn = fns[i];
      if (fn) {
        result = await fn(result);
      }
    }
    return result;
  };
}

/**
 * Compose with error handling
 * Returns null if any function throws
 *
 * @example
 * ```typescript
 * const safeBuilder = composeSafe<User>(
 *   userBuilder.withAge(25),
 *   validateAge,  // May throw
 *   userBuilder.withName('John')
 * );
 *
 * const result = safeBuilder(userBuilder.empty());
 * if (result === null) {
 *   console.error('Composition failed');
 * }
 * ```
 */
export function composeSafe<T>(
  ...fns: Array<Setter<T>>
): (initial: BuilderState<T>) => BuilderState<T> | null {
  return (initial: BuilderState<T>): BuilderState<T> | null => {
    try {
      return compose(...fns)(initial);
    } catch (error) {
      return null;
    }
  };
}
