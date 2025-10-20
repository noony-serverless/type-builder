/**
 * Functional Programming Type Utilities
 * Type definitions for functional builder patterns
 */

import { ZodSchema } from 'zod';

/**
 * Builder state (immutable partial object)
 */
export type BuilderState<T> = Readonly<Partial<T>>;

/**
 * Setter function (pure function that returns new state)
 */
export type Setter<T> = (state: BuilderState<T>) => BuilderState<T>;

/**
 * Builder function (validates and returns final object)
 */
export type BuildFunction<T> = (state: BuilderState<T>) => T;

/**
 * Curried setter for a specific property
 */
export type CurriedSetter<T, K extends keyof T> = (
  value: T[K]
) => Setter<T>;

/**
 * Capitalize first letter of string type
 */
type Capitalize<S extends string> = S extends `${infer F}${infer R}`
  ? `${Uppercase<F>}${R}`
  : S;

/**
 * Immutable builder interface with curried setters
 */
export interface ImmutableBuilder<T> {
  /**
   * Create empty state
   */
  empty(): BuilderState<T>;

  /**
   * Build final object from state
   */
  build(state: BuilderState<T>): T;

  /**
   * Curried setter methods (.withX(value)(state))
   */
  [K: string]: any;
}

/**
 * Helper type for generating with* methods
 */
export type WithMethods<T> = {
  [K in keyof T & string as `with${Capitalize<K>}`]: CurriedSetter<T, K>;
};

/**
 * Complete immutable builder with typed methods
 */
export type TypedImmutableBuilder<T> = {
  empty(): BuilderState<T>;
  build(state: BuilderState<T>): T;
} & WithMethods<T>;

/**
 * Predicate function for filtering
 */
export type Predicate<T, K extends keyof T = keyof T> = (
  key: K,
  value: T[K]
) => boolean;

/**
 * Transformer function for mapping
 */
export type Transformer<T, U, K extends keyof T = keyof T> = (
  key: K,
  value: T[K]
) => U;

/**
 * Reducer function for folding
 */
export type Reducer<T, R, K extends keyof T = keyof T> = (
  acc: R,
  key: K,
  value: T[K]
) => R;

/**
 * Transducer (composable transformation)
 */
export type Transducer<T> = Setter<T>;

/**
 * Builder configuration for FP mode
 */
export interface FunctionalBuilderConfig<T> {
  keys: (keyof T & string)[];
  schema?: ZodSchema<T>;
  validator?: (state: BuilderState<T>) => boolean;
}
