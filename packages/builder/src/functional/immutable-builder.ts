/**
 * Immutable Builder Pattern
 * Pure functional builder with no mutations
 */

import { ZodSchema } from 'zod';
import {
  BuilderState,
  TypedImmutableBuilder,
  CurriedSetter,
  FunctionalBuilderConfig
} from './types';

/**
 * Creates an immutable builder for type T
 * Each .withX() method returns a NEW state (no mutations)
 *
 * @example
 * ```typescript
 * const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email']);
 *
 * const state1 = userBuilder.empty();
 * const state2 = userBuilder.withId(1)(state1);
 * const state3 = userBuilder.withName('Alice')(state2);
 *
 * // state1, state2, state3 are all different objects (immutable)
 * const user = userBuilder.build(state3);
 * ```
 *
 * @param keys - Array of property keys for type T
 * @param schema - Optional Zod schema for validation
 * @returns Immutable builder with curried setters
 */
export function createImmutableBuilder<T>(
  keys: (keyof T & string)[],
  schema?: ZodSchema<T>
): TypedImmutableBuilder<T> {
  const config: FunctionalBuilderConfig<T> = {
    keys,
    ...(schema && { schema })
  };

  /**
   * Create empty state
   */
  function empty(): BuilderState<T> {
    return Object.freeze({} as BuilderState<T>);
  }

  /**
   * Build final object from state
   * Validates with Zod schema if provided
   */
  function build(state: BuilderState<T>): T {
    if (config.schema) {
      return config.schema.parse(state);
    }

    // Create mutable copy for final object
    return { ...state } as T;
  }

  /**
   * Create a curried setter for a specific key
   */
  function createSetter<K extends keyof T>(key: K): CurriedSetter<T, K> {
    return (value: T[K]) => (state: BuilderState<T>): BuilderState<T> => {
      // Return new object (immutable)
      return Object.freeze({
        ...state,
        [key]: value
      } as BuilderState<T>);
    };
  }

  // Build the builder object
  const builder: any = {
    empty,
    build
  };

  // Add curried .withX() methods
  for (const key of keys) {
    const methodName = `with${key.charAt(0).toUpperCase()}${key.slice(1)}`;
    builder[methodName] = createSetter(key);
  }

  return builder as TypedImmutableBuilder<T>;
}

/**
 * Merge multiple states together (immutable)
 *
 * @example
 * ```typescript
 * const state1 = { id: 1 };
 * const state2 = { name: 'Alice' };
 * const merged = mergeStates(state1, state2); // { id: 1, name: 'Alice' }
 * ```
 */
export function mergeStates<T>(
  ...states: BuilderState<T>[]
): BuilderState<T> {
  return Object.freeze(
    states.reduce((acc, state) => ({ ...acc, ...state }), {} as Partial<T>)
  ) as BuilderState<T>;
}

/**
 * Clone a state (creates shallow copy)
 *
 * @example
 * ```typescript
 * const state1 = { id: 1, name: 'Alice' };
 * const state2 = cloneState(state1);
 * // state1 !== state2 (different objects)
 * ```
 */
export function cloneState<T>(state: BuilderState<T>): BuilderState<T> {
  return Object.freeze({ ...state });
}

/**
 * Check if state is empty
 */
export function isEmpty<T>(state: BuilderState<T>): boolean {
  return Object.keys(state).length === 0;
}

/**
 * Get all keys from state
 */
export function getKeys<T>(state: BuilderState<T>): (keyof T)[] {
  return Object.keys(state) as (keyof T)[];
}

/**
 * Check if key exists in state
 */
export function hasKey<T>(
  state: BuilderState<T>,
  key: keyof T
): boolean {
  return key in state;
}

/**
 * Get value for key (with default)
 */
export function getValue<T, K extends keyof T>(
  state: BuilderState<T>,
  key: K,
  defaultValue: T[K]
): T[K] {
  return state[key] ?? defaultValue;
}

/**
 * Remove key from state (immutable)
 */
export function removeKey<T>(
  state: BuilderState<T>,
  key: keyof T
): BuilderState<T> {
  const { [key]: removed, ...rest } = state;
  return Object.freeze(rest as BuilderState<T>);
}

/**
 * Update multiple keys at once (immutable)
 */
export function updateKeys<T>(
  state: BuilderState<T>,
  updates: Partial<T>
): BuilderState<T> {
  return Object.freeze({
    ...state,
    ...updates
  } as BuilderState<T>);
}
