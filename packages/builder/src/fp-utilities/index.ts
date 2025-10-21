/**
 * FP Utilities Module
 * Functional programming tools for data transformation
 *
 * @packageDocumentation
 * @module fp-utilities
 */

// Composition utilities
export * from './composition';

// Currying & partial application
export * from './currying';

// Data transformers
export * from './transformers';

// FP-style builders
export * from './builders';

// Types
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
} from './types';
