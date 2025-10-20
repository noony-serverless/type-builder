/* eslint-disable @typescript-eslint/no-explicit-any, no-redeclare, @typescript-eslint/no-unused-vars */
/**
 * Pipe Operator (Left-to-Right)
 * Combines multiple functions into a single function (left-to-right execution)
 */

import { BuilderState, Setter } from './types';

/**
 * Pipe functions left-to-right
 * pipe(f, g, h)(x) === h(g(f(x)))
 *
 * @example
 * ```typescript
 * const user = pipe<User>(
 *   userBuilder.withId(1),
 *   userBuilder.withName('Bob'),
 *   userBuilder.withEmail('bob@example.com')
 * )(userBuilder.empty());
 * ```
 *
 * @param fns - Functions to pipe (applied left-to-right)
 * @returns Piped function
 */
export function pipe<T>(...fns: Array<Setter<T>>): Setter<T> {
  return (initial: BuilderState<T>): BuilderState<T> => {
    return fns.reduce((acc, fn) => fn(acc), initial);
  };
}

/**
 * Pipe with explicit initial value
 *
 * @example
 * ```typescript
 * const user = pipeWith<User>(
 *   {},
 *   userBuilder.withId(1),
 *   userBuilder.withName('Bob')
 * );
 * ```
 */
export function pipeWith<T>(initial: BuilderState<T>, ...fns: Array<Setter<T>>): BuilderState<T> {
  return pipe(...fns)(initial);
}

/**
 * Pipe functions with different types (generic piping)
 *
 * @example
 * ```typescript
 * const result = pipeGeneric(
 *   getData,        // () -> RawData
 *   normalizeData,  // RawData -> Partial<User>
 *   buildUser       // Partial<User> -> User
 * )();
 * ```
 */
export function pipeGeneric<A, B>(f: (a: A) => B): (a: A) => B;

export function pipeGeneric<A, B, C>(f: (a: A) => B, g: (b: B) => C): (a: A) => C;

export function pipeGeneric<A, B, C, D>(
  f: (a: A) => B,
  g: (b: B) => C,
  h: (c: C) => D
): (a: A) => D;

export function pipeGeneric<A, B, C, D, E>(
  f: (a: A) => B,
  g: (b: B) => C,
  h: (c: C) => D,
  i: (d: D) => E
): (a: A) => E;

export function pipeGeneric(...fns: Array<(x: any) => any>): (x: any) => any {
  return (initial: any): any => {
    return fns.reduce((acc, fn) => fn(acc), initial);
  };
}

/**
 * Pipe with async functions
 *
 * @example
 * ```typescript
 * const user = await pipeAsync<User>(
 *   userBuilder.withName('Alice'),
 *   validateNameAsync,
 *   userBuilder.withEmail('alice@example.com'),
 *   validateEmailAsync
 * )(userBuilder.empty());
 * ```
 */
export function pipeAsync<T>(
  ...fns: Array<(x: BuilderState<T>) => Promise<BuilderState<T>>>
): (initial: BuilderState<T>) => Promise<BuilderState<T>> {
  return async (initial: BuilderState<T>): Promise<BuilderState<T>> => {
    let result = initial;
    for (const fn of fns) {
      result = await fn(result);
    }
    return result;
  };
}

/**
 * Pipe with error handling
 * Returns null if any function throws
 *
 * @example
 * ```typescript
 * const result = pipeSafe<User>(
 *   userBuilder.withName('John'),
 *   validateAge, // May throw
 *   userBuilder.withAge(25)
 * )(userBuilder.empty());
 *
 * if (result === null) {
 *   console.error('Pipe failed');
 * }
 * ```
 */
export function pipeSafe<T>(
  ...fns: Array<Setter<T>>
): (initial: BuilderState<T>) => BuilderState<T> | null {
  return (initial: BuilderState<T>): BuilderState<T> | null => {
    try {
      return pipe(...fns)(initial);
    } catch (error) {
      return null;
    }
  };
}

/**
 * Tap into pipe (for side effects)
 * Executes a function but doesn't modify the state
 *
 * @example
 * ```typescript
 * const user = pipe<User>(
 *   userBuilder.withName('Alice'),
 *   tap(state => console.log('After name:', state)),
 *   userBuilder.withEmail('alice@example.com'),
 *   tap(state => console.log('After email:', state))
 * )(userBuilder.empty());
 * ```
 */
export function tap<T>(sideEffect: (state: BuilderState<T>) => void): Setter<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    sideEffect(state);
    return state;
  };
}

/**
 * Conditional pipe
 * Only applies function if predicate is true
 *
 * @example
 * ```typescript
 * const user = pipe<User>(
 *   userBuilder.withName('Alice'),
 *   pipeIf(
 *     state => state.name === 'Alice',
 *     userBuilder.withRole('admin')
 *   )
 * )(userBuilder.empty());
 * ```
 */
export function pipeIf<T>(
  predicate: (state: BuilderState<T>) => boolean,
  fn: Setter<T>
): Setter<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    return predicate(state) ? fn(state) : state;
  };
}

/**
 * Apply multiple pipes conditionally
 *
 * @example
 * ```typescript
 * const user = pipeWhen<User>(
 *   userBuilder.withName('Alice'),
 *   [
 *     [state => state.name === 'Admin', userBuilder.withRole('admin')],
 *     [state => state.name === 'Guest', userBuilder.withRole('guest')]
 *   ]
 * )(userBuilder.empty());
 * ```
 */
export function pipeWhen<T>(
  ...conditions: Array<[(state: BuilderState<T>) => boolean, Setter<T>]>
): Setter<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    for (const [predicate, fn] of conditions) {
      if (predicate(state)) {
        return fn(state);
      }
    }
    return state;
  };
}
