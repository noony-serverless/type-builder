/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Higher-Order Functions
 * Functional utilities for transforming builder states
 */

import { BuilderState, Setter, Predicate, Reducer } from '../types';

/**
 * Filter builder properties
 * Only keeps properties that satisfy the predicate
 *
 * @example
 * ```typescript
 * const cleanState = filterBuilder<User>(
 *   (key, value) => value !== undefined && value !== null
 * );
 *
 * const state = { id: 1, name: 'Alice', email: undefined };
 * const cleaned = cleanState(state); // { id: 1, name: 'Alice' }
 * ```
 */
export function filterBuilder<T>(predicate: Predicate<T>): Setter<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    const result: any = {};

    for (const key in state) {
      if (predicate(key as keyof T, state[key as keyof T]!)) {
        result[key] = state[key];
      }
    }

    return Object.freeze(result as BuilderState<T>);
  };
}

/**
 * Map over builder properties
 * Transforms all property values
 *
 * @example
 * ```typescript
 * const uppercaseStrings = mapBuilder<User, string>(
 *   (key, value) => typeof value === 'string' ? value.toUpperCase() : value
 * );
 *
 * const state = { name: 'alice', email: 'alice@example.com' };
 * const result = uppercaseStrings(state);
 * // { name: 'ALICE', email: 'ALICE@EXAMPLE.COM' }
 * ```
 */
export function mapBuilder<T>(transform: (key: keyof T, value: any) => any): Setter<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    const result: any = {};

    for (const key in state) {
      result[key] = transform(key as keyof T, state[key]);
    }

    return Object.freeze(result as BuilderState<T>);
  };
}

/**
 * Reduce/fold over builder properties
 * Accumulates a single value from all properties
 *
 * @example
 * ```typescript
 * const countProps = foldBuilder<User, number>(
 *   (acc, key, value) => acc + 1,
 *   0
 * );
 *
 * const state = { id: 1, name: 'Alice', email: 'alice@example.com' };
 * const count = countProps(state); // 3
 * ```
 */
export function foldBuilder<T, R>(
  reducer: Reducer<T, R>,
  initial: R
): (state: BuilderState<T>) => R {
  return (state: BuilderState<T>): R => {
    let acc = initial;

    for (const key in state) {
      acc = reducer(acc, key as keyof T, state[key as keyof T]!);
    }

    return acc;
  };
}

/**
 * For each property (side effects)
 *
 * @example
 * ```typescript
 * const logAll = forEachBuilder<User>(
 *   (key, value) => console.log(`${key}: ${value}`)
 * );
 *
 * logAll({ id: 1, name: 'Alice' });
 * // Logs: id: 1
 * // Logs: name: Alice
 * ```
 */
export function forEachBuilder<T>(
  fn: (key: keyof T, value: T[keyof T]) => void
): (state: BuilderState<T>) => void {
  return (state: BuilderState<T>): void => {
    for (const key in state) {
      fn(key as keyof T, state[key as keyof T]!);
    }
  };
}

/**
 * Pick specific properties
 *
 * @example
 * ```typescript
 * const pickUserInfo = pick<User>(['id', 'name', 'email']);
 *
 * const state = { id: 1, name: 'Alice', email: 'a@example.com', age: 25, role: 'admin' };
 * const picked = pickUserInfo(state); // { id: 1, name: 'Alice', email: 'a@example.com' }
 * ```
 */
export function pick<T>(keys: (keyof T)[]): Setter<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    const result: any = {};

    for (const key of keys) {
      if (key in state) {
        result[key] = state[key];
      }
    }

    return Object.freeze(result as BuilderState<T>);
  };
}

/**
 * Omit specific properties
 *
 * @example
 * ```typescript
 * const omitSensitive = omit<User>(['password', 'ssn']);
 *
 * const state = { id: 1, name: 'Alice', password: 'secret', ssn: '123-45-6789' };
 * const safe = omitSensitive(state); // { id: 1, name: 'Alice' }
 * ```
 */
export function omit<T>(keys: (keyof T)[]): Setter<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    const result: any = { ...state };
    const omitSet = new Set(keys);

    for (const key of omitSet) {
      delete result[key];
    }

    return Object.freeze(result as BuilderState<T>);
  };
}

/**
 * Rename properties
 *
 * @example
 * ```typescript
 * const renameFields = rename<User>({
 *   userName: 'name',
 *   userEmail: 'email'
 * });
 *
 * const state = { userName: 'Alice', userEmail: 'alice@example.com' };
 * const renamed = renameFields(state); // { name: 'Alice', email: 'alice@example.com' }
 * ```
 */
export function rename<T>(mapping: Record<string, keyof T>): Setter<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    const result: any = { ...state };

    for (const oldKey in mapping) {
      if (oldKey in result) {
        const newKey = mapping[oldKey];
        result[newKey] = result[oldKey];
        delete result[oldKey];
      }
    }

    return Object.freeze(result as BuilderState<T>);
  };
}

