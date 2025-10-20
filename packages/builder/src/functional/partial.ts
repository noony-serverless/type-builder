/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Partial Application
 * Pre-fill some arguments of a function
 */

import { BuilderState, Setter } from './types';
import { ZodSchema } from 'zod';

/**
 * Create a partial state (template)
 * Pre-fills some properties with default values
 *
 * @example
 * ```typescript
 * const userTemplate = partial<User>({
 *   age: 25,
 *   role: 'user',
 *   isActive: true
 * });
 *
 * const state = pipe(
 *   userTemplate,
 *   userBuilder.withName('Alice'),
 *   userBuilder.withEmail('alice@example.com')
 * )({});
 *
 * // Result: { age: 25, role: 'user', isActive: true, name: 'Alice', email: '...' }
 * ```
 */
export function partial<T>(template: Partial<T>): Setter<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    return Object.freeze({
      ...state,
      ...template,
    } as BuilderState<T>);
  };
}

/**
 * Partial with overwrite protection
 * Only applies template values if key doesn't exist in state
 *
 * @example
 * ```typescript
 * const defaults = partialDefaults<User>({
 *   age: 18,
 *   role: 'guest'
 * });
 *
 * const state = { age: 25 };
 * const result = defaults(state); // { age: 25, role: 'guest' }
 * // age not overwritten, role added
 * ```
 */
export function partialDefaults<T>(defaults: Partial<T>): Setter<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    const result: any = { ...state };

    for (const key in defaults) {
      if (!(key in state)) {
        result[key] = defaults[key];
      }
    }

    return Object.freeze(result as BuilderState<T>);
  };
}

/**
 * Partial with selective overwrite
 * Only overwrites specified keys
 *
 * @example
 * ```typescript
 * const updateEmail = partialOverwrite<User>(
 *   { email: 'new@example.com', age: 30 },
 *   ['email'] // Only overwrite email
 * );
 *
 * const state = { email: 'old@example.com', age: 25, name: 'Alice' };
 * const result = updateEmail(state);
 * // { email: 'new@example.com', age: 25, name: 'Alice' }
 * ```
 */
export function partialOverwrite<T>(updates: Partial<T>, keys: (keyof T)[]): Setter<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    const result: any = { ...state };

    for (const key of keys) {
      if (key in updates) {
        result[key] = updates[key];
      }
    }

    return Object.freeze(result as BuilderState<T>);
  };
}

/**
 * Create multiple partial templates
 * Returns a function that selects which template to apply
 *
 * @example
 * ```typescript
 * const templates = partialTemplates<User>({
 *   admin: { role: 'admin', permissions: ['read', 'write', 'delete'] },
 *   user: { role: 'user', permissions: ['read'] },
 *   guest: { role: 'guest', permissions: [] }
 * });
 *
 * const adminState = templates('admin')({});
 * const userState = templates('user')({});
 * ```
 */
export function partialTemplates<T>(
  templates: Record<string, Partial<T>>
): (name: string) => Setter<T> {
  return (name: string): Setter<T> => {
    const template = templates[name];
    if (!template) {
      throw new Error(`Template '${name}' not found`);
    }
    return partial(template);
  };
}

/**
 * Partial with transformation
 * Applies template and transforms the result
 *
 * @example
 * ```typescript
 * const normalizedUser = partialWith<User>(
 *   { email: 'ALICE@EXAMPLE.COM' },
 *   state => ({
 *     ...state,
 *     email: state.email?.toLowerCase()
 *   })
 * );
 * ```
 */
export function partialWith<T>(
  template: Partial<T>,
  transform: (state: BuilderState<T>) => BuilderState<T>
): Setter<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    const merged = { ...state, ...template };
    return transform(merged as BuilderState<T>);
  };
}

/**
 * Conditional partial
 * Applies template only if predicate is true
 *
 * @example
 * ```typescript
 * const maybeAdmin = partialIf<User>(
 *   state => state.name === 'Admin',
 *   { role: 'admin', permissions: ['all'] }
 * );
 * ```
 */
export function partialIf<T>(
  predicate: (state: BuilderState<T>) => boolean,
  template: Partial<T>
): Setter<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    if (predicate(state)) {
      return Object.freeze({
        ...state,
        ...template,
      } as BuilderState<T>);
    }
    return state;
  };
}

/**
 * Partial from factory function
 * Generates partial state dynamically
 *
 * @example
 * ```typescript
 * const timestamped = partialFrom<User>(state => ({
 *   createdAt: new Date(),
 *   id: Math.random()
 * }));
 *
 * const user = pipe(
 *   timestamped,
 *   userBuilder.withName('Alice')
 * )({});
 * ```
 */
export function partialFrom<T>(factory: (state: BuilderState<T>) => Partial<T>): Setter<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    const generated = factory(state);
    return Object.freeze({
      ...state,
      ...generated,
    } as BuilderState<T>);
  };
}

/**
 * Merge multiple partials
 *
 * @example
 * ```typescript
 * const combined = mergePartials<User>(
 *   { name: 'Alice' },
 *   { age: 25 },
 *   { email: 'alice@example.com' }
 * );
 *
 * const state = combined({});
 * // { name: 'Alice', age: 25, email: 'alice@example.com' }
 * ```
 */
export function mergePartials<T>(...partials: Partial<T>[]): Setter<T> {
  return (state: BuilderState<T>): BuilderState<T> => {
    const result = partials.reduce((acc, p) => ({ ...acc, ...p }), { ...state });
    return Object.freeze(result as BuilderState<T>);
  };
}

/**
 * Partial application for setter functions
 *
 * @example
 * ```typescript
 * const setSomething = (key: string, value: any, state: any) => ({
 *   ...state,
 *   [key]: value
 * });
 *
 * const setName = partialApply(setSomething, 'name');
 * const state = setName('Alice', {});
 * ```
 */
export function partialApply<T, A, R>(
  fn: (a: A, b: T, ...rest: any[]) => R,
  a: A
): (b: T, ...rest: any[]) => R {
  return (b: T, ...rest: any[]) => fn(a, b, ...rest);
}

/**
 * Partial with validation
 *
 * @example
 * ```typescript
 * const validatedPartial = partialWithSchema<User>(
 *   { age: 25 },
 *   UserSchema
 * );
 *
 * const state = validatedPartial({}); // Validates before returning
 * ```
 */
export function partialWithSchema<T>(
  template: Partial<T>,
  schema: ZodSchema<T>
): (state: BuilderState<T>) => T {
  return (state: BuilderState<T>): T => {
    const merged = { ...state, ...template };
    return schema.parse(merged);
  };
}
