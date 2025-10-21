/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Transducers
 * Efficient composable transformations
 */

import { BuilderState, Transducer } from '../types';
import { pipe } from '../composition/pipe';

/**
 * Transduce - compose multiple transformations efficiently
 * Transducers avoid creating intermediate arrays/objects
 *
 * @example
 * ```typescript
 * const normalizeEmail = (state: BuilderState<User>) => ({
 *   ...state,
 *   email: state.email?.toLowerCase()
 * });
 *
 * const incrementAge = (state: BuilderState<User>) => ({
 *   ...state,
 *   age: (state.age || 0) + 1
 * });
 *
 * const processUser = transduce<User>(
 *   normalizeEmail,
 *   incrementAge
 * );
 *
 * const result = processUser({ email: 'ALICE@EXAMPLE.COM', age: 24 });
 * // { email: 'alice@example.com', age: 25 }
 * ```
 */
export function transduce<T>(...transducers: Transducer<T>[]): Transducer<T> {
  return pipe(...transducers);
}

/**
 * Mapping transducer
 * Transforms a specific property
 *
 * @example
 * ```typescript
 * const uppercaseName = mapping<User, 'name'>(
 *   'name',
 *   name => name.toUpperCase()
 * );
 *
 * const result = uppercaseName({ name: 'alice', age: 25 });
 * // { name: 'ALICE', age: 25 }
 * ```
 */
export function mapping<T, K extends keyof T>(key: K, fn: (value: T[K]) => T[K]): Transducer<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    if (!(key in state)) {
      return state;
    }

    return Object.freeze({
      ...state,
      [key]: fn(state[key]!),
    } as BuilderState<T>);
  };
}

/**
 * Filtering transducer
 * Only passes state if predicate is true
 *
 * @example
 * ```typescript
 * const onlyAdults = filtering<User>(
 *   state => (state.age || 0) >= 18
 * );
 *
 * const adult = onlyAdults({ age: 25, name: 'Alice' }); // { age: 25, name: 'Alice' }
 * const minor = onlyAdults({ age: 15, name: 'Bob' }); // {} (filtered out)
 * ```
 */
export function filtering<T>(predicate: (state: BuilderState<T>) => boolean): Transducer<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    return predicate(state) ? state : Object.freeze({} as BuilderState<T>);
  };
}

/**
 * Taking transducer
 * Takes first n properties
 *
 * @example
 * ```typescript
 * const takeTwo = taking<User>(2);
 *
 * const state = { id: 1, name: 'Alice', email: 'a@example.com', age: 25 };
 * const result = takeTwo(state); // { id: 1, name: 'Alice' }
 * ```
 */
export function taking<T>(n: number): Transducer<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    const keys = Object.keys(state).slice(0, n);
    const result: any = {};

    for (const key of keys) {
      result[key] = state[key as keyof T];
    }

    return Object.freeze(result as BuilderState<T>);
  };
}

/**
 * Dropping transducer
 * Drops first n properties
 *
 * @example
 * ```typescript
 * const dropTwo = dropping<User>(2);
 *
 * const state = { id: 1, name: 'Alice', email: 'a@example.com', age: 25 };
 * const result = dropTwo(state); // { email: 'a@example.com', age: 25 }
 * ```
 */
export function dropping<T>(n: number): Transducer<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    const keys = Object.keys(state).slice(n);
    const result: any = {};

    for (const key of keys) {
      result[key] = state[key as keyof T];
    }

    return Object.freeze(result as BuilderState<T>);
  };
}

/**
 * Deduplication transducer
 * Removes duplicate values
 *
 * @example
 * ```typescript
 * const dedup = deduplicating<User>();
 *
 * const state = { id: 1, userId: 1, name: 'Alice', userName: 'Alice' };
 * const result = dedup(state); // { id: 1, name: 'Alice' }
 * ```
 */
export function deduplicating<T>(): Transducer<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    const seen = new Set();
    const result: any = {};

    for (const key in state) {
      const value = state[key];
      const valueStr = JSON.stringify(value);

      if (!seen.has(valueStr)) {
        seen.add(valueStr);
        result[key] = value;
      }
    }

    return Object.freeze(result as BuilderState<T>);
  };
}

/**
 * Flattening transducer
 * Flattens nested objects
 *
 * @example
 * ```typescript
 * const flatten = flattening<User>();
 *
 * const state = {
 *   name: 'Alice',
 *   address: { city: 'NYC', zip: '10001' }
 * };
 * const result = flatten(state);
 * // { name: 'Alice', 'address.city': 'NYC', 'address.zip': '10001' }
 * ```
 */
