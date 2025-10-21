/* eslint-disable @typescript-eslint/no-explicit-any, no-redeclare */
import {
  createBuilder,
  createAsyncBuilder,
  clearPools,
  getPoolStats,
  getDetailedPoolStats,
  resetPoolStats,
} from './factory';
import { FastObjectPool, BuilderPool } from './object-pool';
import { detectBuilderType, isZodSchema, isClass } from './detection';
import { ZodSchema, ZodType } from 'zod';
export type {
  BuilderType,
  BuilderConfig,
  BuilderInstance,
  AsyncBuilderInstance,
  BuilderFunction,
  AsyncBuilderFunction,
  ObjectPool,
  PerformanceMetrics,
  FluentBuilder,
  FluentAsyncBuilder,
  InferZodType,
} from './types';

// Re-export everything
export {
  createBuilder,
  createAsyncBuilder,
  clearPools,
  getPoolStats,
  getDetailedPoolStats,
  resetPoolStats,
};
export { FastObjectPool, BuilderPool };
export { detectBuilderType, isZodSchema, isClass };

// ============================================================================
// Main Builder Function with Auto-Detection and Type Inference
// ============================================================================

/**
 * Create a fluent builder from a Zod schema with full type inference
 * @param input - Zod schema (type will be automatically inferred)
 * @returns A function that creates a typed builder instance
 *
 * @example
 * ```typescript
 * const UserSchema = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   email: z.string().email()
 * });
 *
 * const createUser = builder(UserSchema);
 *
 * // IDE autocompletes: .withId(), .withName(), .withEmail()
 * const user = createUser()
 *   .withId(1)
 *   .withName('John Doe')
 *   .withEmail('john@example.com')
 *   .build();
 * ```
 */
export function builder<T extends ZodSchema>(
  input: T
): () => import('./types').FluentBuilder<import('./types').InferZodType<T>>;

/**
 * Create a fluent builder from a class constructor with full type inference
 * @param input - Class constructor (type will be automatically inferred)
 * @returns A function that creates a typed builder instance
 *
 * @example
 * ```typescript
 * class Product {
 *   id!: number;
 *   name!: string;
 *   price!: number;
 * }
 *
 * const createProduct = builder(Product);
 *
 * // IDE autocompletes: .withId(), .withName(), .withPrice()
 * const product = createProduct()
 *   .withId(1)
 *   .withName('Laptop')
 *   .withPrice(999)
 *   .build();
 * ```
 */
export function builder<T>(
  input: new (...args: any[]) => T
): () => import('./types').FluentBuilder<T>;

/**
 * Create a fluent builder from an interface with explicit keys and type parameter
 * @param input - Array of property keys
 * @returns A function that creates a typed builder instance
 *
 * @example
 * ```typescript
 * interface Order {
 *   id: string;
 *   total: number;
 * }
 *
 * const createOrder = builder<Order>(['id', 'total']);
 *
 * // IDE autocompletes: .withId(), .withTotal()
 * const order = createOrder()
 *   .withId('ORD-001')
 *   .withTotal(99.99)
 *   .build();
 * ```
 */
export function builder<T>(input: (keyof T & string)[]): () => import('./types').FluentBuilder<T>;

/**
 * Generic builder implementation (fallback for edge cases)
 */
export function builder<T = any>(
  input: any,
  explicitKeys?: string[]
): () => import('./types').FluentBuilder<T> {
  return createBuilder<T>(input, explicitKeys) as any;
}

// ============================================================================
// Async Builder Function with Auto-Detection and Type Inference
// ============================================================================

/**
 * Create an async fluent builder from a Zod schema with full type inference
 * Uses non-blocking validation for high-concurrency scenarios
 *
 * @param input - Zod schema (type will be automatically inferred)
 * @returns A function that creates a typed async builder instance
 *
 * @example
 * ```typescript
 * const UserSchema = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   email: z.string().email()
 * });
 *
 * const createUser = builderAsync(UserSchema);
 *
 * // IDE autocompletes: .withId(), .withName(), .withEmail()
 * const user = await createUser()
 *   .withId(1)
 *   .withName('John Doe')
 *   .withEmail('john@example.com')
 *   .buildAsync();
 * ```
 */
export function builderAsync<T extends ZodType>(
  input: T
): () => import('./types').FluentAsyncBuilder<import('./types').InferZodType<T>>;

/**
 * Generic async builder implementation (fallback)
 */
export function builderAsync<T = any>(
  input: any,
  explicitKeys?: string[]
): () => import('./types').FluentAsyncBuilder<T> {
  return createAsyncBuilder<T>(input, explicitKeys);
}

// ============================================================================
// Re-export Functional Programming utilities
// ============================================================================