/**
 * Group properties by predicate
 *
 * @example
 * ```typescript
 * const [strings, numbers] = groupBy<User>(
 *   (key, value) => typeof value === 'string'
 * )({ id: 1, name: 'Alice', age: 25, email: 'a@example.com' });
 *
 * // strings: { name: 'Alice', email: 'a@example.com' }
 * // numbers: { id: 1, age: 25 }
 * ```
 */
export function groupBy<T>(
  predicate: Predicate<T>
): (state: BuilderState<T>) => [BuilderState<T>, BuilderState<T>] {
  return (state: BuilderState<T>): [BuilderState<T>, BuilderState<T>] => {
    const truthy: any = {};
    const falsy: any = {};

    for (const key in state) {
      if (predicate(key as keyof T, state[key as keyof T]!)) {
        truthy[key] = state[key];
      } else {
        falsy[key] = state[key];
      }
    }

    return [Object.freeze(truthy as BuilderState<T>), Object.freeze(falsy as BuilderState<T>)];
  };
}

/**
 * Partition into groups
 *
 * @example
 * ```typescript
 * const partitioned = partition<User>(
 *   (key, value) => typeof value
 * )({ id: 1, name: 'Alice', age: 25, active: true });
 *
 * // { number: { id: 1, age: 25 }, string: { name: 'Alice' }, boolean: { active: true } }
 * ```
 */
export function partition<T>(
  classifier: (key: keyof T, value: any) => string
): (state: BuilderState<T>) => Record<string, BuilderState<T>> {
  return (state: BuilderState<T>): Record<string, BuilderState<T>> => {
    const groups: Record<string, any> = {};

    for (const key in state) {
      const group = classifier(key as keyof T, state[key]);

      if (!groups[group]) {
        groups[group] = {};
      }

      groups[group][key] = state[key];
    }

    // Freeze all groups
    for (const group in groups) {
      groups[group] = Object.freeze(groups[group]);
    }

    return groups;
  };
}

/**
 * Check if any property satisfies predicate
 *
 * @example
 * ```typescript
 * const hasUndefined = some<User>(
 *   (key, value) => value === undefined
 * );
 *
 * hasUndefined({ id: 1, name: undefined }); // true
 * ```
 */
export function some<T>(predicate: Predicate<T>): (state: BuilderState<T>) => boolean {
  return (state: BuilderState<T>): boolean => {
    for (const key in state) {
      if (predicate(key as keyof T, state[key as keyof T]!)) {
        return true;
      }
    }
    return false;
  };
}

/**
 * Check if all properties satisfy predicate
 *
 * @example
 * ```typescript
 * const allDefined = every<User>(
 *   (key, value) => value !== undefined
 * );
 *
 * allDefined({ id: 1, name: 'Alice' }); // true
 * allDefined({ id: 1, name: undefined }); // false
 * ```
 */
export function every<T>(predicate: Predicate<T>): (state: BuilderState<T>) => boolean {
  return (state: BuilderState<T>): boolean => {
    for (const key in state) {
      if (!predicate(key as keyof T, state[key as keyof T]!)) {
        return false;
      }
    }
    return true;
  };
}

/**
 * Find first property that satisfies predicate
 *
 * @example
 * ```typescript
 * const findEmail = find<User>(
 *   (key, value) => key === 'email'
 * );
 *
 * const result = findEmail({ id: 1, name: 'Alice', email: 'a@example.com' });
 * // ['email', 'a@example.com']
 * ```
 */
export function find<T>(
  predicate: Predicate<T>
): (state: BuilderState<T>) => [keyof T, T[keyof T]] | undefined {
  return (state: BuilderState<T>): [keyof T, T[keyof T]] | undefined => {
    for (const key in state) {
      if (predicate(key as keyof T, state[key as keyof T]!)) {
        return [key as keyof T, state[key as keyof T]!];
      }
    }
    return undefined;
  };
}

/**
 * Compact - remove null and undefined values
 *
 * @example
 * ```typescript
 * const removeNulls = compact<User>();
 *
 * const state = { id: 1, name: 'Alice', email: null, age: undefined };
 * const compacted = removeNulls(state); // { id: 1, name: 'Alice' }
 * ```
 */
export function compact<T>(): Setter<T> {
  return filterBuilder<T>((_key, value) => value !== null && value !== undefined);
}

/**
 * Defaults - apply default values for missing keys
 *
 * @example
 * ```typescript
 * const withDefaults = defaults<User>({
 *   role: 'user',
 *   isActive: true
 * });
 *
 * const state = { id: 1, name: 'Alice' };
 * const result = withDefaults(state);
 * // { id: 1, name: 'Alice', role: 'user', isActive: true }
 * ```
 */
export function defaults<T>(defaultValues: Partial<T>): Setter<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    const result: any = { ...state };

    for (const key in defaultValues) {
      if (!(key in result)) {
        result[key] = defaultValues[key];
      }
    }

    return Object.freeze(result as BuilderState<T>);
  };
}
