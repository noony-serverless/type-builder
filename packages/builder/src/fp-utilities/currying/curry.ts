/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Currying & Partial Application
 * Transform functions to accept arguments one at a time
 */

import { BuilderState, Setter } from '../types';
import { ZodSchema } from 'zod';

/**
 * Create a curried builder
 * Returns a function that accepts key-value pairs one at a time
 *
 * @example
 * ```typescript
 * const setUserProp = curriedBuilder<User>(['id', 'name', 'email']);
 * const setId = setUserProp('id');
 * const setName = setUserProp('name');
 *
 * const state = pipe(
 *   setId(1),
 *   setName('Alice')
 * )({});
 * ```
 */
export function curriedBuilder<T>(
  _keys: (keyof T & string)[]
): <K extends keyof T>(key: K) => (value: T[K]) => Setter<T> {
  return <K extends keyof T>(key: K) => {
    return (value: T[K]) => {
      return (state: BuilderState<T>): BuilderState<T> => {
        return Object.freeze({
          ...state,
          [key]: value,
        } as BuilderState<T>);
      };
    };
  };
}

/**
 * Curry a setter function
 * Transforms a 2-argument function into curried form
 *
 * @example
 * ```typescript
 * const setter = curry((key: string, value: any, state: BuilderState<User>) => ({
 *   ...state,
 *   [key]: value
 * }));
 *
 * const setName = setter('name');
 * const state = setName('Alice')({});
 * ```
 */
export function curry<T, K extends keyof T>(
  fn: (key: K, value: T[K], state: BuilderState<T>) => BuilderState<T>
): (key: K) => (value: T[K]) => (state: BuilderState<T>) => BuilderState<T> {
  return (key: K) => (value: T[K]) => (state: BuilderState<T>) => {
    return fn(key, value, state);
  };
}

/**
 * Curry with 2 parameters
 */
export function curry2<A, B, R>(fn: (a: A, b: B) => R): (a: A) => (b: B) => R {
  return (a: A) => (b: B) => fn(a, b);
}

/**
 * Curry with 3 parameters
 */
export function curry3<A, B, C, R>(fn: (a: A, b: B, c: C) => R): (a: A) => (b: B) => (c: C) => R {
  return (a: A) => (b: B) => (c: C) => fn(a, b, c);
}

/**
 * Curry with 4 parameters
 */
export function curry4<A, B, C, D, R>(
  fn: (a: A, b: B, c: C, d: D) => R
): (a: A) => (b: B) => (c: C) => (d: D) => R {
  return (a: A) => (b: B) => (c: C) => (d: D) => fn(a, b, c, d);
}

/**
 * Auto-curry (works with any arity)
 * Note: Less type-safe than explicit curry functions
 *
 * @example
 * ```typescript
 * const add = (a: number, b: number, c: number) => a + b + c;
 * const curriedAdd = autoCurry(add);
 * const result = curriedAdd(1)(2)(3); // 6
 * ```
 */
export function autoCurry<T extends (...args: any[]) => any>(
  fn: T,
  arity: number = fn.length
): any {
  return function curried(...args: any[]): any {
    if (args.length >= arity) {
      return fn(...args);
    }
    return (...nextArgs: any[]) => curried(...args, ...nextArgs);
  };
}

/**
 * Uncurry a curried function
 *
 * @example
 * ```typescript
 * const curried = (a: number) => (b: number) => a + b;
 * const uncurried = uncurry2(curried);
 * uncurried(1, 2); // 3
 * ```
 */
export function uncurry2<A, B, R>(fn: (a: A) => (b: B) => R): (a: A, b: B) => R {
  return (a: A, b: B) => fn(a)(b);
}

/**
 * Uncurry with 3 parameters
 */
export function uncurry3<A, B, C, R>(fn: (a: A) => (b: B) => (c: C) => R): (a: A, b: B, c: C) => R {
  return (a: A, b: B, c: C) => fn(a)(b)(c);
}

/**
 * Flip argument order for binary function
 *
 * @example
 * ```typescript
 * const subtract = (a: number, b: number) => a - b;
 * const flipped = flip(subtract);
 * flipped(3, 10); // 7 (10 - 3)
 * ```
 */
export function flip<A, B, R>(fn: (a: A, b: B) => R): (b: B, a: A) => R {
  return (b: B, a: A) => fn(a, b);
}

/**
 * Create a curried builder function with validation
 *
 * @example
 * ```typescript
 * const buildUser = curriedBuilderWithSchema(UserSchema);
 * const user = buildUser({ id: 1 })({ name: 'Alice' })({ email: 'a@example.com' });
 * ```
 */
export function curriedBuilderWithSchema<T>(
  schema: ZodSchema<T>
): (partial: Partial<T>) => (state: BuilderState<T>) => T {
  return (partial: Partial<T>) => {
    return (state: BuilderState<T>): T => {
      const merged = { ...state, ...partial };
      return schema.parse(merged);
    };
  };
}

/**
 * Memoize a curried function (cache results)
 *
 * @example
 * ```typescript
 * const expensiveFn = (a: number) => (b: number) => {
 *   // Expensive computation
 *   return a + b;
 * };
 *
 * const memoized = memoizeCurried(expensiveFn);
 * memoized(1)(2); // Computed
 * memoized(1)(2); // Cached
 * ```
 */
export function memoizeCurried<A, B, R>(fn: (a: A) => (b: B) => R): (a: A) => (b: B) => R {
  const cache = new Map<A, Map<B, R>>();

  return (a: A) => {
    if (!cache.has(a)) {
      cache.set(a, new Map());
    }

    const innerCache = cache.get(a)!;

    return (b: B): R => {
      if (!innerCache.has(b)) {
        innerCache.set(b, fn(a)(b));
      }
      return innerCache.get(b)!;
    };
  };
}