// Core functional utilities
export {
  createImmutableBuilder,
  mergeStates,
  cloneState,
  isEmpty,
  getKeys,
  hasKey,
  getValue,
  removeKey,
  updateKeys,
} from './functional/immutable-builder';

export {
  compose,
  composeWith,
  composeGeneric,
  composeAsync,
  composeSafe,
} from './functional/compose';

export {
  pipe,
  pipeWith,
  pipeGeneric,
  pipeAsync,
  pipeSafe,
  tap,
  pipeIf,
  pipeWhen,
} from './functional/pipe';

export {
  curriedBuilder,
  curry,
  curry2,
  curry3,
  curry4,
  autoCurry,
  uncurry2,
  uncurry3,
  flip,
  curriedBuilderWithSchema,
  memoizeCurried,
} from './functional/curry';

export {
  partial as partialApply,
  partialDefaults,
  partialOverwrite,
  partialTemplates,
  partialWith,
  partialIf,
  partialFrom,
  mergePartials,
  partialApply as partialApplyFunc,
  partialWithSchema,
} from './functional/partial';

export {
  filterBuilder,
  mapBuilder,
  foldBuilder,
  forEachBuilder,
  pick,
  omit,
  rename,
  groupBy,
  partition,
  some,
  every,
  find,
  compact,
  defaults,
} from './functional/higher-order';

export {
  transduce,
  mapping,
  filtering,
  taking,
  dropping,
  deduplicating,
  flattening,
  partitioning,
  scanning,
  batching,
  windowing,
  composeTransducers,
  into,
} from './functional/transducers';

// ============================================================================
// Re-export Monads
// ============================================================================

// Maybe Monad
export {
  Maybe,
  sequence as sequenceMaybe,
  traverse as traverseMaybe,
  liftMaybe2,
  liftMaybe3,
  firstSome,
  allSome,
  anySome,
} from './monads/maybe';

// Either Monad
export {
  Either,
  sequence as sequenceEither,
  traverse as traverseEither,
  liftEither2,
  liftEither3,
  firstRight,
  lefts,
  rights,
  partitionEithers,
  allRight,
  anyRight,
  validation,
} from './monads/either';

// ============================================================================
// Re-export Optics
// ============================================================================

// Lens exports
export {
  Lens,
  lens,
  prop,
  path,
  composeLenses,
  index,
  filtered,
  maybeProp,
  view,
  Iso,
  iso,
  Traversal,
  traversal,
  builderLens,
  liftLens,
  over,
  set,
  view_ as viewLens,
} from './optics/lens';

// Prism exports
export {
  Prism,
  prism,
  prismFromPredicate,
  prismSome,
  prismRight,
  prismLeft,
  prismIndex,
  prismHead,
  prismTail,
  prismFind,
  prismType,
  prismInstanceOf,
  prismTypeOf,
  prismJson,
  prismProp,
  composePrisms,
  modifyOption,
  setOption,
  getOption,
  partial as partialPrism,
  at,
} from './optics/prism';

// ============================================================================
// Re-export Types
// ============================================================================

// Functional types
export type {
  BuilderState,
  Setter,
  BuildFunction,
  CurriedSetter,
  TypedImmutableBuilder,
  Predicate,
  Transformer,
  Reducer,
  Transducer,
  FunctionalBuilderConfig,
} from './functional/types';

// Monad types
export type { Maybe as MaybeType } from './monads/maybe';
export type { Either as EitherType } from './monads/either';

// Optics types
export type { Lens as LensType, Iso as IsoType, Traversal as TraversalType } from './optics/lens';
export type { Prism as PrismType } from './optics/prism';

// ============================================================================
// Re-export Projection / CustomPicker utilities
// ============================================================================

// Main customPicker API
export {
  customPicker,
  pickFields,
  pickFieldsArray,
  createPicker,
  omitFields,
  projectToInterface,
  projectByShape,
  createShapeProjector,
  projectArrayByShape,
} from './projection/custom-picker';

// Schema building utilities
export {
  buildProjectionSchema,
  mergeSchemas,
  makeSchemaStrict,
  makeSchemaPassthrough,
} from './projection/schema-builder';

// Path parsing utilities
export {
  parsePath,
  buildPathTree,
  normalizePaths,
  getCacheKey,
  isArrayPath,
  getArrayFieldName,
} from './projection/path-parser';

// Schema cache
export {
  SchemaCache,
  getGlobalSchemaCache,
  clearGlobalSchemaCache,
  getGlobalSchemaCacheStats,
  resetGlobalSchemaCacheStats,
} from './projection/schema-cache';

// Projection types
export type {
  ProjectionPath,
  ProjectionSelector,
  PickerOptions,
  PathSegment,
  SchemaCacheStats,
  PathTree,
  KeysOf,
  PickKeys,
} from './projection';

// Main builder function is available as named export 'builder' and as default export
export default builder;