export function flattening<T>(separator: string = '.'): Transducer<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    const result: any = {};

    function flatten(obj: any, prefix: string = '') {
      for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}${separator}${key}` : key;

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          flatten(value, newKey);
        } else {
          result[newKey] = value;
        }
      }
    }

    flatten(state);

    return Object.freeze(result as BuilderState<T>);
  };
}

/**
 * Partitioning transducer
 * Splits state into chunks
 *
 * @example
 * ```typescript
 * const partitionByType = partitioning<User>(
 *   (key, value) => typeof value
 * );
 *
 * const state = { id: 1, name: 'Alice', age: 25, active: true };
 * const parts = partitionByType(state);
 * // Map { 'number' => { id: 1, age: 25 }, 'string' => { name: 'Alice' }, ... }
 * ```
 */
export function partitioning<T>(
  classifier: (key: keyof T, value: any) => string
): (state: BuilderState<T>) => Map<string, BuilderState<T>> {
  return (state: BuilderState<T>): Map<string, BuilderState<T>> => {
    const groups = new Map<string, any>();

    for (const key in state) {
      const group = classifier(key as keyof T, state[key]);

      if (!groups.has(group)) {
        groups.set(group, {});
      }

      groups.get(group)![key] = state[key];
    }

    // Freeze all partitions
    for (const [key, value] of groups.entries()) {
      groups.set(key, Object.freeze(value));
    }

    return groups;
  };
}

/**
 * Scanning transducer
 * Like reduce, but returns all intermediate results
 *
 * @example
 * ```typescript
 * const sumValues = scanning<User, number>(
 *   (acc, key, value) => acc + (typeof value === 'number' ? value : 0),
 *   0
 * );
 *
 * const state = { id: 1, age: 25, score: 100 };
 * const sums = sumValues(state); // [1, 26, 126]
 * ```
 */
export function scanning<T, R>(
  reducer: (acc: R, key: keyof T, value: any) => R,
  initial: R
): (state: BuilderState<T>) => R[] {
  return (state: BuilderState<T>): R[] => {
    const results: R[] = [];
    let acc = initial;

    for (const key in state) {
      acc = reducer(acc, key as keyof T, state[key]);
      results.push(acc);
    }

    return results;
  };
}

/**
 * Batching transducer
 * Groups properties into batches
 *
 * @example
 * ```typescript
 * const batchTwo = batching<User>(2);
 *
 * const state = { id: 1, name: 'Alice', email: 'a@example.com', age: 25 };
 * const batches = batchTwo(state);
 * // [{ id: 1, name: 'Alice' }, { email: 'a@example.com', age: 25 }]
 * ```
 */
export function batching<T>(size: number): (state: BuilderState<T>) => BuilderState<T>[] {
  return (state: BuilderState<T>): BuilderState<T>[] => {
    const keys = Object.keys(state);
    const batches: BuilderState<T>[] = [];

    for (let i = 0; i < keys.length; i += size) {
      const batch: any = {};
      const batchKeys = keys.slice(i, i + size);

      for (const key of batchKeys) {
        batch[key] = state[key as keyof T];
      }

      batches.push(Object.freeze(batch as BuilderState<T>));
    }

    return batches;
  };
}

/**
 * Windowing transducer
 * Creates sliding windows over properties
 *
 * @example
 * ```typescript
 * const window3 = windowing<User>(3);
 *
 * const state = { a: 1, b: 2, c: 3, d: 4, e: 5 };
 * const windows = window3(state);
 * // [{ a: 1, b: 2, c: 3 }, { b: 2, c: 3, d: 4 }, { c: 3, d: 4, e: 5 }]
 * ```
 */
export function windowing<T>(size: number): (state: BuilderState<T>) => BuilderState<T>[] {
  return (state: BuilderState<T>): BuilderState<T>[] => {
    const keys = Object.keys(state);
    const windows: BuilderState<T>[] = [];

    for (let i = 0; i <= keys.length - size; i++) {
      const window: any = {};
      const windowKeys = keys.slice(i, i + size);

      for (const key of windowKeys) {
        window[key] = state[key as keyof T];
      }

      windows.push(Object.freeze(window as BuilderState<T>));
    }

    return windows;
  };
}

/**
 * Compose transducers efficiently
 * Optimized composition for transducers
 *
 * @example
 * ```typescript
 * const process = composeTransducers<User>(
 *   filtering(state => state.age >= 18),
 *   mapping('email', email => email.toLowerCase()),
 *   deduplicating()
 * );
 * ```
 */
export function composeTransducers<T>(...transducers: Transducer<T>[]): Transducer<T> {
  return transduce(...transducers);
}

/**
 * Into - reduce transducer into a result
 *
 * @example
 * ```typescript
 * const sumAges = into<User, number>(
 *   (acc, state) => acc + (state.age || 0),
 *   0
 * );
 *
 * const states = [{ age: 25 }, { age: 30 }, { age: 35 }];
 * const total = states.reduce((acc, state) => sumAges(state)(acc), 0);
 * ```
 */
export function into<T, R>(
  reducer: (acc: R, state: BuilderState<T>) => R,
  _initial: R
): (state: BuilderState<T>) => (acc: R) => R {
  return (state: BuilderState<T>) => (acc: R) => reducer(acc, state);
}
