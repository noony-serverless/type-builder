/**
 * Functional Programming Entry Point
 * Pure functional builders with immutable state
 *
 * @packageDocumentation
 * @module functional
 *
 * @example
 * ```typescript
 * import { pipe, createImmutableBuilder } from '@noony-serverless/type-builder';
 *
 * const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email']);
 *
 * const user = pipe(
 *   userBuilder.withId(1),
 *   userBuilder.withName('Alice'),
 *   userBuilder.withEmail('alice@example.com')
 * )(userBuilder.empty());
 *
 * const finalUser = userBuilder.build(user);
 * ```
 */

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
  partial,
  partialDefaults,
  partialOverwrite,
  partialTemplates,
  partialWith,
  partialIf,
  partialFrom,
  mergePartials,
  partialApply,
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

// Type exports
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
